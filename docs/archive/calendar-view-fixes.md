# CalendarView 버그 분석 및 편집 계획

소스 직접 분석 기반. `react-native-calendars@1.1314.0` 기준.

---

## Bug 1 — 스와이프 후 재스크롤 (current prop 루프)

### 현상

사용자가 CalendarList를 스와이프해 다음 달로 이동하면 스크롤이 끊기거나 제자리로 튕긴다.

### 원인

CalendarList 소스 (`calendar-list/index.js`):

```js
useEffect(() => {
  if (current) {
    scrollToMonth(new XDate(current)); // current 바뀔 때마다 스크롤 강제 실행
  }
}, [current]);
```

실행 체인:

1. 사용자 스와이프 → FlatList `onViewableItemsChanged`
2. CalendarList 내부 `setCurrentMonth(newMonth)`
3. `useDidUpdate([currentMonth])` → `onVisibleMonthsChange([{dateString}])`
4. 우리 콜백 → `onMonthChange(new Date(...))` → 부모 `setCurrentMonth`
5. `CalendarView` 리렌더 → `current` prop 변경
6. `useEffect([current])` 재발동 → `scrollToOffset` 호출
7. 모멘텀 스크롤 진행 중에 강제 스크롤 → 끊김 or 튕김

### 편집

CalendarView.tsx에 `isSwipingRef` 추가:

```tsx
const isSwipingRef = useRef(false);
const swipeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

// CalendarList props:
current={isSwipingRef.current ? undefined : dayjs(currentMonth).format("YYYY-MM-DD")}

onVisibleMonthsChange={(months) => {
  if (months[0]) {
    isSwipingRef.current = true;
    onMonthChange(new Date(months[0].dateString));
    if (swipeTimerRef.current) clearTimeout(swipeTimerRef.current);
    swipeTimerRef.current = setTimeout(() => {
      isSwipingRef.current = false;
    }, 500);
  }
}}
```

`current = undefined`이면 `if (current)` 조건 false → `scrollToMonth` 미실행.  
버튼/모달 경유 외부 네비게이션 시에는 `isSwipingRef.current = false`이므로 정상 스크롤.

---

## Bug 2 — mode 전환 시 calendarHeight 미반영

### 현상

compact → board 전환 시 셀 높이가 바뀌지 않는다. board 셀이 여전히 compact 높이(290px)로 렌더링된다.

### 원인

CalendarList `renderItem` (`calendar-list/index.js`):

```js
const renderItem = useCallback(({ item }) => {
    return (
        <CalendarListItem
            {...calendarProps}
            calendarHeight={calendarHeight}   // ← 전달하지만
            ...
        />
    );
}, [horizontal, calendarStyle, calendarWidth, testID, getMarkedDatesForItem, isDateInRange, calendarProps]);
//  ↑ calendarHeight이 deps에 없음 → calendarHeight 변경 시 클로저 stale
```

CalendarList가 마운트될 때의 `calendarHeight`가 클로저에 고정된다. 이후 prop이 바뀌어도 `renderItem`은 재생성되지 않으므로 CalendarListItem이 새 높이를 받지 못한다.

추가로, Day 컴포넌트의 `areEqual` 커스텀 비교기:

```js
function areEqual(prevProps, nextProps) {
  const didPropsChange = some(
    omit(prevProps, "marking"),
    (value, key) => value !== omit(nextProps, "marking")[key],
  );
  const isMarkingEqual = isEqual(prevProps.marking, nextProps.marking);
  return !didPropsChange && isMarkingEqual;
}
```

mode 전환 시 `marking`이 바뀌지 않으면 Day 셀이 리렌더되지 않아 `modeRef.current`를 읽는 새 렌더도 발생하지 않는다.

### 편집

CalendarList에 `key` prop 추가 → mode 변경 시 완전 리마운트:

```tsx
<CalendarList
  key={mode}                          // ← 추가
  calendarHeight={calendarHeight}
  ...
/>
```

리마운트 시 비용:

- `initialDate.current` = `currentMonth`로 재설정 → 현재 월부터 새 items 배열 생성
- 모든 CalendarListItem 재생성
- mode 전환은 드문 이벤트이므로 허용 가능한 비용

---

## Bug 3 — pastScrollRange/futureScrollRange = 12 (±1년 제한)

### 현상

앱 실행 시점 기준 ±12개월 밖으로 이동 불가. 화살표·MonthPickerModal로 범위 밖 날짜 선택 시 CalendarList가 경계에서 멈춘다.

### 원인

CalendarList 소스:

```js
const items = useMemo(() => {
  const months = [];
  for (let i = 0; i <= pastScrollRange + futureScrollRange; i++) {
    const rangeDate = initialDate.current
      ?.clone()
      .addMonths(i - pastScrollRange, true);
    months.push(rangeDate);
  }
  return months;
}, [pastScrollRange, futureScrollRange]);
```

