# 캘린더 마이그레이션 설계 — react-native-calendars 전환

## 1. 목표

직접 구현한 CalendarGrid / MonthNavBar를 삭제하고 `react-native-calendars` 라이브러리로 전면 교체.

**이유:**
- 수동 그리드 계산 코드(~240줄) 유지 부담 제거
- 라이브러리 제공 기능 활용: 한국어 로케일, 수평 스와이프 월 전환, 최적화된 렌더링
- `dayComponent` prop으로 기존 compact/board 두 모드 완전 재현 가능

---

## 2. 현황 분석

### 삭제 대상 파일

| 파일 | 이유 |
|------|------|
| `components/calendar/CalendarGrid.tsx` | 라이브러리 Calendar/CalendarList로 대체 |
| `components/calendar/MonthNavBar.tsx` | CalendarView 내부로 통합 또는 라이브러리 헤더 활용 |

### 유지 대상 파일

| 파일 | 이유 |
|------|------|
| `components/calendar/CalendarHeader.tsx` | 앱 헤더(제목/검색/오늘/기념일) — 그리드와 무관 |
| `components/calendar/DayDetailModal.tsx` | board mode 날짜 상세 모달 — 데이터 UI |
| `components/calendar/QuickInputBar.tsx` | 키보드 고정 입력바 — 캘린더 그리드와 무관 |
| `components/calendar/CalendarDebugBar.tsx` | 디버그 정보바 — 삭제 여부 선택 |

### 간접 영향 파일

| 파일 | 변경 내용 |
|------|-----------|
| `components/DatePickerModal.tsx` | CalendarGrid → `Calendar` (라이브러리, 단일 월) |
| `app/(tabs)/index.tsx` | CalendarGrid + MonthNavBar → CalendarView (신규) |

---

## 3. 신규 파일

### `components/calendar/CalendarView.tsx`

CalendarList 기반 메인 캘린더 컴포넌트. CalendarGrid + MonthNavBar를 대체.

**Props:**
```typescript
interface Props {
  currentMonth: Date;
  selectedDate: Date | null;
  markedDates: Date[];          // 기록 있는 날짜 (dot 마킹)
  anniversaryDates?: Date[];   // 기념일 날짜 (dot 마킹)
  mode?: "compact" | "board";
  boardItems?: BoardItem[];
  onSelectDate: (date: Date) => void;
  onMonthChange: (date: Date) => void;  // 월 변경 시 부모에 알림
}
```

**내부 구조:**
```
CalendarView
├── MonthHeader (월 제목 + 이전/다음 버튼 + MonthPickerModal)
└── CalendarList
    ├── horizontal + pagingEnabled  ← 스와이프 월 전환 내장
    ├── calendarHeight (mode에 따라 compact:290 / board:560)
    ├── dayComponent = CompactDay | BoardDay
    └── markedDates (multi-dot 포맷)
```

---

## 4. 라이브러리 사용 계획

### 4.1 한국어 로케일

```typescript
import { LocaleConfig } from "react-native-calendars";

LocaleConfig.locales["ko"] = {
  monthNames: ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"],
  monthNamesShort: ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"],
  dayNames: ["일요일","월요일","화요일","수요일","목요일","금요일","토요일"],
  dayNamesShort: ["일","월","화","수","목","금","토"],
  today: "오늘",
};
LocaleConfig.defaultLocale = "ko";
```

모듈 레벨에서 한 번만 설정. CalendarView.tsx 파일 최상단에 위치.

### 4.2 markedDates 포맷 변환

기존: `Date[]` 배열  
신규: `{ [dateString: string]: MarkingObject }` 딕셔너리

```typescript
// compact mode — multi-dot
{
  "2024-01-15": {
    dots: [
      { key: "log", color: "#4ecdc4" },     // 일반/반복 기록
      { key: "ann", color: "#c084fc" }      // 기념일
    ],
    selected: true    // 선택된 날짜는 selected: true 추가
  }
}

// board mode — selected만 필요 (dayComponent가 boardItems에서 직접 렌더링)
{
  "2024-01-15": { selected: true }
}
```

변환 로직은 `useMemo`로 감싸서 `markedDates`, `anniversaryDates`, `selectedDate` 변경 시만 재계산.

### 4.3 CalendarList 설정

