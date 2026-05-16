// 데이터 내보내기 / 불러오기 — 현재 DB 요약 + 파일 미리보기
import { db } from "@/db/client";
import {
  groups,
  logPersons,
  logs,
  memos,
  personAnniversaries,
  persons,
  todos,
} from "@/db/schema";
import {
  type BackupData,
  applyImport,
  exportData,
  pickBackupFile,
} from "@/services/backup";
import dayjs from "dayjs";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useRouter } from "expo-router";
import { Download, Upload } from "lucide-react-native";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

type DataRow = { label: string; count: number; accent?: boolean };

function SummaryTable({
  rows,
  exportedAt,
}: {
  rows: DataRow[];
  exportedAt?: string;
}) {
  return (
    <View className="bg-[#141414] rounded-[10px] overflow-hidden">
      {exportedAt && (
        <View className="px-4 py-2.5 border-b border-[#1e1e1e]">
          <Text className="text-app-muted text-[11px]">
            내보낸 날짜: {dayjs(exportedAt).format("YYYY-MM-DD HH:mm")}
          </Text>
        </View>
      )}
      {rows.map((row, i) => (
        <View
          key={row.label}
          className="flex-row items-center px-4 py-3"
          style={
            i > 0 ? { borderTopWidth: 1, borderColor: "#1e1e1e" } : undefined
          }
        >
          <Text className="flex-1 text-[#aaa] text-[13px]">{row.label}</Text>
          <Text
            className="text-[13px] font-semibold tabular-nums"
            style={{ color: row.accent ? "#4ecdc4" : "#666" }}
          >
            {row.count}개
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function BackupScreen() {
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);
  const [isPicking, setIsPicking] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [preview, setPreview] = useState<BackupData | null>(null);

  // 현재 DB 요약
  const { data: allGroups = [] } = useLiveQuery(db.select().from(groups));
  const { data: allPersons = [] } = useLiveQuery(db.select().from(persons));
  const { data: allLogs = [] } = useLiveQuery(db.select().from(logs));
  const { data: allAnniversaries = [] } = useLiveQuery(
    db.select().from(personAnniversaries),
  );
  const { data: allTodos = [] } = useLiveQuery(db.select().from(todos));
  const { data: allMemos = [] } = useLiveQuery(db.select().from(memos));
  const { data: allLogPersons = [] } = useLiveQuery(
    db.select().from(logPersons),
  );

  const currentRows: DataRow[] = [
    { label: "그룹", count: allGroups.length },
    { label: "프로필", count: allPersons.length },
    { label: "기록", count: allLogs.length },
    { label: "기록–프로필 연결", count: allLogPersons.length },
    { label: "기념일", count: allAnniversaries.length },
    { label: "할 일", count: allTodos.length },
    { label: "메모", count: allMemos.length },
  ];

  function previewRows(d: BackupData["data"]): DataRow[] {
    return [
      { label: "그룹", count: d.groups.length, accent: true },
      { label: "프로필", count: d.persons.length, accent: true },
      { label: "기록", count: d.logs.length, accent: true },
      {
        label: "기록–프로필 연결",
        count: d.logPersons?.length ?? 0,
        accent: true,
      },
      {
        label: "기념일",
        count: d.personAnniversaries?.length ?? 0,
        accent: true,
      },
      { label: "할 일", count: d.todos?.length ?? 0, accent: true },
      { label: "메모", count: d.memos?.length ?? 0, accent: true },
    ];
  }

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

  async function handlePickFile() {
    setIsPicking(true);
    try {
      const backup = await pickBackupFile();
      setPreview(backup);
    } catch (e: any) {
      if (e?.message === "CANCELLED") return;
      Alert.alert("오류", e?.message ?? String(e));
    } finally {
      setIsPicking(false);
    }
  }

  async function handleConfirmImport() {
    if (!preview) return;
    setIsImporting(true);
    try {
      await applyImport(preview);
      setPreview(null);
      Alert.alert("완료", "데이터를 불러왔습니다.");
    } catch (e: any) {
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

      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 48 }}
      >
        {/* ── 내보내기 ── */}
        <View className="gap-3">
          <Text className="text-app-label text-[12px] font-semibold uppercase tracking-[0.5px]">
            내보내기
          </Text>
          <SummaryTable rows={currentRows} />
          <Pressable
            onPress={handleExport}
            disabled={isExporting}
            className="bg-[#0e2419] rounded-[12px] py-3.5 flex-row items-center justify-center gap-2"
            style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
          >
            <Upload size={16} color="#4ecdc4" />
            <Text className="text-app-teal text-[14px] font-semibold">
              {isExporting ? "내보내는 중…" : "JSON 파일로 내보내기"}
            </Text>
          </Pressable>
        </View>

        <View className="h-[1px] bg-[#1e1e1e]" />

        {/* ── 불러오기 ── */}
        <View className="gap-3">
          <Text className="text-app-label text-[12px] font-semibold uppercase tracking-[0.5px]">
            불러오기
          </Text>

          {preview ? (
            // 파일 선택 후: 미리보기 + 확인/취소
            <>
              <SummaryTable
                rows={previewRows(preview.data)}
                exportedAt={preview.exported_at}
              />

              <View className="bg-[#1a0e0e] rounded-[10px] px-4 py-3">
                <Text className="text-app-danger text-[12px] leading-5">
                  위 데이터로 교체됩니다. 현재 데이터 전체가 삭제됩니다.{"\n"}이
                  작업은 되돌릴 수 없습니다.
                </Text>
              </View>

              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => setPreview(null)}
                  className="flex-1 bg-app-surface rounded-[12px] py-3.5 items-center"
                  style={({ pressed }) =>
                    pressed ? { opacity: 0.7 } : undefined
                  }
                >
                  <Text className="text-[#888] text-[14px] font-semibold">
                    취소
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleConfirmImport}
                  disabled={isImporting}
                  className="flex-1 bg-[#2a0e0e] rounded-[12px] py-3.5 items-center"
                  style={({ pressed }) =>
                    pressed ? { opacity: 0.7 } : undefined
                  }
                >
                  <Text className="text-app-danger text-[14px] font-semibold">
                    {isImporting ? "불러오는 중…" : "교체 확인"}
                  </Text>
                </Pressable>
              </View>
            </>
          ) : (
            // 기본: 파일 선택 버튼
            <>
              <Pressable
                onPress={handlePickFile}
                disabled={isPicking}
                className="bg-[#28200c] rounded-[12px] py-3.5 flex-row items-center justify-center gap-2"
                style={({ pressed }) =>
                  pressed ? { opacity: 0.7 } : undefined
                }
              >
                <Download size={16} color="#c9922a" />
                <Text
                  className="text-[14px] font-semibold"
                  style={{ color: "#c9922a" }}
                >
                  {isPicking ? "파일 선택 중…" : "백업 파일 선택"}
                </Text>
              </Pressable>
              <Text className="text-[#555] text-[11px] text-center">
                파일 선택 후 내용을 확인한 뒤 불러올 수 있습니다.
              </Text>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
