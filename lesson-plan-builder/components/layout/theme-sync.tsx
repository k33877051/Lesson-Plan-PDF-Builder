"use client";

import { useEffect } from "react";

/** โหลด theme จาก localStorage และ sync กับ class บน html */
export function ThemeSync() {
  useEffect(() => {
    const applyTheme = (theme: string) => {
      const root = document.documentElement;
      if (theme === "dark") {
        root.classList.add("dark");
      } else if (theme === "light") {
        root.classList.remove("dark");
      } else {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        root.classList.toggle("dark", prefersDark);
      }
    };

    const stored = localStorage.getItem("lpb-theme");
    if (stored) {
      applyTheme(stored);
      return;
    }

    fetch("/api/settings")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.theme) {
          localStorage.setItem("lpb-theme", json.data.theme);
          applyTheme(json.data.theme);
        }
      })
      .catch(() => {
        // ใช้ system default
      });
  }, []);

  return null;
}

/** บันทึก theme ลง localStorage และ apply ทันที */
export function setAppTheme(theme: "light" | "dark" | "system") {
  localStorage.setItem("lpb-theme", theme);
  const root = document.documentElement;
  if (theme === "dark") root.classList.add("dark");
  else if (theme === "light") root.classList.remove("dark");
  else {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.toggle("dark", prefersDark);
  }
}
