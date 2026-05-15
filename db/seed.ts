// 앱 최초 실행 시 기본 그룹 3개 시드

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
  const g = (name: string) =>
    allGroups.find((g) => g.name === name)?.id ?? allGroups[0].id;

  const familyId = g("가족");
  const friendId = g("친구");
  const workId = g("회사");
  const acquaintId = g("지인");

  const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);

  // 인물 30명
  const p = await db
    .insert(persons)
    .values([
      {
        name: "김민수",
        groupId: familyId,
        mbti: "ISTJ",
        memo: "형, 서울 거주",
      },
      {
        name: "박지원",
        groupId: friendId,
        mbti: "ENFP",
        birthDate: "1995-03-22",
      },
      { name: "이수진", groupId: workId, memo: "팀장, 디자인 담당" },
      { name: "최현우", groupId: acquaintId, mbti: "ENTP" },
      { name: "정다은", groupId: friendId, birthDate: "1996-08-10" },
      {
        name: "한지민",
        groupId: friendId,
        mbti: "INFP",
        birthDate: "1998-02-14",
      },
      { name: "오승준", groupId: workId, mbti: "INTJ", memo: "개발팀 시니어" },
      {
        name: "서예린",
        groupId: familyId,
        mbti: "ISFJ",
        birthDate: "1990-07-04",
        memo: "누나, 결혼함",
      },
      {
        name: "임도현",
        groupId: friendId,
        mbti: "ESTP",
        birthDate: "1997-11-30",
      },
      { name: "강민지", groupId: workId, mbti: "ENFJ", memo: "인사팀 매니저" },
      { name: "윤성호", groupId: acquaintId, mbti: "INTP" },
      {
        name: "황주연",
        groupId: friendId,
        mbti: "ESFP",
        birthDate: "1996-05-17",
      },
      { name: "송재원", groupId: workId, mbti: "ISTJ", memo: "기획팀" },
      {
        name: "신예지",
        groupId: familyId,
        mbti: "INFJ",
        birthDate: "1993-12-25",
        memo: "사촌동생",
      },
      { name: "전민혁", groupId: acquaintId, mbti: "ISTP" },
      {
        name: "조아연",
        groupId: friendId,
        mbti: "ENFP",
        birthDate: "2000-04-08",
      },
      { name: "류승현", groupId: workId, mbti: "ENTJ", memo: "부장님" },
      {
        name: "배소영",
        groupId: acquaintId,
        mbti: "ISFP",
        memo: "헬스장에서 만난 지인",
      },
      {
        name: "고다현",
        groupId: friendId,
        mbti: "ESFJ",
        birthDate: "1998-09-21",
      },
      { name: "남지훈", groupId: workId, mbti: "INTP", memo: "데이터팀" },
      {
        name: "문세연",
        groupId: familyId,
        mbti: "ESTJ",
        birthDate: "1985-03-15",
        memo: "형수님",
      },
      { name: "양현준", groupId: friendId, mbti: "ENFJ" },
      {
        name: "차지수",
        groupId: acquaintId,
        mbti: "INFP",
        birthDate: "1999-06-30",
      },
      { name: "마해린", groupId: workId, mbti: "ISTP", memo: "디자인팀" },
      {
        name: "노태민",
        groupId: friendId,
        mbti: "ESTP",
        birthDate: "1997-01-12",
      },
      { name: "허수빈", groupId: familyId, mbti: "ISFJ", memo: "어머니" },
      { name: "성유진", groupId: workId, mbti: "ENTP", memo: "마케팅팀" },
      { name: "우지후", groupId: acquaintId, mbti: "INTJ" },
      {
        name: "민채원",
        groupId: friendId,
        mbti: "ESFP",
        birthDate: "2001-08-25",
      },
      { name: "표상우", groupId: workId, mbti: "INFJ", memo: "멘토" },
    ])
    .returning();

  // 기록 30개 — 2025-11 ~ 2026-05
  const l = await db
    .insert(logs)
    .values([
      {
        title: "가족 저녁 식사",
        logDate: d(2026, 5, 3),
        groupId: familyId,
        memo: "삼겹살 집, 오랜만에 모두 모임",
      },
      { title: "친구들이랑 영화", logDate: d(2026, 5, 7), groupId: friendId },
      {
        title: "팀 회식",
        logDate: d(2026, 5, 9),
        groupId: workId,
        memo: "이자카야, 2차는 노래방",
      },
      {
        title: "지원이 생일파티",
        logDate: d(2026, 5, 12),
        groupId: friendId,
        memo: "케이크 사 갔음",
      },
      { title: "어머니 병원 동행", logDate: d(2026, 5, 14), groupId: familyId },
      {
        title: "현우 커피 미팅",
        logDate: d(2026, 5, 15),
        groupId: acquaintId,
        memo: "스타벅스 강남점",
      },
      {
        title: "수진 팀장 승진 축하",
        logDate: d(2026, 4, 28),
        groupId: workId,
      },
      {
        title: "대학 동창 모임",
        logDate: d(2026, 4, 20),
        groupId: friendId,
        memo: "홍대 맛집 탐방",
      },
      {
        title: "가족 여행 계획 회의",
        logDate: d(2026, 4, 15),
        groupId: familyId,
      },
      {
        title: "다은이랑 전시회",
        logDate: d(2026, 4, 10),
        groupId: friendId,
        memo: "국립현대미술관",
      },
      {
        title: "치맥 번개",
        logDate: d(2026, 4, 5),
        groupId: friendId,
        memo: "종로 치킨집",
      },
      {
        title: "팀 워크숍",
        logDate: d(2026, 3, 28),
        groupId: workId,
        memo: "판교 오피스",
      },
      {
        title: "봄 소풍",
        logDate: d(2026, 3, 22),
        groupId: friendId,
        memo: "한강 피크닉",
      },
      {
        title: "어버이날 선물 전달",
        logDate: d(2026, 3, 15),
        groupId: familyId,
        memo: "카네이션 다발",
      },
      {
        title: "지인 결혼식",
        logDate: d(2026, 3, 8),
        groupId: acquaintId,
        memo: "코엑스 컨벤션홀",
      },
      {
        title: "설 명절 가족 모임",
        logDate: d(2026, 2, 28),
        groupId: familyId,
        memo: "고향 방문, 친척들 만남",
      },
      {
        title: "신입 환영회",
        logDate: d(2026, 2, 20),
        groupId: workId,
        memo: "이탈리안 레스토랑",
      },
      {
        title: "보드게임 카페",
        logDate: d(2026, 2, 14),
        groupId: friendId,
        memo: "발렌타인데이 모임",
      },
      {
        title: "헬스장 동료 런치",
        logDate: d(2026, 2, 8),
        groupId: acquaintId,
        memo: "샐러드 바",
      },
      {
        title: "아버지 생신 파티",
        logDate: d(2026, 1, 31),
        groupId: familyId,
        memo: "가족 레스토랑",
      },
      {
        title: "영어 스터디 그룹",
        logDate: d(2026, 1, 25),
        groupId: friendId,
        memo: "강남 스터디카페",
      },
      {
        title: "신년회",
        logDate: d(2026, 1, 10),
        groupId: workId,
        memo: "강남 레스토랑",
      },
      {
        title: "등산 모임",
        logDate: d(2026, 1, 5),
        groupId: friendId,
        memo: "북한산",
      },
      {
        title: "크리스마스 파티",
        logDate: d(2025, 12, 25),
        groupId: friendId,
        memo: "홈파티",
      },
      {
        title: "송년회",
        logDate: d(2025, 12, 20),
        groupId: workId,
        memo: "호텔 뷔페",
      },
      {
        title: "지민이 졸업 축하",
        logDate: d(2025, 12, 15),
        groupId: friendId,
      },
      { title: "가족 연말 모임", logDate: d(2025, 12, 10), groupId: familyId },
      {
        title: "야구 경기 관람",
        logDate: d(2025, 11, 22),
        groupId: friendId,
        memo: "잠실 야구장",
      },
      {
        title: "팀 프로젝트 완료 파티",
        logDate: d(2025, 11, 15),
        groupId: workId,
        memo: "피자 파티",
      },
      {
        title: "지인 집들이",
        logDate: d(2025, 11, 8),
        groupId: acquaintId,
        memo: "집들이 선물 가져감",
      },
    ])
    .returning();

  // 기록-인물 연결
  await db.insert(logPersons).values([
    { logId: l[0].id, personId: p[0].id },
    { logId: l[0].id, personId: p[7].id },
    { logId: l[0].id, personId: p[20].id },
    { logId: l[0].id, personId: p[25].id },
    { logId: l[1].id, personId: p[1].id },
    { logId: l[1].id, personId: p[4].id },
    { logId: l[1].id, personId: p[5].id },
    { logId: l[2].id, personId: p[2].id },
    { logId: l[2].id, personId: p[6].id },
    { logId: l[2].id, personId: p[9].id },
    { logId: l[2].id, personId: p[12].id },
    { logId: l[3].id, personId: p[1].id },
    { logId: l[3].id, personId: p[4].id },
    { logId: l[3].id, personId: p[15].id },
    { logId: l[4].id, personId: p[0].id },
    { logId: l[4].id, personId: p[25].id },
    { logId: l[5].id, personId: p[3].id },
    { logId: l[6].id, personId: p[2].id },
    { logId: l[6].id, personId: p[16].id },
    { logId: l[7].id, personId: p[1].id },
    { logId: l[7].id, personId: p[4].id },
    { logId: l[7].id, personId: p[8].id },
    { logId: l[7].id, personId: p[11].id },
    { logId: l[8].id, personId: p[0].id },
    { logId: l[8].id, personId: p[7].id },
    { logId: l[8].id, personId: p[20].id },
    { logId: l[9].id, personId: p[4].id },
    { logId: l[9].id, personId: p[5].id },
    { logId: l[10].id, personId: p[1].id },
    { logId: l[10].id, personId: p[8].id },
    { logId: l[10].id, personId: p[24].id },
    { logId: l[11].id, personId: p[2].id },
    { logId: l[11].id, personId: p[6].id },
    { logId: l[11].id, personId: p[9].id },
    { logId: l[11].id, personId: p[16].id },
    { logId: l[11].id, personId: p[23].id },
    { logId: l[12].id, personId: p[1].id },
    { logId: l[12].id, personId: p[5].id },
    { logId: l[12].id, personId: p[11].id },
    { logId: l[12].id, personId: p[18].id },
    { logId: l[13].id, personId: p[0].id },
    { logId: l[13].id, personId: p[7].id },
    { logId: l[13].id, personId: p[25].id },
    { logId: l[14].id, personId: p[3].id },
    { logId: l[14].id, personId: p[10].id },
    { logId: l[14].id, personId: p[17].id },
    { logId: l[15].id, personId: p[0].id },
    { logId: l[15].id, personId: p[7].id },
    { logId: l[15].id, personId: p[13].id },
    { logId: l[15].id, personId: p[20].id },
    { logId: l[15].id, personId: p[25].id },
    { logId: l[16].id, personId: p[2].id },
    { logId: l[16].id, personId: p[6].id },
    { logId: l[16].id, personId: p[19].id },
    { logId: l[16].id, personId: p[26].id },
    { logId: l[17].id, personId: p[1].id },
    { logId: l[17].id, personId: p[4].id },
    { logId: l[17].id, personId: p[5].id },
    { logId: l[17].id, personId: p[18].id },
    { logId: l[17].id, personId: p[28].id },
    { logId: l[18].id, personId: p[10].id },
    { logId: l[18].id, personId: p[17].id },
    { logId: l[19].id, personId: p[0].id },
    { logId: l[19].id, personId: p[7].id },
    { logId: l[19].id, personId: p[13].id },
    { logId: l[19].id, personId: p[20].id },
    { logId: l[19].id, personId: p[25].id },
    { logId: l[20].id, personId: p[1].id },
    { logId: l[20].id, personId: p[5].id },
    { logId: l[20].id, personId: p[24].id },
    { logId: l[21].id, personId: p[2].id },
    { logId: l[21].id, personId: p[16].id },
    { logId: l[21].id, personId: p[29].id },
    { logId: l[22].id, personId: p[3].id },
    { logId: l[22].id, personId: p[8].id },
    { logId: l[22].id, personId: p[21].id },
    { logId: l[22].id, personId: p[24].id },
    { logId: l[23].id, personId: p[1].id },
    { logId: l[23].id, personId: p[4].id },
    { logId: l[23].id, personId: p[5].id },
    { logId: l[23].id, personId: p[11].id },
    { logId: l[23].id, personId: p[28].id },
    { logId: l[24].id, personId: p[2].id },
    { logId: l[24].id, personId: p[6].id },
    { logId: l[24].id, personId: p[16].id },
    { logId: l[24].id, personId: p[19].id },
    { logId: l[25].id, personId: p[1].id },
    { logId: l[25].id, personId: p[4].id },
    { logId: l[25].id, personId: p[5].id },
    { logId: l[26].id, personId: p[0].id },
    { logId: l[26].id, personId: p[7].id },
    { logId: l[26].id, personId: p[13].id },
    { logId: l[26].id, personId: p[25].id },
    { logId: l[27].id, personId: p[3].id },
    { logId: l[27].id, personId: p[8].id },
    { logId: l[27].id, personId: p[21].id },
    { logId: l[28].id, personId: p[2].id },
    { logId: l[28].id, personId: p[6].id },
    { logId: l[28].id, personId: p[23].id },
    { logId: l[29].id, personId: p[10].id },
    { logId: l[29].id, personId: p[17].id },
    { logId: l[29].id, personId: p[22].id },
    { logId: l[29].id, personId: p[27].id },
  ]);

  // 할 일 30개 — 사분면별 8/8/8/6
  await db.insert(todos).values([
    { title: "프로젝트 기획안 제출", quadrant: "do" },
    { title: "연간 보고서 작성", quadrant: "do" },
    { title: "중요 거래처 미팅 준비", quadrant: "do" },
    { title: "버그 수정 PR 제출", quadrant: "do" },
    { title: "이번 달 가계부 정리", quadrant: "do" },
    { title: "운전면허 갱신 신청", quadrant: "do" },
    { title: "건강검진 예약", quadrant: "do" },
    { title: "급여명세서 확인", quadrant: "do" },
    { title: "독서 모임 일정 잡기", quadrant: "schedule" },
    { title: "친구 생일 파티 계획", quadrant: "schedule" },
    { title: "가족 여행 숙소 예약", quadrant: "schedule" },
    { title: "치과 정기검진 예약", quadrant: "schedule" },
    { title: "헬스 PT 등록", quadrant: "schedule" },
    { title: "팀빌딩 행사 기획", quadrant: "schedule" },
    { title: "월간 팀 회의 일정 확정", quadrant: "schedule" },
    { title: "여름 휴가 계획 세우기", quadrant: "schedule" },
    { title: "팀원에게 보고서 취합 요청", quadrant: "delegate" },
    { title: "동생한테 택배 수령 부탁", quadrant: "delegate" },
    { title: "디자인팀에 시안 제작 요청", quadrant: "delegate" },
    { title: "총무팀에 비품 신청", quadrant: "delegate" },
    { title: "회계팀에 영수증 처리 요청", quadrant: "delegate" },
    { title: "고객 문의 후임자에게 이관", quadrant: "delegate" },
    { title: "인턴에게 자료 조사 맡기기", quadrant: "delegate" },
    { title: "동료에게 회의록 작성 부탁", quadrant: "delegate" },
    { title: "불필요한 구독 서비스 정리", quadrant: "eliminate" },
    { title: "쓰지 않는 앱 삭제", quadrant: "eliminate" },
    { title: "오래된 이메일 정리", quadrant: "eliminate" },
    { title: "낡은 옷가지 정리", quadrant: "eliminate" },
    { title: "안 보는 유튜브 채널 구독 취소", quadrant: "eliminate" },
    { title: "자동 갱신 멤버십 해지", quadrant: "eliminate" },
  ]);

  // 메모 30개
  await db
    .insert(memos)
    .values([
      { content: "민수 형한테 빌린 책 돌려줘야 함" },
      { content: "6월 가족 여행 숙소 알아보기 — 제주도 or 강릉" },
      { content: "지원이 좋아하는 음식: 파스타, 티라미수" },
      { content: "승준 씨 생일 체크해야 함 (4월)" },
      { content: "수진 팀장 커피 취향: 아메리카노, 샷 추가" },
      { content: "현우 새 직장 취업 축하 선물 준비하기" },
      { content: "다은이한테 빌려준 우산 돌려받기" },
      { content: '지민이 추천해준 책: "아무것도 하지 않는 시간의 힘"' },
      { content: "예린 언니 아이 이름: 서윤 (3살)" },
      { content: "도현이 헬스 루틴 참고해보기" },
      { content: "민지 대리 업무 스타일: 명확한 문서 선호" },
      { content: "성호 씨 고향: 전주" },
      { content: "주연이 졸업 후 취직 예정 — 위로 메시지 보내기" },
      { content: "재원이 추천 맛집: 강남 스시집" },
      { content: "예지 동생 대입 합격 — 선물 생각해두기" },
      { content: "민혁이 최근 스타트업 창업 — 관심 가져주기" },
      { content: "아연이 전공: 심리학, 대학원 진학 고민 중" },
      { content: "승현 부장 취미: 골프, 등산" },
      { content: "소영 씨 반려견 이름: 콩이" },
      { content: "다현이 아토피 있어서 꽃 선물 주의" },
      { content: "지훈 씨 채식주의자 — 식당 예약 시 주의" },
      { content: "세연 언니 답례 선물 생각해두기" },
      { content: "현준이 해외 취업 준비 중 — 캐나다 목표" },
      { content: "지수 7월 유럽 배낭여행 계획 중" },
      { content: "해린 씨 사이드 프로젝트 같이 검토 요청받음" },
      { content: "태민이 전역 기념 파티 계획하기" },
      { content: "수빈 어머니 선호 선물: 과일 or 건강식품" },
      { content: "유진 씨 마케팅 인사이트 정기 공유 요청" },
      { content: "지후 씨 독서 취향: SF, 철학 서적" },
      { content: "채원이 유학 고민 중 — 조언 요청 받음" },
    ]);
}