```tsx
<CalendarList
  // 수평 페이징 — 스와이프로 월 전환
  horizontal
  pagingEnabled
  calendarWidth={SCREEN_WIDTH}
  calendarHeight={mode === "board" ? 560 : 290}
  // 내장 월 헤더 숨김 (MonthHeader 컴포넌트로 대체)
  hideArrows
  renderHeader={() => null}
  // 마킹
  markingType="multi-dot"
  markedDates={libMarkedDates}
  // 커스텀 날짜 렌더링
  dayComponent={DayComponent}
  // 다크 테마
  theme={DARK_THEME}
  // 월 변경 콜백
  onVisibleMonthsChange={(months) => {
    if (months[0]) onMonthChange(new Date(months[0].dateString));
  }}
  // 범위 (±12개월)
  pastScrollRange={12}
  futureScrollRange={12}
  // 현재 월로 이동 (current prop 변경 시 자동 스크롤)
  current={dayjs(currentMonth).format("YYYY-MM-DD")}
  hideExtraDays
/>
```

### 4.4 다크 테마

```typescript
const DARK_THEME = {
  calendarBackground: "#111111",
  textSectionTitleColor: "#666666",  // 요일 헤더 기본색
  selectedDayBackgroundColor: "#4ecdc4",
  selectedDayTextColor: "#111111",
  todayTextColor: "#4ecdc4",
  dayTextColor: "#e0e0e0",
  textDisabledColor: "#333333",
  dotColor: "#4ecdc4",
  selectedDotColor: "#111111",
  // 헤더 숨김 + 요일 색상
  "stylesheet.calendar.header": {
    header: { height: 0, overflow: "hidden", marginTop: 0 },
    dayHeader: { flex: 1, textAlign: "center", marginTop: 2, marginBottom: 7, fontSize: 12, color: "#666" },
    dayTextAtIndex0: { color: "#ff6b6b" },   // 일요일
    dayTextAtIndex6: { color: "#4ecdc4" },   // 토요일
    week: { marginTop: 7, flexDirection: "row", justifyContent: "space-around" },
  },
  "stylesheet.calendar.main": {
    container: { paddingHorizontal: 8, backgroundColor: "#111111" },
  },
};
```

### 4.5 dayComponent 안정적 참조

`dayComponent` prop이 매 렌더마다 새 참조면 CalendarList가 모든 날짜 컴포넌트를 unmount/remount함.

```typescript
// 안정적 onSelectDate — ref 패턴
const onSelectDateRef = useRef(onSelectDate);
onSelectDateRef.current = onSelectDate;
const stableOnSelectDate = useCallback((date: Date) => {
  onSelectDateRef.current(date);
}, []); // 절대 변하지 않음

// dayComponent — 빈 deps useMemo → stable
const DayComponent = useMemo(() => {
  return function CompactDay({ date, marking, state, onPress }) {
    // ... 렌더링
    // onPress는 Calendar가 props로 주입 — 클로저 불필요
  };
}, []); // stable
```

---

## 5. compact/board dayComponent 설계

### CompactDay (compact mode)

기존 CalendarGrid compact mode와 동일한 시각:
- 원형 배경: 선택 시 teal, 오늘 시 teal 테두리
- 날짜 텍스트: 일요일 빨강 / 토요일 teal / 기타 흰색
- 원 내부 하단: 기록 dot(teal) + 기념일 dot(보라)

```tsx
function CompactDay({ date, marking, state, onPress }) {
  const dow = dayjs(date.dateString).day();
  const isSelected = marking?.selected ?? false;
  const isToday = state === "today";
  const dots = marking?.dots ?? [];
  // ...
}
```

### BoardDay (board mode)

기존 CalendarGrid board mode와 동일:
- 셀 minHeight: 84px
- 날짜 숫자 상단 좌측
- 이벤트 칩 최대 2개 (teal=일반, amber=반복, purple=기념일)
- +N 오버플로 뱃지

board mode에서는 `dayComponent`가 `boardItems`에 직접 접근 필요.  
`boardItems`는 `CalendarView` props로 받아서 **컨텍스트 또는 module-level ref**로 공유.

