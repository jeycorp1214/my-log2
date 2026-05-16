// expandRepeatInMonth 순수 함수 단위 테스트
import { expandRepeatInMonth } from "@/utils/repeat";
import type { InferSelectModel } from "drizzle-orm";
import type { logs } from "@/db/schema";

type Log = InferSelectModel<typeof logs>;

function makeLog(overrides: Partial<Log> = {}): Log {
  return {
    id: "test-id",
    title: "테스트",
    logDate: new Date("2020-01-15"),
    memo: null,
    repeatType: "daily",
    repeatInterval: 1,
    repeatUntil: null,
    groupId: "g1",
    checkedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

const JUN_START = new Date("2026-06-01T00:00:00.000Z");
const JUN_END = new Date("2026-06-30T23:59:59.999Z");

describe("expandRepeatInMonth", () => {
  test("repeatType none → 빈 배열", () => {
    const log = makeLog({ repeatType: "none" });
    expect(expandRepeatInMonth(log, JUN_START, JUN_END)).toEqual([]);
  });

  test("repeatType null → 빈 배열", () => {
    const log = makeLog({ repeatType: null });
    expect(expandRepeatInMonth(log, JUN_START, JUN_END)).toEqual([]);
  });

  test("origin이 monthEnd 이후 → 빈 배열", () => {
    const log = makeLog({ logDate: new Date("2026-07-01"), repeatType: "daily" });
    expect(expandRepeatInMonth(log, JUN_START, JUN_END)).toHaveLength(0);
  });

  test("repeatUntil이 monthStart 이전 → 빈 배열", () => {
    const log = makeLog({
      logDate: new Date("2020-01-01"),
      repeatType: "daily",
      repeatUntil: new Date("2026-05-31"),
    });
    expect(expandRepeatInMonth(log, JUN_START, JUN_END)).toHaveLength(0);
  });

  test("daily step=1: 6월 30일 모두 반환", () => {
    const log = makeLog({ logDate: new Date("2020-01-15"), repeatType: "daily", repeatInterval: 1 });
    const result = expandRepeatInMonth(log, JUN_START, JUN_END);
    expect(result).toHaveLength(30);
  });

  test("weekly step=1: 원본 요일 기준 약 4-5개", () => {
    // 2020-01-15 = 수요일 → 6월 수요일: 3,10,17,24
    const log = makeLog({ logDate: new Date("2020-01-15"), repeatType: "weekly", repeatInterval: 1 });
    const result = expandRepeatInMonth(log, JUN_START, JUN_END);
    expect(result.length).toBeGreaterThanOrEqual(4);
    expect(result.length).toBeLessThanOrEqual(5);
    // 모두 수요일인지 확인 (0=일 ... 3=수)
    result.forEach((d) => expect(d.getUTCDay()).toBe(3));
  });

  test("monthly step=1: 매월 15일 → 6/15 1개", () => {
    const log = makeLog({ logDate: new Date("2020-01-15"), repeatType: "monthly", repeatInterval: 1 });
    const result = expandRepeatInMonth(log, JUN_START, JUN_END);
    expect(result).toHaveLength(1);
    expect(result[0].getUTCDate()).toBe(15);
  });

  test("yearly step=1: 매년 1/15 → 6월에 없음", () => {
    const log = makeLog({ logDate: new Date("2020-01-15"), repeatType: "yearly", repeatInterval: 1 });
    expect(expandRepeatInMonth(log, JUN_START, JUN_END)).toHaveLength(0);
  });

  test("yearly step=1: 매년 6/15 → 6/15 1개", () => {
    const log = makeLog({ logDate: new Date("2020-06-15"), repeatType: "yearly", repeatInterval: 1 });
    const result = expandRepeatInMonth(log, JUN_START, JUN_END);
    expect(result).toHaveLength(1);
    expect(result[0].getUTCDate()).toBe(15);
  });

  test("repeatUntil 경계: until=6/15 → 15일까지만", () => {
    const log = makeLog({
      logDate: new Date("2020-01-01"),
      repeatType: "daily",
      repeatInterval: 1,
      repeatUntil: new Date("2026-06-15T23:59:59.999Z"),
    });
    const result = expandRepeatInMonth(log, JUN_START, JUN_END);
    expect(result).toHaveLength(15);
  });

  test("origin이 월 중간: 6/10 daily → 10~30일 21개", () => {
    const log = makeLog({ logDate: new Date("2026-06-10"), repeatType: "daily" });
    const result = expandRepeatInMonth(log, JUN_START, JUN_END);
    expect(result).toHaveLength(21);
  });

  test("daily step=7 → weekly와 동일 결과", () => {
    const origin = new Date("2020-01-15");
    const logDaily7 = makeLog({ logDate: origin, repeatType: "daily", repeatInterval: 7 });
    const logWeekly1 = makeLog({ logDate: origin, repeatType: "weekly", repeatInterval: 1 });
    const r1 = expandRepeatInMonth(logDaily7, JUN_START, JUN_END);
    const r2 = expandRepeatInMonth(logWeekly1, JUN_START, JUN_END);
    expect(r1.map((d) => d.toISOString())).toEqual(r2.map((d) => d.toISOString()));
  });
});
