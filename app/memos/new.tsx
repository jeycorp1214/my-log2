// 메모 생성 화면 — 내용 입력 후 저장
import { MemoEditor } from "@/components/memos/MemoEditor";
import { db } from "@/db/client";
import { memos } from "@/db/schema";
import { useRouter } from "expo-router";
import { useState } from "react";

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
    <MemoEditor
      value={content}
      onChange={setContent}
      onSave={save}
      isSaveEnabled={content.trim().length > 0}
      onBack={() => router.back()}
      autoFocus
    />
  );
}
