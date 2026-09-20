/** Remote Turso Cloud — not a local libSQL replica. */
export function isTursoRemote(url: string) {
  return (
    (url.startsWith("libsql://") || url.startsWith("https://") || url.startsWith("http://")) &&
    !url.includes("127.0.0.1") &&
    !url.includes("localhost")
  );
}
