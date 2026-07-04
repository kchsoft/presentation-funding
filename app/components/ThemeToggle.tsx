"use client";

import { Moon, Sun } from "lucide-react";
import { motion } from "motion/react";
import { THEME_STORAGE_KEY } from "@/app/lib/theme";

// 아이콘을 항상 둘 다 렌더링하고 CSS(dark: variant)로만 보이기/숨기기를
// 전환한다 — theme를 React state로 들고 있으면 서버는 항상 기본값을,
// 클라이언트는 실제 선호도를 렌더링하게 되어 하이드레이션 불일치와
// 아이콘 깜빡임이 생긴다. 여기서는 어떤 값도 state로 갖지 않으므로
// 서버/클라이언트 출력이 항상 동일하다.
export default function ThemeToggle() {
  function toggle() {
    const isDark = document.documentElement.classList.toggle("dark");
    window.localStorage.setItem(THEME_STORAGE_KEY, isDark ? "dark" : "light");
  }

  return (
    <motion.button
      type="button"
      onClick={toggle}
      whileTap={{ scale: 0.85, rotate: -20 }}
      aria-label="다크모드 전환"
      className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
    >
      <Sun size={16} className="dark:hidden" />
      <Moon size={16} className="hidden dark:block" />
    </motion.button>
  );
}
