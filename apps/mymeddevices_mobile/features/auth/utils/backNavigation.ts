import type { Href } from "expo-router";

/**
 * Content-aware back navigation for auth screens.
 *
 * Tracks the last non-auth screen the user was on so auth screens can
 * render a specific back label ("Back to Checkout", "Back to Home", ...)
 * instead of a generic "Back".
 */

let referrerPath: string | null = null;

/**
 * Record the current screen as the referrer. Call on every navigation;
 * screens inside the (auth) group are skipped so the last app screen is kept
 * while the user moves between login / register / forgot-password.
 */
export const updateAuthReferrer = (segments: readonly string[]) => {
  if (segments.length === 0 || segments[0] === "(auth)") return;
  referrerPath = `/${segments.join("/")}`;
};

/** Path of the last non-auth screen, or null if the session opened on an auth screen. */
export const getAuthReferrer = (): string | null => referrerPath;

export interface AuthBackContext {
  /** Label rendered next to the back chevron. */
  label: string;
  /** Destination used when there is no navigation history to go back to. */
  fallback: Href;
}

const REFERRER_LABELS: readonly { pattern: RegExp; label: string }[] = [
  { pattern: /^\/checkout$/, label: "Back to Checkout" },
  { pattern: /^\/\(shop\)\/cart$/, label: "Back to Cart" },
  { pattern: /^\/\(shop\)\/account$/, label: "Back to Account" },
  { pattern: /^\/\(shop\)\/index$/, label: "Back to Home" },
  { pattern: /^\/profile(\/|$)/, label: "Back to Account" },
  { pattern: /^\/order-history/, label: "Back to Orders" },
  { pattern: /^\/order-tracking/, label: "Back to Order Tracking" },
  { pattern: /^\/guest-order-history/, label: "Back to Order Lookup" },
  { pattern: /^\/wishlist/, label: "Back to Wishlist" },
  { pattern: /^\/notifications/, label: "Back to Notifications" },
];

/**
 * Resolve the back button context for an auth screen.
 * An explicit `returnTo` param wins; otherwise the label is derived from
 * the screen the user came from, falling back to a generic "Back".
 */
export const getAuthBackContext = (
  returnTo?: string,
  referrer?: string | null
): AuthBackContext => {
  if (returnTo === "checkout") {
    return { label: "Back to Checkout", fallback: "/checkout" };
  }
  if (returnTo === "cart") {
    return { label: "Back to Cart", fallback: "/cart" };
  }

  const referrerPath = referrer ?? getAuthReferrer();
  if (referrerPath) {
    const match = REFERRER_LABELS.find((entry) =>
      entry.pattern.test(referrerPath)
    );
    if (match) {
      return { label: match.label, fallback: referrerPath as Href };
    }
  }

  return { label: "Back", fallback: "/" };
};
