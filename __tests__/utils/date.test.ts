// parseBirthInput / dDayLabel 순수 함수 단위 테스트
import { parseBirthInput, dDayLabel } from "@/utils/date";
import dayjs from "dayjs";

describe("parseBirthInput", () => {
  test("2자리: 나이 25 → 올해 - 25 + 1년", () => {
    const result = parseBirthInput("25");
    expect(result).not.toBeNull();
    expect(result!.getFullYear()).toBe(dayjs().year() - 25 + 1);
  });

  test("2자리: 0 → null (범위 밖)", () => {
    expect(parseBirthInput("00")).toBeNull();
  });

  test("4자리: 연도 1990 → 1990-01-01", () => {
    const result = parseBirthInput("1990");
    expect(result).not.toBeNull();
    expect(result!.getFullYear()).toBe(1990);
  });

  test("4자리: 미래 연도 → null", () => {
    expect(parseBirthInput(String(dayjs().year() + 1))).toBeNull();
  });

  test("6자리: 900315 → 1990-03-15", () => {
    const result = parseBirthInput("900315");
    expect(result).not.toBeNull();
    expect(dayjs(result).format("YYYY-MM-DD")).toBe("1990-03-15");
  });

  test("6자리: 200229 → 2020-02-29 (윤년)", () => {
    const result = parseBirthInput("200229");
    expect(result).not.toBeNull();
    expect(dayjs(result).format("YYYY-MM-DD")).toBe("2020-02-29");
  });

  test("6자리: 190229 → null (2019년 비윤년)", () => {
    expect(parseBirthInput("190229")).toBeNull();
  });

  test("8자리: 19901225 → 1990-12-25", () => {
    const result = parseBirthInput("19901225");
    expect(result).not.toBeNull();
    expect(dayjs(result).format("YYYY-MM-DD")).toBe("1990-12-25");
  });

  test("8자리: 19901332 → null (무효 날짜)", () => {
    expect(parseBirthInput("19901332")).toBeNull();
  });

  test("비숫자 포함: '1990-12-25' → 8자리 파싱", () => {
    const result = parseBirthInput("1990-12-25");
    expect(result).not.toBeNull();
    expect(dayjs(result).format("YYYY-MM-DD")).toBe("1990-12-25");
  });

  test("빈 문자열 → null", () => {
    expect(parseBirthInput("")).toBeNull();
  });
});

describe("dDayLabel", () => {
  test("isRepeat=false: 오늘 날짜 → 'D-Day'", () => {
    const today = dayjs().format("YYYY-MM-DD");
    expect(dDayLabel(today, false)).toBe("D-Day");
  });

  test("isRepeat=false: 5일 후 → 'D-5'", () => {
    const future = dayjs().add(5, "day").format("YYYY-MM-DD");
    expect(dDayLabel(future, false)).toBe("D-5");
  });

  test("isRepeat=false: 3일 전 → '3일 전'", () => {
    const past = dayjs().subtract(3, "day").format("YYYY-MM-DD");
    expect(dDayLabel(past, false)).toBe("3일 전");
  });

  test("isRepeat=true: 올해 지난 날짜 → 내년 기준 D-day", () => {
    // 항상 양수 D-day (내년 기준)
    const pastThisYear = dayjs().subtract(1, "month").format("YYYY-MM-DD");
    const label = dDayLabel(pastThisYear, true);
    expect(label.startsWith("D-")).toBe(true);
    const n = parseInt(label.slice(2));
    expect(n).toBeGreaterThan(0);
  });

  test("isRepeat=true: 오늘 → 'D-Day'", () => {
    const today = dayjs().format("YYYY-MM-DD");
    expect(dDayLabel(today, true)).toBe("D-Day");
  });
});
