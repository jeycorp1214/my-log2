# Phase 1 체크리스트 ✅ DONE

## DB 기반 작업

- [x] drizzle.config.ts 생성
- [x] db/schema.ts — groups, persons, logs, logPersons
- [x] db/client.ts — SQLite + drizzle 초기화
- [x] db/seed.ts — 기본 그룹 3개 + "미설정" 그룹 (sortOrder:0) + REPEAT_OPTIONS export
- [x] 마이그레이션 파일 수동 생성 (drizzle-kit generate는 expo-crypto import 문제로 사용 불가)
- [x] utils/date.ts — dayjs 유틸

## 앱 구조

- [x] app/\_layout.tsx — migrations + QueryClient + seed 호출 + GestureHandlerRootView
- [x] app/(tabs)/\_layout.tsx — 탭 구조 (캘린더/인물/설정)
- [x] app/(tabs)/index.tsx — 캘린더 뷰
- [x] app/(tabs)/persons.tsx — 인물 목록
- [x] app/(tabs)/settings.tsx — 설정

## 그룹 CRUD

- [x] app/groups/new.tsx — 그룹 추가 모달
- [x] settings 탭에서 그룹 목록 + 삭제
- [x] 기본 그룹 삭제 방지 로직

## 인물 CRUD

- [x] app/persons/new.tsx — 인물 추가
- [x] app/persons/[id].tsx — 인물 상세/수정/삭제
- [x] components/persons/PersonCard.tsx — 카드 컴포넌트
- [x] 나이 표시: calcAge(birthDate)

## 일정(로그) CRUD

- [x] app/logs/new.tsx — 로그 추가
- [x] app/logs/[id].tsx — 로그 상세/수정/삭제
- [x] components/logs/LogCard.tsx — 카드 컴포넌트 (반복 배지 포함)
- [x] 반복 규칙 UI (없음/매일/매주/매월/매년)
- [x] logPersons N:M 연결 UI

## 캘린더 뷰

- [x] components/calendar/CalendarGrid.tsx — 월별 달력 직접 구현
- [x] 날짜 탭 시 해당 날짜 로그 목록

---

# Phase 2 체크리스트 — 모바일 UX 최적화 + 반복 기능 완성

## P0 — 버그 수정 (즉시)

- [x] 월 전환 시 selectedDate null로 리셋 → 월간 전체 뷰로 복귀
- [x] 반복 기능: Virtual Occurrences 렌더링 로직 구현 (캘린더에 반복 dot 표시)

## P1 — 모바일 UX 핵심

- [x] FAB (Floating Action Button) — 우측 하단, 기록 추가 / 인물 추가
- [x] 스와이프로 월 이동 (GestureDetector + Gesture.Pan)
- [x] 오늘로 돌아가기 버튼 (Today button)
- [x] logs/new.tsx — 그룹 첫 번째 자동 pre-select (useEffect)
- [x] persons/new.tsx — 그룹 첫 번째 자동 pre-select (useEffect)

## 실기기 피드백 반영 (2026-05-08)

