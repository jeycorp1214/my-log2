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

---

# Phase 9 체크리스트 — 노트 탭 재편 + 홈 탭 변경

## 노트 탭 (app/(tabs)/memo.tsx)

- [x] 메모 서브탭 — 체크리스트 스타일 (체크/삭제/상세 이동)
- [x] 할 일 서브탭 — 아이젠하워 매트릭스 (do/schedule/delegate/eliminate 2×2 그리드)
- [x] QuickInputBar — 하단 빠른 입력 바 (내용 있으면 추가, 없으면 /memos/new 이동)
- [x] 메모 필터 바텀시트 — 완료 상태(전체/완료/미완료) + 정렬(최신/오래된순) + 완료 항목 일괄 삭제
- [x] TabPreferencesProvider 연동 — 메모 필터/정렬 설정 persist
- [x] todos: useLiveQuery + 사분면별 필터링, 미완료 먼저 정렬

## 홈 탭 변경

- [x] app/(tabs)/index.tsx: 캘린더 뷰 제거 → 최근 기록 30개 목록
- [x] TabsHeader + LogCard 재활용, FAB → /logs/new
- [x] 캘린더 관련 훅(useCalendarLogs, useRepeatLogs 등) 홈 탭에서 분리됨

## 타임라인 + 히트맵

- [x] 인물 상세 타임라인 — 바텀 시트 형태
- [x] app/settings/heatmap.tsx — 연간 기록 히트맵

---

# Phase 10 체크리스트 — 보안 (PIN 비밀번호)

## Provider

- [x] providers/PinLockProvider.tsx — isLocked/isPinEnabled + unlock/enablePin/disablePin/changePin/verifyPin
- [x] utils/pin.ts — getStoredPin/savePin/deleteStoredPin (expo-secure-store)

## 컴포넌트

- [x] components/PinPad.tsx — 6자리 숫자 키패드, 점 표시, isError 빨간 점 피드백, C(초기화)/⌫(백스페이스)
- [x] components/LockScreen.tsx — 앱 잠금 화면 (PinPad 사용)

## 화면

- [x] app/settings/password.tsx — PIN 잠금 토글(Switch) + 단계별 PinPad 입력(enable/disable/change)
  - [x] enable: 새 PIN 입력 → 확인 → enablePin()
  - [x] disable: 현재 PIN 검증 → disablePin()
  - [x] change: 현재 PIN 검증 → 새 PIN 입력 → 확인 → changePin()
  - [x] isError + flashError 700ms 흔들림 피드백

## 설정 탭 연동

- [x] settings.tsx: 보안 섹션 → /settings/password 라우팅

## 개발 도구 확장

- [x] db/seed.ts: seedSampleData() — 인물 5명 + 기록 10개 + 할 일 4개 + 메모 2개
- [x] settings.tsx (debugMode=true일 때): 샘플 데이터 삽입 버튼

---

# Phase 11 체크리스트 — 통계 (Stats)

## 훅

- [x] `hooks/stats/use-stats.ts` — 통계 집계 쿼리 모음 (useLiveQuery 기반)
  - [x] `useSummaryStats()` — 총 기록수 / 총 인물수 / 이번 달 기록수
  - [x] `usePersonRanking(period)` — 인물별 등장 횟수 + 마지막 날짜 (period: 'month' | 'year' | 'all')
  - [x] `useLastContact()` — 인물별 마지막 연결 날짜, 오래된 순 정렬
  - [x] `useCategoryRatio(period)` — 그룹별 기록 수 + 비율 (period: 'month' | 'year' | 'all')
  - [x] `useAllLogDates()` + `calcStreak()` — 연속 기록 일수 (JS 계산)
  - [x] `useCompletionRate(period)` — 로그 완료율 (checkedAt IS NOT NULL / total)

## 화면

- [x] `app/settings/stats.tsx` — 통계 메인 페이지
  - [x] 요약 카드 3개 (총 기록수 / 총 인물수 / 이번 달 기록수)
  - [x] 인물 랭킹 섹션 (기간 칩: 이번 달 / 올해 / 전체)
  - [x] 마지막 연결 리스트 (오래된 순 TOP 5, fromNow() 표시)
  - [x] 카테고리 비율 섹션 (그룹 색상 프로그레스 바, 기간 칩 연동)
  - [x] 기록 스트릭 카드 (현재 / 최장)
  - [x] 완료율 카드 (기간 칩 연동)

