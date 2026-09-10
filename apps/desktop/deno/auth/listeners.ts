/// <reference lib="deno.ns" />

import type { AuthListeners } from "./types.ts";

let listeners: AuthListeners = {};

export function setAuthListeners(next: AuthListeners): void {
  listeners = next;
}

export function getAuthListeners(): AuthListeners {
  return listeners;
}
