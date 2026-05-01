import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SalaryCounterComponent } from '../../src/SalaryCounterComponent';

describe('E2E: SalaryCounterComponent', () => {
  it('E2E-01: UI 秒給表示更新', async () => {
    render(<SalaryCounterComponent />);

    // 初期表示確認
    expect(screen.getAllByText(/秒給/)[0]).toBeInTheDocument();
    expect(screen.getByText(/累計給与/)).toBeInTheDocument();
    const startButton = screen.getByRole('button', { name: /開始/ });
    expect(startButton).toBeInTheDocument();
  });

  it('E2E-02: ルール追加 → リアルタイム反映', async () => {
    render(<SalaryCounterComponent />);

    // ルール追加フォーム確認
    const ruleNameInput = screen.getByPlaceholderText('例：午後割増');
    expect(ruleNameInput).toBeInTheDocument();

    // ルール名入力
    fireEvent.change(ruleNameInput, { target: { value: 'テストルール' } });

    // ルール追加ボタン
    const addButton = screen.getByText('+ ルール追加');
    fireEvent.click(addButton);

    // ルール一覧に追加されたか確認
    await waitFor(() => {
      expect(screen.getByText('テストルール')).toBeInTheDocument();
    });
  });

  it('E2E-03: 開始/停止機能', async () => {
    render(<SalaryCounterComponent />);

    const startButton = screen.getByRole('button', { name: /開始/ });
    fireEvent.click(startButton);

    // 停止ボタンに変化
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /停止/ })).toBeInTheDocument();
    });

    const stopButton = screen.getByRole('button', { name: /停止/ });
    fireEvent.click(stopButton);

    // 開始ボタンに戻る
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /開始/ })).toBeInTheDocument();
    });
  });
});
