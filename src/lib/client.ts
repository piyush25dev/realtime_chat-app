type ChatMessage = { id: string; sender: string; text: string; timestamp: number; roomId: string; token?: string; expiresAt?: Date };

async function request<T>(path: string, init?: RequestInit): Promise<{ data: T | null; error: { value: unknown } | null; status: number }> {
  const response = await fetch(`/api/${path}`, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) }, credentials: "same-origin" });
  const data = await response.json().catch(() => null);
  return { data: response.ok ? data as T : null, error: response.ok ? null : { value: data }, status: response.status };
}

export const client = {
  room: {
    create: { post: () => request<{ roomId: string }>("room/create", { method: "POST" }) },
    ttl: { get: ({ query }: { query: { roomId: string } }) => request<{ ttl: number }>(`room/ttl?roomId=${encodeURIComponent(query.roomId)}`) },
  },
  messages: {
    get: ({ query }: { query: { roomId: string } }) => request<{ messages: ChatMessage[] }>(`messages?roomId=${encodeURIComponent(query.roomId)}`),
    post: (body: { sender: string; text: string }, { query }: { query: { roomId: string } }) => request<void>(`messages?roomId=${encodeURIComponent(query.roomId)}`, { method: "POST", body: JSON.stringify(body) }),
    delete: (_body: null, { query }: { query: { roomId: string } }) => request<void>(`messages?roomId=${encodeURIComponent(query.roomId)}`, { method: "DELETE" }),
  },
};
