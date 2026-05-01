import React from 'react';
import { Rule } from '../ruleEngine';

interface RulesListProps {
  rules: Rule[];
  onToggleRule: (id: string) => void;
  onDeleteRule: (id: string) => void;
}

export const RulesList: React.FC<RulesListProps> = ({ rules, onToggleRule, onDeleteRule }) => {
  if (rules.length === 0) {
    return <p>ルールがありません</p>;
  }

  return (
    <div style={styles.container}>
      <h3>ルール一覧</h3>
      {rules.map((rule) => (
        <div key={rule.id} style={styles.ruleItem}>
          <label style={styles.label}>
            <input
              type="checkbox"
              checked={rule.enabled}
              onChange={() => onToggleRule(rule.id)}
            />
            <span style={{ marginLeft: '8px', fontWeight: 'bold' }}>{rule.name}</span>
          </label>
          <span style={styles.details}>
            倍率: {rule.multiplier.toFixed(2)}x | 優先度: {rule.priority}
          </span>
          <button
            onClick={() => onDeleteRule(rule.id)}
            style={styles.deleteButton}
          >
            削除
          </button>
        </div>
      ))}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    marginBottom: '20px',
  },
  ruleItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px',
    borderBottom: '1px solid #eee',
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
  },
  details: {
    fontSize: '12px',
    color: '#666',
  },
  deleteButton: {
    padding: '6px 12px',
    fontSize: '12px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};
