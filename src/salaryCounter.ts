import { calculateSecondSalary, calculateOvertimeSalary, getOvertimeMultiplier } from './salaryCalculator';
import { evaluateRules, applyPriority, Rule } from './ruleEngine';

interface SalaryCounterConfig {
  monthlySalary: number;
  monthlyWorkingHours: number;
  fixedWorkingHours?: number;
  paymentDate?: number;
  rules?: Rule[];
  currentDate: Date;
}

export class SalaryCounter {
  private monthlySalary: number;
  private monthlyWorkingHours: number;
  private fixedWorkingHours?: number;
  private paymentDate: number;
  private rules: Rule[];
  private currentDate: Date;
  private accumulatedSalary: number = 0;
  private actualWorkingSeconds: number = 0;

  constructor(config: SalaryCounterConfig) {
    this.monthlySalary = config.monthlySalary;
    this.monthlyWorkingHours = config.monthlyWorkingHours;
    this.fixedWorkingHours = config.fixedWorkingHours;
    this.paymentDate = config.paymentDate ?? 31;
    this.rules = config.rules ?? [];
    this.currentDate = new Date(config.currentDate);
  }

  getAccumulatedSalary(): number {
    return this.accumulatedSalary;
  }

  getCurrentSecondSalary(): number {
    // ルール評価
    const actualWorkingHours = this.actualWorkingSeconds / 3600;
    const matchedRules = evaluateRules(
      this.currentDate,
      actualWorkingHours,
      this.fixedWorkingHours,
      this.rules
    );

    // 優先度適用
    const multiplier = applyPriority(matchedRules);

    // 残業代計算
    const overtimeSalary = calculateOvertimeSalary({
      monthlySalary: this.monthlySalary,
      monthlyWorkingHours: this.monthlyWorkingHours,
      actualWorkingHours,
      assumedWorkingHours: this.fixedWorkingHours,
      appliedRules: matchedRules,
    });

    // 動的秒給計算
    const totalSalary = this.monthlySalary + overtimeSalary;
    const remainingSeconds = this.calculateRemainingSeconds();

    return calculateSecondSalary({
      monthlySalary: this.monthlySalary,
      actualWorkingSeconds: this.actualWorkingSeconds,
      remainingWorkingSeconds: remainingSeconds,
      totalSalary,
    }) * multiplier;
  }

  advanceSeconds(seconds: number): void {
    const secondSalary = this.getCurrentSecondSalary();
    this.accumulatedSalary += secondSalary * seconds;
    this.actualWorkingSeconds += seconds;

    // 時刻を進める
    this.currentDate.setSeconds(this.currentDate.getSeconds() + seconds);
  }

  calculateRemainingSeconds(): number {
    const now = this.currentDate;
    const currentDate = now.getDate();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // 給与日の Date オブジェクト
    const paymentDateObj = new Date(currentYear, currentMonth, this.paymentDate);

    // 給与日が過ぎていたら来月の給与日
    if (paymentDateObj < now) {
      paymentDateObj.setMonth(paymentDateObj.getMonth() + 1);
    }

    // 日数差分
    const daysRemaining = paymentDateObj.getDate() - currentDate + 1;

    // 線形配分：月勤務時間 / 月日数
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const secondsPerDay = (this.monthlyWorkingHours * 3600) / daysInMonth;

    return Math.max(0, daysRemaining * secondsPerDay);
  }

  updateRules(rules: Rule[]): void {
    this.rules = rules;
  }

  setCurrentDate(date: Date): void {
    this.currentDate = new Date(date);
  }
}
