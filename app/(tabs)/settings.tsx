// 설정 탭 — 그룹 관리 + 반복 관리 + 개발 도구(데이터 초기화)
import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Plus, Trash2 } from "lucide-react-native";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { eq, isNotNull } from "drizzle-orm";
import dayjs from "dayjs";

import { db } from "@/db/client";
import { groups, logs, logPersons, persons } from "@/db/schema";
import { seedDefaultGroups } from "@/db/seed";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Card } from "@/components/ui/card";

const REPEAT_LABEL: Record<string, string> = {
  daily: "매일",
  weekly: "매주",
  monthly: "매월",
  yearly: "매년",
};

export default function SettingsScreen() {
  const router = useRouter();
  const { data: allGroups = [] } = useLiveQuery(db.select().from(groups));
  const { data: repeatLogs = [] } = useLiveQuery(
    db.select().from(logs).where(isNotNull(logs.repeatType)),
  );

  async function deleteGroup(id: string, isDefault: boolean) {
    if (isDefault) {
      Alert.alert("삭제 불가", "기본 그룹은 삭제할 수 없습니다.");
      return;
    }
    Alert.alert("그룹 삭제", "그룹을 삭제할까요?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          await db.delete(groups).where(eq(groups.id, id));
        },
      },
    ]);
  }

  async function clearRepeat(id: string) {
    Alert.alert("반복 해제", "이 기록의 반복 설정을 해제할까요?", [
      { text: "취소", style: "cancel" },
      {
        text: "해제",
        onPress: async () => {
          await db.update(logs).set({ repeatType: null }).where(eq(logs.id, id));
        },
      },
    ]);
  }

  async function resetAllData() {
    Alert.alert(
      "전체 데이터 초기화",
      "모든 기록, 인물, 그룹이 삭제되고 기본 그룹이 재생성됩니다.",
      [
        { text: "취소", style: "cancel" },
        {
          text: "초기화",
          style: "destructive",
          onPress: async () => {
            await db.delete(logPersons);
            await db.delete(logs);
            await db.delete(persons);
            await db.delete(groups);
            await seedDefaultGroups();
            router.replace("/(tabs)");
          },
        },
      ],
    );
  }

  return (
    <View className="flex-1 bg-app-bg">
      <View className="px-5 pt-14 pb-3">
        <Text className="text-white text-2xl font-bold">설정</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}>
        {/* 그룹 관리 */}
        <View className="mb-8">
          <HStack className="items-center justify-between mb-3">
            <Text className="text-app-label text-[13px] font-semibold uppercase tracking-[0.5px]">그룹 관리</Text>
            <Pressable onPress={() => router.push("/groups/new")} className="bg-app-teal rounded-[16px] p-1">
              <Plus size={16} color="#fff" />
            </Pressable>
          </HStack>
          <VStack space="sm">
            {allGroups.map((group) => (
              <HStack key={group.id} className="items-center bg-app-surface rounded-[12px] p-[14px]">
                <View className="w-3 h-3 rounded-full mr-[10px]" style={{ backgroundColor: group.color }} />
                <Text className="flex-1 text-white text-[15px]">{group.emoji} {group.name}</Text>
                {!group.isDefault && (
                  <Pressable onPress={() => deleteGroup(group.id, group.isDefault)} className="p-1">
                    <Trash2 size={16} color="#ff6b6b" />
                  </Pressable>
                )}
              </HStack>
            ))}
          </VStack>
        </View>

        {/* 반복 관리 */}
        {repeatLogs.length > 0 && (
          <View className="mb-8">
            <Text className="text-app-label text-[13px] font-semibold uppercase tracking-[0.5px] mb-3">
              반복 관리 ({repeatLogs.length})
            </Text>
            <VStack space="sm">
              {repeatLogs.map((log) => (
                <Card key={log.id} variant="elevated" className="bg-app-surface rounded-[12px] p-0 overflow-hidden">
                  <Pressable
                    onPress={() => router.push({ pathname: "/logs/[id]", params: { id: log.id } })}
                    className="p-[14px]"
                  >
                    <HStack className="items-center justify-between">
                      <VStack className="flex-1 mr-3">
                        <Text className="text-white text-[14px] font-semibold" numberOfLines={1}>
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
          </View>
        )}

        {/* 개발 도구 */}
        <View className="mb-8">
          <Text className="text-app-label text-[13px] font-semibold uppercase tracking-[0.5px] mb-3">개발 도구</Text>
          <Pressable onPress={resetAllData} className="bg-app-danger-bg rounded-[12px] p-[14px] items-center">
            <Text className="text-app-danger text-[15px] font-semibold">전체 데이터 초기화</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
