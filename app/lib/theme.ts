export const THEME_STORAGE_KEY = "theme";

/**
 * 하이드레이션 전에 실행되는 FOUC 방지 스크립트.
 * localStorage 저장값 → 시스템 설정 → light 순으로 우선순위를 매긴다.
 */
export const noFlashThemeScript = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");var d=t?t==="dark":matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d)}catch(e){}})()`;
