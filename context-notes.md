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

### drizzle-kit generate 이슈
- expo driver용 config 필요: driver: "expo" 명시
- 생성된 drizzle/ 폴더 전체 git commit 필수 (R4 리스크)

### QueryClient 설정
- mutations: { retry: 1 } — Drive/IAP 뮤테이션용
- 로컬 DB는 useLiveQuery만 사용, react-query 불필요
