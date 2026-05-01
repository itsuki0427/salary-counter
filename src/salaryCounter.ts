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
    const baseSecondSalary = calculateSecondSalary(
      this.monthlySalary,
      this.monthlyWorkingHours,
      this.fixedWorkingHours
    );

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
