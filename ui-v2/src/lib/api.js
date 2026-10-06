// Same-origin requests only. Financial calculations remain in the local backend.
export async function get(path, signal) {
  const response = await fetch(path, { signal, cache: "no-store" });
  if (!response.ok)
    throw new Error(`Erreur de chargement (${response.status})`);
  return response.json();
}

export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export async function loadDashboard(signal) {
  const { profile } = await loadContext(signal);
  const [stats, accounts, budgets] = await Promise.all([
    get("/api/stats/dashboard", signal),
    get("/api/stats/accounts", signal),
    get("/api/budgets/status", signal),
  ]);
  return {
    stats,
    accounts: accounts.filter((a) => !a.is_closed),
    budgets: budgets.budgets,
    profile,
  };
}

export function loadTransactions(accountId, signal) {
  const params = new URLSearchParams({ limit: "6", date_end: localDate() });
  if (accountId) params.set("account_id", accountId);
  return get(`/api/transactions/?${params}`, signal);
}

const legacyViews = new Set([
  "dashboard",
  "all_operations",
  "analytics",
  "budgets",
  "accounts",
  "chat",
  "recurrences",
  "config",
]);
export function legacyUrl(view = "dashboard", action) {
  const params = new URLSearchParams({
    view: legacyViews.has(view) ? view : "dashboard",
  });
  if (action === "new") params.set("action", action);
  return `${import.meta.env.DEV ? "http://127.0.0.1:8434" : ""}/?${params}`;
}

export async function loadContext(signal) {
  const [profile, config] = await Promise.all([
    get("/api/profiles/active", signal),
    get("/api/config/", signal),
  ]);
  if (
    (profile.has_pin && sessionStorage.getItem("omni_is_locked") === "true") ||
    (config.enable_org_mode === "true" &&
      !sessionStorage.getItem("omni_current_user"))
  ) {
    window.location.replace(legacyUrl());
    throw new DOMException("Retour vers l’interface classique", "AbortError");
  }
  return { profile, config };
}

export async function mutate(path, method, body) {
  const user = sessionStorage.getItem("omni_current_user");
  if (
    user &&
    body &&
    /^\/api\/transactions\/(?:\d+)?$/.test(path) &&
    (method === "POST" || method === "PUT")
  ) {
    body = {
      ...body,
      [method === "POST" ? "created_by" : "modified_by"]: user,
    };
  }
  const response = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok)
    throw new Error(`Erreur de sauvegarde (${response.status})`);
  return response.json();
}
