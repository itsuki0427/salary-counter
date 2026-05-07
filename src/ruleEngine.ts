export interface Rule {
  id: string;
  name: string;
  type: 'assumed-overtime' | 'time-range' | 'weekday';
  condition: {
    assumedHours?: number;
    startHour?: number;
    endHour?: number;
    dayOfWeek?: number;
  };
  multiplier: number;
  priority: number;
  enabled: boolean;
}

export function evaluateRules(
  currentTime: Date,
  actualWorkingHours: number,
  assumedWorkingHours: number | undefined,
  rules: Rule[]
): Rule[] {
  return rules.filter((rule) => {
    if (!rule.enabled) return false;

    if (rule.type === 'assumed-overtime') {
      if (assumedWorkingHours === undefined) return false;
      return actualWorkingHours > assumedWorkingHours;
    }

    if (rule.type === 'time-range') {
      const hour = currentTime.getHours();
      const startHour = rule.condition.startHour;
      const endHour = rule.condition.endHour;

      if (startHour === undefined || endHour === undefined) return false;

      if (startHour < endHour) {
        return hour >= startHour && hour < endHour;
      } else {
        return hour >= startHour || hour < endHour;
      }
    }

    if (rule.type === 'weekday') {
      const dayOfWeek = rule.condition.dayOfWeek;
      if (dayOfWeek === undefined) return false;
      return currentTime.getDay() === dayOfWeek;
    }

    return false;
  });
}

export function applyPriority(matchedRules: Rule[]): number {
  if (matchedRules.length === 0) return 1.0;

  const sorted = [...matchedRules].sort((a, b) => a.priority - b.priority);
  return sorted[0].multiplier;
}
