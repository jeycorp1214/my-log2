# Context Notes — Phase 1

## 2026-05-07

### DB 설정
- expo-sqlite v16 (package.json 기준) — drizzle-orm/expo-sqlite 통합 사용
- drizzle.config.ts: dialect=sqlite, driver=expo, out=./drizzle
- db/client.ts: openDatabaseSync + enableChangeListener:true (useLiveQuery 지원)
- runMigrations() + seedDefaultGroups() → app/_layout.tsx에서 useEffect로 호출

### 탭 구조 결정
- 탭 3개: 캘린더(index), 인물(persons), 설정(settings)
- explore.tsx 제거 → persons.tsx, settings.tsx로 교체
- lucide-react-native 아이콘 사용 (이미 설치됨, IconSymbol은 iOS SF Symbols 전용)

### drizzle-kit generate 이슈 — 영구 차단
- `ERROR: Unexpected "typeof"` — esbuild가 expo-crypto import를 파싱 불가 (react-native 환경 전용 코드)
- **결정: 모든 마이그레이션은 수동으로 SQL 작성 + journal 업데이트 + migrations.js 업데이트**
- 패턴: SQLite ALTER TABLE 미지원 → CREATE __new → INSERT SELECT → DROP → RENAME
- 마이그레이션 파일: drizzle/0000_*.sql, 0001_*.sql, 0002_*.sql
- migrations.js와 meta/_journal.json 항상 동기화 유지

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
- Gluestack UI v3 + GluestackUIProvider(mode:"dark") 이미 _layout.tsx에 적용
- 전환 범위: 모든 app/ 화면 + components/ (StyleSheet.create 완전 제거)
- app-specific 색상을 tailwind.config.js에 추가: app.bg, surface, teal, muted, label, dim, danger, danger-bg
- 유지된 inline style: elevation(FAB Android), textAlignVertical:'top'(textarea), dynamic backgroundColor
- CalendarGrid: selectedDate 타입 Date → Date | null 수정 (null 시 isSelected=false)
