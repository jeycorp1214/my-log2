// 인물 추가 모달 화면
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
  TextInput,
  View,
} from "react-native";
import { Plus, X } from "lucide-react-native";

import { DatePickerModal } from "@/components/DatePickerModal";
import { BirthDateInput } from "@/components/persons/BirthDateInput";
import { MbtiPicker } from "@/components/persons/MbtiPicker";
import { db } from "@/db/client";
import { groups, personAnniversaries, persons } from "@/db/schema";

type DraftAnniversary = {
  id: string;
  title: string;
  date: Date | null;
  isRepeat: boolean;
};

const ANNIVERSARY_PRESETS = ["결혼", "졸업", "입사", "첫 만남", "사귀기 시작"];

export default function PersonNewScreen() {
  const router = useRouter();
  const { data: allGroups = [] } = useLiveQuery(db.select().from(groups));

  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [mbti, setMbti] = useState("");
  const [memo, setMemo] = useState("");
  const [groupId, setGroupId] = useState("");
  const [anniversaries, setAnniversaries] = useState<DraftAnniversary[]>([]);
  const [showPickerFor, setShowPickerFor] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId && allGroups.length > 0) {
      setGroupId(allGroups[0].id);
    }
  }, [allGroups, groupId]);

  function addAnniversary() {
    setAnniversaries((prev) => [
      ...prev,
      { id: Math.random().toString(), title: "", date: null, isRepeat: false },
    ]);
  }

  function addPreset(title: string) {
    setAnniversaries((prev) => [
      ...prev,
      { id: Math.random().toString(), title, date: null, isRepeat: true },
    ]);
  }

  function removeAnniversary(id: string) {
    setAnniversaries((prev) => prev.filter((a) => a.id !== id));
  }

  function updateAnniversary<K extends keyof Omit<DraftAnniversary, "id">>(
    id: string,
    field: K,
    value: DraftAnniversary[K],
  ) {
    setAnniversaries((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [field]: value } : a)),
    );
  }

  async function save() {
    if (!name.trim()) {
      Alert.alert("이름을 입력해 주세요.");
      return;
    }

    const result = await db
      .insert(persons)
      .values({
        name: name.trim(),
        birthDate: birthDate ? dayjs(birthDate).format("YYYY-MM-DD") : undefined,
        mbti: mbti || undefined,
        memo: memo.trim() || undefined,
        groupId,
      })
      .returning({ id: persons.id });

    const personId = result[0].id;

    for (const ann of anniversaries) {
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
        <Text className="text-app-label text-[13px] mt-3">이름 *</Text>
        <TextInput
          className="bg-app-surface text-white rounded-[10px] p-3 text-[15px]"
          value={name}
          onChangeText={setName}
          placeholder="이름 입력"
          placeholderTextColor="#555"
        />

        <View className="mt-3">
          <BirthDateInput value={birthDate} onChange={setBirthDate} />
        </View>

        <View className="mt-3">
          <MbtiPicker value={mbti} onChange={setMbti} />
        </View>

        <Text className="text-app-label text-[13px] mt-3">메모</Text>
        <TextInput
          className="bg-app-surface text-white rounded-[10px] p-3 text-[15px]"
          value={memo}
          onChangeText={setMemo}
          placeholder="메모"
          placeholderTextColor="#555"
          multiline
          numberOfLines={3}
          style={{ minHeight: 80, textAlignVertical: "top" }}
        />

        <Text className="text-app-label text-[13px] mt-3">그룹</Text>
        <View className="flex-row flex-wrap gap-2 mt-1">
          {allGroups.map((g) => (
            <Pressable
              key={g.id}
              onPress={() => setGroupId(g.id)}
              className={`rounded-[20px] px-3 py-1.5 ${groupId === g.id ? "bg-app-teal" : "bg-app-surface"}`}
            >
              <Text className={`text-[13px] ${groupId === g.id ? "text-[#111] font-semibold" : "text-app-label"}`}>
                {g.emoji} {g.name}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* 기념일 섹션 */}
        <Text className="text-app-label text-[13px] mt-5">기념일</Text>

        <View className="flex-row flex-wrap gap-2 mt-1">
          {ANNIVERSARY_PRESETS.map((preset) => (
            <Pressable
              key={preset}
              onPress={() => addPreset(preset)}
              className="bg-app-surface rounded-[20px] px-3 py-1.5"
            >
              <Text className="text-app-label text-[13px]">{preset}</Text>
            </Pressable>
          ))}
        </View>

        {anniversaries.map((ann) => (
          <View key={ann.id} className="bg-app-surface rounded-[10px] p-3 mt-1">
            <View className="flex-row items-center gap-2">
              <TextInput
                className="flex-1 text-white text-[14px]"
                value={ann.title}
                onChangeText={(v) => updateAnniversary(ann.id, "title", v)}
                placeholder="기념일 이름"
                placeholderTextColor="#555"
              />
              <Pressable onPress={() => removeAnniversary(ann.id)} hitSlop={8}>
                <X size={16} color="#555" />
              </Pressable>
            </View>
            <View className="flex-row items-center gap-2 mt-2">
              <Pressable
                onPress={() => setShowPickerFor(ann.id)}
                className="flex-1 bg-[#1a1a1a] rounded-[8px] px-2 py-1.5"
              >
                <Text className="text-[13px]" style={{ color: ann.date ? "#ccc" : "#555" }}>
                  {ann.date ? dayjs(ann.date).format("YYYY.MM.DD") : "날짜 선택"}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => updateAnniversary(ann.id, "isRepeat", !ann.isRepeat)}
                className="flex-row items-center gap-1.5 bg-[#1a1a1a] rounded-[8px] px-2.5 py-1.5"
              >
                <View
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: ann.isRepeat ? "#4ecdc4" : "#444" }}
                />
                <Text className="text-[12px] text-app-muted">매년</Text>
              </Pressable>
            </View>
          </View>
        ))}

        <Pressable onPress={addAnniversary} className="flex-row items-center gap-1.5 py-2">
          <Plus size={14} color="#4ecdc4" />
          <Text className="text-app-teal text-[13px]">기념일 추가</Text>
        </Pressable>

        {showPickerFor && (
          <DatePickerModal
            visible
            value={anniversaries.find((a) => a.id === showPickerFor)?.date ?? new Date()}
            onChange={(date) => {
              updateAnniversary(showPickerFor, "date", date);
              setShowPickerFor(null);
            }}
            onClose={() => setShowPickerFor(null)}
          />
        )}

        <Pressable onPress={save} className="bg-app-teal rounded-[12px] p-4 items-center mt-6">
          <Text className="text-[#111] text-base font-bold">저장</Text>
        </Pressable>
        <Pressable onPress={() => router.back()} className="items-center py-3">
          <Text className="text-app-muted text-[14px]">취소</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
