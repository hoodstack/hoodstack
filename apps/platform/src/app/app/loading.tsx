/**
 * Instant loading UI for the authenticated app. Shown the moment navigation
 * into /app begins, so the transition (redirect + session check + Privy init)
 * never looks frozen. Deliberately minimal - no heavy imports - so it paints
 * immediately.
 */
export default function AppLoading() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas">
      <span
        aria-label="Loading"
        role="status"
        className="size-6 animate-spin rounded-full border-2 border-content-tertiary border-r-transparent"
      />
    </div>
  );
}
