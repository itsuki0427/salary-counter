import { calculateSecondSalary, getOvertimeMultiplier } from '../src/salaryCalculator';

describe('SalaryCalculator - 基本秒給計算（通常モード）', () => {
  it('月給300000円、160時間勤務 → 秒給0.521円/秒', () => {
    const monthlySalary = 300000;
    const monthlyWorkingHours = 160;

    const secondSalary = calculateSecondSalary(monthlySalary, monthlyWorkingHours);

    expect(secondSalary).toBeCloseTo(0.5208, 4);
  });

  it('月給400000円、180時間勤務 → 秒給0.617円/秒', () => {
    const monthlySalary = 400000;
    const monthlyWorkingHours = 180;

    const secondSalary = calculateSecondSalary(monthlySalary, monthlyWorkingHours);

    expect(secondSalary).toBeCloseTo(0.6173, 4);
  });

  it('無効な入力：月給が負 → エラー', () => {
    expect(() => calculateSecondSalary(-300000, 160)).toThrow('月給は0以上である必要があります');
  });

  it('無効な入力：勤務時間が負 → エラー', () => {
    expect(() => calculateSecondSalary(300000, -160)).toThrow('勤務時間は0より大きい必要があります');
  });
});

describe('SalaryCalculator - 見なし残業モード（案A：時間ベース計算）', () => {
  it('見なし45h、月給30万、実作業45h（見なし内）→ 秒給1.852円/秒', () => {
    const monthlySalary = 300000;
    const actualWorkingHours = 45; // 見なし時間内
    const fixedWorkingHours = 45;
    const secondSalary = calculateSecondSalary(monthlySalary, actualWorkingHours, fixedWorkingHours);
    // 300000 / (45 * 3600) = 1.851...
    expect(secondSalary).toBeCloseTo(1.8519, 4);
  });

  it('見なし45h、月給30万、実作業48h（見なし超過）→ 秒給1.736円/秒', () => {
    const monthlySalary = 300000;
    const actualWorkingHours = 48; // 見なし超過（実作業が見なし時間を超えたら実作業時間で割る）
    const fixedWorkingHours = 45;
    const secondSalary = calculateSecondSalary(monthlySalary, actualWorkingHours, fixedWorkingHours);
    // 300000 / (48 * 3600) = 1.736...
    expect(secondSalary).toBeCloseTo(1.7361, 4);
  });

  it('見なし45h、月給30万、実作業42h（見なし未満）→ 秒給1.852円/秒', () => {
    const monthlySalary = 300000;
    const actualWorkingHours = 42; // 見なし未満（見なし時間で割る）
    const fixedWorkingHours = 45;
    const secondSalary = calculateSecondSalary(monthlySalary, actualWorkingHours, fixedWorkingHours);
    // 見なし時間内なので見なし時間で割る → 300000 / (45 * 3600) = 1.851...
    expect(secondSalary).toBeCloseTo(1.8519, 4);
  });
});

describe('SalaryCalculator - 残業代モード', () => {
  it('基本（残業代なし）：月給30万、160時間 → 秒給0.521円/秒', () => {
    const monthlySalary = 300000;
    const monthlyWorkingHours = 160;
    const secondSalary = calculateSecondSalary(monthlySalary, monthlyWorkingHours);
    expect(secondSalary).toBeCloseTo(0.5208, 4);
  });

  it('日曜残業：日曜日に時給1.25倍 → 秒給0.651円/秒', () => {
    const monthlySalary = 300000;
    const monthlyWorkingHours = 160;
    const baseSecondSalary = calculateSecondSalary(monthlySalary, monthlyWorkingHours);

    // 日曜日（0）14時
    const sunday = new Date(2026, 4, 3); // 2026年5月3日は日曜
    const multiplier = getOvertimeMultiplier(sunday, 14);
    const effectiveSecondSalary = baseSecondSalary * multiplier;

    expect(effectiveSecondSalary).toBeCloseTo(0.6510, 4); // 0.5208 * 1.25
  });

  it('平日（日中）：残業対象外 → 秒給0.521円/秒', () => {
    const monthlySalary = 300000;
    const monthlyWorkingHours = 160;
    const baseSecondSalary = calculateSecondSalary(monthlySalary, monthlyWorkingHours);

    // 平日日中（14時）
    const weekday = new Date(2026, 4, 1); // 2026年5月1日は金曜
    const multiplier = getOvertimeMultiplier(weekday, 14);
    const effectiveSecondSalary = baseSecondSalary * multiplier;

    expect(effectiveSecondSalary).toBeCloseTo(0.5208, 4); // 倍率1.0
  });

  it('夜間残業（22時～5時）：時給1.25倍 → 秒給0.651円/秒', () => {
    const monthlySalary = 300000;
    const monthlyWorkingHours = 160;
    const baseSecondSalary = calculateSecondSalary(monthlySalary, monthlyWorkingHours);

    // 夜22時
    const nightTime = new Date(2026, 4, 1); // 日付は任意
    const multiplier = getOvertimeMultiplier(nightTime, 22);
    const effectiveSecondSalary = baseSecondSalary * multiplier;

    expect(effectiveSecondSalary).toBeCloseTo(0.6510, 4); // 0.5208 * 1.25
  });
});
