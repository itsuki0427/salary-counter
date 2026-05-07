import { SalaryCounter } from '../src/salaryCounter';

describe('SalaryCounter - 既存互換テスト', () => {
  it('初期化時：累計0円', () => {
    const counter = new SalaryCounter({
      monthlySalary: 300000,
      monthlyWorkingHours: 160,
      paymentDate: 31,
      rules: [],
      currentDate: new Date(2026, 4, 1, 9, 0, 0),
    });

    counter.start(); // calculationStartDate を現在時刻にリセット
    expect(counter.getAccumulatedSalary()).toBe(0);
  });

  it('1秒経過：累計が増加', () => {
    const counter = new SalaryCounter({
      monthlySalary: 300000,
      monthlyWorkingHours: 160,
      paymentDate: 31,
      rules: [],
      currentDate: new Date(2026, 4, 1, 9, 0, 0),
    });

    counter.start(); // calculationStartDate を現在時刻にリセット
    const before = counter.getAccumulatedSalary();
    counter.advanceSeconds(1);
    const after = counter.getAccumulatedSalary();

    expect(after).toBeGreaterThan(before);
  });

  it('1時間経過：累計がさらに増加', () => {
    const counter = new SalaryCounter({
      monthlySalary: 300000,
      monthlyWorkingHours: 160,
      paymentDate: 31,
      rules: [],
      currentDate: new Date(2026, 4, 1, 9, 0, 0),
    });

    counter.start(); // calculationStartDate を現在時刻にリセット
    const before = counter.getAccumulatedSalary();
    counter.advanceSeconds(3600);
    const after = counter.getAccumulatedSalary();

    expect(after - before).toBeGreaterThan(1000); // 月給から計算すると ~1875
  });

  it('現在秒給を取得', () => {
    const counter = new SalaryCounter({
      monthlySalary: 300000,
      monthlyWorkingHours: 160,
      paymentDate: 31,
      rules: [],
      currentDate: new Date(2026, 4, 1, 9, 0, 0),
    });

    const salary = counter.getCurrentSecondSalary();
    expect(salary).toBeGreaterThan(0);
    expect(salary).toBeLessThan(1); // 秒給は1円未満
  });
});
