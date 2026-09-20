/**
 * `@libsql/hrana-client` builds a `Request` from `@libsql/isomorphic-fetch`.
 * On Vercel Node that path fails to send `Authorization` (raw `fetch` /
 * `node:https` with the same JWT succeed). Re-issue via global `fetch` and
 * always attach the Bearer token.
 */
export function vercelSafeLibsqlFetch(authToken: string): typeof globalThis.fetch {
  return async (input, init) => {
    const request = input instanceof Request ? input : new Request(input, init);
    const headers = new Headers(request.headers);
    headers.set("authorization", `Bearer ${authToken}`);

    return globalThis.fetch(request.url, {
      method: request.method,
      headers,
      body: request.body,
      redirect: request.redirect,
      // Node undici needs this when forwarding a streamed body.
      duplex: "half",
    } as RequestInit);
  };
}
