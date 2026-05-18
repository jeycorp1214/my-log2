// 할 일 생성 화면 — 제목, 사분면, 기한, 노트 입력 후 저장
import { DateInput } from "@/components/DateInput";
import { db } from "@/db/client";
import { todos, type Quadrant } from "@/db/schema";
import dayjs from "dayjs";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

const QUADRANTS: { key: Quadrant; label: string; color: string }[] = [
  { key: "do", label: "즉시 실행", color: "#ff6b6b" },
  { key: "schedule", label: "계획", color: "#4ecdc4" },
  { key: "delegate", label: "빠르게 처리", color: "#f59e0b" },
  { key: "eliminate", label: "제거", color: "#666666" },
];

export default function TodoNewScreen() {
  const router = useRouter();
  const { quadrant: quadrantParam } = useLocalSearchParams<{ quadrant?: string }>();

  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [quadrant, setQuadrant] = useState<Quadrant>((quadrantParam as Quadrant) ?? "do");
  const [dueDate, setDueDate] = useState<Date | null>(null);

  async function save() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    await db.insert(todos).values({
      title: trimmedTitle,
      note: note.trim() || null,
      quadrant,
      dueDate: dueDate ? dayjs(dueDate).format("YYYY-MM-DD") : null,
    });
    router.back();
  }

  return (
    <KeyboardAwareScrollView
      className="flex-1 bg-app-bg"
      contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* 제목 */}
      <View>
        <Text className="text-app-label text-xs font-semibold uppercase tracking-[0.5px] mb-2">
          제목
        </Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          className="bg-app-surface text-white rounded-[10px] px-4 py-3 text-sm"
          placeholderTextColor="#555"
          placeholder="할 일 제목"
          autoFocus
        />
      </View>

      {/* 사분면 */}
      <View>
        <Text className="text-app-label text-xs font-semibold uppercase tracking-[0.5px] mb-2">
          분류
        </Text>
        <View className="flex-row gap-2 flex-wrap">
          {QUADRANTS.map((q) => (
            <Pressable
              key={q.key}
              onPress={() => setQuadrant(q.key)}
              className="rounded-[10px] px-4 py-2.5"
              style={{
                backgroundColor: quadrant === q.key ? `${q.color}22` : "#1e1e1e",
                borderWidth: quadrant === q.key ? 1.5 : 0.5,
                borderColor: quadrant === q.key ? q.color : "#2a2a2a",
              }}
            >
              <Text
                style={{
                  color: quadrant === q.key ? q.color : "#666",
                  fontSize: 13,
                  fontWeight: "600",
                }}
              >
                {q.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* 기한 */}
      <View>
        <Text className="text-app-label text-xs font-semibold uppercase tracking-[0.5px] mb-2">
          기한
        </Text>
        <DateInput
          value={dueDate}
          onChange={setDueDate}
          onClear={() => setDueDate(null)}
          placeholder="기한 없음"
          variant="field"
        />
      </View>

      {/* 노트 */}
      <View>
        <Text className="text-app-label text-xs font-semibold uppercase tracking-[0.5px] mb-2">
          노트
        </Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          className="bg-app-surface text-white rounded-[10px] px-4 py-3 text-sm"
          placeholderTextColor="#555"
          placeholder="추가 메모 (선택)"
          multiline
          style={{ minHeight: 100, textAlignVertical: "top" }}
        />
      </View>

      <Pressable
        onPress={save}
        className="bg-app-teal rounded-[12px] p-4 items-center mt-2"
        style={{ opacity: title.trim() ? 1 : 0.4 }}
        disabled={!title.trim()}
      >
        <Text className="text-[#111] text-base font-bold">저장</Text>
      </Pressable>
    </KeyboardAwareScrollView>
  );
}
