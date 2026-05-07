// 앱 루트 레이아웃 — DB 마이그레이션, 시드, QueryClient 초기화
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import "@/global.css";

import { runMigrations } from "@/db/client";
import { seedDefaultGroups } from "@/db/seed";

const queryClient = new QueryClient({
  defaultOptions: { mutations: { retry: 1 } },
});

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      await runMigrations();
      await seedDefaultGroups();
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GluestackUIProvider mode="dark">
        <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="persons/new" options={{ presentation: "modal", title: "인물 추가" }} />
            <Stack.Screen name="persons/[id]" options={{ presentation: "modal", title: "인물 상세" }} />
            <Stack.Screen name="logs/new" options={{ presentation: "modal", title: "기록 추가" }} />
            <Stack.Screen name="logs/[id]" options={{ presentation: "modal", title: "기록 상세" }} />
            <Stack.Screen name="groups/new" options={{ presentation: "modal", title: "그룹 추가" }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </GluestackUIProvider>
    </QueryClientProvider>
  );
}
