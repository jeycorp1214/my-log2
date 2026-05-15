# Context Notes — Phase 1

## 2026-05-07

### DB 설정

- expo-sqlite v16 (package.json 기준) — drizzle-orm/expo-sqlite 통합 사용
- drizzle.config.ts: dialect=sqlite, driver=expo, out=./drizzle
- db/client.ts: openDatabaseSync + enableChangeListener:true (useLiveQuery 지원)
- runMigrations() + seedDefaultGroups() → app/\_layout.tsx에서 useEffect로 호출

### 탭 구조 결정

- 탭 3개: 캘린더(index), 인물(persons), 설정(settings)
- explore.tsx 제거 → persons.tsx, settings.tsx로 교체
- lucide-react-native 아이콘 사용 (이미 설치됨, IconSymbol은 iOS SF Symbols 전용)

### drizzle-kit generate — 해결됨 (2026-05-15)

- 원인: `db/schema.ts`에서 `expo-crypto` import → esbuild가 react-native 코드 파싱 불가
- **해결: Metro 플랫폼 분기 파일 사용**
  - `db/generate-id.ts` → Node.js (drizzle-kit): `node:crypto`
  - `db/generate-id.native.ts` → React Native (Hermes): `expo-crypto`
  - `db/schema.ts`에서 `import { randomUUID } from './generate-id'`
- `npx drizzle-kit generate` 정상 작동. 스키마 변경 후 실행하면 됨.
- migrations.js는 drizzle-kit이 자동 업데이트하지 않으므로 generate 후 수동으로 import/export 추가 필요

### QueryClient 설정

- mutations: { retry: 1 } — Drive/IAP 뮤테이션용
- 로컬 DB는 useLiveQuery만 사용, react-query 불필요

---

## 2026-05-08 — 실기기 테스트 완료 / Phase 2 진입

### RN-IAP 제거

- react-native-iap 이 단계에서 개발/테스트 방해 → 의존성 제거
- 추후 결제 기능 필요 시 재도입 예정

### 실기기 테스트에서 발견된 버그

1. **월 전환 시 selectedDate 불일치**: currentMonth 바뀌어도 selectedDate 유지됨
   - 수정: nextMonth/prevMonth 호출 시 setSelectedDate(null) → 월간 전체 뷰
2. **반복 기능 미작동**: DB에 repeatType 저장은 되나, 캘린더 렌더링 시 occurrence 생성 로직 없음
   - 원인: `between(logs.logDate, ...)` 쿼리가 원본 날짜만 히트

### 반복 기능 아키텍처 — Virtual Occurrences 채택

- DB에 원본 1개 저장, 렌더 시 반복 날짜를 메모리에서 계산
- `expandRepeatInMonth(log, monthStart, monthEnd)` — utils/repeat.ts
- 원본 날짜 dedup: `.filter(date => !isSameDay(date, new Date(log.logDate)))`
- repeatUntil null = 영구 반복, monthEnd까지 계산

### 스키마 변경 — groupId nullable

- logs.groupId, persons.groupId: `.notNull()` 제거 (nullable)
- 이유: "미설정" 상태가 자연스러운 UX
- migration 0001 (logs), 0002 (persons) 수동 작성

### seed.ts 변경

- "미설정" 그룹 추가: sortOrder:0, color:"#ADB5BD", emoji:"✖️", isDefault:true
- `REPEAT_OPTIONS` export 추가: [없음(none), 매일, 매주, 매월, 매년]
- logs/new.tsx, logs/[id].tsx에서 import

### 그룹 pre-select 패턴

- logs/new.tsx: `useEffect(() => { if (!groupId && allGroups.length > 0) setGroupId(allGroups[0].id); }, [allGroups, groupId]);`
- persons/new.tsx: 동일 패턴 적용
- "그룹" 필수 검증 (Alert) 제거 — 첫 번째 그룹이 항상 선택됨

### 설정 — 전체 데이터 초기화

- logPersons → logs → persons → groups 순서로 삭제 (외래키 제약)
- seedDefaultGroups() 재호출
- router.replace("/(tabs)") — useLiveQuery 갱신 대기 불필요, 탭 화면 재마운트로 즉시 반영

### NativeWind 전환 (2026-05-08)

