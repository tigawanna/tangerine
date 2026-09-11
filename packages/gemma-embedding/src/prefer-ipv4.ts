import { setDefaultResultOrder } from "node:dns";
import { setDefaultAutoSelectFamily } from "node:net";

let applied = false;

/**
 * Node's undici Happy Eyeballs prefers IPv6. On networks with a broken IPv6
 * default route (RA → link-local gateway), HF CDN fetches fail with
 * AggregateError ETIMEDOUT/ENETUNREACH on `2600:…` while curl/IPv4 works.
 *
 * Force IPv4-first DNS and disable auto family selection before any Hub fetch.
 */
export function preferIpv4ForHubFetches(): void {
  if (applied) return;
  applied = true;
  try {
    setDefaultResultOrder("ipv4first");
  } catch {
    // older runtimes
  }
  try {
    setDefaultAutoSelectFamily(false);
  } catch {
    // Node < 18.13 / unsupported
  }
}
