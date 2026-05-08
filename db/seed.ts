// 앱 최초 실행 시 기본 그룹 3개 시드
import { db } from "./client";
import { groups } from "./schema";

export const DEFAULT_GROUPS = [
  {
    name: "미설정",
    color: "#ADB5BD", // 회색톤으로 설정하여 '없음'의 느낌을 강조
    emoji: "⬛", // 비어있는 것보다 기본 이모지가 있는 것이 UI상 깔끔합니다
    isDefault: true,
    sortOrder: 0,
  },
  {
    name: "가족",
    color: "#FF6B6B",
    emoji: "🏠",
    isDefault: true,
    sortOrder: 1,
  },
  {
    name: "친구",
    color: "#4ECDC4",
    emoji: "👥",
    isDefault: true,
    sortOrder: 2,
  },
  {
    name: "회사",
    color: "#45B7D1",
    emoji: "💼",
    isDefault: true,
    sortOrder: 3,
  },
  {
    name: "지인",
    color: "#FFA07A", // 기존 노란색보다 가독성이 좋은 살구색 계열 추천
    emoji: "🤝",
    isDefault: true,
    sortOrder: 4,
  },
];

export async function seedDefaultGroups() {
  const existing = await db.select().from(groups);
  if (existing.length > 0) return;
  await db.insert(groups).values(DEFAULT_GROUPS);
}

export const REPEAT_OPTIONS = [
  { label: "없음", value: "none" },
  { label: "매일", value: "daily" },
  { label: "매주", value: "weekly" },
  { label: "매월", value: "monthly" },
  { label: "매년", value: "yearly" },
];

export const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export const MBTI_OPTIONS = [
  "INTJ",
  "INTP",
  "ENTJ",
  "ENTP",
  "INFJ",
  "INFP",
  "ENFJ",
  "ENFP",
  "ISTJ",
  "ISFJ",
  "ESTJ",
  "ESFJ",
  "ISTP",
  "ISFP",
  "ESTP",
  "ESFP",
];

export const PRESET_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#98D8C8",
  "#F7DC6F",
];
