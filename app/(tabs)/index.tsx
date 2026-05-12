// 홈 탭 — 최근 기록 목록 (캘린더 없음)
import { FloatingActionButton } from "@/components/FloatingActionButton";
import TabsHeader from "@/components/layout/TabsHeader";
import { LogCard } from "@/components/logs/LogCard";
import { db } from "@/db/client";
import { logs } from "@/db/schema";
import { desc } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";

export default function HomeScreen() {
  const router = useRouter();
  const { data: recentLogs = [] } = useLiveQuery(
    db.select().from(logs).orderBy(desc(logs.logDate)).limit(30),
  );

  return (
    <View className="flex-1 bg-app-bg">
      <TabsHeader title="홈" searchOnPress={true} />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 96,
          gap: 8,
        }}
      >
        {recentLogs.length === 0 ? (
          <Text className="text-app-muted text-center mt-10">
            기록이 없습니다.
          </Text>
        ) : (
          recentLogs.map((log) => (
            <LogCard
              key={log.id}
              log={log}
              onPress={() =>
                router.push({ pathname: "/logs/[id]", params: { id: log.id } })
              }
            />
          ))
        )}
      </ScrollView>
      <FloatingActionButton onPress={() => router.push("/logs/new")} />
    </View>
  );
}
