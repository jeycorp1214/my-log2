// 데이터 내보내기 / 불러오기 화면
import { useRouter } from "expo-router";
import { Download, Upload } from "lucide-react-native";
import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";

import { exportData, pickAndImport } from "@/services/backup";

export default function BackupScreen() {
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  async function handleExport() {
    setIsExporting(true);
    try {
      await exportData();
    } catch (e) {
      Alert.alert("오류", String(e));
    } finally {
      setIsExporting(false);
    }
  }

  function handleImport() {
    Alert.alert(
      "데이터 불러오기",
      "기존 데이터가 모두 삭제되고 백업 파일의 데이터로 교체됩니다.\n이 작업은 되돌릴 수 없습니다.",
      [
        { text: "취소", style: "cancel" },
        {
          text: "불러오기",
          style: "destructive",
          onPress: doImport,
        },
      ],
    );
  }

  async function doImport() {
    setIsImporting(true);
    try {
      const { count } = await pickAndImport();
      const summary = [
        `그룹 ${count.groups}개`,
        `인물 ${count.persons}개`,
        `기록 ${count.logs}개`,
        count.todos > 0 ? `할 일 ${count.todos}개` : null,
        count.memos > 0 ? `메모 ${count.memos}개` : null,
      ]
        .filter(Boolean)
        .join(" · ");
      Alert.alert("완료", `데이터를 불러왔습니다.\n${summary}`);
    } catch (e: any) {
      if (e?.message === "CANCELLED") return;
      Alert.alert("오류", e?.message ?? String(e));
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <View className="flex-1 bg-app-bg">
      <View className="px-5 pt-14 pb-3 flex-row items-center">
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => (pressed ? { opacity: 0.6 } : undefined)}
          hitSlop={12}
        >
          <Text className="text-app-teal text-base">‹ 설정</Text>
        </Pressable>
        <Text className="flex-1 text-center text-white text-base font-semibold mr-10">
          백업 / 복원
        </Text>
      </View>

      <View className="px-4 pt-2 gap-3">
        {/* 내보내기 */}
        <Pressable
          onPress={handleExport}
          disabled={isExporting}
          className="bg-app-surface rounded-[14px] p-5 flex-row items-center gap-4"
          style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
        >
          <View className="w-10 h-10 rounded-full bg-[#0e2419] items-center justify-center">
            <Upload size={20} color="#4ecdc4" />
          </View>
          <View className="flex-1">
            <Text className="text-white text-[15px] font-semibold">
              {isExporting ? "내보내는 중…" : "데이터 내보내기"}
            </Text>
            <Text className="text-app-muted text-[12px] mt-0.5">
              전체 데이터를 JSON 파일로 저장
            </Text>
          </View>
        </Pressable>

        {/* 불러오기 */}
        <Pressable
          onPress={handleImport}
          disabled={isImporting}
          className="bg-app-surface rounded-[14px] p-5 flex-row items-center gap-4"
          style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
        >
          <View className="w-10 h-10 rounded-full bg-[#28200c] items-center justify-center">
            <Download size={20} color="#c9922a" />
          </View>
          <View className="flex-1">
            <Text className="text-white text-[15px] font-semibold">
              {isImporting ? "불러오는 중…" : "데이터 불러오기"}
            </Text>
            <Text className="text-app-muted text-[12px] mt-0.5">
              JSON 파일로 전체 데이터 교체
            </Text>
          </View>
        </Pressable>

        <View className="bg-[#1a1a0e] rounded-[10px] px-4 py-3 mt-1">
          <Text className="text-[#888] text-[12px] leading-5">
            내보내기 파일명: mylog_backup_YYYYMMDD_HHmmss.json{"\n"}
            불러오기 시 기존 데이터 전체 삭제 후 교체됩니다.
          </Text>
        </View>
      </View>
    </View>
  );
}
