import { SalaryCounter } from '../../src/salaryCounter';

describe('SalaryCounter: calculateStartDate', () => {
  it('Unit-01: 給与日31日、5月15日 → 4月1日を返す', () => {
    const counter = new SalaryCounter({
      monthlySalary: 300000,
      monthlyWorkingHours: 160,
      paymentDate: 31,
      currentDate: new Date(2026, 4, 15), // May 15
    });

    const startDate = (counter as any).calculateStartDate(31, new Date(2026, 4, 15));
    expect(startDate.getFullYear()).toBe(2026);
    expect(startDate.getMonth()).toBe(3); // April
    expect(startDate.getDate()).toBe(1);
  });

  it('Unit-02: 給与日31日、6月1日 → 5月1日を返す', () => {
    const counter = new SalaryCounter({
      monthlySalary: 300000,
      monthlyWorkingHours: 160,
      paymentDate: 31,
      currentDate: new Date(2026, 5, 1), // June 1
    });

    const startDate = (counter as any).calculateStartDate(31, new Date(2026, 5, 1));
    expect(startDate.getFullYear()).toBe(2026);
    expect(startDate.getMonth()).toBe(4); // May
    expect(startDate.getDate()).toBe(1);
  });

  it('Unit-03: 給与日28日、3月15日 → 2月1日を返す（2月は28日まで）', () => {
    const counter = new SalaryCounter({
      monthlySalary: 300000,
      monthlyWorkingHours: 160,
      paymentDate: 28,
      currentDate: new Date(2026, 2, 15), // Mar 15
    });

    const startDate = (counter as any).calculateStartDate(28, new Date(2026, 2, 15));
    expect(startDate.getFullYear()).toBe(2026);
    expect(startDate.getMonth()).toBe(1); // Feb
    expect(startDate.getDate()).toBe(1);
  });

  it('Unit-04: 給与日31日、1月15日 → 12月1日を返す（前年12月）', () => {
    const counter = new SalaryCounter({
      monthlySalary: 300000,
      monthlyWorkingHours: 160,
      paymentDate: 31,
      currentDate: new Date(2026, 0, 15), // Jan 15
    });

    const startDate = (counter as any).calculateStartDate(31, new Date(2026, 0, 15));
    expect(startDate.getFullYear()).toBe(2025);
    expect(startDate.getMonth()).toBe(11); // Dec
    expect(startDate.getDate()).toBe(1);
  });

  it('Unit-05: 給与日31日、5月31日（給与日当日） → 4月1日を返す', () => {
    const counter = new SalaryCounter({
      monthlySalary: 300000,
      monthlyWorkingHours: 160,
      paymentDate: 31,
      currentDate: new Date(2026, 4, 31), // May 31 (payment day)
    });

    const startDate = (counter as any).calculateStartDate(31, new Date(2026, 4, 31));
    expect(startDate.getFullYear()).toBe(2026);
    expect(startDate.getMonth()).toBe(3); // April
    expect(startDate.getDate()).toBe(1);
  });
});
