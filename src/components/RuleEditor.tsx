import React, { useState } from 'react';
import { Rule } from '../ruleEngine';

interface RuleEditorProps {
  onAddRule: (rule: Rule) => void;
}

export const RuleEditor: React.FC<RuleEditorProps> = ({ onAddRule }) => {
  const [name, setName] = useState<string>('');
  const [type, setType] = useState<'assumed-overtime' | 'time-range' | 'weekday'>('time-range');
  const [multiplier, setMultiplier] = useState<number>(1.25);
  const [priority, setPriority] = useState<number>(1);
  const [startHour, setStartHour] = useState<number>(22);
  const [endHour, setEndHour] = useState<number>(5);

  const handleAddRule = () => {
    if (!name.trim()) {
      alert('ルール名を入力してください');
      return;
    }

    const condition: Record<string, number> = {};
    if (type === 'time-range') {
      condition.startHour = startHour;
      condition.endHour = endHour;
    }

    const newRule: Rule = {
      id: `custom-${Date.now()}`,
      name,
      type,
      condition,
      multiplier,
      priority,
      enabled: true,
    };

    onAddRule(newRule);
    setName('');
    setMultiplier(1.25);
    setPriority(1);
  };

  return (
    <div style={styles.container}>
      <h3>ルール追加</h3>
      <label style={styles.label}>
        ルール名:
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={styles.input}
          placeholder="例：午後割増"
        />
      </label>

      <label style={styles.label}>
        種類:
        <select
          value={type}
          onChange={(e) => setType(e.target.value as any)}
          style={styles.input}
        >
          <option value="time-range">時間帯</option>
          <option value="weekday">曜日</option>
          <option value="assumed-overtime">見なし超過</option>
        </select>
      </label>

      {type === 'time-range' && (
        <>
          <label style={styles.label}>
            開始時刻:
            <input
              type="number"
              min="0"
              max="23"
              value={startHour}
              onChange={(e) => setStartHour(Number(e.target.value))}
              style={styles.input}
            />
          </label>
          <label style={styles.label}>
            終了時刻:
            <input
              type="number"
              min="0"
              max="23"
              value={endHour}
              onChange={(e) => setEndHour(Number(e.target.value))}
              style={styles.input}
            />
          </label>
        </>
      )}

      <label style={styles.label}>
        倍率:
        <input
          type="number"
          step="0.05"
          min="1"
          value={multiplier}
          onChange={(e) => setMultiplier(Number(e.target.value))}
          style={styles.input}
        />
      </label>

      <label style={styles.label}>
        優先度:
        <input
          type="number"
          min="1"
          value={priority}
          onChange={(e) => setPriority(Number(e.target.value))}
          style={styles.input}
        />
      </label>

      <button onClick={handleAddRule} style={styles.addButton}>
        + ルール追加
      </button>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '15px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    marginTop: '10px',
  },
  label: {
    display: 'block',
    marginBottom: '10px',
    fontSize: '14px',
  },
  input: {
    marginLeft: '8px',
    padding: '6px',
    fontSize: '14px',
    width: '120px',
  },
  addButton: {
    padding: '10px 20px',
    fontSize: '14px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '10px',
  },
};
