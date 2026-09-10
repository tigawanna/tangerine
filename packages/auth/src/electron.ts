/**
 * Custom protocol for Better Auth Electron deep links (reverse-DNS).
 * Must match electron-builder `protocols.schemes`, Electron client, and proxy client.
 */
export const ELECTRON_PROTOCOL_SCHEME = "com.tigawanna.tangerine";

/** Value for Better Auth `trustedOrigins` (scheme + `:/`). */
export const ELECTRON_TRUSTED_ORIGIN = `${ELECTRON_PROTOCOL_SCHEME}:/`;
