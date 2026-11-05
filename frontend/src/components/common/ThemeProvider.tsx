"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import api from "@/services/api";
import { useAuthStore } from "@/store/authStore";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = Exclude<ThemePreference, "system">;

const THEME_KEY = "qubira-theme";
const LEGACY_THEME_KEYS = ["theme", "skillbattle-theme"];

interface ThemeContextValue {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredPreference(): ThemePreference {
  try {
    const keys = [THEME_KEY, ...LEGACY_THEME_KEYS];
    for (const key of keys) {
      const stored = localStorage.getItem(key);
      if (stored === "light" || stored === "dark" || stored === "system") {
        return stored;
      }
    }
  } catch {
    return "system";
  }
  return "system";
}

function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference !== "system") return preference;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(preference: ThemePreference): ResolvedTheme {
  const resolved = resolveTheme(preference);
  const root = document.documentElement;
  root.dataset.theme = resolved;
  root.dataset.themePreference = preference;
  root.style.colorScheme = resolved;
  return resolved;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("dark");

  const setPreference = useCallback((next: ThemePreference) => {
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      console.warn("Could not persist the Qubira theme preference on this device.");
    }
    setPreferenceState(next);
    setResolvedTheme(applyTheme(next));
  }, []);

  useEffect(() => {
    const stored = readStoredPreference();
    setPreferenceState(stored);
    setResolvedTheme(applyTheme(stored));
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemThemeChange = () => {
      if (preference === "system") setResolvedTheme(applyTheme("system"));
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key !== THEME_KEY) return;
      const next = event.newValue;
      if (next !== "light" && next !== "dark" && next !== "system") return;
      setPreferenceState(next);
      setResolvedTheme(applyTheme(next));
    };

    media.addEventListener("change", onSystemThemeChange);
    window.addEventListener("storage", onStorage);
    return () => {
      media.removeEventListener("change", onSystemThemeChange);
      window.removeEventListener("storage", onStorage);
    };
  }, [preference]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    void api.get<{ theme?: string }>("/profile/preferences")
      .then(({ data }) => {
        if (!active) return;
        if (data.theme === "light" || data.theme === "dark" || data.theme === "system") {
          setPreference(data.theme);
        }
      })
      .catch(() => {
        if (active) console.warn("Could not load the saved Qubira theme preference.");
      });
    return () => {
      active = false;
    };
  }, [isAuthenticated, setPreference]);

  const value = useMemo(
    () => ({ preference, resolvedTheme, setPreference }),
    [preference, resolvedTheme, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider.");
  return context;
}

export const themeBootstrapScript = `(() => {
  try {
    const keys = ["qubira-theme", "theme", "skillbattle-theme"];
    let preference = "system";
    for (const key of keys) {
      const value = localStorage.getItem(key);
      if (value === "light" || value === "dark" || value === "system") {
        preference = value;
        break;
      }
    }
    const resolved = preference === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : preference;
    document.documentElement.dataset.theme = resolved;
    document.documentElement.dataset.themePreference = preference;
    document.documentElement.style.colorScheme = resolved;
  } catch {
    document.documentElement.dataset.theme = "dark";
    document.documentElement.dataset.themePreference = "system";
  }
})();`;