## 라우팅

- [x] `app/_layout.tsx` — `settings/stats` Stack.Screen 등록
- [x] `app/(tabs)/settings.tsx` — 통계 섹션에 `/settings/stats` 링크 추가

## 추가 아이디어 구현 계획

### P1 — 즉시 구현 (데이터 없어도 의미 있음)

- [x] **반복 기록 비율** — `useRepeatRatio(period)`. stats.tsx 완료율 카드 아래 2열 배치. 반복 기록 비율 프로그레스 바 (amber 색).
- [x] **평균 기록 간격** — `calcAvgInterval(dates)` 순수 함수 (JS). 첫 기록일~오늘 / 총 기록수. 반복 비율 카드 옆 배치.
- [x] **할일 사분면별 완료율** — `useQuadrantStats()`. todos GROUP BY quadrant. 사분면별 프로그레스 바 섹션. 할일 없으면 섹션 숨김.

### P2 — 데이터 어느 정도 필요 (기록 30개↑)

- [x] **기록 없는 최장 공백** — `calcLongestGap(dates)` 순수 함수. 스트릭 카드 3열(현재/최장/공백)로 확장. 스트릭 카드에 flex:2 비율 적용.

### P3 — 항상 표시 (데이터 없으면 섹션 숨김)

- [x] **MBTI 분포** — `useMbtiDistribution()`. persons GROUP BY mbti WHERE mbti IS NOT NULL. 데이터 없으면 섹션 자체 미표시.
- [x] **함께 등장 빈도** — `useCoAppearance()`. logPersons self alias JOIN. TOP 5. 데이터 없으면 섹션 자체 미표시.

## 설계 결정 메모

- 차트 라이브러리 없음 — 단순 프로그레스 바 + 텍스트 (의존성 미추가)
- 스키마 변경 없음 — 기존 테이블만으로 충분
- 기간 필터 상태: 페이지 로컬 state (persist 불필요)
- 스트릭 계산: DB에서 날짜 목록 로드 → JS에서 연속 날짜 카운트
- useLiveQuery 사용: 기록 추가/삭제 시 통계 자동 갱신

---

# Phase 12 체크리스트 — 캘린더 탭

## 신규 파일

- [x] `app/(tabs)/calendar.tsx` — 캘린더 탭 메인 화면
- [x] `hooks/useCalendarData.ts` — markedDates + dayItems 계산 훅
- [x] `components/calendar/AnniversaryCard.tsx` — 기념일 D-Day 카드

## 탭 등록

- [x] `app/(tabs)/_layout.tsx` — 캘린더 탭 추가 (아이콘: CalendarDays)

## 캘린더 뷰 (react-native-calendars 기반)

- [x] `Calendar` 컴포넌트 + `enableSwipeMonths` 적용
- [x] `CALENDAR_THEME` — calendar.tsx 내 상수로 정의 (transparent 배경)
- [x] 월 변경 시 `currentMonth` state 업데이트 → 훅 재계산
- [x] 선택 날짜 하이라이트 (`selected: true`)
- [x] multi-dot marking: 종류별 1개 dot (log/repeat/anniversary)

## markedDates 계산 (`useCalendarData`)

- [x] 로그 dot — `logs.logDate` 기준, key: `'log'`, color: `#4ECDC4`
- [x] 반복 로그 dot — `expandRepeatInMonth()` 재활용, key: `'repeat'`, color: `#f59e0b`
- [x] 기념일 dot — `personAnniversaries` + `persons.birthDate`, key: `'anniversary'`, color: `#f97316`
- [x] `isRepeat=true` 기념일: 올해 날짜로 정규화 (매년 반복)
- [x] `birthDate`: 항상 매년 반복으로 처리

## 하단 패널 (고정 절반 레이아웃)

- [x] 선택 날짜 섹션 헤더 (날짜 + 요일 표시)
- [x] 로그 아이템 — 기존 `LogCard` 재활용, 탭 시 `/logs/[id]` 이동
- [x] 반복 로그 아이템 — 기존 `LogCard` + `occurrenceDate` param, opacity 0.65 구분
- [x] 기념일 아이템 — `AnniversaryCard` (인물명 + 기념일 제목 + D-Day)
- [x] 빈 날짜 — "기록이 없습니다" 안내 + FAB으로 추가 유도

## FAB

