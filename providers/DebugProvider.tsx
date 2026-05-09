// 디버그 모드 전역 상태 — SecureStore로 앱 재시작 간 유지
import * as SecureStore from "expo-secure-store";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const DEBUG_KEY = "app_debug_mode";

type DebugContextValue = {
  debugMode: boolean;
  toggleDebugMode: () => void;
};

const DebugContext = createContext<DebugContextValue>({
  debugMode: false,
  toggleDebugMode: () => {},
});

export function DebugProvider({ children }: { children: ReactNode }) {
  const [debugMode, setDebugMode] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(DEBUG_KEY).then((v) => {
      if (v === "true") setDebugMode(true);
    });
  }, []);

  function toggleDebugMode() {
    setDebugMode((prev) => {
      const next = !prev;
      SecureStore.setItemAsync(DEBUG_KEY, String(next));
      return next;
    });
  }

  return (
    <DebugContext.Provider value={{ debugMode, toggleDebugMode }}>
      {children}
    </DebugContext.Provider>
  );
}

export function useDebugMode() {
  return useContext(DebugContext);
}
