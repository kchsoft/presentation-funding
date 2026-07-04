"use client";

import { useEffect } from "react";

/**
 * useActionState의 결과가 성공 상태로 바뀔 때마다 콜백을 실행한다.
 * `state?.success`(boolean)가 아니라 `state` 객체 참조 자체를 의존성으로 써야 한다 —
 * 매 성공마다 서버 액션이 새 객체를 반환하므로 참조는 항상 바뀌지만,
 * boolean 값만 보면 true→true라 두 번째 이후의 성공에서는 effect가 재실행되지 않는다.
 */
export function useOnActionSuccess(
  state: { success?: boolean } | null,
  onSuccess?: () => void,
) {
  useEffect(() => {
    if (state?.success) onSuccess?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
}
