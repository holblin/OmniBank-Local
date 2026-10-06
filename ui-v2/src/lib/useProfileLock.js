import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export function useProfileLock(profile) {
  const client = useQueryClient();
  useEffect(() => {
    if (!profile?.has_pin) return;
    const configured =
      localStorage.getItem(`${profile.id}_omni_autolock_minutes`) ??
      (profile.id === "default"
        ? localStorage.getItem("omni_autolock_minutes")
        : null) ??
      "5";
    const minutes = Number.parseInt(configured, 10);
    if (!Number.isFinite(minutes) || minutes <= 0) return;
    let timer;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        sessionStorage.setItem("omni_is_locked", "true");
        client.clear();
        window.location.replace('/v2/unlock');
      }, minutes * 60000);
    };
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((event) =>
      window.addEventListener(event, reset, { passive: true }),
    );
    reset();
    return () => {
      clearTimeout(timer);
      events.forEach((event) => window.removeEventListener(event, reset));
    };
  }, [profile, client]);
}
