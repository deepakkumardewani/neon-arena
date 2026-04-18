/**
 * tsparticles expects concrete color strings. Values are read from :root tokens
 * when available; resolved to `rgb()` via the browser when tokens use OKLCH.
 */
const FALLBACK_PURPLE = "#7b61ff";
const FALLBACK_CYAN = "#00f5ff";

function resolveCssColorToRgb(cssColor: string, fallback: string): string {
  const v = cssColor.trim();
  if (v.length === 0) return fallback;
  if (typeof document === "undefined" || document.body === null) return fallback;
  if (v.startsWith("#")) return v;

  const probe = document.createElement("span");
  probe.hidden = true;
  probe.style.color = v;
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();
  if (resolved.length === 0) return fallback;
  return resolved;
}

export function cssVarRgbForParticles(): { purple: string; cyan: string } {
  if (typeof document === "undefined") {
    return { purple: FALLBACK_PURPLE, cyan: FALLBACK_CYAN };
  }
  const root = document.documentElement;
  const purpleRaw = getComputedStyle(root).getPropertyValue("--na-purple").trim();
  const cyanRaw = getComputedStyle(root).getPropertyValue("--na-cyan").trim();
  return {
    purple: resolveCssColorToRgb(purpleRaw, FALLBACK_PURPLE),
    cyan: resolveCssColorToRgb(cyanRaw, FALLBACK_CYAN),
  };
}
