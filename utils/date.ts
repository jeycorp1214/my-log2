// 앱 전반 날짜 포맷·나이 계산·경과 시간 유틸
import dayjs from "dayjs";
import "dayjs/locale/ko";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);
dayjs.locale("ko");

export function calcAge(birthDate: string): number {
  return dayjs().diff(dayjs(birthDate), "year");
}

export function fromNow(date: Date): string {
  return dayjs(date).fromNow();
}

export function formatLogDate(date: Date): string {
  return dayjs(date).format("YYYY년 M월 D일");
}

export function formatMonthYear(date: Date): string {
  return dayjs(date).format("YYYY년 M월");
}

export function isSameMonthDay(date: Date): boolean {
  const today = dayjs();
  return (
    dayjs(date).month() === today.month() && dayjs(date).date() === today.date()
  );
}

export function isSameDay(a: Date, b: Date): boolean {
  return dayjs(a).isSame(dayjs(b), "day");
}

export function startOfMonth(date: Date): Date {
  return dayjs(date).startOf("month").toDate();
}

export function endOfMonth(date: Date): Date {
  return dayjs(date).endOf("month").toDate();
}

export function addMonths(date: Date, n: number): Date {
  return dayjs(date).add(n, "month").toDate();
}

export function toDateKey(date: Date): string {
  return dayjs(date).format("YYYY-MM-DD");
}

// 숫자 문자열에서 생년월일 파싱
// 2자리: 한국 나이 → 연도 역산 / 4자리: 연도만 / 6자리: YYMMDD / 8자리: YYYYMMDD
export function parseBirthInput(input: string): Date | null {
  const digits = input.replace(/\D/g, "");

  if (digits.length === 2) {
    const age = parseInt(digits, 10);
    if (age < 1 || age > 120) return null;
    const year = dayjs().year() - age + 1;
    return dayjs(`${year}-01-01`).toDate();
  }

  if (digits.length === 4) {
    const year = parseInt(digits, 10);
    if (year < 1900 || year > dayjs().year()) return null;
    return dayjs(`${year}-01-01`).toDate();
  }

  if (digits.length === 6) {
    const yy = parseInt(digits.slice(0, 2), 10);
    const mm = digits.slice(2, 4);
    const dd = digits.slice(4, 6);
    const year = yy >= 30 ? 1900 + yy : 2000 + yy;
    const dateStr = `${year}-${mm}-${dd}`;
    const d = dayjs(dateStr);
    if (d.format("YYYY-MM-DD") !== dateStr) return null;
    return d.toDate();
  }

  if (digits.length === 8) {
    const year = digits.slice(0, 4);
    const mm = digits.slice(4, 6);
    const dd = digits.slice(6, 8);
    const dateStr = `${year}-${mm}-${dd}`;
    const d = dayjs(dateStr);
    if (d.format("YYYY-MM-DD") !== dateStr) return null;
    return d.toDate();
  }

  return null;
}

// isRepeat=true → 올해(지났으면 내년) 기준 D-day, false → 절대 날짜 기준
export function dDayLabel(dateStr: string, isRepeat: boolean): string {
  const today = dayjs().startOf("day");
  let target = dayjs(dateStr).startOf("day");

  if (isRepeat) {
    target = target.year(today.year());
    if (target.isBefore(today)) {
      target = target.add(1, "year");
    }
  }

  const diff = target.diff(today, "day");
  if (diff === 0) return "D-Day";
  if (diff > 0) return `D-${diff}`;
  return `${Math.abs(diff)}일 전`;
}
