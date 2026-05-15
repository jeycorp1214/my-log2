# 인물 기능 확장 아이디어

> 작성일: 2026-05-16  
> 현재 기능 기반: 그룹/MBTI 필터, 기념일 모드, 인물 상세(기록/기념일/메모)

---

## 1. 관계 태그 (Relationship Tags)

**개요.** 각 인물에 커스텀 태그 부착. 그룹과 별개로 인물 특성 표현.

- 예시: `연인`, `직장동료`, `오랜친구`, `멘토`, `온라인친구`
- 필터 시트에서 태그별 필터 추가

**DB 변경.**
```sql
ALTER TABLE persons ADD COLUMN tags TEXT; -- JSON 배열, e.g. '["친구","직장"]'
```

**구현 범위.**
- `PersonForm`에 태그 입력 UI (칩 형태)
- `persons.tsx` 필터 시트에 태그 필터 추가
- `PersonCard`에 태그 칩 표시

**난이도.** ★☆☆ (DB 컬럼 1개 추가)

---

## 2. 연락 주기 알림 (Contact Cadence)

**개요.** 인물별 "N일마다 연락" 설정. 마지막 기록 기준 D+N 초과 시 목록 강조.

- 예시: 가족 = 7일, 친구 = 30일
- `PersonCard`에 "X일 지남" 경고 배지

**DB 변경.**
```sql
ALTER TABLE persons ADD COLUMN contact_interval INTEGER; -- NULL = 설정 안 함
```

**구현 범위.**
- `PersonForm`에 주기 입력 (숫자 입력 또는 프리셋 칩: 7일/30일/90일)
- `usePersonsWithGroups` 훅에서 마지막 기록일 조인, 경과일 계산
- `PersonCard`에 경과일 배지 (초과 시 red/orange)

**난이도.** ★★☆

---

## 3. 인물 상세 타임라인 뷰

**개요.** 현재 평면 리스트인 "함께한 기록"을 날짜별 타임라인으로 변환. 기념일 + 기록을 시간축에 혼합.

- DB 변경 없음, 기존 `personLogs` + `dbAnniversaries` 데이터 재활용

**구현 범위.**
- `persons/[id].tsx` 내 기록/기념일 병합 → 날짜 정렬
- 타임라인 컴포넌트 (`TimelineItem.tsx`): 날짜 점 + 내용

**난이도.** ★☆☆

---

## 4. 인물 간 연결 (Person-to-Person Relations)

**개요.** 인물끼리 관계 연결. 상세 화면에서 "아는 사람" 섹션 노출.

- 예시: "김민준 — [친구] — 이지은"

**DB 변경.**
```sql
CREATE TABLE person_relations (
  id TEXT PRIMARY KEY,
  from_id TEXT NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  to_id   TEXT NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  label   TEXT, -- "친구", "직장동료" 등
  created_at INTEGER NOT NULL
);
```

**구현 범위.**
- `persons/[id].tsx`에 "연결된 인물" 섹션
- 관계 추가/삭제 UI (인물 검색 → 선택 → 라벨 입력)

**난이도.** ★★★

---

## 5. 첫 만남 날짜 + 함께한 기간

**개요.** 인물 등록 시 처음 만난 날짜 입력. 상세 화면에 "함께한 지 X년 Y일" 표시. 만남 기념일 자동 생성 옵션.

**DB 변경.**
```sql
ALTER TABLE persons ADD COLUMN met_at TEXT; -- YYYY-MM-DD
```

**구현 범위.**
- `PersonForm`에 만남 날짜 입력 (BirthDateInput 재활용)
- `persons/[id].tsx` 헤더에 기간 표시
- 저장 시 "만남 기념일" 자동 생성 여부 물어보기

**난이도.** ★☆☆

---

## 6. 기록별 감정 온도 (Mood per Log-Person)

**개요.** 기록 작성 시 해당 인물에 대한 감정 선택. 인물 상세에서 감정 추이 확인.

- 감정 옵션: `좋음 😊`, `보통 😐`, `힘들었음 😞` (또는 1-5 점수)

**DB 변경.**
```sql
ALTER TABLE log_persons ADD COLUMN mood TEXT; -- "good"|"neutral"|"bad"
```

**구현 범위.**
- 기록 작성/수정 화면에서 인물 연결 시 감정 선택 UI
- `persons/[id].tsx`에 감정 히스토리 섹션 (이모지 타임라인 or 바 차트)

**난이도.** ★★☆

---

## 7. 인물 아바타 (Avatar)

**개요.** 로컬 이미지 선택 또는 이니셜 자동 아바타.

**DB 변경.**
```sql
ALTER TABLE persons ADD COLUMN avatar_uri TEXT; -- 로컬 파일 URI
```

**구현 범위.**
- `PersonCard`에 아바타 원형 표시 (이미지 or 이니셜 fallback)
- `PersonForm`에 이미지 선택 버튼 (`expo-image-picker`)
- `persons/[id].tsx` 상단 대형 아바타

**난이도.** ★★☆ (expo-image-picker 의존성 추가 필요)

---

## 8. 인물 전문 검색 개선

**개요.** 인물 이름 검색 시 관련 기록 내용도 함께 노출. 현재 탭 헤더 검색 기능 실제 연결.

**구현 범위.**
- `persons.tsx` 검색 입력 시 이름 + 메모 + 기록 제목 전문 검색
- 검색 결과를 인물 카드 + 관련 기록 미리보기로 표시

**난이도.** ★★☆

---

## 9. 인물 통계 카드

**개요.** 상세 화면 상단 미니 통계. 기존 `personLogs` 데이터 즉시 활용 가능.

- 표시 항목: 총 기록 수, 첫 기록 날짜, 가장 자주 만난 달, 평균 만남 간격

**DB 변경.** 없음.

**구현 범위.**
- `persons/[id].tsx`에 통계 카드 컴포넌트 추가
- `personLogs` 배열 집계 (클라이언트 계산)

**난이도.** ★☆☆

---

## 10. 인물 즐겨찾기 / 고정 (Pin)

**개요.** 자주 보는 인물을 상단 고정. 목록 최상단에 별도 섹션.

**DB 변경.**
```sql
ALTER TABLE persons ADD COLUMN is_pinned INTEGER NOT NULL DEFAULT 0;
```

**구현 범위.**
- `PersonCard` 롱프레스 → "고정" 토글
- `persons.tsx` 상단에 고정 인물 섹션 (그룹 구분 없이 평면)

**난이도.** ★☆☆

---

## 우선순위 매트릭스

| # | 기능 | 임팩트 | 난이도 | 비고 |
|---|------|--------|--------|------|
| 3 | 타임라인 뷰 | ★★★ | ★☆☆ | DB 변경 없음 |
| 9 | 통계 카드 | ★★☆ | ★☆☆ | DB 변경 없음 |
| 10 | 즐겨찾기/고정 | ★★☆ | ★☆☆ | 컬럼 1개 |
| 5 | 첫 만남 날짜 | ★★☆ | ★☆☆ | 컬럼 1개 |
| 1 | 관계 태그 | ★★★ | ★★☆ | 컬럼 1개 |
| 2 | 연락 주기 알림 | ★★★ | ★★☆ | 앱 핵심 가치 직결 |
| 6 | 감정 온도 | ★★☆ | ★★☆ | log_persons 확장 |
| 7 | 아바타 | ★★☆ | ★★☆ | 외부 패키지 필요 |
| 8 | 검색 개선 | ★★☆ | ★★☆ | — |
| 4 | 인물 간 연결 | ★★★ | ★★★ | 새 테이블 필요 |
