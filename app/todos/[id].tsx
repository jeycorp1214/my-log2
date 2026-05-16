// 할 일 상세/수정 화면 — 제목, 노트, 기한, 사분면 편집
import { DateInput } from "@/components/DateInput";
import { db } from "@/db/client";
import { todos, type Quadrant } from "@/db/schema";
import { eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useLocalSearchParams, useRouter } from "expo-router";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

const QUADRANTS: { key: Quadrant; label: string; color: string }[] = [
  { key: "do",       label: "즉시 실행", color: "#ff6b6b" },
  { key: "schedule", label: "계획",      color: "#4ecdc4" },
  { key: "delegate", label: "빠르게 처리", color: "#f59e0b" },
  { key: "eliminate",label: "제거",       color: "#666666" },
];

export default function TodoDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: rows = [] } = useLiveQuery(
    db.select().from(todos).where(eq(todos.id, id)),
    [id],
  );
  const todo = rows[0];

  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [quadrant, setQuadrant] = useState<Quadrant>("do");
  const [dueDate, setDueDate] = useState<Date | null>(null);

  useEffect(() => {
    if (!todo) return;
    setTitle(todo.title);
    setNote(todo.note ?? "");
    setQuadrant(todo.quadrant);
    setDueDate(todo.dueDate ? dayjs(todo.dueDate).toDate() : null);
  }, [todo?.id]);

  if (!todo) return null;

  const isDirty =
    title.trim() !== todo.title ||
    (note.trim() || null) !== (todo.note ?? null) ||
    quadrant !== todo.quadrant ||
    (dueDate ? dayjs(dueDate).format("YYYY-MM-DD") : null) !== (todo.dueDate ?? null);

  async function save() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    await db
      .update(todos)
      .set({
        title: trimmedTitle,
        note: note.trim() || null,
        quadrant,
        dueDate: dueDate ? dayjs(dueDate).format("YYYY-MM-DD") : null,
        updatedAt: new Date(),
      })
      .where(eq(todos.id, id));
    router.back();
  }

  async function deleteTodo() {
    Alert.alert("할 일 삭제", "이 항목을 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          await db.delete(todos).where(eq(todos.id, id));
          router.back();
        },
      },
    ]);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <ScrollView
        className="flex-1 bg-app-bg"
        contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* 제목 */}
        <View>
          <Text className="text-app-label text-[12px] font-semibold uppercase tracking-[0.5px] mb-2">
            제목
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            className="bg-app-surface text-white rounded-[10px] px-4 py-3 text-[15px]"
            placeholderTextColor="#555"
            placeholder="할 일 제목"
            autoFocus
          />
        </View>

        {/* 사분면 */}
        <View>
          <Text className="text-app-label text-[12px] font-semibold uppercase tracking-[0.5px] mb-2">
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
                <Text style={{ color: quadrant === q.key ? q.color : "#666", fontSize: 13, fontWeight: "600" }}>
                  {q.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* 기한 */}
        <View>
          <Text className="text-app-label text-[12px] font-semibold uppercase tracking-[0.5px] mb-2">
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
          <Text className="text-app-label text-[12px] font-semibold uppercase tracking-[0.5px] mb-2">
            노트
          </Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            className="bg-app-surface text-white rounded-[10px] px-4 py-3 text-[14px]"
            placeholderTextColor="#555"
            placeholder="추가 메모 (선택)"
            multiline
            style={{ minHeight: 100, textAlignVertical: "top" }}
          />
        </View>

        <Pressable
          onPress={save}
          className="bg-app-teal rounded-[12px] p-4 items-center mt-2"
          style={{ opacity: isDirty ? 1 : 0.4 }}
          disabled={!isDirty}
        >
          <Text className="text-[#111] text-base font-bold">저장</Text>
        </Pressable>
        <Pressable onPress={() => router.back()} className="items-center py-2">
          <Text className="text-app-muted text-[14px]">취소</Text>
        </Pressable>
        <Pressable onPress={deleteTodo} className="items-center py-2">
          <Text style={{ color: "#ff6b6b", fontSize: 14 }}>삭제</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
