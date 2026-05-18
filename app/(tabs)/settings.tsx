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
import {
  resetLogsData,
  resetMemosData,
  resetPersonsData,
  resetTodosData,
  seedDefaultGroups,
  seedLogsOnly,
  seedMemosOnly,
  seedPersonsOnly,
  seedSampleData,
  seedTodosOnly,
} from "@/db/seed";
import { useDebugMode } from "@/providers/DebugProvider";

export default function SettingsScreen() {
  const router = useRouter();
  const { debugMode, toggleDebugMode } = useDebugMode();

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

  async function insertSampleData() {
    Alert.alert(
      "샘플 데이터 삽입",
      "프로필 50명, 기록 30개, 할 일 30개, 메모 30개를 추가합니다. 계속하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "삽입",
          onPress: async () => {
            try {
              await seedSampleData();
              Alert.alert("완료", "샘플 데이터가 삽입되었습니다.");
            } catch (e) {
              console.error("[insertSampleData]", e);
              Alert.alert("오류", String(e));
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
              Alert.alert(
                "완료",
                "테이블 구조부터 데이터까지 모두 초기화되었습니다.",
              );
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
          <Text className="text-app-label text-sm font-semibold uppercase tracking-[0.5px] mb-3">
            관리
          </Text>
          <View className="bg-app-surface rounded-[12px] overflow-hidden">
            <Pressable
              onPress={() => router.push("/settings/groups")}
              className="flex-row items-center px-[14px] py-[16px]"
              style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
            >
              <Text className="flex-1 text-white text-sm">그룹 관리</Text>
              <ChevronRight size={16} color="#666" />
            </Pressable>
            <View className="h-[1px] bg-[#2a2a2a] mx-[14px]" />
            <Pressable
              onPress={() => router.push("/settings/repeats")}
              className="flex-row items-center px-[14px] py-[16px]"
              style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
            >
              <Text className="flex-1 text-white text-sm">반복 관리</Text>
              <ChevronRight size={16} color="#666" />
            </Pressable>
            <View className="h-[1px] bg-[#2a2a2a] mx-[14px]" />
            <Pressable
              onPress={() => router.push("/settings/data")}
              className="flex-row items-center px-[14px] py-[16px]"
              style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
            >
              <Text className="flex-1 text-white text-sm">데이터 확인</Text>
              <ChevronRight size={16} color="#666" />
            </Pressable>
          </View>
        </View>

        {/* 백업 */}
        <View className="mb-8">
          <Text className="text-app-label text-sm font-semibold uppercase tracking-[0.5px] mb-3">
            백업
          </Text>
          <View className="bg-app-surface rounded-[12px] overflow-hidden">
            <Pressable
              onPress={() => router.push("/settings/backup")}
              className="flex-row items-center px-[14px] py-[16px]"
              style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
            >
              <Text className="flex-1 text-white text-sm">백업 / 복원</Text>
              <ChevronRight size={16} color="#666" />
            </Pressable>
          </View>
        </View>

        {/* 통계 */}
        <View className="mb-8">
          <Text className="text-app-label text-sm font-semibold uppercase tracking-[0.5px] mb-3">
            통계
          </Text>
          <View className="bg-app-surface rounded-[12px] overflow-hidden">
            <Pressable
              onPress={() => router.push("/settings/heatmap")}
              className="flex-row items-center px-[14px] py-[16px]"
              style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
            >
              <Text className="flex-1 text-white text-sm">기록 히트맵</Text>
              <ChevronRight size={16} color="#666" />
            </Pressable>
            <View className="h-[1px] bg-[#2a2a2a] mx-[14px]" />
            <Pressable
              onPress={() => router.push("/settings/stats")}
              className="flex-row items-center px-[14px] py-[16px]"
              style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
            >
              <Text className="flex-1 text-white text-sm">통계</Text>
              <ChevronRight size={16} color="#666" />
            </Pressable>
          </View>
        </View>

        {/* 보안 */}
        <View className="mb-8">
          <Text className="text-app-label text-sm font-semibold uppercase tracking-[0.5px] mb-3">
            보안
          </Text>
          <View className="bg-app-surface rounded-[12px] overflow-hidden">
            <Pressable
              onPress={() => router.push("/settings/password")}
              className="flex-row items-center px-[14px] py-[16px]"
              style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
            >
              <Text className="flex-1 text-white text-sm">비밀번호</Text>
              <ChevronRight size={16} color="#666" />
            </Pressable>
          </View>
        </View>

        {/* 탭 설정 */}
        <View className="mb-8">
          <Text className="text-app-label text-sm font-semibold uppercase tracking-[0.5px] mb-3">
            탭 설정
          </Text>
          <View className="bg-app-surface rounded-[12px] overflow-hidden">
            <Pressable
              onPress={() => router.push("/settings/tab-prefs")}
              className="flex-row items-center px-[14px] py-[16px]"
              style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
            >
              <Text className="flex-1 text-white text-sm">탭 기본 설정</Text>
              <ChevronRight size={16} color="#666" />
            </Pressable>
          </View>
        </View>

        {/* 테스트 */}
        <View className="mb-8">
          <Text className="text-app-label text-sm font-semibold uppercase tracking-[0.5px] mb-3">
            테스트
          </Text>
          <View className="bg-app-surface rounded-[12px] overflow-hidden">
            <Pressable
              onPress={() => router.push("/settings/keyboard-test")}
              className="flex-row items-center px-[14px] py-[16px]"
              style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
            >
              <Text className="flex-1 text-white text-sm">
                KeyboardStickyView 테스트
              </Text>
              <ChevronRight size={16} color="#666" />
            </Pressable>
            <View className="h-[1px] bg-[#2a2a2a] mx-[14px]" />
            <Pressable
              onPress={() => router.push("/settings/calendar-test")}
              className="flex-row items-center px-[14px] py-[16px]"
              style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
            >
              <Text className="flex-1 text-white text-sm">캘린더 테스트</Text>
              <ChevronRight size={16} color="#666" />
            </Pressable>
          </View>
        </View>

        {/* 개발자 옵션 */}
        <View className="mb-8">
          <Text className="text-app-label text-sm font-semibold uppercase tracking-[0.5px] mb-3">
            개발자 옵션
          </Text>
          <View className="bg-app-surface rounded-[12px] overflow-hidden">
            <View className="flex-row items-center px-[14px] py-[16px]">
              <View className="flex-1">
                <Text className="text-white text-sm">디버그 모드</Text>
                <Text className="text-app-muted text-xs mt-0.5">
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
            <Text className="text-app-label text-sm font-semibold uppercase tracking-[0.5px] mb-3">
              개발 도구
            </Text>

            {/* 샘플 데이터 삽입 */}
            <View className="bg-app-surface rounded-[12px] overflow-hidden mb-2">
              <Pressable
                onPress={insertSampleData}
                className="px-[14px] py-[14px] items-center"
              >
                <Text className="text-app-teal text-sm font-semibold">
                  전체 샘플 삽입
                </Text>
                <Text className="text-app-muted text-xs mt-0.5">
                  프로필 100명 · 기록 80개 · 할 일 60개 · 메모 60개
                </Text>
              </Pressable>
              <View className="h-[1px] bg-[#2a2a2a]" />
              {(
                [
                  { label: "프로필", fn: seedPersonsOnly },
                  { label: "기록", fn: seedLogsOnly },
                  { label: "할 일", fn: seedTodosOnly },
                  { label: "메모", fn: seedMemosOnly },
                ] as const
              ).map((item, idx, arr) => (
                <View key={item.label}>
                  <View className="flex-row items-center px-[14px] py-[10px] gap-2">
                    <Text className="flex-1 text-white text-sm">{item.label}</Text>
                    {([10, 30, 50] as const).map((n) => (
                      <Pressable
                        key={n}
                        onPress={async () => {
                          try {
                            await item.fn(n);
                            Alert.alert("완료", `${item.label} ${n}개 추가됨.`);
                          } catch (e) {
                            Alert.alert("오류", String(e));
                          }
                        }}
                        className="rounded-[6px] px-3 py-1.5"
                        style={{ backgroundColor: "#1a3a2e" }}
                      >
                        <Text style={{ color: "#4ecdc4", fontSize: 12, fontWeight: "600" }}>
                          {n}개
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  {idx < arr.length - 1 && <View className="h-[1px] bg-[#2a2a2a] mx-[14px]" />}
                </View>
              ))}
            </View>

            {/* 개별 테이블 초기화 */}
            <View className="bg-app-danger-bg rounded-[12px] overflow-hidden mb-2">
              <View className="flex-row px-[14px] py-[10px] gap-2">
                {(
                  [
                    { label: "프로필", fn: resetPersonsData, desc: "기록 연결 포함" },
                    { label: "기록", fn: resetLogsData, desc: "연결 포함" },
                    { label: "할 일", fn: resetTodosData, desc: "" },
                    { label: "메모", fn: resetMemosData, desc: "" },
                  ] as const
                ).map((item) => (
                  <Pressable
                    key={item.label}
                    onPress={() =>
                      Alert.alert(
                        `${item.label} 초기화`,
                        `${item.label} 데이터를 모두 삭제합니다.${item.desc ? ` (${item.desc})` : ""} 계속하시겠습니까?`,
                        [
                          { text: "취소", style: "cancel" },
                          {
                            text: "삭제",
                            style: "destructive",
                            onPress: async () => {
                              try {
                                await item.fn();
                                Alert.alert("완료", `${item.label} 초기화됨.`);
                              } catch (e) {
                                Alert.alert("오류", String(e));
                              }
                            },
                          },
                        ],
                      )
                    }
                    className="flex-1 rounded-[6px] py-2 items-center"
                    style={{ backgroundColor: "#3a1a1a" }}
                  >
                    <Text style={{ color: "#ff6b6b", fontSize: 12, fontWeight: "600" }}>
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Pressable
              onPress={resetAllData}
              className="bg-app-danger-bg rounded-[12px] p-[14px] items-center mb-2"
            >
              <Text className="text-app-danger text-sm font-semibold">
                전체 데이터 초기화
              </Text>
              <Text className="text-app-muted text-xs mt-0.5">
                스키마 유지 · 데이터만 삭제
              </Text>
            </Pressable>

            <Pressable
              onPress={resetTableStructure}
              className="bg-app-danger-bg rounded-[12px] p-[14px] items-center"
            >
              <Text className="text-app-danger text-sm font-semibold">
                테이블 초기화 (DROP + 재생성)
              </Text>
              <Text className="text-app-muted text-xs mt-0.5">
                스키마까지 완전 초기화 · 마이그레이션 재실행
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
