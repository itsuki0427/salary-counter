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
  private calculationStartDate: Date;
  private accumulatedSalary: number = 0;
  private actualWorkingSeconds: number = 0;
  private isRunning: boolean = false;

  constructor(config: SalaryCounterConfig) {
    this.monthlySalary = config.monthlySalary;
    this.monthlyWorkingHours = config.monthlyWorkingHours;
    this.fixedWorkingHours = config.fixedWorkingHours;
    this.paymentDate = config.paymentDate ?? 31;
    this.rules = config.rules ?? [];
    this.currentDate = new Date(config.currentDate);
    this.calculationStartDate = this.calculateStartDate(this.paymentDate, this.currentDate);
    this.isRunning = true; // 初期状態は実行中（テスト互換性）
  }

  private calculateStartDate(paymentDate: number, currentDate: Date): Date {
    // 給与日の前月1日が計算開始日
    // currentDate が給与日以前 → 前月の給与日の次の日
    // currentDate が給与日を過ぎた → 当月の給与日の次の日

    const current = new Date(currentDate);
    const year = current.getFullYear();
    const month = current.getMonth();
    const date = current.getDate();

    // 給与日が当月にあるかチェック
    const paymentThisMonth = new Date(year, month, paymentDate);

    if (current <= paymentThisMonth) {
      // 給与日以前 → 前月の給与日の次の日 = 前々月の末日の翌日
      const previousMonthStart = new Date(year, month - 1, 1);
      return previousMonthStart;
    } else {
      // 給与日を過ぎた → 当月の給与日の次の日 = 当月1日
      const thisMonthStart = new Date(year, month, 1);
      return thisMonthStart;
    }
  }

  getAccumulatedSalary(): number {
    // 計算開始日からの経過秒数を計算
    const elapsedMs = this.currentDate.getTime() - this.calculationStartDate.getTime();
    const elapsedSeconds = Math.max(0, elapsedMs / 1000);

    // 累計給与 = 経過秒数 × 秒給
    const secondSalary = this.getCurrentSecondSalary();
    return elapsedSeconds * secondSalary;
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
    if (!this.isRunning) return; // 実行中のみ処理

    this.actualWorkingSeconds += seconds;
    // 時刻を進める
    this.currentDate.setSeconds(this.currentDate.getSeconds() + seconds);
  }

  start(): void {
    this.isRunning = true;
    // 開始時に計算開始日を「今」にリセット
    this.resetCalculationStartDate();
  }

  stop(): void {
    this.isRunning = false;
  }

  resetCalculationStartDate(): void {
    // 現在時刻を計算開始日として設定
    this.calculationStartDate = new Date(this.currentDate);
  }

  isCounterRunning(): boolean {
    return this.isRunning;
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
