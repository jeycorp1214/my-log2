// DB 마이그레이션·시드 초기화를 담당하는 Provider
import { runMigrations } from "@/db/client";
import { seedDefaultGroups } from "@/db/seed";
import { type ReactNode, useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

type Props = { children: ReactNode };

export function DatabaseProvider({ children }: Props) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    (async () => {
      try {
        await runMigrations();
        await seedDefaultGroups();
        setReady(true);
      } catch (e) {
        console.error("[DB] 초기화 실패", e);
        setError(e instanceof Error ? e : new Error(String(e)));
      }
    })();
  }, []);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
        <Text style={{ color: "#ff6b6b", fontSize: 16, fontWeight: "bold", marginBottom: 8 }}>
          DB 초기화 실패
        </Text>
        <Text style={{ color: "#888", fontSize: 13, textAlign: "center" }}>
          {error.message}
        </Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return <>{children}</>;
}
