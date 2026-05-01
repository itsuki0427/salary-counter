# 秒給与カウンター

リアルタイム秒単位給与累積アプリ。月給と勤務時間から、毎秒の給与カウントを表示します。

## 機能

### コア機能
- **秒給与計算**: 月給 ÷ (月勤務時間 × 3600)
- **見なし残業対応**: 見なし時間を超えた分は実作業時間ベースで再計算
- **残業代対応**: 
  - 日曜: 1.25倍
  - 夜間 (22:00-05:00): 1.25倍

### UI
- 入力: 月給、月勤務時間、見なし時間（任意）
- 表示: 現在秒給、累計給与
- 制御: 開始/停止/リセット
- リアルタイム更新（1秒毎）

## 技術スタック

- **フロントエンド**: React 19 + TypeScript
- **ビルド**: Vite
- **テスト**: Jest + React Testing Library
- **スタイル**: CSS-in-JS

## セットアップ

```bash
npm install
npm run dev      # 開発サーバー (localhost:5174)
npm test         # テスト実行
npm run build    # プロダクションビルド
```

## テスト

```bash
npm test         # 全テスト実行 (17/17 通過)
npm run test:watch
```

### テストカバレッジ

- `salaryCalculator.ts`: 11 テスト
  - 基本秒給計算
  - 見なし残業
  - 残業代（日曜・夜間）

- `salaryCounter.ts`: 6 テスト
  - 状態管理
  - 時刻進行
  - 見なし残業ロジック

## 実装詳細

### salaryCalculator.ts
- `calculateSecondSalary(monthlySalary, actualWorkingHours, fixedWorkingHours?)`
- `getOvertimeMultiplier(date, hour?)`

### salaryCounter.ts
- `SalaryCounter` クラス
  - `advanceSeconds(seconds)`: 時刻進行
  - `getCurrentSecondSalary()`: 配数反映秒給取得
  - `getAccumulatedSalary()`: 累計給与取得

### React UI
- `SalaryCounterComponent.tsx`: メインコンポーネント

## ライセンス

ISC
