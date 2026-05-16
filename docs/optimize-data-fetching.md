# 데이터 호출 최적화 계획

> 최종 업데이트: 2026-05-17
> 담당: 자동 (Claude Code)

---

## 목표

탭별 데이터 호출 방식을 감사하여 불필요한 전체 테이블 스캔, 중복 쿼리, 메모이제이션 누락, 무한스크롤 미구현 등을 수정한다.

---

## 발견된 문제 목록

### 🔴 HIGH — 즉시 수정

| # | 위치 | 문제 |
|---|---|---|
| H1 | Home / `useAllLogDates` | `logs` 전체 스캔 후 JS에서 streak 계산. 날짜 범위 미적용. |
| H2 | List / `useEventFilter` | 선택 기간 전체를 메모리에 적재. 페이지네이션 없음. |
| H3 | Calendar / `useCalendarData` | `personAnniversaries` + `persons` WHERE 절 없이 전체 페치 |
| H4 | Persons / `usePersonsWithGroups` | `logPersons` JOIN 전체 로드 후 JS reduce로 `lastLogDate` 계산 |

### 🟡 MED — 성능 저하 누적

| # | 위치 | 문제 |
|---|---|---|
| M1 | List | `logPersons` 전체 스캔 후 Set 구성 (날짜 범위 미적용) |
| M2 | List | 필터(group/completion/person) 전부 JS 처리 — SQL WHERE 이동 가능 |
| M3 | Memo | 서브탭 무관하게 memos + todos 모두 마운트 시 실행 |
| M4 | Memo | `filteredMemos`, `quadrantTodos` `useMemo` 없이 매 렌더 재계산 |
| M5 | Persons | `ScrollView` 사용 — `FlatList`/`SectionList` 가상화 필요 |
| M6 | Persons | `allGroups.find()` 렌더 안에서 N×G 루프 (Map으로 교체) |
| M7 | `TodoStatusWidget` | `todos` 전체 로드 후 JS count — SQL `COUNT + GROUP BY`로 대체 |
| M8 | `useAnniversariesInMonth` | 3개 탭에서 동일 전체 테이블 쿼리 동시 실행 |
| M9 | 전체 탭 | `useFocusEffect` 없음 — 방문한 탭 전부 live subscription 유지 |

### 🟢 LOW — 코너케이스

| # | 위치 | 문제 |
|---|---|---|
| L1 | Home, Persons | `today`/`rangeStart` `useMemo([], [])` → 자정 이후 stale |
| L2 | Calendar | `monthStart`/`monthEnd` 매 렌더마다 새 객체 → useLiveQuery 불필요 재실행 |
| L3 | List/Calendar/Persons | `groups` 쿼리 3중 중복 live subscription |

---

## 구현 계획 및 체크리스트

### Phase 1: HIGH — SQL 집계 전환 및 범위 제한

- [x] **H1** `hooks/stats/use-stats.ts` — `useAllLogDates(limitDays?)` 파라미터 추가, Home 탭에서 730일 제한 적용
- [x] **H3** `hooks/useCalendarData.ts` — `personAnniversaries` 쿼리에 `strftime` WHERE 절 추가 (isRepeat 분기)
- [x] **H4** `hooks/persons/use-persons-with-groups.ts` — `MAX(logDate) GROUP BY personId` DB 집계로 교체

### Phase 2: MED — 메모이제이션 및 JS 필터 제거

- [x] **M4** `app/(tabs)/memo.tsx` — `filteredMemos`, `quadrantTodos`, `todoCounts`, `memoDoneCount`, `todoDoneCount` `useMemo` 적용
- [x] **M6** `app/(tabs)/persons.tsx` — `allGroups.find()` 3곳 → `groupMap` (Map) 조회로 교체
- [x] **M7** `components/home/TodoStatusWidget.tsx` — `COUNT + GROUP BY` DB 집계 쿼리로 교체

### Phase 3: HIGH — List 무한스크롤

- [x] **H2** `app/(tabs)/list.tsx` — 섹션 기반 페이지네이션 구현
  - `visibleSections` state (기본값 4), `onEndReached`로 +4씩 증가
  - 필터/프리셋/검색 변경 시 리셋
  - `ListFooterComponent`: 더 있으면 ActivityIndicator 표시
  - `pagedSections = sections.slice(0, visibleSections)` — 전체 합계는 `filtered` 기준 유지

### Phase 4: MED — useFocusEffect 가드

- [x] **M9** `hooks/use-is-focused.ts` 신규 생성 — `useFocusEffect` 기반 `useIsFocused()` 유틸
- [x] **M9** `hooks/persons/use-anniversaries-in-month.ts` — `enabled` 파라미터 추가, 미포커스 시 useMemo 조기 반환
- [x] **M9** Home, List, Persons 탭 — `useIsFocused()` + `enabled` 인자 전달
  - DB 구독은 유지 (drizzle useLiveQuery 제한), JS 연산만 포커스 시 실행
  - 3개 탭 동시 마운트 시 anniversary 연산 1개만 실행

### Phase 5: MED — ScrollView → FlatList 가상화

- [ ] **M5** `app/(tabs)/persons.tsx` — 인물 그룹 목록 `SectionList`로 교체

### Phase 6: LOW — 기타 정리

- [ ] **L1** Home — `today` `useMemo` → `useEffect` + state로 자정 갱신 처리
- [ ] **L2** Calendar — `monthStart`/`monthEnd` `useMemo` 안으로 이동
- [ ] **M1** List — `linkedLogRows` 쿼리 날짜 범위 스코핑

---

## 진행 상황

| Phase | 상태 | 완료일 |
|-------|------|--------|
| Phase 1: HIGH SQL 집계 | ✅ 완료 | 2026-05-17 |
| Phase 2: MED 메모이제이션 | ✅ 완료 | 2026-05-17 |
| Phase 3: HIGH List 무한스크롤 | ✅ 완료 | 2026-05-17 |
| Phase 4: MED useFocusEffect | ✅ 완료 | 2026-05-17 |
| Phase 5: MED ScrollView→FlatList | 🔲 대기 | - |
| Phase 6: LOW 기타 | 🔲 대기 | - |

---

## 결정 사항

- **streak 날짜 범위**: 365일로 제한. 앱 내 streak 표시는 최대 1년 기준이므로 충분.
- **List 페이지 크기**: 50개. SectionList 기본 windowSize 고려하여 충분한 버퍼 제공.
- **useFocusEffect 적용 범위**: Heavy 쿼리만 (전체 테이블 스캔 수준). 가벼운 쿼리(limit 5 등)는 제외.
- **groupContext 공유**: Phase 1-3 완료 후 필요 여부 재평가. 지금은 중복 쿼리 낮은 우선순위.
- **ScrollView→FlatList**: persons 탭만 적용. 나머지는 데이터 크기 허용 범위.

---

## 관련 파일

```
hooks/
  use-all-log-dates.ts
  use-calendar-data.ts
  use-anniversaries-in-month.ts
  use-event-filter.ts
  persons/use-persons-with-groups.ts
app/(tabs)/
  index.tsx
  list.tsx
  memo.tsx
  persons.tsx
  calendar.tsx
components/home/
  TodoStatusWidget.tsx
  TodayRepeatWidget.tsx
```
