// 메모 생성 화면 — 내용 입력 후 저장
import { MemoEditor } from "@/components/memos/MemoEditor";
import { db } from "@/db/client";
import { memos } from "@/db/schema";
import { useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import {
  Pressable,
  Text,
} from "react-native";

export default function MemoNewScreen() {
  const router = useRouter();
  const [content, setContent] = useState("");

  async function save() {
    const trimmed = content.trim();
    if (trimmed.length === 0) return;
    await db.insert(memos).values({ content: trimmed });
    router.back();
  }

  return (
    <KeyboardAwareScrollView
      className="flex-1 bg-app-bg"
      contentContainerStyle={{ padding: 20, gap: 8, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
        <MemoEditor
          value={content}
          onChange={setContent}
          isSaveEnabled={content.trim().length > 0}
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
    </KeyboardAwareScrollView>
  );
}
