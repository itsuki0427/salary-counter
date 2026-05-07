# Tasks: 秒給与動的計算モデル実装

## 実装の順序

TDD 原則：テストが先に書ける粒度に分解。ドメイン関数 → 状態管理 → React UI の順で実装。

---

## Task 1: ruleEngine.ts 実装 + Unit テスト

_Requirements: FR-2, FR-3, AC-2.1-2.3, AC-3.1-3.2_

- [ ] Task 1
  
  **File**: `src/ruleEngine.ts`
  
  **Leverage**: なし（新規）
  
  **Purpose**: ルール評価と優先度制御エンジンの実装
  
  **Prompt**:
  ```
  Role: TDD 実装者（ドメイン層）
  
  Task: ruleEngine.ts を実装する。
  
  責務:
  1. evaluateRules(currentTime, actualWorkingHours, assumedWorkingHours, rules): Rule[] 
     → 現在時刻でマッチするルール配列を返す
     → 判定ルール:
        - 見なし超過: actualWorkingHours > assumedWorkingHours
        - 時間帯: startHour <= hour < endHour（跨夜は startHour > endHour として判定）
        - 曜日: date.getDay() === dayOfWeek
     → disabled なルールは除外
  
  2. applyPriority(matchedRules): number
     → マッチしたルールから優先度が最も高い（priority が最小）ルールの multiplier を返す
     → マッチなし → 1.0
     → 複数同じ優先度 → 最初の1つを選択
  
  制約:
  - Type: TypeScript（必須）
  - 型定義: Rule インターフェースは design.md に従う
  - テスト: Unit-04〜08 をカバー（14テスト）
  
  Success Criteria:
  - 全 Unit テスト（14件）通過
  - Branch coverage >= 95%
  ```

---

## Task 2: salaryCalculator.ts 拡張 + Unit テスト

_Requirements: FR-1, AC-1.1-1.3_

- [ ] Task 2
  
  **File**: `src/salaryCalculator.ts`
  
  **Leverage**: 既存の `getOvertimeMultiplier()` 関数（time-based 倍率）を継続利用
  
  **Purpose**: 秒給動的計算とルール別残業代計算の実装
  
  **Prompt**:
  ```
  Role: TDD 実装者（ドメイン層）
  
  Task: salaryCalculator.ts の calculateSecondSalary() を拡張、calculateOvertimeSalary() を新規実装。
  
  責務:
  1. calculateSecondSalary(params):
     入力: { monthlySalary, actualWorkingSeconds, remainingWorkingSeconds, totalSalary }
     出力: number（秒給、小数点第4位まで精度）
     計算: totalSalary / (actualWorkingSeconds + remainingWorkingSeconds)
     精度: ±0.0001 円/秒以内
  
  2. calculateOvertimeSalary(params):
     入力: { monthlySalary, monthlyWorkingHours, actualWorkingHours, assumedWorkingHours, appliedRules }
     出力: number（残業代、円）
     計算: 
       - overHours = max(0, actualWorkingHours - assumedWorkingHours)
       - baseHourlyRate = monthlySalary / monthlyWorkingHours
       - overtimeSalary = overHours × baseHourlyRate × multiplier（appliedRules から）
     精度: ±1円以内
  
  制約:
  - 既存の getOvertimeMultiplier() は削除しない（後方互換）
  - Unit-01〜03, 09 をカバー
  
  Success Criteria:
  - 全 Unit テスト（4件）通過
  - calculateSecondSalary 誤差 < 0.0001 円/秒
  - calculateOvertimeSalary 誤差 < 1円
  ```

---

## Task 3: SalaryCounter クラス リファクタ + Unit/Integ テスト

_Requirements: FR-1, FR-2, AC-1.1-1.3, AC-2.2-2.3, AC-3.1-3.2_

- [ ] Task 3
  
  **File**: `src/salaryCounter.ts`
  
  **Leverage**: 既存の SalaryCounter クラス構造（骨組み継続）
  
  **Purpose**: 動的計算ロジックの統合と状態管理
  
  **Prompt**:
  ```
  Role: TDD 実装者（Application 層）
  
  Task: SalaryCounter を拡張し、新しい給与計算モデルに対応。
  
  変更内容:
  1. constructor に paymentDate: number, rules: Rule[] を追加
  2. actualWorkingSeconds: number フィールド追加（月初からの累積）
  3. getCurrentSecondSalary():
     - evaluateRules() でマッチルール取得
     - applyPriority() で倍率決定
     - calculateOvertimeSalary() で残業代計算
     - calculateSecondSalary() で動的秒給計算
  4. advanceSeconds(seconds):
     - actualWorkingSeconds += seconds
     - 秒給再計算 → 累計給与更新
  5. calculateRemainingSeconds(): 新規メソッド
     - 給与日までの予定勤務秒数を計算
     - 線形配分: (paymentDate - today) × (monthlyWorkingHours / daysInMonth) × 3600
  
  制約:
  - Unit-09, Integ-01〜04 をカバー
  - 既存テスト（6件）も継続して通過
  
  Success Criteria:
  - 全テスト（10+6=16件）通過
  - advanceSeconds() 処理時間 < 100ms
  ```

