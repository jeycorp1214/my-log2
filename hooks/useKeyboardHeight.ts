// 키보드 높이를 플랫폼별로 추적하는 훅 — iOS는 will*, Android는 did* 이벤트 사용
import { useEffect, useState } from "react";
import { Keyboard, Platform } from "react-native";

export function useKeyboardHeight() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const show = Keyboard.addListener(
      showEvent,
      (e) => setKeyboardHeight(e.endCoordinates.height), // 키보드 높이 업데이트
    );
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));

    return () => {
      show.remove(); // 이벤트 리스너 정리
      hide.remove(); // 이벤트 리스너 정리
    };
  }, []);

  return keyboardHeight;
}
