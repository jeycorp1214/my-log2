// 반복 관리 화면 — 반복 로그 목록 조회/해제 + FAB 추가
import dayjs from "dayjs";
import { eq, isNotNull } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

import { Card } from "@/components/ui/card";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { db } from "@/db/client";
import { logs } from "@/db/schema";

const REPEAT_LABEL: Record<string, string> = {
  daily: "매일",
  weekly: "매주",
  monthly: "매월",
  yearly: "매년",
};

export default function RepeatsScreen() {
  const router = useRouter();
  const { data: repeatLogs = [] } = useLiveQuery(
    db.select().from(logs).where(isNotNull(logs.repeatType)),
  );

  async function clearRepeat(id: string) {
    Alert.alert("반복 해제", "이 기록의 반복 설정을 해제할까요?", [
      { text: "취소", style: "cancel" },
      {
        text: "해제",
        onPress: async () => {
          await db
            .update(logs)
            .set({ repeatType: null })
            .where(eq(logs.id, id));
        },
      },
    ]);
  }

  return (
    <View className="flex-1 bg-app-bg">
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 96,
        }}
      >
        {repeatLogs.length === 0 ? (
          <Text className="text-app-muted text-center mt-8">
            반복 기록이 없습니다.
          </Text>
        ) : (
          <VStack space="sm">
            {repeatLogs.map((log) => (
              <Card
                key={log.id}
                variant="elevated"
                className="bg-app-surface rounded-[12px] p-0 overflow-hidden"
              >
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/logs/[id]",
                      params: { id: log.id },
                    })
                  }
                  className="p-[14px]"
                >
                  <HStack className="items-center justify-between">
                    <VStack className="flex-1 mr-3">
                      <Text
                        className="text-white text-[14px] font-semibold"
                        numberOfLines={1}
                      >
                        {log.title}
                      </Text>
                      <HStack className="gap-2 mt-1">
                        <Text className="text-app-teal text-xs">
                          {REPEAT_LABEL[log.repeatType ?? ""] ?? log.repeatType}
                        </Text>
                        {log.repeatUntil && (
                          <Text className="text-app-muted text-xs">
                            ~{dayjs(log.repeatUntil).format("YY.MM.DD")}
                          </Text>
                        )}
                      </HStack>
                    </VStack>
                    <Pressable
                      onPress={() => clearRepeat(log.id)}
                      className="bg-app-bg rounded-[8px] px-3 py-1.5"
                    >
                      <Text className="text-app-muted text-xs">해제</Text>
                    </Pressable>
                  </HStack>
                </Pressable>
              </Card>
            ))}
          </VStack>
        )}
      </ScrollView>
    </View>
  );
}
