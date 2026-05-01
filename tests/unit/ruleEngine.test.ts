import { evaluateRules, applyPriority, Rule } from '../../src/ruleEngine';

describe('ruleEngine', () => {
  const baseRule = {
    id: 'rule-1',
    name: 'Test Rule',
    enabled: true,
    priority: 1,
    multiplier: 1.25,
  };

  describe('evaluateRules()', () => {
    describe('Unit-04: 時間帯判定（深夜 22-5時）', () => {
      it('23:30 で深夜ルールマッチ', () => {
        const currentTime = new Date(2024, 0, 15, 23, 30);
        const rules: Rule[] = [
          {
            ...baseRule,
            id: 'midnight',
            type: 'time-range',
            condition: { startHour: 22, endHour: 5 },
          },
        ];
        const matched = evaluateRules(currentTime, 50, 45, rules);
        expect(matched).toHaveLength(1);
        expect(matched[0].id).toBe('midnight');
      });

      it('21:59 で深夜ルール非マッチ', () => {
        const currentTime = new Date(2024, 0, 15, 21, 59);
        const rules: Rule[] = [
          {
            ...baseRule,
            id: 'midnight',
            type: 'time-range',
            condition: { startHour: 22, endHour: 5 },
          },
        ];
        const matched = evaluateRules(currentTime, 50, 45, rules);
        expect(matched).toHaveLength(0);
      });

      it('04:59 で深夜ルールマッチ（跨夜）', () => {
        const currentTime = new Date(2024, 0, 15, 4, 59);
        const rules: Rule[] = [
          {
            ...baseRule,
            id: 'midnight',
            type: 'time-range',
            condition: { startHour: 22, endHour: 5 },
          },
        ];
        const matched = evaluateRules(currentTime, 50, 45, rules);
        expect(matched).toHaveLength(1);
      });

      it('05:00 で深夜ルール非マッチ', () => {
        const currentTime = new Date(2024, 0, 15, 5, 0);
        const rules: Rule[] = [
          {
            ...baseRule,
            id: 'midnight',
            type: 'time-range',
            condition: { startHour: 22, endHour: 5 },
          },
        ];
        const matched = evaluateRules(currentTime, 50, 45, rules);
        expect(matched).toHaveLength(0);
      });
    });

    describe('Unit-05: 曜日判定（日曜）', () => {
      it('日曜（dayOfWeek=0）でマッチ', () => {
        const sunday = new Date(2024, 0, 7); // 2024-01-07 is Sunday
        const rules: Rule[] = [
          {
            ...baseRule,
            id: 'sunday',
            type: 'weekday',
            condition: { dayOfWeek: 0 },
          },
        ];
        const matched = evaluateRules(sunday, 50, 45, rules);
        expect(matched).toHaveLength(1);
        expect(matched[0].id).toBe('sunday');
      });

      it('月曜（dayOfWeek=0 以外）で非マッチ', () => {
        const monday = new Date(2024, 0, 8); // 2024-01-08 is Monday
        const rules: Rule[] = [
          {
            ...baseRule,
            id: 'sunday',
            type: 'weekday',
            condition: { dayOfWeek: 0 },
          },
        ];
        const matched = evaluateRules(monday, 50, 45, rules);
        expect(matched).toHaveLength(0);
      });

      it('複数曜日ルール判定', () => {
        const friday = new Date(2024, 0, 12); // 2024-01-12 is Friday
        const rules: Rule[] = [
          {
            ...baseRule,
            id: 'sunday',
            type: 'weekday',
            condition: { dayOfWeek: 0 },
          },
          {
            ...baseRule,
            id: 'friday',
            type: 'weekday',
            condition: { dayOfWeek: 5 },
          },
        ];
        const matched = evaluateRules(friday, 50, 45, rules);
        expect(matched).toHaveLength(1);
        expect(matched[0].id).toBe('friday');
      });
    });

    describe('Unit-06: 見なし超過判定', () => {
      it('実勤務 50h > 見なし 45h でマッチ', () => {
        const currentTime = new Date(2024, 0, 15, 10, 0);
        const rules: Rule[] = [
          {
            ...baseRule,
            id: 'assumed-ot',
            type: 'assumed-overtime',
            condition: { assumedHours: 45 },
          },
        ];
        const matched = evaluateRules(currentTime, 50, 45, rules);
        expect(matched).toHaveLength(1);
        expect(matched[0].id).toBe('assumed-ot');
      });

      it('実勤務 40h < 見なし 45h で非マッチ', () => {
        const currentTime = new Date(2024, 0, 15, 10, 0);
        const rules: Rule[] = [
          {
            ...baseRule,
            id: 'assumed-ot',
            type: 'assumed-overtime',
            condition: { assumedHours: 45 },
          },
        ];
        const matched = evaluateRules(currentTime, 40, 45, rules);
        expect(matched).toHaveLength(0);
      });

      it('実勤務 45h === 見なし 45h で非マッチ', () => {
        const currentTime = new Date(2024, 0, 15, 10, 0);
        const rules: Rule[] = [
          {
            ...baseRule,
            id: 'assumed-ot',
            type: 'assumed-overtime',
            condition: { assumedHours: 45 },
          },
        ];
        const matched = evaluateRules(currentTime, 45, 45, rules);
        expect(matched).toHaveLength(0);
      });
    });

    describe('ルール無効化', () => {
      it('disabled=true のルールは除外', () => {
        const currentTime = new Date(2024, 0, 15, 23, 30);
        const rules: Rule[] = [
          {
            ...baseRule,
            id: 'midnight',
            type: 'time-range',
            condition: { startHour: 22, endHour: 5 },
            enabled: false,
          },
        ];
        const matched = evaluateRules(currentTime, 50, 45, rules);
        expect(matched).toHaveLength(0);
      });

      it('複数ルール中、有効なものだけマッチ', () => {
        const currentTime = new Date(2024, 0, 15, 23, 30);
        const rules: Rule[] = [
          {
            ...baseRule,
            id: 'midnight',
            type: 'time-range',
            condition: { startHour: 22, endHour: 5 },
            enabled: true,
          },
          {
            ...baseRule,
            id: 'sunday',
            type: 'weekday',
            condition: { dayOfWeek: 0 },
            enabled: false,
          },
        ];
        const matched = evaluateRules(currentTime, 50, 45, rules);
        expect(matched).toHaveLength(1);
        expect(matched[0].id).toBe('midnight');
      });
    });
  });

  describe('applyPriority()', () => {
    const basePriorityRule = {
      name: 'Test',
      enabled: true,
      type: 'time-range' as const,
      condition: { startHour: 22, endHour: 5 },
    };

    describe('Unit-07: 優先度制御（最大値優先 = 最小数値優先）', () => {
      it('優先度 1 のルール倍率を選択', () => {
        const matchedRules: Rule[] = [
          { ...basePriorityRule, id: 'rule1', priority: 1, multiplier: 1.25 },
          { ...basePriorityRule, id: 'rule2', priority: 2, multiplier: 1.25 },
          { ...basePriorityRule, id: 'rule3', priority: 3, multiplier: 1.0 },
        ];
        const multiplier = applyPriority(matchedRules);
        expect(multiplier).toBe(1.25);
      });

      it('優先度が同じ場合、最初のルール選択', () => {
        const matchedRules: Rule[] = [
          { ...basePriorityRule, id: 'rule1', priority: 1, multiplier: 1.25 },
          { ...basePriorityRule, id: 'rule2', priority: 1, multiplier: 1.15 },
        ];
        const multiplier = applyPriority(matchedRules);
        expect(multiplier).toBe(1.25); // rule1 の倍率
      });

      it('複数ルール複合（日曜 + 深夜）時、優先度で決定', () => {
        const matchedRules: Rule[] = [
          { ...basePriorityRule, id: 'sunday', priority: 2, multiplier: 1.25 },
          { ...basePriorityRule, id: 'midnight', priority: 1, multiplier: 1.25 },
        ];
        const multiplier = applyPriority(matchedRules);
        expect(multiplier).toBe(1.25); // midnight が priority 1
      });

      it('優先度 0 が最優先', () => {
        const matchedRules: Rule[] = [
          { ...basePriorityRule, id: 'rule0', priority: 0, multiplier: 1.5 },
          { ...basePriorityRule, id: 'rule1', priority: 1, multiplier: 1.25 },
        ];
        const multiplier = applyPriority(matchedRules);
        expect(multiplier).toBe(1.5);
      });
    });

    describe('Unit-08: applyPriority() - マッチなし', () => {
      it('マッチルール 0 件時は 1.0 返却', () => {
        const matchedRules: Rule[] = [];
        const multiplier = applyPriority(matchedRules);
        expect(multiplier).toBe(1.0);
      });
    });

    describe('エッジケース', () => {
      it('負の優先度も正しく動作', () => {
        const matchedRules: Rule[] = [
          { ...basePriorityRule, id: 'rule1', priority: -1, multiplier: 2.0 },
          { ...basePriorityRule, id: 'rule2', priority: 0, multiplier: 1.5 },
        ];
        const multiplier = applyPriority(matchedRules);
        expect(multiplier).toBe(2.0); // -1 が最優先
      });

      it('倍率が 0 の場合も許容', () => {
        const matchedRules: Rule[] = [
          { ...basePriorityRule, id: 'zero-mult', priority: 1, multiplier: 0.0 },
        ];
        const multiplier = applyPriority(matchedRules);
        expect(multiplier).toBe(0.0);
      });
    });
  });

  describe('複合シナリオ', () => {
    it('日曜の深夜：複数ルール複合マッチ → 優先度適用', () => {
      const sundayMidnight = new Date(2024, 0, 7, 23, 30);
      const rules: Rule[] = [
        {
          ...baseRule,
          id: 'sunday',
          type: 'weekday',
          condition: { dayOfWeek: 0 },
          priority: 2,
          multiplier: 1.25,
        },
        {
          ...baseRule,
          id: 'midnight',
          type: 'time-range',
          condition: { startHour: 22, endHour: 5 },
          priority: 1,
          multiplier: 1.25,
        },
      ];
      const matched = evaluateRules(sundayMidnight, 50, 45, rules);
      expect(matched).toHaveLength(2);
      const multiplier = applyPriority(matched);
      expect(multiplier).toBe(1.25); // midnight が priority 1
    });

    it('見なし超過 + 深夜：複数条件同時マッチ', () => {
      const midnight = new Date(2024, 0, 15, 23, 0);
      const rules: Rule[] = [
        {
          ...baseRule,
          id: 'assumed-ot',
          type: 'assumed-overtime',
          condition: { assumedHours: 45 },
          priority: 1,
          multiplier: 1.0,
        },
        {
          ...baseRule,
          id: 'midnight',
          type: 'time-range',
          condition: { startHour: 22, endHour: 5 },
          priority: 2,
          multiplier: 1.25,
        },
      ];
      const matched = evaluateRules(midnight, 50, 45, rules);
      expect(matched).toHaveLength(2);
      const multiplier = applyPriority(matched);
      expect(multiplier).toBe(1.0); // assumed-ot が priority 1
    });

    it('ルール複合：無効ルール混在', () => {
      const midnight = new Date(2024, 0, 7, 23, 30);
      const rules: Rule[] = [
        {
          ...baseRule,
          id: 'sunday',
          type: 'weekday',
          condition: { dayOfWeek: 0 },
          priority: 1,
          multiplier: 1.3,
          enabled: true,
        },
        {
          ...baseRule,
          id: 'midnight-disabled',
          type: 'time-range',
          condition: { startHour: 22, endHour: 5 },
          priority: 2,
          multiplier: 1.25,
          enabled: false,
        },
        {
          ...baseRule,
          id: 'midnight-enabled',
          type: 'time-range',
          condition: { startHour: 22, endHour: 5 },
          priority: 3,
          multiplier: 1.2,
          enabled: true,
        },
      ];
      const matched = evaluateRules(midnight, 50, 45, rules);
      expect(matched).toHaveLength(2); // sunday と midnight-enabled
      const multiplier = applyPriority(matched);
      expect(multiplier).toBe(1.3); // sunday が priority 1
    });
  });
});
