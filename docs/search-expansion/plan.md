# 검색 기능 확장 계획

## 목표
앱 전체 검색 커버 + UX 개선. 현재 logs/persons만 검색하는 것을 todos, memos까지 확장하고, 필터 칩과 인물-기록 연결로 검색 품질 높임.

## 현재 상태
- `app/search.tsx` — logs(title/memo) + persons(name/memo) LIKE 검색
- SectionList로 [기록 N개] / [인물 N개] 섹션 분리
- debounce 300ms, 최소 2글자

## 구현 순서

### Phase 1: todos + memos 검색 추가
todos.title, memos.content 검색 추가. 두 테이블은 이미 schema에 존재.
- 신규 타입: `TodoItem`, `MemoItem`
- 신규 섹션: "메모 N개", "할 일 N개"
- 탭 라우트: memos/[id], todos는 (tabs)/memo로 이동 (quadrant 필터)

### Phase 2: 필터 칩
검색바 아래 가로 스크롤 칩 행.
- 필터: "전체" | "기록" | "인물" | "메모" | "할 일"
- 선택된 필터만 섹션 표시
- teal 색상으로 활성화

### Phase 3: 인물 → 관련 기록 연결
logPersons JOIN으로 인물 카드에 관련 기록 개수 표시.
- PersonCard 아래 "관련 기록 N개 →" 링크
- 탭 시 persons/[id] 이동 (기록 목록 포함)

## 영향 파일
- `app/search.tsx` — 주 수정 대상
- `components/search/SearchMemoItem.tsx` — 신규
- `components/search/SearchTodoItem.tsx` — 신규
