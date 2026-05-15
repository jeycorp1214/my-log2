// 앱 최초 실행 시 기본 그룹 3개 시드
import { eq } from "drizzle-orm";

import { db } from "./client";
import { groups, logPersons, logs, memos, persons, todos } from "./schema";

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

export const ANNIVERSARY_PRESETS = ["생일", "결혼", "입사", "퇴사", "이사"];

// 개발용 샘플 데이터 삽입 — 디버그 모드 개발 도구에서 호출
export async function seedSampleData() {
  const allGroups = await db.select().from(groups);
  const g = (name: string) => allGroups.find((g) => g.name === name)?.id ?? allGroups[0].id;

  const familyId = g("가족");
  const friendId = g("친구");
  const workId = g("회사");
  const acquaintId = g("지인");

  // 인물 5명
  const now = Date.now();
  const insertedPersons = await db
    .insert(persons)
    .values([
      { name: "김민수", groupId: familyId, mbti: "ISTJ", memo: "형, 서울 거주" },
      { name: "박지원", groupId: friendId, mbti: "ENFP", birthDate: "1995-03-22" },
      { name: "이수진", groupId: workId, memo: "팀장, 디자인 담당" },
      { name: "최현우", groupId: acquaintId, mbti: "ENTP" },
      { name: "정다은", groupId: friendId, birthDate: "1996-08-10" },
    ])
    .returning();

  const [minsu, jiwon, sujin, hyunwoo, daeun] = insertedPersons;

  // 기록 10개 — 현재 달(5월) 중심
  const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);
  const insertedLogs = await db
    .insert(logs)
    .values([
      { title: "가족 저녁 식사", logDate: d(2026, 5, 3), groupId: familyId, memo: "삼겹살 집, 오랜만에 모두 모임" },
      { title: "친구들이랑 영화", logDate: d(2026, 5, 7), groupId: friendId },
      { title: "팀 회식", logDate: d(2026, 5, 9), groupId: workId, memo: "이자카야, 2차는 노래방" },
      { title: "지원이 생일파티", logDate: d(2026, 5, 12), groupId: friendId, memo: "케이크 사 갔음" },
      { title: "어머니 병원 동행", logDate: d(2026, 5, 14), groupId: familyId },
      { title: "현우 커피 미팅", logDate: d(2026, 5, 15), groupId: acquaintId, memo: "스타벅스 강남점" },
      { title: "수진 팀장 승진 축하", logDate: d(2026, 4, 28), groupId: workId },
      { title: "대학 동창 모임", logDate: d(2026, 4, 20), groupId: friendId, memo: "홍대 맛집 탐방" },
      { title: "가족 여행 계획 회의", logDate: d(2026, 4, 15), groupId: familyId },
      { title: "다은이랑 전시회", logDate: d(2026, 4, 10), groupId: friendId, memo: "국립현대미술관" },
    ])
    .returning();

  // 기록-인물 연결
  await db.insert(logPersons).values([
    { logId: insertedLogs[0].id, personId: minsu.id },
    { logId: insertedLogs[1].id, personId: jiwon.id },
    { logId: insertedLogs[1].id, personId: daeun.id },
    { logId: insertedLogs[2].id, personId: sujin.id },
    { logId: insertedLogs[3].id, personId: jiwon.id },
    { logId: insertedLogs[4].id, personId: minsu.id },
    { logId: insertedLogs[5].id, personId: hyunwoo.id },
    { logId: insertedLogs[6].id, personId: sujin.id },
    { logId: insertedLogs[7].id, personId: jiwon.id },
    { logId: insertedLogs[7].id, personId: daeun.id },
    { logId: insertedLogs[8].id, personId: minsu.id },
    { logId: insertedLogs[9].id, personId: daeun.id },
  ]);

  // 할 일 4개 — 각 사분면 하나씩
  await db.insert(todos).values([
    { title: "프로젝트 기획안 제출", quadrant: "do" },
    { title: "독서 모임 일정 잡기", quadrant: "schedule" },
    { title: "팀원에게 보고서 취합 요청", quadrant: "delegate" },
    { title: "불필요한 구독 서비스 정리", quadrant: "eliminate" },
  ]);

  // 메모 2개
  await db.insert(memos).values([
    { content: "민수 형한테 빌린 책 돌려줘야 함" },
    { content: "6월 가족 여행 숙소 알아보기 — 제주도 or 강릉" },
  ]);
}
