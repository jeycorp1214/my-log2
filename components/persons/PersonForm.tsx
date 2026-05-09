// 인물 폼 공유 컴포넌트 — 생성/수정에서 공통 사용
import { DatePickerModal } from "@/components/DatePickerModal";
import { BirthDateInput } from "@/components/persons/BirthDateInput";
import { MbtiPicker } from "@/components/persons/MbtiPicker";
import { groups } from "@/db/schema";
import { ANNIVERSARY_PRESETS } from "@/db/seed";
import dayjs from "dayjs";
import { Plus, X } from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

export type DraftAnniversary = {
  id: string;
  title: string;
  date: Date | null;
  isRepeat: boolean;
};

type Group = typeof groups.$inferSelect;

interface PersonFormProps {
  name: string;
  onNameChange: (v: string) => void;
  birthDate: Date | null;
  onBirthDateChange: (v: Date | null) => void;
  mbti: string;
  onMbtiChange: (v: string) => void;
  memo: string;
  onMemoChange: (v: string) => void;
  groupId: string;
  onGroupIdChange: (v: string) => void;
  allGroups: Group[];
  draftAnniversaries: DraftAnniversary[];
  onAnniversariesChange: (v: DraftAnniversary[]) => void;
}

export function PersonForm({
  name,
  onNameChange,
  birthDate,
  onBirthDateChange,
  mbti,
  onMbtiChange,
  memo,
  onMemoChange,
  groupId,
  onGroupIdChange,
  allGroups,
  draftAnniversaries,
  onAnniversariesChange,
}: PersonFormProps) {
  const [showPickerFor, setShowPickerFor] = useState<string | null>(null);

  function addAnniversary() {
    onAnniversariesChange([
      ...draftAnniversaries,
      { id: Math.random().toString(), title: "", date: null, isRepeat: false },
    ]);
  }

  function addPreset(title: string) {
    onAnniversariesChange([
      ...draftAnniversaries,
      { id: Math.random().toString(), title, date: null, isRepeat: true },
    ]);
  }

  function removeAnniversary(draftId: string) {
    onAnniversariesChange(draftAnniversaries.filter((a) => a.id !== draftId));
  }

  function updateAnniversary<K extends keyof Omit<DraftAnniversary, "id">>(
    draftId: string,
    field: K,
    value: DraftAnniversary[K],
  ) {
    onAnniversariesChange(
      draftAnniversaries.map((a) =>
        a.id === draftId ? { ...a, [field]: value } : a,
      ),
    );
  }

  return (
    <>
      <Text className="text-app-label text-[13px] mt-3">이름 *</Text>
      <TextInput
        className="bg-app-surface text-white rounded-[10px] p-3 text-[15px]"
        value={name}
        onChangeText={onNameChange}
        placeholder="이름 입력"
        placeholderTextColor="#555"
      />

      <View className="mt-3">
        <BirthDateInput value={birthDate} onChange={onBirthDateChange} />
      </View>

      <View className="mt-3">
        <MbtiPicker value={mbti} onChange={onMbtiChange} />
      </View>

      <Text className="text-app-label text-[13px] mt-3">메모</Text>
      <TextInput
        className="bg-app-surface text-white rounded-[10px] p-3 text-[15px]"
        value={memo}
        onChangeText={onMemoChange}
        placeholder="메모"
        placeholderTextColor="#555"
        multiline
        style={{ minHeight: 80, textAlignVertical: "top" }}
      />

      <Text className="text-app-label text-[13px] mt-3">그룹</Text>
      <View className="flex-row flex-wrap gap-2 mt-1">
        {allGroups.map((g) => (
          <Pressable
            key={g.id}
            onPress={() => onGroupIdChange(g.id)}
            className={`rounded-[20px] px-3 py-1.5 ${groupId === g.id ? "bg-app-teal" : "bg-app-surface"}`}
          >
            <Text
              className={`text-[13px] ${groupId === g.id ? "text-[#111] font-semibold" : "text-app-label"}`}
            >
              {g.emoji} {g.name}
            </Text>
          </Pressable>
        ))}
      </View>

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

      {draftAnniversaries.map((ann) => (
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
              <Text
                className="text-[13px]"
                style={{ color: ann.date ? "#ccc" : "#555" }}
              >
                {ann.date ? dayjs(ann.date).format("YYYY.MM.DD") : "날짜 선택"}
              </Text>
            </Pressable>
            <Pressable
              onPress={() =>
                updateAnniversary(ann.id, "isRepeat", !ann.isRepeat)
              }
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

      <Pressable
        onPress={addAnniversary}
        className="flex-row items-center gap-1.5 py-2"
      >
        <Plus size={14} color="#4ecdc4" />
        <Text className="text-app-teal text-[13px]">기념일 추가</Text>
      </Pressable>

      {showPickerFor && (
        <DatePickerModal
          visible
          value={
            draftAnniversaries.find((a) => a.id === showPickerFor)?.date ??
            new Date()
          }
          onChange={(date) => {
            updateAnniversary(showPickerFor, "date", date);
            setShowPickerFor(null);
          }}
          onClose={() => setShowPickerFor(null)}
        />
      )}
    </>
  );
}
