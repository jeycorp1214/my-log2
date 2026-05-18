// 앱 루트 레이아웃 — Provider 조합 + Stack 네비게이터
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import "react-native-reanimated";

import { LockScreen } from "@/components/LockScreen";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import "@/global.css";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { DatabaseProvider } from "@/providers/DatabaseProvider";
import { DebugProvider } from "@/providers/DebugProvider";
import { ErrorBoundary } from "@/providers/ErrorBoundary";
import { PinLockProvider, usePinLock } from "@/providers/PinLockProvider";
import { TabPreferencesProvider } from "@/providers/TabPreferencesProvider";

const queryClient = new QueryClient({
  defaultOptions: { mutations: { retry: 1 } },
});

function PinLockOverlay() {
  const { isLocked } = usePinLock();
  if (!isLocked) return null;
  return <LockScreen />;
}

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ErrorBoundary>
      <DatabaseProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <KeyboardProvider>
            <QueryClientProvider client={queryClient}>
              <GluestackUIProvider mode="dark">
                <DebugProvider>
                  <TabPreferencesProvider>
                    <PinLockProvider>
                      <ThemeProvider
                        value={
                          colorScheme === "dark" ? DarkTheme : DefaultTheme
                        }
                      >
                        <Stack screenOptions={{ headerTitleAlign: "center" }}>
                          <Stack.Screen
                            name="(tabs)"
                            options={{ headerShown: false }}
                          />
                          <Stack.Screen
                            name="persons/new"
                            options={{
                              presentation: "modal",
                              title: "프로필 추가",
                            }}
                          />
                          <Stack.Screen
                            name="persons/[id]"
                            options={{
                              presentation: "modal",
                              title: "프로필 상세",
                            }}
                          />
                          <Stack.Screen
                            name="logs/new"
                            options={{
                              presentation: "modal",
                              title: "기록 추가",
                            }}
                          />
                          <Stack.Screen
                            name="logs/[id]"
                            options={{
                              presentation: "modal",
                              title: "기록 상세",
                            }}
                          />
                          <Stack.Screen
                            name="memos/new"
                            options={{
                              presentation: "modal",
                              title: "메모 추가",
                            }}
                          />
                          <Stack.Screen
                            name="memos/[id]"
                            options={{
                              presentation: "modal",
                              title: "메모 상세",
                            }}
                          />
                          <Stack.Screen
                            name="todos/new"
                            options={{
                              presentation: "modal",
                              title: "할 일 추가",
                            }}
                          />
                          <Stack.Screen
                            name="todos/[id]"
                            options={{
                              presentation: "modal",
                              title: "할 일 상세",
                            }}
                          />
                          <Stack.Screen
                            name="groups/new"
                            options={{
                              presentation: "modal",
                              title: "그룹 추가",
                            }}
                          />
                          <Stack.Screen
                            name="settings/groups"
                            options={{ title: "그룹 관리" }}
                          />
                          <Stack.Screen
                            name="settings/repeats"
                            options={{ title: "반복 관리" }}
                          />
                          <Stack.Screen
                            name="settings/data"
                            options={{ title: "데이터 확인" }}
                          />
                          <Stack.Screen
                            name="settings/backup"
                            options={{ title: "백업 / 복원" }}
                          />
                          <Stack.Screen
                            name="settings/tab-prefs"
                            options={{ title: "탭 기본 설정" }}
                          />
                          <Stack.Screen
                            name="settings/keyboard-test"
                            options={{ title: "KeyboardStickyView 테스트" }}
                          />
                          <Stack.Screen
                            name="settings/password"
                            options={{ title: "비밀번호" }}
                          />
                          <Stack.Screen
                            name="settings/stats"
                            options={{ title: "통계" }}
                          />
                          <Stack.Screen
                            name="search"
                            options={{
                              presentation: "modal",
                              headerShown: false,
                            }}
                          />
                        </Stack>
                        <StatusBar style="auto" />
                        <PinLockOverlay />
                      </ThemeProvider>
                    </PinLockProvider>
                  </TabPreferencesProvider>
                </DebugProvider>
              </GluestackUIProvider>
            </QueryClientProvider>
          </KeyboardProvider>
        </GestureHandlerRootView>
      </DatabaseProvider>
    </ErrorBoundary>
  );
}
