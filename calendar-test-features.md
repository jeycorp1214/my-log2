# 캘린더 테스트 화면 기능 현황

> `react-native-calendars@1.1314.0` 기준. `app/settings/calendar-test.tsx` 분석.

---

## ✅ 구현 완료 & 작동

### 뷰 모드

| 뷰 | 컴포넌트 | 비고 |
|----|---------|------|
| 월간 뷰 (Month) | `Calendar` | 스와이프 월 이동 포함 |
| 무한 스크롤 (Infinite) | `CalendarList` | ±6개월 범위 |
| 일정 뷰 (Agenda) | `Calendar` + 커스텀 `FlatList` | 라이브러리 `Agenda` 컴포넌트 아님 — 무한루프 버그 회피용 커스텀 구현 |

### 날짜 마킹

| 마킹 타입 | 상태 | 설명 |
|----------|------|------|
| 점 표시 (Dots) | ✅ | 카테고리별 멀티 dot. 최대 4개 카테고리 색상 |
| 선택 (Selected) | ✅ | 단일 날짜 배경색 강조 |
| 기간 (Period) | ✅ | 시작일 탭 → 종료일 탭으로 범위 선택. 초기화 버튼 포함 |
| 커스텀 (Custom) | ✅ | 카테고리별 배경색 + 테두리 (`customStyles`) |
| 커스텀 테마 | ✅ | `DARK_THEME` 객체로 색상/폰트 일괄 설정 |

### 인터랙션 제어

| 기능 | 상태 | 비고 |
|------|------|------|
| 최소 날짜 (`minDate`) | ✅ | 오늘 기준 -30일 이전 비활성 토글 |
| 최대 날짜 (`maxDate`) | ✅ | 오늘 기준 +30일 이후 비활성 토글 |
| 날짜 탭 이벤트 (`onDayPress`) | ✅ | 선택 날짜 문자열 반환 및 화면 표시 |
| 월 변경 이벤트 (`onMonthChange`) | ✅ | 이동한 월 dateString 반환 |
| 표시 월 변경 (`onVisibleMonthsChange`) | ✅ | Infinite 뷰 전용 |

### 일정 관리

| 기능 | 상태 | 비고 |
|------|------|------|
| 일정 추가 | ✅ | 선택 날짜 기준, 제목 + 카테고리 입력 |
| 일정 수정 | ✅ | 탭 → 바텀시트 모달 |
| 일정 삭제 | ✅ | Alert 확인 후 삭제 |
| 카테고리 컬러 코딩 | ✅ | 업무(파랑), 개인(노랑), 가족(초록), 할 일(보라) |
| 할 일 완료 토글 | ✅ | `todo` 카테고리에만 체크박스 표시 |

---

## ⚠️ 구현됨 — 이슈 있음

| 항목 | 문제 | 원인 |
|------|------|------|
| **Infinite 뷰 스와이프 끊김** | 빠른 스와이프 시 제자리 튕김 | Bug 1 (`isSwipingRef` 패치 미적용). `calendar-view-fixes.md` 참고 |
| **dots 위치** | 날짜 숫자 원 **안에** 그려짐 | 이슈 4. 커스텀 `dayComponent` 없으므로 라이브러리 기본 렌더링 사용 |
| **Agenda 뷰 일정 추가** | 추가 시 Month 뷰 `selectedDate` 기준으로 저장됨 | `agendaDate` 대신 `selectedDate` 참조 — 버그 |
| **Infinite 범위** | ±6개월 밖 이동 불가 | `pastScrollRange=6` 고정. 메인 앱은 50/24 설정 |

---

## ❌ 미구현

| 기능 | 설명 |
|------|------|
| **반복 일정** | 매일/매주/매월/매년 반복 설정 없음. `CalendarEvent` 타입에 `repeatType` 필드 없음 |
| **일정 영속성** | 인메모리 `useState`만. 앱 재시작 시 샘플 데이터로 초기화. DB 미연결 |
| **다크 모드 자동 전환** | `DARK_THEME` 하드코딩. 시스템 테마(`useColorScheme`) 연동 없음 |
| **라이브러리 Agenda 컴포넌트** | 무한루프 버그로 사용 포기. 커스텀으로 대체됨 |

---

## 기능 추가 우선순위 (제안)

| 순위 | 항목 | 비고 |
|------|------|------|
| P0 | Agenda 뷰 일정 추가 버그 수정 | `selectedDate` → `agendaDate` 1줄 수정 |
| P0 | Infinite 뷰 Bug 1 패치 | `calendar-view-fixes.md` 수정안 적용 |
| P1 | 반복 일정 UI | 메인 앱 `logs` 스키마에 이미 `repeatType` 존재 — 연동 가능 |
| P2 | 다크 모드 자동 전환 | `useColorScheme` 훅 연결 |
| P2 | 일정 DB 연결 | `logs` 테이블과 연동 |
