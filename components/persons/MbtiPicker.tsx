// MBTI 4축 토글 선택 컴포넌트 — E/I, N/S, T/F, J/P 이진 선택
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

type Choices = [string, string, string, string];

const AXES = [
  {
    a: { key: "E", label: "외향", desc: "사교와 활동" },
    b: { key: "I", label: "내향", desc: "집중과 사색" },
  },
  {
    a: { key: "N", label: "가능성", desc: "상상과 비전" },
    b: { key: "S", label: "현실", desc: "경험과 사실" },
  },
  {
    a: { key: "T", label: "논리", desc: "분석과 원칙" },
    b: { key: "F", label: "감정", desc: "공감과 관계" },
  },
  {
    a: { key: "J", label: "계획", desc: "체계와 절차" },
    b: { key: "P", label: "유연", desc: "자유와 적응" },
  },
];

const DESC_MAP: Record<string, string> = {
  E: "사교적인",
  I: "신중한",
  N: "비전 있는",
  S: "현실적인",
  T: "논리적인",
  F: "따뜻한",
  J: "체계적인",
  P: "자유로운",
};

function parseChoices(mbti: string): Choices {
  if (mbti.length === 4) return [mbti[0], mbti[1], mbti[2], mbti[3]];
  return ["", "", "", ""];
}

type Props = {
  value: string;
  onChange: (mbti: string) => void;
};

export function MbtiPicker({ value, onChange }: Props) {
  const [choices, setChoices] = useState<Choices>(() => parseChoices(value));

  useEffect(() => {
    setChoices(parseChoices(value));
  }, [value]);

  function handleSelect(axisIdx: number, key: string) {
    const next = [...choices] as Choices;
    next[axisIdx] = next[axisIdx] === key ? "" : key;
    setChoices(next);
    onChange(next.every((c) => c !== "") ? next.join("") : "");
  }

  function clearAll() {
    const empty: Choices = ["", "", "", ""];
    setChoices(empty);
    onChange("");
  }

  const mbtiResult = choices.every((c) => c !== "") ? choices.join("") : "";
  const hasAny = choices.some((c) => c !== "");

  return (
    <View>
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-app-label text-[13px]">MBTI</Text>
        {hasAny && (
          <Pressable onPress={clearAll} hitSlop={8}>
            <Text className="text-app-muted text-[12px]">초기화</Text>
          </Pressable>
        )}
      </View>

      <View className="flex-row gap-2">
        {AXES.map((axis, idx) => (
          <View key={idx} className="flex-1 gap-1.5">
            <Pressable
              onPress={() => handleSelect(idx, axis.a.key)}
              className="items-center rounded-[10px] py-2.5"
              style={{
                backgroundColor:
                  choices[idx] === axis.a.key ? "#4ecdc4" : "#222",
              }}
            >
              <Text
                className="font-bold text-[16px]"
                style={{
                  color: choices[idx] === axis.a.key ? "#111" : "#aaa",
                }}
              >
                {axis.a.key}
              </Text>
              <Text
                className="text-[10px] mt-0.5"
                style={{
                  color: choices[idx] === axis.a.key ? "#111" : "#555",
                }}
              >
                {axis.a.label}
              </Text>
            </Pressable>

            <View className="h-[1px] bg-[#2a2a2a]" />

            <Pressable
              onPress={() => handleSelect(idx, axis.b.key)}
              className="items-center rounded-[10px] py-2.5"
              style={{
                backgroundColor:
                  choices[idx] === axis.b.key ? "#4ecdc4" : "#222",
              }}
            >
              <Text
                className="font-bold text-[16px]"
                style={{
                  color: choices[idx] === axis.b.key ? "#111" : "#aaa",
                }}
              >
                {axis.b.key}
              </Text>
              <Text
                className="text-[10px] mt-0.5"
                style={{
                  color: choices[idx] === axis.b.key ? "#111" : "#555",
                }}
              >
                {axis.b.label}
              </Text>
            </Pressable>
          </View>
        ))}
      </View>

      {mbtiResult ? (
        <View className="mt-3 bg-[#1a3a2e] rounded-[10px] px-3 py-2.5">
          <Text className="text-app-teal text-[14px] font-bold">
            {mbtiResult}
          </Text>
          <Text className="text-app-teal text-[12px] mt-0.5 opacity-80">
            {choices.map((c) => DESC_MAP[c]).join(", ")} 사람
          </Text>
        </View>
      ) : null}
    </View>
  );
}
