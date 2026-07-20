/**
 * Theme bootstrap.
 *
 * Runs before first paint, synchronously in <head>, to apply the stored theme
 * before React hydrates. Without this the page renders in the default theme and
 * then repaints - the flash of wrong theme.
 *
 * Kept as a single-line string because its SHA-256 is pinned in the CSP
 * (`next.config.mjs`). Any change, including whitespace, changes the hash and
 * the browser will refuse to execute it. Run `pnpm theme:hash` after editing.
 */
export const THEME_BOOTSTRAP_SCRIPT =
  "try{var t=localStorage.getItem('hs-theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t)}}catch(e){}";

export const THEME_STORAGE_KEY = "hs-theme";
