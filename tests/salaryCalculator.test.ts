import { calculateSecondSalary, getOvertimeMultiplier } from '../src/salaryCalculator';

describe('SalaryCalculator - 互換性テスト（getOvertimeMultiplier）', () => {
  it('日曜は1.25倍', () => {
    const sunday = new Date(2026, 4, 3); // Sunday
    expect(getOvertimeMultiplier(sunday)).toBe(1.25);
  });

  it('夜間（22時～5時）は1.25倍', () => {
    const date = new Date(2026, 4, 1);
    expect(getOvertimeMultiplier(date, 22)).toBe(1.25);
  });

  it('平日昼間は1.0', () => {
    const weekday = new Date(2026, 4, 1); // Friday
    expect(getOvertimeMultiplier(weekday, 14)).toBe(1.0);
  });
});

describe('SalaryCalculator - 動的秒給計算', () => {
  it('基本：月給30万、実勤30h、残り130h → 秒給0.5208', () => {
    const secondSalary = calculateSecondSalary({
      monthlySalary: 300000,
      actualWorkingSeconds: 30 * 3600,
      remainingWorkingSeconds: 130 * 3600,
      totalSalary: 300000,
    });
    expect(secondSalary).toBeCloseTo(0.5208, 4);
  });

  it('残業代含む場合、秒給上昇', () => {
    const salary1 = calculateSecondSalary({
      monthlySalary: 300000,
      actualWorkingSeconds: 30 * 3600,
      remainingWorkingSeconds: 130 * 3600,
      totalSalary: 300000,
    });
    const salary2 = calculateSecondSalary({
      monthlySalary: 300000,
      actualWorkingSeconds: 30 * 3600,
      remainingWorkingSeconds: 130 * 3600,
      totalSalary: 305000, // +5000
    });
    expect(salary2).toBeGreaterThan(salary1);
  });

  it('0秒でエラー', () => {
    expect(() =>
      calculateSecondSalary({
        monthlySalary: 300000,
        actualWorkingSeconds: 0,
        remainingWorkingSeconds: 0,
        totalSalary: 300000,
      })
    ).toThrow();
  });
});
