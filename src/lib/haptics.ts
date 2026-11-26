/**
 * Tiny haptic ticks for touch controls.
 * Android and most browsers: the Vibration API. iOS Safari has no vibrate(), but iOS 18+ plays the
 * system tick when a switch-style checkbox is toggled, so we toggle a hidden one. Silent elsewhere.
 */
let iosSwitch: HTMLLabelElement | null = null;

export function haptic(kind: "tick" | "pick" = "tick") {
  if (typeof window === "undefined") return;
  try {
    if (typeof navigator.vibrate === "function" && !/iP(hone|ad|od)/.test(navigator.userAgent)) {
      navigator.vibrate(kind === "pick" ? 14 : 6);
      return;
    }
    if (!iosSwitch) {
      iosSwitch = document.createElement("label");
      const input = document.createElement("input");
      input.type = "checkbox";
      input.setAttribute("switch", "");
      iosSwitch.appendChild(input);
      iosSwitch.setAttribute("aria-hidden", "true");
      iosSwitch.style.cssText = "position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;left:-9px;top:-9px";
      document.body.appendChild(iosSwitch);
    }
    iosSwitch.click();
  } catch {
    /* no haptics here */
  }
}
