export function calculateSecondSalary(
  monthlySalary: number,
  actualWorkingHours: number,
  fixedWorkingHours?: number
): number {
  if (monthlySalary < 0) {
    throw new Error('月給は0以上である必要があります');
  }
  if (actualWorkingHours <= 0) {
    throw new Error('勤務時間は0より大きい必要があります');
  }

  // 見なし残業モード：実作業時間が見なし時間を超えたら実作業時間で割る、それ以外は見なし時間で割る
  const divisorHours = fixedWorkingHours && actualWorkingHours > fixedWorkingHours
    ? actualWorkingHours
    : (fixedWorkingHours || actualWorkingHours);

  const totalSecondsInMonth = divisorHours * 3600;
  return monthlySalary / totalSecondsInMonth;
}

export function getOvertimeMultiplier(date: Date, hour: number = 0): number {
  const dayOfWeek = date.getDay();

  // 日曜（0）は1.25倍
  if (dayOfWeek === 0) return 1.25;

  // 夜間（22時～5時）は1.25倍
  if (hour >= 22 || hour < 5) return 1.25;

  // デフォルト：倍率なし
  return 1.0;
}
