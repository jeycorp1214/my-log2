// 설정 탭 — 관리 항목 네비게이션 + 개발 도구
import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

import { db, resetDatabase } from "@/db/client";
import {
  groups,
  logPersons,
  logs,
  personAnniversaries,
  persons,
} from "@/db/schema";
import { seedDefaultGroups } from "@/db/seed";

export default function SettingsScreen() {
  const router = useRouter();

  async function resetAllData() {
    Alert.alert(
      "전체 데이터 초기화",
      "모든 데이터가 삭제되고 초기 상태로 돌아갑니다. 이 작업은 되돌릴 수 없습니다. 계속하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "초기화",
          style: "destructive",
          onPress: async () => {
            try {
              await db.delete(logPersons);
              await db.delete(logs);
              await db.delete(personAnniversaries);
              await db.delete(persons);
              await db.delete(groups);

              // 2. 기본 데이터 다시 넣기
              await seedDefaultGroups();

              Alert.alert("알림", "데이터가 초기화되었습니다.");
            } catch (error) {
              console.error("초기화 중 오류 발생:", error);
            }
          },
        },
      ],
    );
  }

  async function resetTableStructure() {
    Alert.alert(
      "테이블 초기화",
      "모든 테이블을 DROP하고 마이그레이션을 재실행합니다. 데이터 전체가 삭제됩니다. 계속하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "초기화",
          style: "destructive",
          onPress: async () => {
            try {
              await resetDatabase();
              await seedDefaultGroups();
              Alert.alert("완료", "테이블 구조부터 데이터까지 모두 초기화되었습니다.");
            } catch (e) {
              console.error("[resetTableStructure]", e);
              Alert.alert("오류", String(e));
            }
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

            <Pressable
              onPress={resetTableStructure}
              className="bg-app-danger-bg rounded-[12px] p-[14px] items-center mt-2"
            >
              <Text className="text-app-danger text-[15px] font-semibold">
                테이블 초기화 (DROP + 재생성)
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
