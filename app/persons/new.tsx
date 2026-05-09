// 인물 추가 모달 화면
import {
  DraftAnniversary,
  PersonForm,
} from "@/components/persons/PersonForm";
import { db } from "@/db/client";
import { groups, personAnniversaries, persons } from "@/db/schema";
import dayjs from "dayjs";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
} from "react-native";

export default function PersonNewScreen() {
  const router = useRouter();
  const { data: allGroups = [] } = useLiveQuery(db.select().from(groups));

  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [mbti, setMbti] = useState("");
  const [memo, setMemo] = useState("");
  const [groupId, setGroupId] = useState("");
  const [draftAnniversaries, setDraftAnniversaries] = useState<
    DraftAnniversary[]
  >([]);

  useEffect(() => {
    if (!groupId && allGroups.length > 0) {
      setGroupId(allGroups[0].id);
    }
  }, [allGroups, groupId]);

  async function save() {
    if (!name.trim()) {
      Alert.alert("이름을 입력해 주세요.");
      return;
    }

    const result = await db
      .insert(persons)
      .values({
        name: name.trim(),
        birthDate: birthDate
          ? dayjs(birthDate).format("YYYY-MM-DD")
          : undefined,
        mbti: mbti || undefined,
        memo: memo.trim() || undefined,
        groupId,
      })
      .returning({ id: persons.id });

    const personId = result[0].id;

    for (const ann of draftAnniversaries) {
      if (!ann.title.trim() || !ann.date) continue;
      await db.insert(personAnniversaries).values({
        personId,
        title: ann.title.trim(),
        date: dayjs(ann.date).format("YYYY-MM-DD"),
        isRepeat: ann.isRepeat,
      });
    }

    router.back();
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView
        className="flex-1 bg-app-bg"
        contentContainerStyle={{ padding: 20, gap: 8, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <PersonForm
          name={name}
          onNameChange={setName}
          birthDate={birthDate}
          onBirthDateChange={setBirthDate}
          mbti={mbti}
          onMbtiChange={setMbti}
          memo={memo}
          onMemoChange={setMemo}
          groupId={groupId}
          onGroupIdChange={setGroupId}
          allGroups={allGroups}
          draftAnniversaries={draftAnniversaries}
          onAnniversariesChange={setDraftAnniversaries}
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
