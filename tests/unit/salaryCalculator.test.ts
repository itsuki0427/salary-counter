import { calculateSecondSalary, calculateOvertimeSalary, getOvertimeMultiplier } from '../../src/salaryCalculator';
import { Rule } from '../../src/ruleEngine';

describe('salaryCalculator', () => {
  describe('getOvertimeMultiplier()', () => {
    it('既存互換：日曜は1.25倍', () => {
      const sunday = new Date(2024, 0, 7); // Sunday
      expect(getOvertimeMultiplier(sunday)).toBe(1.25);
    });

    it('既存互換：22時〜5時は1.25倍', () => {
      const date = new Date(2024, 0, 15, 23, 0);
      expect(getOvertimeMultiplier(date, 23)).toBe(1.25);
    });

    it('既存互換：デフォルト1.0', () => {
      const monday = new Date(2024, 0, 8, 10, 0);
      expect(getOvertimeMultiplier(monday, 10)).toBe(1.0);
    });
  });

  describe('calculateSecondSalary()', () => {
    describe('Unit-01: 動的計算精度', () => {
      it('秒給 = 月給 ÷ (実勤務秒 + 残り予定秒)、小数点第4位精度', () => {
        // 月給 300,000円、当月勤務 160h、受取額 300,000円
        // 実勤務 30h、残り予定 130h
        const params = {
          monthlySalary: 300000,
          actualWorkingSeconds: 30 * 3600, // 30時間
          remainingWorkingSeconds: 130 * 3600, // 130時間
          totalSalary: 300000,
        };
        const secondSalary = calculateSecondSalary(params);
        // 300000 / (30*3600 + 130*3600) = 300000 / 576000 = 0.520833...
        expect(secondSalary).toBeCloseTo(0.520833, 4);
      });

      it('秒給計算：誤差 < 0.0001', () => {
        const params = {
          monthlySalary: 250000,
          actualWorkingSeconds: 50 * 3600,
          remainingWorkingSeconds: 110 * 3600,
          totalSalary: 250000,
        };
        const secondSalary = calculateSecondSalary(params);
        // 250000 / (50*3600 + 110*3600) = 250000 / 576000 = 0.434027...
        expect(Math.abs(secondSalary - 0.434027)).toBeLessThan(0.00001);
      });

      it('秒給計算：0秒でエラー', () => {
        const params = {
          monthlySalary: 300000,
          actualWorkingSeconds: 0,
          remainingWorkingSeconds: 0,
          totalSalary: 300000,
        };
        expect(() => calculateSecondSalary(params)).toThrow();
      });
    });

    describe('Unit-02: 残業代反映', () => {
      it('受取額に残業代含む場合、秒給上昇', () => {
        // Case 1: 残業代なし
        const case1 = {
          monthlySalary: 300000,
          actualWorkingSeconds: 50 * 3600,
          remainingWorkingSeconds: 110 * 3600,
          totalSalary: 300000,
        };
        const salary1 = calculateSecondSalary(case1);

        // Case 2: 残業代 20,000円 含む
        const case2 = {
          monthlySalary: 300000,
          actualWorkingSeconds: 50 * 3600,
          remainingWorkingSeconds: 110 * 3600,
          totalSalary: 320000, // +20,000 残業代
        };
        const salary2 = calculateSecondSalary(case2);

        expect(salary2).toBeGreaterThan(salary1);
      });

      it('受取額計算：月給だけ vs 月給+超過代', () => {
        const baseParams = {
          actualWorkingSeconds: 30 * 3600,
          remainingWorkingSeconds: 130 * 3600,
        };
        const salary1 = calculateSecondSalary({
          ...baseParams,
          monthlySalary: 300000,
          totalSalary: 300000,
        });
        const salary2 = calculateSecondSalary({
          ...baseParams,
          monthlySalary: 300000,
          totalSalary: 305000, // +5000 超過代
        });
        expect(salary2 - salary1).toBeCloseTo(5000 / (160 * 3600), 4);
      });
    });
  });

  describe('calculateOvertimeSalary()', () => {
    describe('Unit-03: 見なし超過', () => {
      it('実勤務 50h > 見なし 45h で超過代計算', () => {
        const rules: Rule[] = [
          {
            id: 'assumed-ot',
            name: 'Assumed Overtime',
            type: 'assumed-overtime',
            condition: { assumedHours: 45 },
            multiplier: 1.0,
            priority: 1,
            enabled: true,
          },
        ];
        const params = {
          monthlySalary: 300000,
          monthlyWorkingHours: 160,
          actualWorkingHours: 50,
          assumedWorkingHours: 45,
          appliedRules: rules,
        };
        const overtimeSalary = calculateOvertimeSalary(params);
        // 超過 = 50 - 45 = 5h
        // 時給 = 300000 / 160 = 1875円
        // 超過代 = 5 * 1875 * 1.0 = 9375円
        expect(overtimeSalary).toBeCloseTo(9375, 1);
      });

      it('実勤務 40h < 見なし 45h で超過代0', () => {
        const rules: Rule[] = [
          {
            id: 'assumed-ot',
            name: 'Assumed Overtime',
            type: 'assumed-overtime',
            condition: { assumedHours: 45 },
            multiplier: 1.0,
            priority: 1,
            enabled: true,
          },
        ];
        const params = {
          monthlySalary: 300000,
          monthlyWorkingHours: 160,
          actualWorkingHours: 40,
          assumedWorkingHours: 45,
          appliedRules: rules,
        };
        const overtimeSalary = calculateOvertimeSalary(params);
        expect(overtimeSalary).toBeCloseTo(0, 1);
      });

      it('複数ルール適用時、最優先ルールの倍率を使用', () => {
        const rules: Rule[] = [
          {
            id: 'rule1',
            name: 'Rule 1',
            type: 'assumed-overtime',
            condition: { assumedHours: 45 },
            multiplier: 1.5,
            priority: 1,
            enabled: true,
          },
          {
            id: 'rule2',
            name: 'Rule 2',
            type: 'assumed-overtime',
            condition: { assumedHours: 45 },
            multiplier: 1.0,
            priority: 2,
            enabled: true,
          },
        ];
        const params = {
          monthlySalary: 300000,
          monthlyWorkingHours: 160,
          actualWorkingHours: 50,
          assumedWorkingHours: 45,
          appliedRules: rules,
        };
        const overtimeSalary = calculateOvertimeSalary(params);
        // 5h * (300000/160) * 1.5 = 5 * 1875 * 1.5 = 14062.5円
        expect(overtimeSalary).toBeCloseTo(14062.5, 1);
      });

      it('ルール倍率2.0の高倍率計算', () => {
        const rules: Rule[] = [
          {
            id: 'high-mult',
            name: 'High Multiplier',
            type: 'assumed-overtime',
            condition: { assumedHours: 45 },
            multiplier: 2.0,
            priority: 1,
            enabled: true,
          },
        ];
        const params = {
          monthlySalary: 300000,
          monthlyWorkingHours: 160,
          actualWorkingHours: 60,
          assumedWorkingHours: 45,
          appliedRules: rules,
        };
        const overtimeSalary = calculateOvertimeSalary(params);
        // 15h * (300000/160) * 2.0 = 15 * 1875 * 2.0 = 56250円
        expect(overtimeSalary).toBeCloseTo(56250, 1);
      });

      it('誤差 < 1円を維持', () => {
        const rules: Rule[] = [
          {
            id: 'precision',
            name: 'Precision Test',
            type: 'assumed-overtime',
            condition: { assumedHours: 45 },
            multiplier: 1.25,
            priority: 1,
            enabled: true,
          },
        ];
        const params = {
          monthlySalary: 350000,
          monthlyWorkingHours: 160,
          actualWorkingHours: 52,
          assumedWorkingHours: 45,
          appliedRules: rules,
        };
        const overtimeSalary = calculateOvertimeSalary(params);
        // 7 * (350000/160) * 1.25 = 7 * 2187.5 * 1.25 = 19140.625
        expect(Math.abs(overtimeSalary - 19140.625)).toBeLessThan(1);
      });
    });

    describe('エッジケース', () => {
      it('ルール空配列の場合、0を返す', () => {
        const params = {
          monthlySalary: 300000,
          monthlyWorkingHours: 160,
          actualWorkingHours: 50,
          assumedWorkingHours: 45,
          appliedRules: [] as Rule[],
        };
        const overtimeSalary = calculateOvertimeSalary(params);
        expect(overtimeSalary).toBe(0);
      });

      it('見なし時間undefined の場合、0を返す', () => {
        const rules: Rule[] = [
          {
            id: 'test',
            name: 'Test',
            type: 'assumed-overtime',
            condition: {},
            multiplier: 1.0,
            priority: 1,
            enabled: true,
          },
        ];
        const params = {
          monthlySalary: 300000,
          monthlyWorkingHours: 160,
          actualWorkingHours: 50,
          assumedWorkingHours: undefined,
          appliedRules: rules,
        };
        const overtimeSalary = calculateOvertimeSalary(params);
        expect(overtimeSalary).toBe(0);
      });
    });
  });
});