items 배열은 마운트 시 `initialDate.current`(앱 실행 당시 날짜) 기준으로 계산된다.  
현재 값: 12 + 12 + 1 = **25개월** 총 범위.

라이브러리 기본값은 `pastScrollRange = 50`, `futureScrollRange = 50`.

### 편집

```tsx
<CalendarList
  pastScrollRange={50}
  futureScrollRange={24}      // 미래는 2년으로 제한해도 충분
  ...
/>
```

일기 앱 특성상 과거 접근이 중요하므로 `pastScrollRange`를 50으로 설정.

---

## 이슈 4 — Dot이 원(circle) 내부에 렌더링 → 시각적 열화

### 현상

compact mode에서 기록 dot이 날짜 숫자 원 안에 그려진다. 원의 곡률로 인해 하단 모서리 근처에 위치하며 시각적으로 잘 보이지 않는다.

### 분석

현재 구조:

```tsx
<View style={{ width: 36, height: 36, borderRadius: 18, ... }}>
  <Text>15</Text>
  {/* dots가 원 안에 있음 */}
  <View style={{ flexDirection: "row", gap: 2, marginTop: 1 }}>
    <View style={{ width: 4, height: 4 }} />
  </View>
</View>
```

텍스트 ~17px + marginTop 1px + dot 4px = ~22px. 36px 원에서 중앙 정렬 시 dot의 상단은 y≈25 위치. 원 테두리와 7px 여유밖에 없어 dot이 원 하단 곡면 근처에 위치한다.

react-native-calendars 기본 렌더링은 dot을 원 **아래**에 표시한다.

### 편집

dot을 원 바깥 아래로 이동:

```tsx
// 변경 전 (원 내부)
<View style={{ width: 36, height: 36, ... }}>
  <Text>{date.day}</Text>
  <DotsRow />          {/* 원 안 */}
</View>

// 변경 후 (원 아래)
<View style={{ alignItems: "center" }}>
  <View style={{ width: 36, height: 36, ... }}>
    <Text>{date.day}</Text>
  </View>
  <DotsRow />          {/* 원 밖 */}
</View>
```

dot이 원 아래 표시되어 명확하게 보인다. 이 경우 dayComponent 전체 높이가 36 + dot영역(~8px)이므로 `calendarHeight`도 재조정 필요:

- compact: `290` → `310` 으로 증가

---

## 이슈 5 — markingType="multi-dot" 불필요

### 분석

`calendar/day/index.js`:

```js
const Component =
  dayComponent || (markingType === "period" ? PeriodDay : BasicDay);
```

`dayComponent`가 있으면 `markingType`은 **렌더링 컴포넌트 선택에 영향 없음**.  
`marking` prop은 `markingType`과 무관하게 `markedDates[dateString]` raw 객체가 그대로 전달된다.

```js
marking={markedDates?.[dateString]}   // calendar/index.js renderDay
```

`markingType="multi-dot"` 설정은 기능적으로 무의미하다. 제거 가능.

### 편집

```tsx
// 제거
markingType = "multi-dot";
```

---

## 이슈 6 — DatePickerModal markingType="dot" 불일치

### 현상

DatePickerModal의 `markedDates` 형식은 `{ selected: true }` (simple marking)인데 `markingType="dot"`으로 지정되어 있다.

### 편집

```tsx
// 제거 또는 아래로 교체
markingType = "simple";
```

custom `dayComponent`를 사용하므로 기능에 영향 없지만 의도를 명확히 한다.

---

## 편집 우선순위 요약

| 우선순위 | 이슈                         | 편집                                      |
| -------- | ---------------------------- | ----------------------------------------- |
| P0       | Bug 2: calendarHeight 미반영 | `key={mode}` 추가                         |
| P0       | Bug 3: ±1년 제한             | `pastScrollRange={50}`                    |
| P1       | Bug 1: 스와이프 재스크롤     | `isSwipingRef` 패턴                       |
| P1       | 이슈 4: dot 위치             | 원 바깥 아래로 이동 + calendarHeight 조정 |
| P2       | 이슈 5,6: markingType        | 불필요 prop 제거                          |

---

## Dot 동작 여부 결론

`marking.dots`는 정상 전달된다. `Day` 컴포넌트의 `{...props}` 스프레드로 `marking`이 dayComponent에 올바르게 전달됨:

```js
// calendar/day/index.js
return (
  <Component {...props} {...dayComponentProps}>
    {formatNumbers(_date?.getDate())}
  </Component>
);
```

`{...props}`에 `marking`이 포함된다. **기능적으로 dot 데이터는 전달된다.**  
현재 증상이 있다면 원인은 dot이 원 내부 하단에 위치해 시각적으로 잘 안 보이는 것이다(이슈 4).

단, Bug 2로 인해 mode 전환 후 셀이 리렌더되지 않으면 `marking` 변경에도 dot 업데이트가 안 되는 경우가 발생한다. Bug 2 편집이 선행되어야 한다.
