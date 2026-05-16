// 현재 탭/화면 포커스 여부 반환 훅
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

export function useIsFocused(): boolean {
  const [focused, setFocused] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );
  return focused;
}
