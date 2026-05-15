# Context Notes

## 결정 사항

### todos 탭 라우팅
todos에는 개별 상세 페이지(/todos/[id])가 없음. 탭 시 `(tabs)/memo`로 이동하되 quadrant 파라미터 없이 이동. 할 일 탭 자체가 목적지.

### memos 라우팅
memos/[id] 경로 존재 확인됨. SearchMemoItem 탭 시 해당 경로로 이동.

### logPersons COUNT 방식
Phase 3에서 persons 쿼리 수정 시 drizzle의 sql\`count()\` 집계로 JOIN COUNT. 결과에 logCount 필드 추가.

### 필터 칩 기본값
"전체"로 시작. 선택 필터가 "전체"면 기존 로직과 동일하게 sections 전부 표시.

### 섹션 순서
기록 → 인물 → 메모 → 할 일 순서. 앱 메인 사용 흐름 반영.
