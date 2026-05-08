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
