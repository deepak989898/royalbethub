export async function roulettePost<T>(
  path: string,
  token: string | null,
  body?: unknown
): Promise<T> {
  const headers: HeadersInit = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(path, {
    method: "POST",
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || res.statusText || "Request failed");
  }
  return data as T;
}

export async function roulettePatch<T>(
  path: string,
  token: string,
  body: unknown
): Promise<T> {
  const res = await fetch(path, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || res.statusText || "Request failed");
  }
  return data as T;
}
