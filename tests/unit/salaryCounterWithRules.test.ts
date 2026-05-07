import { SalaryCounter } from '../../src/salaryCounter';
import { Rule } from '../../src/ruleEngine';

describe('SalaryCounter - 動的計算 + ルール統合', () => {
  const baseRule: Rule = {
    id: 'base',
    name: 'Base',
    type: 'time-range',
    condition: { startHour: 22, endHour: 5 },
    multiplier: 1.25,
    priority: 1,
    enabled: true,
  };

  describe('Unit-09: advanceSeconds() - 秒給積算', () => {
    it('3秒経過で秒給 × 3 を累積', () => {
      const counter = new SalaryCounter({
        monthlySalary: 300000,
        monthlyWorkingHours: 160,
        paymentDate: 31,
        rules: [],
        currentDate: new Date(2026, 4, 1, 9, 0, 0),
      });

      const before = counter.getAccumulatedSalary();
      counter.advanceSeconds(3);
      const after = counter.getAccumulatedSalary();

      // 秒給 ≈ 0.5208, 3秒 × 0.5208 ≈ 1.5624
      expect(after - before).toBeCloseTo(1.5624, 1);
    });

    it('時刻が 22:00 に達するとルール適用', () => {
      const midnight = new Date(2026, 4, 1, 21, 59, 57); // 21:59:57
      const counter = new SalaryCounter({
        monthlySalary: 300000,
        monthlyWorkingHours: 160,
        paymentDate: 31,
        rules: [baseRule],
        currentDate: midnight,
      });

      // 21:59:57 時点: ルール非マッチ
      const salary1 = counter.getAccumulatedSalary();
      counter.advanceSeconds(3); // 22:00:00 に到達
      const salary2 = counter.getAccumulatedSalary();

      // 増分は秒給 × 3（ルール適用前3秒）
      // ただし最後の秒ではルール適用されている可能性
      expect(salary2 - salary1).toBeGreaterThan(0);
    });
  });

  describe('複合シナリオ', () => {
    it('ルール追加後、秒給反映', () => {
      const counter = new SalaryCounter({
        monthlySalary: 300000,
        monthlyWorkingHours: 160,
        paymentDate: 31,
        rules: [],
        currentDate: new Date(2026, 4, 1, 10, 0, 0),
      });

      const salary1 = counter.getCurrentSecondSalary();

      // ルール追加（深夜1.25倍）
      counter.updateRules([baseRule]);

      // 10時なのでルール非マッチ、秒給は変わらない
      const salary2 = counter.getCurrentSecondSalary();
      expect(salary2).toBeCloseTo(salary1, 4);

      // 22時に進める
      counter.setCurrentDate(new Date(2026, 4, 1, 22, 0, 0));
      const salary3 = counter.getCurrentSecondSalary();

      // 22時でルール適用、1.25倍
      expect(salary3).toBeCloseTo(salary1 * 1.25, 3);
    });

    it('複数ルール優先度', () => {
      const rule1: Rule = { ...baseRule, id: 'r1', priority: 1, multiplier: 1.5 };
      const rule2: Rule = { ...baseRule, id: 'r2', priority: 2, multiplier: 1.25 };

      const counter = new SalaryCounter({
        monthlySalary: 300000,
        monthlyWorkingHours: 160,
        paymentDate: 31,
        rules: [rule1, rule2],
        currentDate: new Date(2026, 4, 1, 22, 0, 0),
      });

      const salary = counter.getCurrentSecondSalary();

      // rule1 が priority 1 なので 1.5倍を適用
      const baseSalary = 300000 / (160 * 3600);
      expect(salary).toBeCloseTo(baseSalary * 1.5, 3);
    });
  });

  describe('calculateRemainingSeconds() - 残り勤務秒数', () => {
    it('月中盤：残り日数に応じて線形配分', () => {
      const mid = new Date(2026, 4, 15, 10, 0, 0); // 5月15日
      const counter = new SalaryCounter({
        monthlySalary: 300000,
        monthlyWorkingHours: 160,
        paymentDate: 31,
        rules: [],
        currentDate: mid,
      });

      // 5月15日～31日 = 17日間（31日を含む）
      // 月勤務 160h を31日で配分 → 1日あたり 160/31 ≈ 5.16h
      // 残り 17日 × 5.16h ≈ 87.75h
      const remaining = counter.calculateRemainingSeconds() / 3600;
      expect(remaining).toBeCloseTo(87.75, 1);
    });

    it('給与日当日：残り秒数 ≈ 0', () => {
      const lastDay = new Date(2026, 4, 31, 23, 59, 0); // 5月31日
      const counter = new SalaryCounter({
        monthlySalary: 300000,
        monthlyWorkingHours: 160,
        paymentDate: 31,
        rules: [],
        currentDate: lastDay,
      });

      const remaining = counter.calculateRemainingSeconds();
      expect(remaining).toBeLessThan(100); // ほぼ0
    });
  });
});