- 설치 상태: NativeWind v4 + tailwindcss v3 (babel.config.js에 "nativewind/babel" 설정됨)
- Gluestack UI v3 + GluestackUIProvider(mode:"dark") 이미 \_layout.tsx에 적용
- 전환 범위: 모든 app/ 화면 + components/ (StyleSheet.create 완전 제거)
- app-specific 색상을 tailwind.config.js에 추가: app.bg, surface, teal, muted, label, dim, danger, danger-bg
- 유지된 inline style: elevation(FAB Android), textAlignVertical:'top'(textarea), dynamic backgroundColor
- CalendarGrid: selectedDate 타입 Date → Date | null 수정 (null 시 isSelected=false)

---

## 2026-05-09 — Phase 7 UI 개선

### 리스트 탭 기간 프리셋 재설계

- 기존: 1개월/3개월(기본)/6개월/1년/전체 (상대적 기간)
- 변경: 올해(기본)/작년/최근 1년/전체/직접 선택 (절대적 연도 기준)
- 이유: "이번 달에 뭘 했지?" 보다 "올해 기록 전체 보기" 니즈가 더 자연스러움
- "올해" = dayjs().startOf('year') ~ endOf('year')
- "직접 선택" = customStart/customEnd, MonthPickerModal 두 개로 시작/종료 월 선택

### 리스트 탭 필터 시스템

- 기존: "미완료만" 단순 토글
- 변경: 바텀 시트 (RN Modal animationType:"slide") — 3가지 필터 축
  - 완료 상태: all/done/undone (기존 토글 통합)
  - 기록 유형: all/regular/repeat (isRepeat 필드 기반)
  - 정렬: oldest/newest (Array reverse)
- filterBadge: 기본값 외 활성 필터 수 → 헤더 아이콘 위 뱃지
- 바텀 시트 backdrop: 중첩 Pressable 패턴 (MonthPicker와 동일)

### 캘린더 확장 뷰

