import { useEffect, useState } from "react";

export type ThemeSetting = "light" | "dark" | "system";
export type ThemeResolved = "light" | "dark";

const STORAGE_KEY = "analytics:theme";

function readSystem(): ThemeResolved {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readSetting(): ThemeSetting {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") return stored;
  return "system";
}

function resolve(setting: ThemeSetting): ThemeResolved {
  return setting === "system" ? readSystem() : setting;
}

export function useTheme(): {
  setting: ThemeSetting;
  resolved: ThemeResolved;
  setSetting: (next: ThemeSetting) => void;
} {
  const [setting, setSettingState] = useState<ThemeSetting>(readSetting);
  const [resolved, setResolved] = useState<ThemeResolved>(() => resolve(readSetting()));

  useEffect(() => {
    setResolved(resolve(setting));
    window.localStorage.setItem(STORAGE_KEY, setting);
  }, [setting]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolved === "dark");
  }, [resolved]);

  useEffect(() => {
    if (setting !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (): void => setResolved(mq.matches ? "dark" : "light");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [setting]);

  return { setting, resolved, setSetting: setSettingState };
}
