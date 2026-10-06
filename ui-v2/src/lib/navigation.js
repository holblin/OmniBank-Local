export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
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
