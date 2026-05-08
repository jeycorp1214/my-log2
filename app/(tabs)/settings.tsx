// 설정 탭 — 관리 항목 네비게이션 + 개발 도구
import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

import { db } from "@/db/client";
import { groups, logPersons, logs, persons } from "@/db/schema";
import { seedDefaultGroups } from "@/db/seed";

export default function SettingsScreen() {
  const router = useRouter();

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

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
      >
        {/* 관리 섹션 */}
        <View className="mb-8">
          <Text className="text-app-label text-[13px] font-semibold uppercase tracking-[0.5px] mb-3">
            관리
          </Text>
          <View className="bg-app-surface rounded-[12px] overflow-hidden">
            <Pressable
              onPress={() => router.push("/settings/groups")}
              className="flex-row items-center px-[14px] py-[16px]"
              style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
            >
              <Text className="flex-1 text-white text-[15px]">그룹 관리</Text>
              <ChevronRight size={16} color="#666" />
            </Pressable>
            <View className="h-[1px] bg-[#2a2a2a] mx-[14px]" />
            <Pressable
              onPress={() => router.push("/settings/repeats")}
              className="flex-row items-center px-[14px] py-[16px]"
              style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
            >
              <Text className="flex-1 text-white text-[15px]">반복 관리</Text>
              <ChevronRight size={16} color="#666" />
            </Pressable>
            <View className="h-[1px] bg-[#2a2a2a] mx-[14px]" />
            <Pressable
              onPress={() => router.push("/settings/data")}
              className="flex-row items-center px-[14px] py-[16px]"
              style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
            >
              <Text className="flex-1 text-white text-[15px]">데이터 확인</Text>
              <ChevronRight size={16} color="#666" />
            </Pressable>
          </View>
        </View>

        {/* 개발 도구 — 개발 빌드에서만 표시 */}
        {__DEV__ && (
          <View className="mb-8">
            <Text className="text-app-label text-[13px] font-semibold uppercase tracking-[0.5px] mb-3">
              개발 도구
            </Text>
            <Pressable
              onPress={resetAllData}
              className="bg-app-danger-bg rounded-[12px] p-[14px] items-center"
            >
              <Text className="text-app-danger text-[15px] font-semibold">
                전체 데이터 초기화
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
