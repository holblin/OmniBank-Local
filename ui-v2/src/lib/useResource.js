import { useEffect, useState } from "react";
import { loadContext, legacyUrl } from "./api";

export function useProfileLock(profile) {
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
        window.location.replace(legacyUrl());
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
  }, [profile]);
}

export function useResource(load, key) {
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState({ loading: true });
  useEffect(() => {
    const controller = new AbortController();
    setState((previous) => ({ ...previous, loading: true, error: false }));
    (async () => {
      const context = await loadContext(controller.signal);
      const data = await load(controller.signal);
      if (!controller.signal.aborted)
        setState({ ...context, data, loading: false });
    })().catch((error) => {
      if (!controller.signal.aborted && error.name !== "AbortError")
        setState((previous) => ({ ...previous, error: true, loading: false }));
    });
    return () => controller.abort();
  }, [key, revision]);
  useProfileLock(state.profile);
  return { ...state, refresh: () => setRevision((value) => value + 1) };
}