```tsx
// BoardDay에서 boardItems 접근
const BoardDay = useMemo(() => {
  return function({ date, marking, state, onPress }) {
    const dayItems = boardItemsRef.current.filter(item => isSameDay(item.date, new Date(date.dateString)));
    // ...
  };
}, []); // stable

// useMemo 내부 함수가 ref 접근 → deps 불필요
const boardItemsRef = useRef(boardItems);
boardItemsRef.current = boardItems;
```

---

## 6. index.tsx 변경 계획

### 제거
- `CalendarGrid` import + 사용
- `MonthNavBar` import + 사용
- `GestureDetector` 수평 스와이프 제스처 (CalendarList 내장으로 대체)
- `horizontalSwipe` Gesture

### 추가
- `CalendarView` import + 사용

### 수직 스와이프 (모드 전환) 처리 방안
- **방안 A**: `GestureDetector(verticalSwipe)`를 CalendarView 외부에서 유지 (기존 UX 보존)
- **방안 B**: CalendarView 헤더에 토글 버튼 추가 (더 명확한 UX)
- **결정**: 구현 시 논의 필요

### 변경 후 CalendarView 사용 예시

```tsx
<CalendarView
  currentMonth={currentMonth}
  selectedDate={selectedDate}
  markedDates={logDates}
  anniversaryDates={calendarAnniversaryDates}
  mode={viewMode === "board" ? "board" : "compact"}
  boardItems={viewMode === "board" ? boardItems : undefined}
  onSelectDate={handleSelectDate}
  onMonthChange={(date) => {
    setCurrentMonth(date);
    setSelectedDate(null);
  }}
/>
```

---

## 7. DatePickerModal 변경 계획

CalendarGrid(수동) → Calendar(라이브러리 단일 월 컴포넌트).

```tsx
// 변경 전
<CalendarGrid
  currentMonth={pickerMonth}
  selectedDate={value}
  markedDates={[]}
  onSelectDate={handleSelect}
/>

// 변경 후
<Calendar
  key={dayjs(pickerMonth).format("YYYY-MM")}  // 월 변경 시 re-mount
  current={dayjs(pickerMonth).format("YYYY-MM-DD")}
  hideArrows
  hideExtraDays
  onDayPress={(day) => handleSelect(new Date(day.dateString))}
  markedDates={selectedDate ? { [dayjs(value).format("YYYY-MM-DD")]: { selected: true } } : {}}
  dayComponent={DatePickerDay}  // compact와 동일, selected 표시
  theme={DARK_THEME}
/>
```

MonthNavBar는 DatePickerModal이 자체적으로 갖고 있는 prev/next 버튼으로 처리. MonthNavBar 컴포넌트 불필요.

---

## 8. 설계 결정 기록

| # | 결정 | 이유 |
|---|------|------|
| 1 | CalendarList (horizontal) 사용 | 수평 스와이프 월 전환 내장. GestureDetector horizontal 제거 가능 |
| 2 | DatePickerModal은 Calendar (단일 월) | 모달 내 고정 너비(320px)에서 CalendarList width 계산 불필요 |
| 3 | MonthNavBar 삭제 후 CalendarView 내부로 통합 | 두 컴포넌트를 동기화하는 책임 제거 |
| 4 | dayComponent에 Pressable 포함 | Calendar가 dayComponent를 TouchableOpacity로 감싸지 않음. 직접 처리 필요 |
| 5 | onSelectDate stable callback (useRef) | dayComponent useMemo deps 비우기 → unmount/remount 방지 |
| 6 | board mode에 boardItemsRef | boardItems가 자주 바뀌어도 dayComponent re-creation 없이 최신값 접근 |
| 7 | calendarHeight: mode별 고정값 | CalendarList FlatList 가상화에 필수. compact=290 / board=560 |

---

## 9. 알려진 제약

1. **CalendarList current prop**: `current` 변경 시 CalendarList가 해당 월로 스크롤. 사용자 스와이프 후 `onVisibleMonthsChange` → `setCurrentMonth` → `current` 재설정 시 동일 위치 재스크롤 가능성. 실측 후 필요 시 isSwipingRef로 방지.

2. **calendarHeight 고정**: 5주/6주 달이 섞일 때 빈 공간 발생. `showSixWeeks` prop으로 항상 6주 고정 시 해결.

3. **CalendarList + GestureDetector 충돌 가능성**: board mode에서 수직 swipe gesture와 CalendarList 내부 scroll이 충돌할 수 있음. 실측 필요.