- [x] 우측 하단 FAB — `/logs/new?date=YYYY-MM-DD` (선택 날짜 프리필)

## 설계 결정 메모

- `calendar-test.tsx` 삭제 안 함 — 설정에 그대로 유지 (라이브러리 탐색용)
- 하단 패널: BottomSheet 아님, 고정 절반 View (reanimated 의존성 증가 방지)
- 빈 날짜 탭 시: 패널만 열림 (실수 이동 방지), FAB으로 로그 추가
- 할일(todos): 날짜 컬럼 없어서 캘린더 연동 제외
- 기념일 D-Day: `dDayLabel()` 기존 유틸 재활용
- 반복 로그 스타일: `opacity-60` or 점선 처리로 가상 occurrence 구분
- 성능: 월 단위 쿼리 (`logDate >= monthStart AND logDate < nextMonthStart`)

---

# Phase 13 체크리스트 — 리스트 탭 고도화 v2

## 버그 수정

- [x] `list.tsx`: 커스텀 날짜 피커 미구현 버그 수정 — `MonthPickerModal` 컴포넌트 신규 생성 + start/end 연결

## UX 개선

- [x] `ListEventItem.tsx`: 좌측 그룹 색상 인디케이터 세로 바 추가 (`groupColor` prop)
- [x] `list.tsx`: 요약 영역 진행률 바 추가 (완료/전체 비율 시각화)
- [x] `list.tsx`: 섹션 헤더에 월별 완료율 표시 ("N개 중 M개 완료")
- [x] `list.tsx`: 빈 상태 — 필터 적용 시 "필터 초기화" CTA 버튼 추가

## 설계 결정 메모

- 그룹 색상: `allGroups`(이미 query 중) → `Map<id, color>` → `ListEventItem` prop 전달. 훅/쿼리 추가 없음.
- 진행률 바: 반복 항목 제외 (체크 개념 없음). 기존 `doneCount/totalCount` 재활용.
- 섹션 완료율: `sections` useMemo에서 각 섹션별 regularCount/doneCount 계산.
- 빈 상태 CTA: `filterBadge > 0`일 때만 "필터 초기화" 버튼 노출.

---

# Phase 14 체크리스트 — 인물 탭 고도화

## 버그 수정

- [x] `persons.tsx`: 기념일 모드 커스텀 날짜 피커 미구현 — `MonthPickerModal` 연결
- [x] `persons.tsx`: 기념일 모드 `AnniversaryItem`에 `date` prop 누락 → D-DAY 미표시 수정

## 기능 개선

- [x] `TabPreferencesProvider.tsx`: `PersonsPrefs.sortOrder`에 `"last-contact-asc"` 추가
- [x] `persons.tsx`: 마지막 연락 오래된순 정렬 추가 (`sortPersons`에 `lastLogDateMap` 파라미터)
- [x] `persons.tsx`: 연락 주기 초과 필터 (`overdueFilter` 로컬 state + 필터 시트 옵션)
- [x] `persons.tsx`: 태그 필터 동적 추출 (`allPersons`에서 useMemo로 집계)
- [x] `persons.tsx`: 인물 모드 요약 바 — "총 N명 · 표시 M명" 표시

## UI/UX 개선

- [x] `PersonCard.tsx`: 마지막 연락 `fromNow()` 표시 — `lastLogDate` 있으면 "3일 전", 없고 `contactInterval` 있으면 "기록 없음"
- [x] `PersonCard.tsx`: 핀 버튼 명시적 노출 — `onPinPress` prop 추가, 카드 우측 핀 아이콘 Pressable (onLongPress 제거)
- [x] `persons.tsx`: 빈 상태 CTA — 필터 후 결과 없을 때 "필터 초기화" 버튼 (인물/기념일 모드 모두)
- [x] `PersonCard.tsx`: 연락 주기 진행률 바 — `contactInterval` 설정 시 카드 하단 얇은 바 (초과 빨강, 임박 주황, 여유 teal)
- [x] `persons.tsx`: 전체 접기/펼치기 버튼 — 요약 바 우측
- [x] `persons.tsx`: 그룹 헤더 색상 도트 — 그룹명 앞 6px 컬러 dot
- [x] `persons.tsx` + `AnniversaryItem.tsx`: 기념일 그룹 색상 인디케이터

## 설계 결정 메모