---

## Task 4: React UI 拡張（給与日 + ルール管理）+ E2E テスト

_Requirements: FR-2, FR-4, AC-2.1-2.3, AC-4.1-4.3_

- [ ] Task 4
  
  **File**: 
  - `src/SalaryCounterComponent.tsx`（既存継続、給与日 input 追加）
  - `src/components/RulesList.tsx`（新）
  - `src/components/RuleEditor.tsx`（新）
  
  **Leverage**: 既存の SalaryCounterComponent UI フレームワーク
  
  **Purpose**: UI 拡張とルール管理画面の実装
  
  **Prompt**:
  ```
  Role: TDD 実装者（Presentation 層）
  
  Task: SalaryCounterComponent を拡張し、ルール管理 UI を追加。
  
  実装内容:
  1. SalaryCounterComponent:
     - 給与日 input（<input type="date">）
     - ルール管理セクション（RulesList, RuleEditor）
     - 初期化時に 3つのデフォルトルール（見なし超過、深夜、日曜）をセット
  
  2. RulesList コンポーネント:
     - ルール一覧表示（名前、条件、倍率）
     - トグル（有効/無効切り替え）
     - 削除ボタン
     - ルール変更時に SalaryCounter に反映
  
  3. RuleEditor コンポーネント:
     - ルール追加フォーム
     - 入力フィールド: name, type（dropdown）, condition（条件別）, multiplier, priority
     - バリデーション: startHour < endHour 等
     - 保存ボタン → RulesList に反映
  
  制約:
  - E2E-01〜05 をカバー
  - 既存の「開始/停止/リセット」機能は継続
  
  Success Criteria:
  - 全 E2E テスト（5件）通過
  - ルール変更 → 秒給自動更新（ラグ < 100ms）
  - UI レスポンス（input → 秒給表示更新）< 500ms
  ```

---

## Task 5: Integ テスト実装

_Requirements: 全 FR, 全 AC_

- [ ] Task 5
  
  **File**: `tests/integration/salaryCounterWithRules.test.ts`
  
  **Leverage**: 既存の Jest テストフレームワーク
  
  **Purpose**: ドメイン + Application 層の統合テスト
  
  **Prompt**:
  ```
  Role: TDD 実装者（テスト層）
  
  Task: Integ テスト 4件を実装（Integ-01〜04）。
  
  テストケース:
  1. ルール追加 → 秒給再計算（Integ-01）
  2. 複数ルール複合（日曜の深夜）（Integ-02）
  3. 給与日前後の秒給遷移（Integ-03）
  4. ルール有効/無効切り替え（Integ-04）
  
  各テストで SalaryCounter インスタンスを作成し、
  ルール追加/削除 → advanceSeconds() → 秒給検証 の流れ。
  
  制約:
  - Jest + React Testing Library を使用
  - テスト実行時間 < 5秒（全 Integ）
  
  Success Criteria:
  - 全 Integ テスト（4件）通過
  ```

---

## Task 6: E2E テスト実装

_Requirements: 全 FR, 全 AC_

- [ ] Task 6
  
  **File**: `tests/e2e/salaryCounterApp.test.tsx`
  
  **Leverage**: React Testing Library（ユーザーイベント）
  
  **Purpose**: UI ユーザーフロー検証
  
  **Prompt**:
  ```
  Role: TDD 実装者（E2E テスト）
  
  Task: E2E テスト 5件を実装（E2E-01〜05）。
  
  テストケース:
  1. 給与日入力 → 秒給表示更新（E2E-01）
  2. ルール追加 → リアルタイム反映（E2E-02）
  3. 優先度変更 → 秒給再計算（E2E-03）
  4. 時刻進行（22:00 境界）による自動更新（E2E-04）
  5. 複雑シナリオ（見なし超過 + 深夜）（E2E-05）
  
  各テストでコンポーネント render → ユーザー操作 → 表示検証。
  
  制約:
  - screen.getByText, fireEvent, userEvent を使用
  - 時刻進行は new Date() mock で対応
  
  Success Criteria:
  - 全 E2E テスト（5件）通過
  ```

---

## 実装確認チェックリスト

実装完了後に確認:

- [ ] 全 Unit テスト（14件）通過
- [ ] 全 Integ テスト（4件）通過
- [ ] 全 E2E テスト（5件）通過
- [ ] 既存テスト（17件）も継続通過
- [ ] カバレッジ: 秒給計算 Line 100%, Branch 100%
- [ ] カバレッジ: ルール評価 Line 95%, Branch 95%
- [ ] npm run build で production build 成功
- [ ] http://localhost:5174 で動作確認（UI + リアルタイムカウント）

---

## Notes

- Task 1-3 はドメイン層中心なので、並列実装可能
- Task 4 は Task 3（SalaryCounter）完了後に開始
- Task 5-6 は各実装タスク完了に合わせて並列実装
- 各 Task の Prompt は spec-implementer へのフォワーディング時に使用
