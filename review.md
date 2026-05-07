# mylog — 리뷰 v0.2

2. 아키텍처 및 구현 보완 제안
   2.1 데이터 모델: 인덱스 최적화
   현재 스키마에서 logs 테이블은 시간이 지날수록 데이터가 쌓이게 됩니다. 쿼리 성능을 위해 인덱스 추가를 권장합니다.

// db/schema.ts 수정 제안
export const logs = sqliteTable("logs", {
// ... 기존 컬럼
}, (table) => ({
logDateIdx: index("log_date_idx").on(table.logDate), // 캘린더 조회 최적화
groupIdIdx: index("group_id_idx").on(table.groupId), // 그룹별 필터링 최적화
}));

2.2 Google Drive 백업의 '충돌' 대응
Last-Write-Wins 전략을 택하셨는데, 유저가 '동기화' 버튼을 눌렀을 때 비교 로직이 중요합니다.

문제: 유저가 기기 A에서 기록 후 기기 B를 켰을 때, 기기 B의 updated_at이 더 최신이면 기기 A의 데이터를 덮어쓸 위험이 있습니다.

보안: 백업 JSON에 device_name을 포함하세요. "다른 기기(Galaxy S24)에서 온 데이터가 더 최신입니다. 교체할까요?" 식의 구체적인 메시지는 유저의 데이터 주권 신뢰도를 높여줍니다.

3. 수익 모델 및 리텐션 (현실적인 조언)
   영수증 위조 리스크 (R2): 서버 검증이 없으므로, 프리미엄 기능을 '클라이언트 사이드 플래그'로 관리하게 됩니다. 유저가 앱 삭제 후 재설치했을 때 restore 로직이 완벽해야 클레임이 없습니다. AsyncStorage 외에도 expo-secure-store에 구매 여부를 중복 저장하는 것을 고려해보세요. (보안성 강화)

위젯(Widget)의 중요성: 기획서 7번에 언급된 위젯은 Android 유저들에게 아주 강력한 리텐션 도구입니다. expo-widgets 등을 활용해 '오늘의 한마디'나 '오늘 만날 사람'을 홈 화면에 띄워주는 기능은 프리미엄 결제 유도용(Paywall)으로 가장 매력적입니다.

4. 로드맵 단계별 팁
   Phase 0: expo-dev-client 빌드 시, Android는 eas build --profile development --platform android 명령어로 빌드된 APK를 실제 기기에 설치해서 테스트하는 단계부터 시작하세요. 에뮬레이터에서는 IAP와 Google Drive 로그인이 제대로 동작하지 않는 경우가 많습니다.

Phase 1: logPersons 테이블(N:M 관계) 처리를 위해 Drizzle의 relational query 기능을 적극 활용하시면 leftJoin 지옥에서 벗어날 수 있습니다.

---

# mylog — 리뷰 v0.3

레이어,라이브러리,용도 및 선택 이유
날짜 처리,dayjs,"나이 계산, 관계 온도계(fromNow), 기념일(On This Day) 계산 최적화"
상태 관리,@tanstack/react-query,"비동기 전용: Drive 백업, IAP 통신 관리 (로컬 DB는 Drizzle 내장 훅 사용)"
보안 저장,expo-secure-store,프리미엄 플래그 이중 저장 (AsyncStorage 초기화 대비 리스크 완화)

```
4. 로드맵 및 리스크 관리
   Phase 1: Relational Query 적용 팁
   Drizzle의 관계형 쿼리를 쓰면 '로그-인물' 연결을 훨씬 간단하게 가져올 수 있습니다.

// 예: 특정 로그와 연결된 인물들 함께 조회
const results = await db.query.logs.findMany({
with: {
logPersons: {
with: { person: true }
}
}
});
```

R6: 결제 복원(Restore) QA 필수
리스크: 유저가 AsyncStorage를 지웠을 때 프리미엄 기능이 잠기는 현상.

보완: SecureStore 이중 저장으로 1차 방어하고, 설정 페이지에 '구매 복원(Restore)' 버튼을 명시적으로 배치하여 react-native-iap의 getAvailablePurchases()를 강제 실행할 수 있게 함.

최종 검토 의견
실기기 테스트: react-native-iap와 Google Drive API는 에뮬레이터에서 정상 동작하지 않습니다. Phase 0에서 반드시 Android 실기기(개발자 모드)를 준비하세요.

보안: SecureStore 추가는 매우 훌륭한 선택입니다. 유저 데이터 주권을 강조하는 앱인 만큼, 결제 정보 유실은 치명적일 수 있는데 이를 잘 보완하셨습니다.

성능: logs 테이블의 logDate 인덱스는 데이터가 1,000건만 넘어가도 캘린더 렌더링 속도에서 큰 차이를 만듭니다.
