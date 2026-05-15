# 검색 확장 체크리스트

## Phase 1: todos + memos 검색 추가
- [x] SearchMemoItem 컴포넌트 생성
- [x] SearchTodoItem 컴포넌트 생성
- [x] search.tsx에 memos 쿼리 추가
- [x] search.tsx에 todos 쿼리 추가
- [x] 신규 타입 정의 (MemoItem, TodoItem)
- [x] sections에 메모/할 일 섹션 추가
- [x] 각 아이템 탭 시 라우팅 처리
- [x] placeholder 텍스트 업데이트

## Phase 2: 필터 칩
- [x] FilterType 타입 정의
- [x] 필터 상태 추가 (useState)
- [x] 필터 칩 UI 컴포넌트 (ScrollView 수평)
- [x] sections useMemo에 필터 적용

## Phase 3: 인물 → 관련 기록 연결
- [x] 인물 검색 쿼리에 logPersons COUNT JOIN 추가
- [x] PersonCard에 관련 기록 수 prop 추가
- [x] 관련 기록 수 표시 UI

## 완료
- [x] 빌드 확인 (tsc --noEmit 통과)
