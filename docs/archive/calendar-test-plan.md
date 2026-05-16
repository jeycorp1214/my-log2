# 캘린더 테스트 화면 구현 계획

## 개요

설정 탭 > 테스트 섹션에 "캘린더 테스트" 항목을 추가하여 `react-native-calendars` 라이브러리의 주요 기능을 탐색/검증하는 화면을 구현한다.

---

## 구현 범위

### ✅ 구현 대상

#### 1. 뷰 모드

| 기능            | 컴포넌트       | 설명                            |
| --------------- | -------------- | ------------------------------- |
| Month View      | `Calendar`     | 전형적인 월간 달력              |
| Infinite Scroll | `CalendarList` | 위아래로 스크롤되는 달력 리스트 |
| Agenda View     | `Agenda`       | 날짜별 일정 목록이 연동된 뷰    |

#### 2. 날짜 마킹 (Marking System)

| 기능            | 마킹 타입   | 설명                                          |
| --------------- | ----------- | --------------------------------------------- |
| 이벤트 점(Dots) | `multi-dot` | 특정 날짜에 일정이 있음을 알리는 점 (멀티 닷) |
| 선택 표시       | `selected`  | 클릭한 날짜를 배경색으로 강조                 |
| 기간 선택       | `period`    | 시작일~종료일 사이를 선으로 연결              |
| 커스텀 스타일링 | `custom`    | 배경색, 글자색 등 직접 조절                   |

#### 3. 인터랙션 제어

- `minDate` / `maxDate` 토글로 과거/미래 제한
- `onDayPress` — 클릭한 날짜 정보를 화면 하단에 표시
- `onMonthChange` — 월 변경 이벤트를 화면에 표시

#### 4. 일정 CRUD

- 날짜 클릭 시 일정 추가 모달 표시
- 일정 수정 / 삭제
- 카테고리(업무/개인/가족)별 컬러 코딩
- 할 일(To-do) 아이템: 마감 기한 있는 항목을 달력 날짜 하단에 표시

#### 5. 테마 & 다크 모드

- 시스템 테마(다크/라이트)에 맞춰 달력 배경·글자색 자동 전환
- `theme` prop으로 오늘 날짜 색상, 선택 색상, 폰트 변경

---

### ⏸ 보류 (추후 구현)

| 기능                               | 사유                                         |
| ---------------------------------- | -------------------------------------------- |
| 반복 일정 설정                     | 앱 DB 반복 로직과 연동 설계 필요             |
| 위젯(Widget) 지원                  | 네이티브 모듈 추가 및 플랫폼 별도 작업 필요  |
| 외부 캘린더 연동 (Google / iCloud) | OAuth + API 키 설정 필요, 별도 기능으로 분리 |

---

## 화면 구조

```
CalendarTestScreen
├── 상단 탭: [Month | Infinite | Agenda]
├── 뷰 영역
│   ├── Month: <Calendar> + marking 타입 탭
│   │   ├── [Dots | Selected | Period | Custom]
│   │   └── 마킹된 달력 렌더
│   ├── Infinite: <CalendarList pastScrollRange=12 futureScrollRange=12>
│   └── Agenda: <Agenda> + 일정 아이템 렌더
├── 인터랙션 컨트롤 패널
│   ├── minDate 토글 (오늘로부터 -30일)
│   ├── maxDate 토글 (오늘로부터 +30일)
│   └── 마지막 이벤트 표시 (onDayPress / onMonthChange)
└── 일정 CRUD 영역 (Month 뷰일 때만)
    ├── 선택된 날짜의 일정 목록
    ├── 일정 추가 버튼 → 모달
    └── 일정 아이템 (수정 / 삭제)
```

---

## 파일 구조

```
app/
  settings/
    calendar-test.tsx      ← 메인 테스트 화면
components/
  calendar/
    CalendarEventModal.tsx  ← 일정 추가/수정 모달
    CalendarEventItem.tsx   ← 일정 아이템 컴포넌트
```

---

## 데이터 모델 (로컬 상태)

```ts
type EventCategory = "work" | "personal" | "family" | "todo";

interface CalendarEvent {
  id: string;
  date: string; // 'YYYY-MM-DD'
  title: string;
  category: EventCategory;
  isTodo: boolean;
  isDone?: boolean; // todo 아이템 완료 여부
  color: string; // 카테고리별 컬러
}
```

---

## 카테고리 컬러 맵

| 카테고리   | 색상             | 용도  |
| ---------- | ---------------- | ----- |
| `work`     | `#3b82f6` (파랑) | 업무  |
| `personal` | `#eab308` (노랑) | 개인  |
| `family`   | `#22c55e` (초록) | 가족  |
| `todo`     | `#a855f7` (보라) | 할 일 |

---

## 완료 체크리스트

- [x] 계획 문서 작성
- [x] `calendar-test.tsx` 메인 화면 구현
  - [x] 뷰 모드 탭 (Month / Infinite / Agenda)
  - [x] 마킹 타입 탭 (Dots / Selected / Period / Custom)
  - [x] 인터랙션 컨트롤 패널 (minDate / maxDate / 이벤트 표시)
  - [x] 일정 CRUD (Month 뷰 — 추가·수정·삭제·할 일 체크)
  - [x] 다크 테마 연동 (앱 다크 팔레트 적용)
- [x] 설정 탭에 "캘린더 테스트" 항목 추가
