/// <reference lib="deno.ns" />

/** Open a URL in the OS default browser (system browser OAuth). */
export async function openExternal(url: string): Promise<void> {
  const os = Deno.build.os;
  const cmd =
    os === "darwin"
      ? ["open", url]
      : os === "windows"
        ? ["cmd", "/c", "start", "", url]
        : ["xdg-open", url];
  const proc = new Deno.Command(cmd[0]!, {
    args: cmd.slice(1),
    stdout: "null",
    stderr: "null",
  });
  const status = await proc.spawn().status;
  if (!status.success) {
    throw new Error(`Failed to open system browser (${cmd[0]})`);
  }
}
