// 설정 탭 — 관리 항목 네비게이션 + 개발 도구
import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { Alert, Pressable, ScrollView, Switch, Text, View } from "react-native";

import { db, resetDatabase } from "@/db/client";
import {
  groups,
  logPersons,
  logs,
  personAnniversaries,
  persons,
} from "@/db/schema";
import { seedDefaultGroups } from "@/db/seed";
import { useDebugMode } from "@/providers/DebugProvider";
import { useTabPreferences } from "@/providers/TabPreferencesProvider";

export default function SettingsScreen() {
  const router = useRouter();
  const { debugMode, toggleDebugMode } = useDebugMode();
  const { prefs } = useTabPreferences();

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

        {/* 탭 설정 현황 */}
        <View className="mb-8">
          <Text className="text-app-label text-[13px] font-semibold uppercase tracking-[0.5px] mb-3">
            탭 설정 현황
          </Text>
          <View className="bg-app-surface rounded-[12px] overflow-hidden">
            {/* 캘린더 */}
            <View className="px-[14px] py-[14px]">
              <Text className="text-app-muted text-[11px] font-semibold uppercase tracking-[0.5px] mb-1.5">
                캘린더
              </Text>
              <Text className="text-white text-[14px]">
                뷰모드. {prefs.calendar.viewMode === "board" ? "보드" : "컴팩트"}
                {"  ·  "}
                기념일. {prefs.calendar.showAnniversaries ? "ON" : "OFF"}
              </Text>
            </View>
            <View className="h-[1px] bg-[#2a2a2a] mx-[14px]" />
            {/* 리스트 */}
            <View className="px-[14px] py-[14px]">
              <Text className="text-app-muted text-[11px] font-semibold uppercase tracking-[0.5px] mb-1.5">
                리스트
              </Text>
              <Text className="text-white text-[14px]">
                {(() => {
                  const presetLabel =
                    prefs.list.preset === "this-week"
                      ? "이번 주"
                      : prefs.list.preset === "this-month"
                        ? "이번 달"
                        : prefs.list.preset === "recent-3m"
                          ? "최근 3개월"
                          : "직접 선택";
                  const completionLabel =
                    prefs.list.completionFilter === "done"
                      ? "완료"
                      : prefs.list.completionFilter === "undone"
                        ? "미완료"
                        : "전체";
                  const personLabel =
                    prefs.list.personFilter === "yes"
                      ? "있음"
                      : prefs.list.personFilter === "no"
                        ? "없음"
                        : "전체";
                  return `기간. ${presetLabel}  ·  완료. ${completionLabel}  ·  인물. ${personLabel}  ·  기념일. ${prefs.list.showAnniversaries ? "ON" : "OFF"}`;
                })()}
              </Text>
            </View>
            <View className="h-[1px] bg-[#2a2a2a] mx-[14px]" />
            {/* 인물 */}
            <View className="px-[14px] py-[14px]">
              <Text className="text-app-muted text-[11px] font-semibold uppercase tracking-[0.5px] mb-1.5">
                인물
              </Text>
              <Text className="text-white text-[14px]">
                {(() => {
                  const sortLabel =
                    prefs.persons.sortOrder === "name-asc" ? "이름순" : "나이순";
                  const mbtiLabel =
                    prefs.persons.mbtiFilter === "yes"
                      ? prefs.persons.mbtiDetail
                        ? `있음(${prefs.persons.mbtiDetail})`
                        : "있음"
                      : prefs.persons.mbtiFilter === "no"
                        ? "없음"
                        : "전체";
                  const groupLabel =
                    prefs.persons.groupFilter === "all" ? "전체" : "그룹 선택됨";
                  return `정렬. ${sortLabel}  ·  MBTI. ${mbtiLabel}  ·  그룹. ${groupLabel}`;
                })()}
              </Text>
            </View>
            <View className="h-[1px] bg-[#2a2a2a] mx-[14px]" />
            {/* 메모 */}
            <View className="px-[14px] py-[14px]">
              <Text className="text-app-muted text-[11px] font-semibold uppercase tracking-[0.5px] mb-1.5">
                메모
              </Text>
              <Text className="text-white text-[14px]">
                {(() => {
                  const completionLabel =
                    prefs.memo.completionFilter === "done"
                      ? "완료"
                      : prefs.memo.completionFilter === "undone"
                        ? "미완료"
                        : "전체";
                  const sortLabel =
                    prefs.memo.sortOrder === "newest" ? "최신순" : "오래된순";
                  return `표시. ${completionLabel}  ·  정렬. ${sortLabel}`;
                })()}
              </Text>
            </View>
          </View>
        </View>

        {/* 개발자 옵션 */}
        <View className="mb-8">
          <Text className="text-app-label text-[13px] font-semibold uppercase tracking-[0.5px] mb-3">
            개발자 옵션
          </Text>
          <View className="bg-app-surface rounded-[12px] overflow-hidden">
            <View className="flex-row items-center px-[14px] py-[16px]">
              <View className="flex-1">
                <Text className="text-white text-[15px]">디버그 모드</Text>
                <Text className="text-app-muted text-[12px] mt-0.5">
                  캘린더 상단에 쿼리 정보 표시
                </Text>
              </View>
              <Switch
                value={debugMode}
                onValueChange={toggleDebugMode}
                trackColor={{ false: "#333", true: "#1a3a2e" }}
                thumbColor={debugMode ? "#4ecdc4" : "#666"}
              />
            </View>
          </View>
        </View>

        {/* 개발 도구 — 디버그 모드일 때만 표시 */}
        {debugMode && (
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
