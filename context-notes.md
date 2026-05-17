# Context Notes

## UUID → Integer Autoincrement 마이그레이션 (2026-05-17)

### 결정 배경
- 앱 구조: 로컬 SQLite 전용, 서버 없음
- 백업/복원: 덮어쓰기 방식 (delete all → insert all), 병합 없음
- UUID는 IDOR 방어 또는 다기기 병합에서만 의미 있음 → 이 앱에 해당 없음
- integer autoincrement가 더 단순하고 인덱스 성능도 유리

### DraftAnniversary.id 타입 결정
- 저장된 기념일: `a.id` (number)
- 새로 추가 중인 임시 기념일: `Math.random().toString()` (string, React key용)
- `id: string | number`로 유지 — 저장 전/후 구분하지 않고 단순하게 처리

### groupId 상태 타입
- 기존: `useState("")` — 빈 문자열로 초기화, useEffect에서 첫 그룹으로 세팅
- 변경: `useState<number | null>(null)` — null 초기화, 동일 패턴 유지
- `!groupId` guard는 null과 0 모두 잡음 (autoincrement PK는 1부터 시작)

### 마이그레이션 전략
- 기존 마이그레이션 11개 전부 삭제
- `drizzle-kit generate`로 단일 초기 마이그레이션 재생성
- 앱에서 "테이블 초기화 (DROP + 재생성)" 실행으로 적용
- 개발 단계라 데이터 손실 무관

### URL params와 number ID
- expo-router의 `useLocalSearchParams`는 항상 string 반환
- 쿼리에서 `eq(table.id, id)` 사용 시 `Number(id)` 변환 필수
- `router.push({ params: { id: person.id } })`는 number → string 자동 변환됨
