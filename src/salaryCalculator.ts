export interface CalculateSecondSalaryParams {
  monthlySalary: number;
  actualWorkingSeconds: number;
  remainingWorkingSeconds: number;
  totalSalary: number;
}

export function calculateSecondSalary(params: CalculateSecondSalaryParams): number {
  const totalSeconds = params.actualWorkingSeconds + params.remainingWorkingSeconds;
  if (totalSeconds <= 0) {
    throw new Error('実勤務秒 + 残り予定秒は0より大きい必要があります');
  }
  return params.totalSalary / totalSeconds;
}

import { Rule } from './ruleEngine';

export interface CalculateOvertimeSalaryParams {
  monthlySalary: number;
  monthlyWorkingHours: number;
  actualWorkingHours: number;
  assumedWorkingHours?: number;
  appliedRules: Rule[];
}

export function calculateOvertimeSalary(params: CalculateOvertimeSalaryParams): number {
  const { monthlySalary, monthlyWorkingHours, actualWorkingHours, assumedWorkingHours, appliedRules } = params;

  if (!appliedRules || appliedRules.length === 0) {
    return 0;
  }

  if (assumedWorkingHours === undefined) {
    return 0;
  }

  const overHours = Math.max(0, actualWorkingHours - assumedWorkingHours);
  if (overHours <= 0) {
    return 0;
  }

  const baseHourlyRate = monthlySalary / monthlyWorkingHours;

  // 最優先ルール（priority最小）の倍率を使用
  const sortedRules = [...appliedRules].sort((a, b) => a.priority - b.priority);
  const multiplier = sortedRules[0]?.multiplier ?? 1.0;

  return overHours * baseHourlyRate * multiplier;
}

export function getOvertimeMultiplier(date: Date, hour: number = 0): number {
  const dayOfWeek = date.getDay();

  // 日曜（0）は1.25倍
  if (dayOfWeek === 0) return 1.25;

  // 夜間（22時～5時）は1.25倍
  if (hour >= 22 || hour < 5) return 1.25;

  // デフォルト：倍率なし
  return 1.0;
}