- [x] 캘린더: 월 이동 시 selectedDate null → 월간 전체 뷰
- [x] 캘린더: 날짜 탭 → 선택, 재탭 → 전체 뷰 토글
- [x] 캘린더: 월간 전체 뷰에 날짜별 섹션 헤더 추가
- [x] 반복: repeatUntil null → 영구 반복 (monthEnd까지 계산)
- [x] 반복: 현재 월 내 시작한 반복 로그도 이후 occurrence 표시
- [x] 반복: "없음" 항목 추가 (기본값 "none", REPEAT_OPTIONS에 포함)
- [x] 스키마: logs.groupId nullable 변경 + migration 0001 수동 생성
- [x] 스키마: persons.groupId nullable 변경 + migration 0002 수동 생성
- [x] seed: "미설정" 그룹 추가 (sortOrder:0, gray #ADB5BD)
- [x] UI: 인물 탭 FAB 교체 (헤더 버튼 → 우측 하단 FAB)
- [x] 설정: 전체 데이터 초기화 버튼 (개발 도구 섹션)
- [x] 설정: 초기화 후 router.replace → UI 즉시 갱신
- [x] NativeWind 전환: 모든 화면/컴포넌트 StyleSheet → className

## P2 — UX 고도화

- [x] 년/월 타이틀 클릭 시 MonthPicker 모달 (Gluestack Modal → RN Modal로 교체, 즉시 닫힘 버그 수정)
- [x] 반복 기록 관리 — 설정 탭 내 "반복 관리" 섹션 (Gluestack Card/VStack/HStack)
- [x] Gluestack 우선 적용 방침 확립: VStack/HStack/Card/Modal → NativeWind className 보완

## 실기기 버그 수정 2차 (2026-05-09)

- [x] MonthPicker 모달 열렸다가 즉시 닫히는 버그 → RN Modal + 중첩 Pressable backdrop으로 교체
- [x] FAB 날짜 버그 — 다른 달 조회 시 항상 오늘 날짜로 기록 생성됨 → currentMonth 기준 첫날 사용
- [x] 6월 리스트에 5/8 원본 날짜 노출 → buildDaySections에 monthStart/monthEnd 범위 가드 추가
- [x] 전체 데이터 초기화 후 UI 미갱신 → router.replace 제거, useLiveQuery 반응성으로 처리

## P3 — UX 개선 (2026-05-09)

- [x] 기록 추가/상세 상단 날짜 입력 영역 — DatePickerModal 컴포넌트 + CalendarGrid 재활용
- [x] 기록 상세 수정 모드에서도 날짜 변경 가능 (logDate DB 업데이트 포함)
- [x] 설정 탭 리스트형 리팩토링 — 그룹 관리/반복 관리 각각 별도 페이지로 분리
- [x] app/settings/groups.tsx — 그룹 목록 + FAB(→ /groups/new)
- [x] app/settings/repeats.tsx — 반복 로그 목록 + FAB(→ /logs/new) + 해제 기능
- [x] \_layout.tsx에 settings/groups, settings/repeats Stack.Screen 등록
- [x] 인물 타임라인 — persons/[id].tsx에 이미 구현됨 (personLogs + "함께한 기록" 섹션)

---

# Phase 3 체크리스트 — 반복 완성

## 반복 기능 완성

- [x] logs/new.tsx: repeatUntil 날짜 선택 UI ("영구" / "종료일 지정" 토글 + DatePickerModal)
- [x] logs/[id].tsx: repeatUntil 수정 UI (수정 모드 동일 패턴)
- [ ] settings/repeats.tsx: 반복 로그에 종료일 표시 개선

## 반복 단일/전체 수정

- [x] index.tsx: repeat occurrence 탭 시 occurrenceDate param 포함 push (LogItem 타입 도입)
- [x] logs/[id].tsx: occurrenceDate param 수신 → isOccurrenceView 감지 + "🔄 반복 기록" 배너
- [x] "수정" 탭 → Alert ("이 날만 별도 기록" / "반복 전체 수정") 분기
- [x] copy mode: occurrenceDate 기준 새 단일 로그 INSERT + router.back

---

# Phase 4 체크리스트 — 표준 캘린더 기능

## 검색

- [x] app/search.tsx 신규 생성 — 제목/메모/인물명 LIKE 검색 (FTS5 불필요, 개인앱 규모)
- [x] (tabs)/index.tsx: 캘린더 헤더 Search 아이콘 → /search push
- [x] \_layout.tsx: search Stack.Screen 등록 (presentation: modal)
- [x] components/logs/SearchLogItem.tsx: 날짜+제목+메모 검색 결과 아이템
- [x] 기록(title/memo) + 인물(name/memo) 통합 검색, SectionList 2섹션
- [x] 300ms 디바운스, 2자 이상 검색, 결과 limit 기록 50 / 인물 20

~~## 알림/리마인더~~ ← 기획 방향과 맞지 않아 제거 (2026-05-09)

---

# Phase 5 체크리스트 — 리스트 탭

## DB 스키마

- [x] migration 0001: logs.checked_at integer 컬럼 추가
- [x] db/schema.ts: logs에 checkedAt 필드 추가

## 훅

- [x] hooks/logs/use-event-filter.ts — 기간 필터 + 일반/반복 로그 통합 반환 (EventItem 타입)

## 컴포넌트

- [x] components/logs/ListEventItem.tsx — 체크박스(일반)/반복배지(반복) + 제목/날짜 아이템

## 화면

- [x] app/(tabs)/list.tsx — 리스트 탭 메인 화면
  - [x] 기간 필터 칩: 1개월/3개월(기본)/6개월/1년/전체
  - [x] 요약: 총 N개 · 완료 M개
  - [x] 미완료만 토글
  - [x] 월별 섹션 SectionList (stickySectionHeadersEnabled)
  - [x] 체크 토글 → DB checkedAt 업데이트
  - [x] 아이템 탭 → logs/[id] 상세 이동

## 탭 구조

- [x] app/(tabs)/\_layout.tsx: 리스트 탭 추가 (캘린더/인물/리스트/설정)

## 설계 결정 메모

- 반복 로그: 옵션 A — 체크박스 없이 "반복" 배지로 표시
- "전체" 프리셋 반복 expansion: dayjs +2년으로 캡 (폭발 방지)
- checkedAt: timestamp_ms integer (언제 완료했는지 보존, boolean보다 우월)

---

# Phase 6 체크리스트 — 인물 기념일

## DB 스키마

- [x] migration 0002: person_anniversaries 테이블 생성
- [x] db/schema.ts: personAnniversaries 테이블 추가 (persons FK cascade delete)

## 유틸

- [x] utils/date.ts: dDayLabel(dateStr, isRepeat) 함수 추가

## 화면

- [x] persons/new.tsx: 기념일 섹션 추가
  - [x] 프리셋 칩: 결혼/졸업/입사/첫 만남/사귀기 시작
  - [x] 동적 기념일 행 추가/삭제
  - [x] 날짜 선택 (DatePickerModal, 한 번에 하나)
  - [x] 매년 반복 토글
  - [x] 저장 시 person INSERT → anniversaries INSERT (returning id 활용)

- [x] persons/[id].tsx: 기념일 뷰/편집 섹션 추가
  - [x] 뷰 모드: 기념일 목록 + D-Day 표시 (함께한 기록 위)
  - [x] 수정 모드: 기존 기념일 편집/삭제 + 추가
  - [x] 저장 시 delete-all + re-insert
  - [x] startEditing() 함수로 편집 초기화 통합

## 설계 결정 메모

- 캘린더 기념일 마커: 1차 제외
- date 컬럼: text YYYY-MM-DD (birthDate 동일 패턴)
- 기념일 수정: delete-all + re-insert (simple, 참조 테이블 없음)
- dDayLabel: isRepeat=true → 올해(지났으면 내년) 기준

---

# 아키텍처 개선 체크리스트 (2026-05-09)

## 에러 처리 강화

- [x] `providers/ErrorBoundary.tsx` — 렌더 에러 캐치용 클래스 기반 에러 바운더리 추가
- [x] `providers/DatabaseProvider.tsx` — DB 초기화 로직 분리 + async 에러 try/catch 처리

## Provider 분리 (\_layout.tsx 관심사 분리)

- [x] `app/_layout.tsx` — DB init 로직 제거, Provider 조합만 담당하도록 리팩토링
  - 이전: DB init useEffect + ready state + 로딩/에러 UI 모두 \_layout에 혼재
  - 이후: `<ErrorBoundary> → <DatabaseProvider> → <GestureHandlerRootView> → ...`

## 도메인 훅 추출

- [x] `hooks/logs/use-calendar-logs.ts` — CalendarScreen의 useLiveQuery 2개 추출 (월간 로그, 반복 로그)
- [x] `hooks/persons/use-persons-with-groups.ts` — PersonsScreen의 useLiveQuery 2개 + 그룹핑 로직 추출
- [x] `app/(tabs)/index.tsx` — useCalendarLogs 훅 사용으로 교체
- [x] `app/(tabs)/persons.tsx` — usePersonsWithGroups 훅 사용으로 교체

## 유틸 구조 (이미 완료)

- [x] `utils/date.ts` — 날짜 유틸 (기존)
- [x] `utils/repeat.ts` — 반복 occurrence 계산 (기존)

---

# Phase 7 체크리스트 — UI/UX 고도화

## 리스트 탭 개선

- [x] list.tsx: 기간 프리셋 → 올해(기본)/작년/최근 1년/전체/직접 선택
- [x] list.tsx: "직접 선택" 시 시작/종료 월 버튼 + MonthPickerModal 재사용
- [x] list.tsx: 헤더 필터 아이콘(SlidersHorizontal) + 활성 필터 수 뱃지
- [x] list.tsx: 필터 바텀 시트 (RN Modal, slide 애니메이션)
  - [x] 완료 상태: 전체/완료/미완료 (기존 "미완료만" 토글 통합)
  - [x] 기록 유형: 전체/일반/반복
  - [x] 정렬: 오래된순/최신순
- [x] list.tsx: cn 유틸 적용 (프리셋 칩 className 조건부 처리)

## 캘린더 확장 뷰

- [x] CalendarGrid: `mode?: 'compact' | 'board'` + `boardItems?` prop 추가
- [x] CalendarGrid: 확장 모드 — 셀 minHeight 68, 이벤트 제목 최대 2개 표시
- [x] CalendarGrid: 일반 로그(teal) / 반복 로그(amber) 색상 구분
- [x] CalendarGrid: 3개 이상 이벤트 시 "+N" 오버플로 뱃지
- [x] CalendarGrid: cn 유틸 적용 (일반 모드 조건부 className 정리)
- [x] index.tsx: `viewMode` 상태 + 헤더 토글 버튼 (확장/일반)
- [x] index.tsx: 확장 모드 — ScrollView > 확장 CalendarGrid, 하단 리스트 숨김, 스와이프 비활성
- [x] index.tsx: `boardItems` useMemo (monthLogs + repeatOccurrences 통합)

## MBTI / 생년월일 입력 개선

- [x] MbtiPicker: 4축 토글 컴포넌트 (E/I, N/S, T/F, J/P)
- [x] BirthDateInput: 스마트 숫자 파싱 (2자리 나이 / 4자리 연도 / 6자리 YYMMDD / 8자리 YYYYMMDD)
- [x] utils/date.ts: parseBirthInput() 추가

## 인물 기념일 (Phase 6 연계)

- [x] db/schema.ts: personAnniversaries 테이블
- [x] migration 0002: person_anniversaries 생성
- [x] persons/new.tsx: 기념일 섹션 (프리셋 + 추가/삭제 + 날짜 + 매년 반복)
- [x] persons/[id].tsx: 기념일 뷰(D-Day) + 수정 모드

## 설정 — 테이블 초기화

- [x] db/client.ts: resetDatabase() 함수 (execAsync DROP + runMigrations)
- [x] settings.tsx: 테이블 구조 초기화 버튼 (resetDatabase 호출)

---

# Phase 8 체크리스트 — Gluestack / cn / Tailwind 스타일 통일

> 규칙: `StyleSheet.create` 및 inline `style={{}}` 제거 → `className` + `cn()` 사용.
> 예외: Android elevation, Reanimated transform → inline 유지 OK.

## Step 1 — StyleSheet.create 제거 (4개, 최단순)

- [x] `components/ui/collapsible.tsx` — heading/content StyleSheet → className
- [x] `components/themed-text.tsx` — typography StyleSheet → TYPE_CLASS 맵 + className
- [x] `components/parallax-scroll-view.tsx` — header/content StyleSheet → className (Animated 제외)
- [x] `app/modal.tsx` — container/link StyleSheet → className

## Step 2 — inline style 단순 케이스 (flex/padding/margin)

- [ ] `app/_layout.tsx` — GestureHandlerRootView (써드파티 미지원, 보류)
- [x] `app/logs/[id].tsx` — KeyboardAvoidingView `style={{ flex: 1 }}` → `className="flex-1"`
- [x] `app/logs/new.tsx` — KeyboardAvoidingView `style={{ flex: 1 }}` → `className="flex-1"`
- [x] `app/memos/new.tsx` — KeyboardAvoidingView `style={{ flex: 1 }}` → `className="flex-1"`
- [x] `app/memos/[id].tsx` — KeyboardAvoidingView `style={{ flex: 1 }}` → `className="flex-1"`
- [x] `app/persons/new.tsx` — KeyboardAvoidingView → `className="flex-1"`
- [x] `app/persons/[id].tsx` — KeyboardAvoidingView → `className="flex-1"`
- [x] `app/groups/new.tsx` — KeyboardAvoidingView → `className="flex-1"` (Step 3에서 함께)
- [x] `components/memos/MemoEditor.tsx` — TextInput flex/padding → className, textAlignVertical inline 유지

## Step 3 — 조건부 컬러 inline style

- [x] `components/DateInput.tsx` — 조건부 text color → `cn()` + className
- [x] `components/persons/BirthDateInput.tsx` — 에러 state color + width → className
- [x] `app/groups/new.tsx` — 색상 선택 border → `cn()`, backgroundColor 런타임값 inline 유지

## Step 4 — 중간 난이도 inline style

- [x] `components/persons/PersonForm.tsx` — minHeight → className, dot color → cn()
- [x] `app/settings/tab-prefs.tsx` — Chips + 그룹칩 3곳 backgroundColor/color → cn()

## Step 5 — 대규모 (마지막)

- [x] `components/MonthPickerModal.tsx` — 전체 inline style → className 전환

## 보류 (inline 유지 OK)

- `components/FloatingActionButton.tsx` — elevation: 6 (Android 플랫폼 전용)
- `components/calendar/QuickInputBar.tsx` — elevation: 6 + bottom 위치값
- `components/hello-wave.tsx` — Reanimated animation inline
- `components/parallax-scroll-view.tsx` — Animated transform inline

## 참고 파일 (올바른 패턴 예시)

- `components/logs/LogCard.tsx` — className 우수 사용 예
- `components/ui/button/index.tsx` — tva() + className 기준 패턴
- `app/(tabs)/index.tsx` — 화면 레벨 className 우수 사용 예
