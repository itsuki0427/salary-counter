import { SalaryCounter } from '../../src/salaryCounter';
import { Rule } from '../../src/ruleEngine';

describe('統合テスト: SalaryCounter + ルール評価', () => {
  it('Integ-01: ルール追加 → 秒給再計算', () => {
    const counter = new SalaryCounter({
      monthlySalary: 300000,
      monthlyWorkingHours: 160,
      paymentDate: 31,
      rules: [],
      currentDate: new Date(2026, 4, 1, 9, 0, 0),
    });

    const salary1 = counter.getCurrentSecondSalary();

    // 深夜ルール追加
    const midnightRule: Rule = {
      id: 'midnight',
      name: '深夜',
      type: 'time-range',
      condition: { startHour: 22, endHour: 5 },
      multiplier: 1.25,
      priority: 1,
      enabled: true,
    };
    counter.updateRules([midnightRule]);
    counter.setCurrentDate(new Date(2026, 4, 1, 22, 0, 0));

    const salary2 = counter.getCurrentSecondSalary();

    // 22時でルール適用、1.25倍
    expect(salary2).toBeGreaterThan(salary1);
    expect(salary2).toBeCloseTo(salary1 * 1.25, 2);
  });

  it('Integ-02: 複数ルール複合（優先度）', () => {
    const rule1: Rule = {
      id: 'r1',
      name: 'Rule 1',
      type: 'time-range',
      condition: { startHour: 22, endHour: 5 },
      multiplier: 1.5,
      priority: 1,
      enabled: true,
    };
    const rule2: Rule = {
      id: 'r2',
      name: 'Rule 2',
      type: 'time-range',
      condition: { startHour: 22, endHour: 5 },
      multiplier: 1.25,
      priority: 2,
      enabled: true,
    };

    const counter = new SalaryCounter({
      monthlySalary: 300000,
      monthlyWorkingHours: 160,
      paymentDate: 31,
      rules: [rule1, rule2],
      currentDate: new Date(2026, 4, 1, 22, 0, 0),
    });

    const salary = counter.getCurrentSecondSalary();
    const base = 300000 / (160 * 3600);

    // rule1 が priority 1 なので 1.5倍
    expect(salary).toBeCloseTo(base * 1.5, 2);
  });
});
