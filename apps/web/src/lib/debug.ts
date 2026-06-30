/**
 * Debug flags for frontend productization.
 *
 * These flags control visibility of internal/debug information.
 * ALL FLAGS DEFAULT TO FALSE — debug is never visible by default,
 * even in development builds.
 *
 * Enable explicitly via environment variable for local development:
 *   NEXT_PUBLIC_SHOW_CONTRACT_DEBUG_INFO=true
 *   NEXT_PUBLIC_SHOW_TEMPLATE_DEBUG_INFO=true
 *   NEXT_PUBLIC_SHOW_INTERNAL_IDS=true
 */

/** Show contract runtime metadata (templateCode, version, hash) in form editor */
export const SHOW_CONTRACT_DEBUG_INFO =
  process.env.NEXT_PUBLIC_SHOW_CONTRACT_DEBUG_INFO === "true";

/** Show template catalog debug info (sourceZip, generatedAt) in template selector */
export const SHOW_TEMPLATE_DEBUG_INFO =
  process.env.NEXT_PUBLIC_SHOW_TEMPLATE_DEBUG_INFO === "true";

/** Show internal document IDs to users (normally hidden) */
export const SHOW_INTERNAL_IDS =
  process.env.NEXT_PUBLIC_SHOW_INTERNAL_IDS === "true";
