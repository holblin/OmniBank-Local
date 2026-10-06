// Same-origin requests only. Financial calculations remain in the local backend.
export async function get<T = unknown>(
  path: string,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(path, { signal, cache: "no-store" });
  if (!response.ok)
    throw new Error(`Erreur de chargement (${response.status})`);
  return response.json();
}

export async function mutate(
  path: string,
  method: string,
  body?: Record<string, unknown> | number[],
): Promise<unknown> {
  const user = sessionStorage.getItem("omni_current_user");
  if (
    user &&
    body &&
    !Array.isArray(body) &&
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
