import { useEffect, useState } from "react";

// These controlled dialogs are unmounted after completion. Restore focus even
// when the native dialog was removed before it could close itself.
export function useRestoreFocus() {
  const [trigger] = useState(() => document.activeElement);
  useEffect(
    () => () => {
      requestAnimationFrame(() => {
        const target =
          trigger?.isConnected && trigger !== document.body
            ? trigger
            : document.querySelector('main [role="region"]');
        if (target instanceof HTMLElement)
          target.focus({ preventScroll: true });
      });
    },
    [trigger],
  );
}
