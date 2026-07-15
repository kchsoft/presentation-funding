"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

// 롤링페이퍼 카드의 "작성 브라우저" 판별용 로컬 저장소.
// 참여 성공 시 서버가 1회 발급한 editToken을 펀딩별로 저장해두고,
// 같은 브라우저에서만 카드 수정·삭제 UI를 노출한다 (서버가 최종 검증한다).
// localStorage 접근은 반드시 클라이언트(이펙트/핸들러)에서만 호출할 것.

const tokensKey = (fundingId: string) => `sm:edit-tokens:${fundingId}`;
const openedKey = (fundingId: string) => `sm:paper-opened:${fundingId}`;
const STORE_EVENT = "sm:paper-storage";

function readStorage(key: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function notifyStorageChange(key: string) {
  window.dispatchEvent(new CustomEvent(STORE_EVENT, { detail: key }));
}

function subscribeToKey(key: string, onStoreChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === key) onStoreChange();
  };
  const onSameTabChange = (event: Event) => {
    if ((event as CustomEvent<string>).detail === key) onStoreChange();
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(STORE_EVENT, onSameTabChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(STORE_EVENT, onSameTabChange);
  };
}

function parseEditTokens(raw: string): Record<string, string> {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      ),
    );
  } catch {
    return {};
  }
}

export function loadEditTokens(fundingId: string): Record<string, string> {
  return parseEditTokens(readStorage(tokensKey(fundingId), "{}"));
}

export function useEditTokens(fundingId: string): Record<string, string> {
  const key = tokensKey(fundingId);
  const subscribe = useCallback(
    (onStoreChange: () => void) => subscribeToKey(key, onStoreChange),
    [key],
  );
  const getSnapshot = useCallback(() => readStorage(key, "{}"), [key]);
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => "{}");
  return useMemo(() => parseEditTokens(raw), [raw]);
}

export function saveEditToken(
  fundingId: string,
  contributionId: string,
  editToken: string,
) {
  try {
    const tokens = loadEditTokens(fundingId);
    tokens[contributionId] = editToken;
    const key = tokensKey(fundingId);
    localStorage.setItem(key, JSON.stringify(tokens));
    notifyStorageChange(key);
  } catch {
    // 저장 실패(시크릿 모드 등)면 수정·삭제만 못할 뿐 참여는 유효하다.
  }
}

/** 마감 후 오프닝 연출을 방문자마다 첫 1회만 재생하기 위한 플래그. */
export function wasPaperOpened(fundingId: string): boolean {
  return readStorage(openedKey(fundingId), "0") === "1";
}

export function usePaperOpened(fundingId: string): boolean {
  const key = openedKey(fundingId);
  const subscribe = useCallback(
    (onStoreChange: () => void) => subscribeToKey(key, onStoreChange),
    [key],
  );
  const getSnapshot = useCallback(() => readStorage(key, "0"), [key]);
  return useSyncExternalStore(subscribe, getSnapshot, () => "0") === "1";
}

export function markPaperOpened(fundingId: string) {
  try {
    const key = openedKey(fundingId);
    localStorage.setItem(key, "1");
    notifyStorageChange(key);
  } catch {
    // 실패해도 다음 방문에 연출이 한 번 더 나올 뿐이다.
  }
}
