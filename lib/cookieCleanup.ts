/**
 * Utility to purge bloated legacy cookies (Supabase auth chunks, mock session JSON)
 * from document.cookie to prevent Vercel 494 REQUEST_HEADER_TOO_LARGE.
 */

export const INLINE_COOKIE_PURGE_SCRIPT = `
(function() {
  try {
    var cookies = document.cookie ? document.cookie.split(';') : [];
    var host = window.location.hostname;
    var domainParts = host.split('.');
    var parentDomain = domainParts.length > 2 ? '.' + domainParts.slice(-2).join('.') : '.' + host;
    var domains = ['', host, '.' + host, parentDomain];

    for (var i = 0; i < cookies.length; i++) {
      var c = cookies[i];
      var eq = c.indexOf('=');
      var name = (eq > -1 ? c.substring(0, eq) : c).trim();

      if (
        name.indexOf('sb-') === 0 ||
        name.indexOf('-auth-token') > -1 ||
        name.indexOf('supabase-') === 0 ||
        name.indexOf('six9_mock_session') === 0
      ) {
        for (var d = 0; d < domains.length; d++) {
          var dom = domains[d] ? '; domain=' + domains[d] : '';
          document.cookie = name + '=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax' + dom;
          document.cookie = name + '=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT' + dom;
        }
      }
    }
  } catch (e) {}
})();
`.trim();

export function purgeBloatedCookies(): void {
  if (typeof window === "undefined") return;

  try {
    const rawCookies = document.cookie;
    if (!rawCookies) return;

    const cookiePairs = rawCookies.split(";");
    const host = window.location.hostname;
    const domainParts = host.split(".");
    const parentDomain = domainParts.length > 2 ? `.${domainParts.slice(-2).join(".")}` : `.${host}`;
    const domains = ["", host, `.${host}`, parentDomain];

    for (const cookieStr of cookiePairs) {
      const eqIdx = cookieStr.indexOf("=");
      const name = (eqIdx > -1 ? cookieStr.slice(0, eqIdx) : cookieStr).trim();

      const isBloated =
        name.startsWith("sb-") ||
        name.includes("-auth-token") ||
        name.startsWith("supabase-") ||
        name.startsWith("six9_mock_session");

      if (isBloated) {
        for (const dom of domains) {
          const domAttr = dom ? `; domain=${dom}` : "";
          document.cookie = `${name}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${domAttr}`;
          document.cookie = `${name}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT${domAttr}`;
        }
      }
    }
  } catch (err) {
    console.warn("[Cookie Cleanup] Error clearing bloated cookies:", err);
  }
}
