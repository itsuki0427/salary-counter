import React, { useState, useEffect, useRef } from 'react';
import { SalaryCounter } from './salaryCounter';
import { Rule } from './ruleEngine';
import { RulesList } from './components/RulesList';
import { RuleEditor } from './components/RuleEditor';

const defaultRules: Rule[] = [
  {
    id: 'assumed-overtime',
    name: '見なし超過',
    type: 'assumed-overtime',
    condition: { assumedHours: 45 },
    multiplier: 1.0,
    priority: 1,
    enabled: true,
  },
  {
    id: 'midnight',
    name: '深夜労働（22-5時）',
    type: 'time-range',
    condition: { startHour: 22, endHour: 5 },
    multiplier: 1.25,
    priority: 2,
    enabled: true,
  },
  {
    id: 'sunday',
    name: '休日労働（日曜）',
    type: 'weekday',
    condition: { dayOfWeek: 0 },
    multiplier: 1.25,
    priority: 3,
    enabled: true,
  },
];

export const SalaryCounterComponent: React.FC = () => {
  const [monthlySalary, setMonthlySalary] = useState<number>(300000);
  const [monthlyWorkingHours, setMonthlyWorkingHours] = useState<number>(160);
  const [fixedWorkingHours, setFixedWorkingHours] = useState<number | undefined>(45);
  const [paymentDate, setPaymentDate] = useState<number>(31);
  const [rules, setRules] = useState<Rule[]>(defaultRules);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [accumulatedSalary, setAccumulatedSalary] = useState<number>(0);
  const [currentSecondSalary, setCurrentSecondSalary] = useState<number>(0);

  const counterRef = useRef<SalaryCounter | null>(null);
  const intervalRef = useRef<NodeJS.Timer | null>(null);

  useEffect(() => {
    counterRef.current = new SalaryCounter({
      monthlySalary,
      monthlyWorkingHours,
      fixedWorkingHours,
      paymentDate,
      rules,
      currentDate: new Date(),
    });
    setAccumulatedSalary(0);
    updateDisplay();
  }, [monthlySalary, monthlyWorkingHours, fixedWorkingHours, paymentDate, rules]);

  useEffect(() => {
    if (isRunning && counterRef.current) {
      intervalRef.current = setInterval(() => {
        if (counterRef.current) {
          counterRef.current.advanceSeconds(1);
          updateDisplay();
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const updateDisplay = () => {
    if (counterRef.current) {
      setAccumulatedSalary(counterRef.current.getAccumulatedSalary());
      setCurrentSecondSalary(counterRef.current.getCurrentSecondSalary());
    }
  };

  const handleStartStop = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    counterRef.current = new SalaryCounter({
      monthlySalary,
      monthlyWorkingHours,
      fixedWorkingHours,
      paymentDate,
      rules,
      currentDate: new Date(),
    });
    setAccumulatedSalary(0);
    updateDisplay();
  };

  const handleAddRule = (newRule: Rule) => {
    setRules([...rules, newRule]);
  };

  const handleToggleRule = (id: string) => {
    setRules(
      rules.map((r) =>
        r.id === id ? { ...r, enabled: !r.enabled } : r
      )
    );
  };

  const handleDeleteRule = (id: string) => {
    setRules(rules.filter((r) => r.id !== id));
  };

  return (
    <div style={styles.container}>
      <h1>秒給与カウンター</h1>

      <div style={styles.inputSection}>
        <label>
          月給（円）:
          <input
            type="number"
            value={monthlySalary}
            onChange={(e) => setMonthlySalary(Number(e.target.value))}
            disabled={isRunning}
            style={styles.input}
          />
        </label>

        <label>
          月勤務時間（時間）:
          <input
            type="number"
            value={monthlyWorkingHours}
            onChange={(e) => setMonthlyWorkingHours(Number(e.target.value))}
            disabled={isRunning}
            style={styles.input}
          />
        </label>

        <label>
          見なし時間（時間、任意）:
          <input
            type="number"
            value={fixedWorkingHours || ''}
            onChange={(e) => setFixedWorkingHours(e.target.value ? Number(e.target.value) : undefined)}
            disabled={isRunning}
            style={styles.input}
            placeholder="45"
          />
        </label>

        <label>
          給与日（日）:
          <input
            type="number"
            min="1"
            max="31"
            value={paymentDate}
            onChange={(e) => setPaymentDate(Number(e.target.value))}
            disabled={isRunning}
            style={styles.input}
          />
        </label>
      </div>

      <div style={styles.rulesSection}>
        <h2>ルール管理</h2>
        <RulesList rules={rules} onToggleRule={handleToggleRule} onDeleteRule={handleDeleteRule} />
        <RuleEditor onAddRule={handleAddRule} />
      </div>

      <div style={styles.displaySection}>
        <div style={styles.displayBox}>
          <h2>秒給</h2>
          <p style={styles.largeText}>{currentSecondSalary.toFixed(4)}円/秒</p>
        </div>

        <div style={styles.displayBox}>
          <h2>累計給与</h2>
          <p style={styles.largeText}>{accumulatedSalary.toLocaleString('ja-JP', { maximumFractionDigits: 0 })}円</p>
        </div>
      </div>

      <div style={styles.controlSection}>
        <button onClick={handleStartStop} style={styles.button}>
          {isRunning ? '停止' : '開始'}
        </button>
        <button onClick={handleReset} style={styles.button}>
          リセット
        </button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    maxWidth: '600px',
    margin: '0 auto',
  },
  inputSection: {
    marginBottom: '30px',
    padding: '15px',
    border: '1px solid #ddd',
    borderRadius: '8px',
  },
  input: {
    marginLeft: '10px',
    padding: '8px',
    fontSize: '16px',
    width: '150px',
  },
  displaySection: {
    display: 'flex',
    gap: '20px',
    marginBottom: '30px',
    justifyContent: 'space-around',
  },
  displayBox: {
    padding: '20px',
    border: '2px solid #007bff',
    borderRadius: '8px',
    textAlign: 'center',
    flex: 1,
  },
  largeText: {
    fontSize: '32px',
    fontWeight: 'bold',
    margin: '10px 0',
  },
  controlSection: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
  },
  button: {
    padding: '12px 24px',
    fontSize: '16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  rulesSection: {
    marginBottom: '30px',
    padding: '15px',
    border: '1px solid #ddd',
    borderRadius: '8px',
  },
};
