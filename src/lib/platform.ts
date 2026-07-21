// Detects when the app is running inside our Android TWA/Capacitor wrapper.
// The native wrapper is expected to launch the URL with `?android=1` (or
// `?platform=android`). We persist that in localStorage so subsequent
// in-app navigations remain flagged.
//
// This flag is used to comply with Google Play's Payments Policy by
// hiding external (non-Google-Play-Billing) upgrade paths from the
// Android build. Web users are unaffected.

const KEY = "lexikon_platform";

export function detectAndPersistPlatform() {
  if (typeof window === "undefined") return;
  try {
    const params = new URLSearchParams(window.location.search);
    const flag = params.get("android") || params.get("platform");
    if (flag === "1" || flag === "android") {
      localStorage.setItem(KEY, "android");
    }
  } catch {
    /* ignore */
  }
}

export function isAndroidApp(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(KEY) === "android";
  } catch {
    return false;
  }
}
