// 메모 상세/수정 화면 — 내용 편집 후 저장
import { MemoEditor } from "@/components/memos/MemoEditor";
import { db } from "@/db/client";
import { memos } from "@/db/schema";
import { eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
} from "react-native";

export default function MemoDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: rows = [] } = useLiveQuery(
    db.select().from(memos).where(eq(memos.id, id)),
    [id],
  );
  const memo = rows[0];

  const [content, setContent] = useState("");

  useEffect(() => {
    if (memo) setContent(memo.content);
    // memo.id 변경 시에만 초기화 — 편집 중 라이브쿼리 업데이트로 내용 덮어쓰기 방지
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memo?.id]);

  if (!memo) return null;

  const isDirty = content.trim() !== memo.content;

  async function save() {
    const trimmed = content.trim();
    if (trimmed.length === 0) return;
    await db
      .update(memos)
      .set({ content: trimmed, updatedAt: new Date() })
      .where(eq(memos.id, id));
    router.back();
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <ScrollView
        className="flex-1 bg-app-bg"
        contentContainerStyle={{ padding: 20, gap: 8, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <MemoEditor
          value={content}
          onChange={setContent}
          isSaveEnabled={isDirty && content.trim().length > 0}
          autoFocus
        />

        <Pressable
          onPress={save}
          className="bg-app-teal rounded-[12px] p-4 items-center mt-6"
        >
          <Text className="text-[#111] text-base font-bold">저장</Text>
        </Pressable>
        <Pressable onPress={() => router.back()} className="items-center py-3">
          <Text className="text-app-muted text-[14px]">취소</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
