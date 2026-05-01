import { calculateSecondSalary, getOvertimeMultiplier } from './salaryCalculator';

interface SalaryCounterConfig {
  monthlySalary: number;
  monthlyWorkingHours: number;
  fixedWorkingHours?: number;
  currentDate: Date;
}

export class SalaryCounter {
  private monthlySalary: number;
  private monthlyWorkingHours: number;
  private fixedWorkingHours?: number;
  private currentDate: Date;
  private accumulatedSalary: number = 0;

  constructor(config: SalaryCounterConfig) {
    this.monthlySalary = config.monthlySalary;
    this.monthlyWorkingHours = config.monthlyWorkingHours;
    this.fixedWorkingHours = config.fixedWorkingHours;
    this.currentDate = new Date(config.currentDate);
  }

  getAccumulatedSalary(): number {
    return this.accumulatedSalary;
  }

  getCurrentSecondSalary(): number {
    // 現在の実装: 見なし残業モード（時間ベース）を秒単位で計算
    // TODO: Task 3 で動的計算+ルール評価に置き換え
    let divisorHours = this.monthlyWorkingHours;
    if (this.fixedWorkingHours) {
      divisorHours =
        this.monthlyWorkingHours > this.fixedWorkingHours
          ? this.monthlyWorkingHours
          : this.fixedWorkingHours;
    }

    const totalSecondSalaryParams = {
      monthlySalary: this.monthlySalary,
      actualWorkingSeconds: divisorHours * 3600,
      remainingWorkingSeconds: 0,
      totalSalary: this.monthlySalary,
    };

    const baseSecondSalary = calculateSecondSalary(totalSecondSalaryParams);

    const hour = this.currentDate.getHours();
    const multiplier = getOvertimeMultiplier(this.currentDate, hour);

    return baseSecondSalary * multiplier;
  }

  advanceSeconds(seconds: number): void {
    const secondSalary = this.getCurrentSecondSalary();
    this.accumulatedSalary += secondSalary * seconds;

    // 時刻を進める
    this.currentDate.setSeconds(this.currentDate.getSeconds() + seconds);
  }
}