- CalendarGrid에 mode prop 추가: 'compact'(기존) | 'board'(신규)
- 확장 모드 셀 구조: 날짜 텍스트(top-left) + 이벤트 행 최대 2개 + overflow 뱃지
- 확장 셀 배경: gap:1 + bg-[#1e1e1e] 외부 컨테이너 → 그리드 선 효과 (border 대신)
- 색상 구분: 일반 로그(bg:#0e2419, text:#4ecdc4) / 반복 로그(bg:#28200c, text:#c9922a)
- 확장 모드에서 셀 선택 시: backgroundColor:'#142218' (약한 teal tint)
- index.tsx 확장 모드: GestureDetector 스와이프 비활성, 하단 리스트 숨김, ScrollView로 전체 그리드 스크롤
- boardItems 출처: monthLogs + repeatOccurrences (useMemo로 memoize)

### UI 스택 방침 (확정)

- **Gluestack UI v3 메인**: VStack, HStack, Card, Box 등 레이아웃 컴포넌트는 Gluestack 우선
- **NativeWind + cn() 보조**: className prop에 Tailwind 클래스, 조건부 className은 cn()
- **plain View/Text 사용 기준**: Gluestack 컴포넌트로 표현이 부자연스러운 경우에만
- plain View로 Gluestack 컴포넌트를 교체하는 리팩터링은 하지 않는다
- inline style 유지: dynamic backgroundColor, elevation (tailwind 클래스로 표현 불가)

### cn 유틸 적용 방침

- utils/utils.ts: clsx + tailwind-merge 기반 cn() 함수
- 적용 대상: 조건부 className이 있는 컴포넌트 (template literal `${}` → cn())
- CalendarGrid.tsx, list.tsx 적용 완료

### 아키텍처 개선 (2026-05-09)

- providers/ErrorBoundary.tsx: 클래스 기반 에러 바운더리
- providers/DatabaseProvider.tsx: DB 초기화 비동기 처리 분리
- hooks/logs/use-calendar-logs.ts: CalendarScreen useLiveQuery 추출
- hooks/persons/use-persons-with-groups.ts: PersonsScreen useLiveQuery + 그룹핑 추출

---

## 2026-05-10 ~ 2026-05-14 — 노트 탭 재편 + 홈 탭 변경

### 노트 탭 아키텍처

- memo.tsx: 메모/할 일 서브탭 단일 파일. 상태가 많지만 분리하면 오히려 prop 전달이 복잡해짐 → 단일 파일 유지.
- 아이젠하워 매트릭스: 2×2 그리드 셀을 Pressable로 사분면 선택, 하단 FlatList에 해당 사분면 항목 표시.
- todos 정렬: 미완료 먼저(.sort), DB 레벨에서 createdAt asc 후 JS에서 checkedAt 기준 재정렬.
- QuickInputBar: content 있으면 DB insert + 초기화, 없으면 /memos/new 이동 (긴 메모 작성 용도).
- TabPreferencesProvider: 메모 completionFilter + sortOrder persist. AsyncStorage 기반.

### 홈 탭 결정

- 캘린더 제거 이유: 캘린더는 기록이 쌓인 후에 가치가 있음. 초기 사용 단계에서 빈 달력보다 최근 기록 피드가 더 직관적.
- 검색 아이콘(TabsHeader searchOnPress=true) 유지 → /search 이동.
- 캘린더 뷰는 삭제하지 않고 settings/calendar-test.tsx에 테스트 화면으로 유지.

### 타임라인 + 히트맵

- 인물 상세 타임라인: persons/[id].tsx에 바텀 시트 추가 (RN Modal).
- settings/heatmap.tsx: 연간 기록 히트맵, 주 단위 그리드.

---

## 2026-05-15 — drizzle-kit generate 해결 + PIN 비밀번호 기능

### drizzle-kit generate 영구 해결

- 문제: db/schema.ts에서 expo-crypto import → drizzle-kit(esbuild) RN 코드 파싱 불가
- 해결: Metro 플랫폼 분기 파일
  - db/generate-id.ts: `import { randomUUID } from 'node:crypto'` (drizzle-kit용)
  - db/generate-id.native.ts: `import * as Crypto from 'expo-crypto'` (React Native 앱용)
  - Metro가 .native.ts 우선 resolve → 앱은 expo-crypto, drizzle-kit은 node:crypto
- 이후 스키마 변경 시 `npx drizzle-kit generate` 실행 가능. generate 후 drizzle/migrations.js에 수동으로 import 추가 필요.

### PIN 비밀번호 아키텍처 결정

- 6자리 숫자 PIN (4자리보다 보안↑, 생체인증보다 구현 단순).
- 저장소: expo-secure-store (iOS Keychain / Android Keystore). 평문 저장 (PIN은 비밀번호 관리자 용도 아님, 앱 잠금 목적).
- PinLockProvider: 전역 isLocked/isPinEnabled 상태. 앱 시작 시 getStoredPin() → PIN 있으면 isLocked=true.
- LockScreen: PinLockProvider.isLocked=true일 때 앱 전체를 덮는 오버레이. _layout.tsx에서 렌더.
- PinPad: 재사용 컴포넌트. password.tsx(설정)와 LockScreen(잠금 해제) 모두 사용.
- isError: flashError() → 700ms 후 에러 해제 + pin 초기화. 재입력 유도.
- 단계 흐름: enable(새PIN→확인), disable(현재PIN 검증), change(현재→새→확인).

### 샘플 데이터 (seedSampleData)

- 개발/데모용. debugMode=true 시에만 설정 탭에 노출.
- 인물 5명(각 그룹), 기록 10개(날짜 분산), 할 일 4개(각 사분면), 메모 2개.

---

## 2026-05-16 — Phase 11 통계 기능 설계

### 통계 항목 선정 근거

- **인물 랭킹**: logPersons COUNT. "요즘 자주 만나는 사람" 파악 목적. 기간 필터(이번 달/올해/전체)로 맥락 분리.
- **마지막 연결**: MAX(logDate) per person, 오래된 순 정렬. 관계 유지 점검 용도. fromNow() 표시로 "3개월째 연락 없음" 직관적 전달.
- **카테고리 비율**: logs GROUP BY groupId + 그룹 색상 프로그레스 바. 기간 비교로 관심사 변화 추적 가능.
- **기록 스트릭**: JS에서 날짜 배열 정렬 후 연속 카운트. 히트맵(settings/heatmap.tsx)과 보완 관계.
- **완료율**: logs checkedAt IS NOT NULL / total. 체크 습관 지표.

### 쿼리 전략

```typescript
// 인물 랭킹 — leftJoin으로 기록 없는 인물도 포함 (count 0)
db.select({ personId: persons.id, name: persons.name, count: count(logPersons.id), lastDate: max(logs.logDate) })
  .from(persons)
  .leftJoin(logPersons, eq(persons.id, logPersons.personId))
  .leftJoin(logs, and(eq(logPersons.logId, logs.id), gte(logs.logDate, periodStart)))
  .groupBy(persons.id)
  .orderBy(desc(count(logPersons.id)))

// 카테고리 비율 — leftJoin으로 기록 없는 그룹도 포함
db.select({ groupId: groups.id, name: groups.name, color: groups.color, count: count(logs.id) })
  .from(groups)
  .leftJoin(logs, and(eq(groups.id, logs.groupId), gte(logs.logDate, periodStart)))
  .groupBy(groups.id)
  .orderBy(desc(count(logs.id)))
```

### UI 방침

- **차트 라이브러리 미사용**: react-native-gifted-charts 등 추가 의존성 없이 View + 프로그레스 바로 구현. 개인앱 특성상 과도한 시각화 불필요.
- **기간 칩 공유**: 인물 랭킹 / 카테고리 비율 / 완료율 섹션이 동일한 기간 칩 상태 공유 (페이지 단일 `period` state).
- **스키마 변경 없음**: 기존 7개 테이블만으로 모든 통계 도출 가능. migration 불필요.

### 향후 확장 고려 (현재 미구현)

- 기간별 비교 (이번 달 vs 지난 달 delta): 현재 단일 기간만 표시, 추후 delta 뱃지 추가 가능.
- 함께 등장 빈도 (logPersons self JOIN): A-B 조합 TOP 5. 데이터 충분히 쌓인 후 의미 있음.
- MBTI 분포: persons GROUP BY mbti. 재미 요소, 인물 10명 이상일 때 유의미.

---

## 2026-05-16 — Phase 12: 캘린더 탭

### 배경

홈 탭이 Phase 9에서 최근 기록 목록으로 변경되면서 캘린더 뷰가 앱에서 사라짐.
날짜별 기록 조회 + 기념일 확인 UX 복원을 위해 별도 탭으로 신설.

### 라이브러리

`react-native-calendars` 이미 설치됨 (calendar-test.tsx에서 사용 중).
직접 구현 불필요. `Calendar` 컴포넌트 + `markingType="multi-dot"` 채택.

### 레이아웃 결정 — 고정 5:5 분할

- 옵션 A (고정 절반): 상단 Calendar + 하단 FlatList, 비율 고정
- 옵션 B (BottomSheet): reanimated 기반 드래그 확장
- 옵션 C (ScrollView): 캘린더가 스크롤 아웃됨
- **채택: A** — reanimated 의존성 증가 없이 단순 구현. 캘린더 항상 노출.

### dot 마킹 전략 — 종류별 1개

날짜 셀이 작아서 숫자 뱃지 가독성 나쁨. 카테고리별 색상 dot 1개씩.

| key | color | 의미 |
|-----|-------|------|
| `log` | `#4ECDC4` | 일반 로그 |
| `repeat` | `#f59e0b` | 반복 로그 (가상 occurrence) |
| `anniversary` | `#f97316` | 기념일 / 생년월일 |

### 기념일 날짜 정규화

`personAnniversaries.isRepeat = true` → `dayjs(date).year(currentYear)` 로 올해 날짜 변환.
`persons.birthDate` → 항상 올해 날짜로 변환 (생일은 무조건 매년).
기준: 이미 지난 날짜면 내년으로 이월 (기존 `dDayLabel()` 로직과 동일).

### 반복 로그 재활용

`expandRepeatInMonth()` (utils/repeat.ts) 그대로 재활용.
가상 occurrence는 실제 로그와 시각적으로 구분 — `opacity-60` 적용 예정.

### 할일 제외

`todos` 테이블에 날짜 컬럼 없음 (`id, title, quadrant, checkedAt`).
스키마 변경 없이 캘린더 탭 범위에서 제외. 향후 `dueDate` 컬럼 추가 시 연동 가능.

### FAB logDate 프리필

날짜 선택 후 FAB 탭 → `/logs/new?logDate=YYYY-MM-DD` 로 이동.
`logs/new.tsx`에서 `searchParams.logDate` 수신 → `logDate` 초기값 세팅 필요 (기존 없음, 추가).

### calendar-test.tsx 보존

삭제하지 않음. 설정 > 개발자 옵션에 그대로 유지. 라이브러리 탐색/디버그 용도.