- `last-contact-asc` 정렬: 기록 없는 인물은 맨 앞(연락 가장 오래됨)으로.
- `overdueFilter`: persist 불필요 → 로컬 state. 필터 바텀시트에서 토글.
- 태그 동적 추출: `JSON.parse(p.tags)` 집계 → 실제 DB 태그만 표시. 태그 없으면 섹션 숨김.
- 요약 바: 필터 적용 후 렌더 인물 수 vs 전체 인물 수 둘 다 표시.
- `onPinPress`: `onLongPress` 대체. PersonCard에서 별도 Pressable로 노출.
- 진행률 바: `daysSinceLastLog / contactInterval`. 100% 초과 시 클램프. 기록 없으면 100%.
- 기념일 인디케이터: `personGroupMap`(이미 있음) + `allGroups` → `groupColor` → `AnniversaryItem` prop.

---

# Phase 15 체크리스트 — 노트 탭 개선

## A. 코드만 (스키마 변경 없음)

- [x] **A2** `memo.tsx`: 할 일 탭에 완료 항목 일괄 삭제 추가 (메모 탭과 동일 패턴, 필터 시트 추가)
- [x] **A3** `memo.tsx`: 사분면 그리드 카운트 `완료/전체` 형태로 변경 (현재 미완료만 표시)
- [ ] **A1** `memo.tsx`: 메모 스와이프 액션 — reanimated v4 호환 문제로 제거. 버튼 UI 유지.
- [x] **A5** `memo.tsx`: 메모 생성일 표시 옵션 — 필터 시트에 토글 추가 + TabPreferences persist

## B. 스키마 소규모 확장

- [x] **B6** `db/schema.ts` + migration 0008: memos에 `pinnedAt` 컬럼 추가 → 핀고정 기능 (목록 상단 고정)
- [x] **B7** `db/schema.ts` + migration 0009: todos에 `dueDate` 컬럼 추가 → 기한 설정 + 그리드에 D-day 뱃지
- [x] **B8** `app/todos/[id].tsx` 신규: 할 일 상세 화면 + `note` 컬럼 추가 (부가 설명 필드)

## 설계 결정 메모

- 스와이프: `react-native-gesture-handler`의 `Swipeable` 사용 (이미 GestureHandlerRootView 설치됨)
- 핀고정 정렬: `pinnedAt DESC NULLS LAST, createdAt DESC` — 핀 먼저, 그 안에서 최신순
- dueDate: `text("due_date")` YYYY-MM-DD (birthDate 동일 패턴)
- 할 일 상세: todos에 `title`만 있어서 현재 탭 시 아무것도 없음 → 상세 화면 추가 필요

---

# Phase 16 체크리스트 — 버그 수정 및 코드 품질

## P0 — 크래시/데이터 누락 (높음)

- [x] **#1** `persons.tsx`: `JSON.parse(p.tags)` try/catch 래핑 — 손상 데이터 시 인물 탭 전체 크래시
- [x] **#2** `hooks/logs/use-event-filter.ts`: `or(isNull, eq('none'))` + repeatSources에 `ne('none')` 추가 — 리스트 탭 로그 누락 버그
- [x] **#3** `db/client.ts`: `ensureGroupsColumns()` 추가 — `sort_order` 누락 시 화이트스크린
- [x] **#4** `hooks/useCalendarData.ts`: 날짜 파싱 try/catch + parts.length 가드 — 빈값/잘못된 포맷 런타임 에러

## P1 — 코드 중복 (중간)

- [x] **#5** `FilterBottomSheet` + `FilterChipGroup` 컴포넌트 신규 — `memo.tsx` / `list.tsx` 교체 완료

## P2 — 성능 (중간)

- [ ] **#6** `persons.tsx`: `ScrollView` → SectionList 교체 — 접기/펼치기 + 핀고정 혼재로 리스크 큼, 스킵
- [x] **#7** `useCalendarData.ts`: `baseDots` / `markedDates` 분리 — 날짜 탭 시 dots 재계산 제거

## 설계 결정 메모

- #2 수정 기준: `useCalendarData.ts`의 `ne(logs.repeatType, 'none')` 패턴 동일 적용
- #3 groups 안전망: `sortOrder` 컬럼만 추가하면 됨 (seed에서 DEFAULT 처리)
- #5 공통화 범위: 완료 상태 / 정렬 / 유형 필터 칩 + 삭제 버튼 → `FilterBottomSheet` 컴포넌트
