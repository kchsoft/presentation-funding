export function formatKrw(amount: number): string {
  return `${new Intl.NumberFormat("ko-KR").format(amount)}원`;
}

export function progressPercent(total: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.min(100, Math.round((total / goal) * 100));
}

/** 오늘부터 마감일까지 남은 일수 (마감일 당일 = 0, 지났으면 음수). */
export function daysLeft(deadline: Date): number {
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((startOfDay(deadline) - startOfDay(new Date())) / msPerDay);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "long" }).format(date);
}
