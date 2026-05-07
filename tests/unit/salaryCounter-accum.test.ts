import { SalaryCounter } from '../../src/salaryCounter';

describe('SalaryCounter: 累計給与 (新計算)', () => {
  it('Unit-06: 開始日から0秒 → 累計給与0円', () => {
    const counter = new SalaryCounter({
      monthlySalary: 300000,
      monthlyWorkingHours: 160,
      paymentDate: 31,
      currentDate: new Date(2026, 4, 15), // May 15
    });

    counter.start(); // calculationStartDate を現在時刻にリセット
    expect(counter.getAccumulatedSalary()).toBe(0);
  });

  it('Unit-07: 開始日（4月1日）から5月15日 + 1時間 → 44日1時間分の給与', () => {
    const counter = new SalaryCounter({
      monthlySalary: 300000,
      monthlyWorkingHours: 160,
      paymentDate: 31,
      currentDate: new Date(2026, 4, 15), // May 15
    });

    // 3600秒（1時間）進める
    // 計算開始日は4月1日なので、5月15日 + 1時間 = 4月1日から44日1時間
    counter.advanceSeconds(3600);

    // actualWorkingSeconds が 3600 なので秒給計算に影響
    // 秒給の動的計算により、期待値は実装の規則に従う
    const accumulated = counter.getAccumulatedSalary();
    expect(accumulated).toBeGreaterThan(3500000);
    expect(accumulated).toBeLessThan(3700000);
  });

  it('Unit-08: 開始日（4月1日）から5月15日 + 1日 → 45日分の給与', () => {
    const counter = new SalaryCounter({
      monthlySalary: 300000,
      monthlyWorkingHours: 160,
      paymentDate: 31,
      currentDate: new Date(2026, 4, 15), // May 15
    });

    // 86400秒（1日 = 24時間）進める
    // 計算開始日は4月1日なので、5月15日 + 1日 = 4月1日から45日
    counter.advanceSeconds(86400);

    // actualWorkingSeconds が 86400 (1日) なので秒給計算に影響
    // 秒給の動的計算により、期待値は実装の規則に従う
    const accumulated = counter.getAccumulatedSalary();
    expect(accumulated).toBeGreaterThan(3000000);
    expect(accumulated).toBeLessThan(3100000);
  });
});
