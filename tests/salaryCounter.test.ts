import { SalaryCounter } from '../src/salaryCounter';

describe('SalaryCounter - 秒給カウンター', () => {
  it('初期化時：累計0円', () => {
    const counter = new SalaryCounter({
      monthlySalary: 300000,
      monthlyWorkingHours: 160,
      currentDate: new Date(2026, 4, 1, 9, 0, 0), // 5月1日 9:00
    });

    expect(counter.getAccumulatedSalary()).toBe(0);
  });

  it('1秒経過：累計がsecondSalary分増加', () => {
    const counter = new SalaryCounter({
      monthlySalary: 300000,
      monthlyWorkingHours: 160,
      currentDate: new Date(2026, 4, 1, 9, 0, 0),
    });

    const baseSalary = counter.getAccumulatedSalary();
    counter.advanceSeconds(1);
    const afterSalary = counter.getAccumulatedSalary();

    expect(afterSalary - baseSalary).toBeCloseTo(0.5208, 3);
  });

  it('1時間経過：累計がsecondSalary × 3600増加', () => {
    const counter = new SalaryCounter({
      monthlySalary: 300000,
      monthlyWorkingHours: 160,
      currentDate: new Date(2026, 4, 1, 9, 0, 0),
    });

    const baseSalary = counter.getAccumulatedSalary();
    counter.advanceSeconds(3600);
    const afterSalary = counter.getAccumulatedSalary();

    // (300000 / (160 * 3600)) * 3600 = 300000 / 160 = 1875
    expect(afterSalary - baseSalary).toBeCloseTo(1875, 0);
  });

  it('日曜日：秒給が1.25倍 → 累計増分が1.25倍', () => {
    const counter = new SalaryCounter({
      monthlySalary: 300000,
      monthlyWorkingHours: 160,
      currentDate: new Date(2026, 5, 7, 14, 0, 0), // 6月7日（日曜）14時
    });

    const baseSalary = counter.getAccumulatedSalary();
    counter.advanceSeconds(1);
    const afterSalary = counter.getAccumulatedSalary();

    // 0.5208 * 1.25 ≈ 0.651
    expect(afterSalary - baseSalary).toBeCloseTo(0.651, 3);
  });

  it('現在秒給を取得', () => {
    const counter = new SalaryCounter({
      monthlySalary: 300000,
      monthlyWorkingHours: 160,
      currentDate: new Date(2026, 4, 1, 9, 0, 0), // 平日日中
    });

    expect(counter.getCurrentSecondSalary()).toBeCloseTo(0.5208, 4);
  });

  it('見なし残業対応：見なし45h超過時に秒給が低下', () => {
    const counter = new SalaryCounter({
      monthlySalary: 300000,
      monthlyWorkingHours: 48, // 見なし超過
      fixedWorkingHours: 45,
      currentDate: new Date(2026, 4, 1, 9, 0, 0),
    });

    // 300000 / (48 * 3600) ≈ 1.736
    expect(counter.getCurrentSecondSalary()).toBeCloseTo(1.7361, 4);
  });
});
