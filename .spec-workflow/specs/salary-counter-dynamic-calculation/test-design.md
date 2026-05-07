# Test Design: 秒給与動的計算モデル

## カバレッジマトリクス

| FR | AC | Unit | Integ | E2E | 備考 |
|---|---|---|---|---|---|
| **FR-1: 秒給動的計算** | AC-1.1 | ✓ | ✓ | - | calculateSecondSalary() の精度検証 |
| | AC-1.2 | ✓ | ✓ | - | 残業代計算の反映確認 |
| | AC-1.3 | ✓ | ✓ | ✓ | 時刻変更→秒給自動更新 |
| **FR-2: ルール組み立て** | AC-2.1 | ✓ | - | ✓ | デフォルトルール初期化 |
| | AC-2.2 | ✓ | ✓ | ✓ | ルール追加 → 反映確認 |
| | AC-2.3 | ✓ | - | ✓ | ルール有効/無効トグル |
| **FR-3: 複数ルール優先度** | AC-3.1 | ✓ | ✓ | - | applyPriority() の優先度判定 |
| | AC-3.2 | ✓ | ✓ | ✓ | 優先度変更 → 秒給再計算 |
| **FR-4: UI 拡張** | AC-4.1 | - | ✓ | ✓ | 給与日入力フィールド |
| | AC-4.2 | - | ✓ | ✓ | 見なし時間フィールド |
| | AC-4.3 | - | - | ✓ | ルール管理画面 UX |

---

## テストシナリオ

### Unit Tests

#### Unit-01: calculateSecondSalary() - 動的計算精度

```
Given: 月給 300,000円、当月勤務予定 160h、受取額 300,000円
       実勤務 30h、残り予定 130h
When: calculateSecondSalary() を呼び出す
Then: 秒給 = 300,000 ÷ ((30×3600) + (130×3600))
     秒給 ≈ 0.5208円/秒（小数点第4位まで正確）
```

#### Unit-02: calculateSecondSalary() - 残業代反映

```
Given: 月給 300,000円、受取額 320,000円（残業代 20,000円含む）
       実勤務 50h、残り予定 110h
When: calculateSecondSalary() を呼び出す
Then: 秒給 = 320,000 ÷ ((50×3600) + (110×3600))
     秒給 > Unit-01 のケース
```

#### Unit-03: calculateOvertimeSalary() - 見なし超過

```
Given: 月給 300,000円、見なし 45h、実勤務 50h
When: calculateOvertimeSalary() を呼び出す
Then: 残業代 = 5h × (300,000/160/3600) × 1.0
```

#### Unit-04: evaluateRules() - ルール判定（時間帯）

```
Given: 現在時刻 23:30、ルール（深夜 22-5時）
When: evaluateRules() を呼び出す
Then: 深夜ルールがマッチ
```

#### Unit-05: evaluateRules() - ルール判定（曜日）

```
Given: 現在曜日 0（日曜）、ルール（日曜）
When: evaluateRules() を呼び出す
Then: 日曜ルールがマッチ
```

#### Unit-06: evaluateRules() - 見なし超過判定

```
Given: 見なし 45h、実勤務 50h、ルール（見なし超過）
When: evaluateRules() を呼び出す
Then: 見なし超過ルールがマッチ
```

#### Unit-07: applyPriority() - 優先度制御（最大値優先）

```
Given: マッチルール 3件（優先度 1:1.25, 2:1.25, 3:1.0）
When: applyPriority() を呼び出す
Then: 優先度 1 のルール（1.25）が選択される
```

#### Unit-08: applyPriority() - マッチなし

```
Given: マッチルール 0件
When: applyPriority() を呼び出す
Then: 倍率 1.0 を返す
```

#### Unit-09: SalaryCounter.advanceSeconds() - 秒給積算

```
Given: 秒給 0.5208円/秒、3秒経過
When: advanceSeconds(3) を呼び出す
Then: 累計給与 += 0.5208 × 3 ≈ 1.5624円
```

#### Unit-10: validateRule() - ルールバリデーション

```
Given: startHour=22, endHour=5（時間帯ルール）
When: validateRule() を呼び出す
Then: エラー「endHour は startHour より後である必要があります」
```

### Integration Tests

#### Integ-01: ルール追加 → 秒給再計算

```
Given: SalaryCounter インスタンス、ルール追加操作
When: 新ルール「金曜 18-22時 1.15倍」を追加 → advanceSeconds()
Then: マッチ時に秒給に 1.15倍が適用される
```

#### Integ-02: 複数ルール複合（日曜の深夜）

```
Given: 日曜 23:30、日曜1.25倍 + 深夜1.25倍ルール
When: advanceSeconds(1) × 複数回
Then: 最優先ルールの倍率が一貫して適用
```

#### Integ-03: 給与日前後の秒給遷移

```
Given: 給与日 31日、月勤務 160h、15日時点で 80h 経過
When: 15日 → 16日 → ... → 31日 と日が進む
Then: 秒給が日々増加（残りの予定勤務秒数が減少）
```

#### Integ-04: ルール有効/無効切り替え

```
Given: 深夜ルール有効、22時
When: 深夜ルール を disable
Then: 秒給が倍率なし（1.0）で計算される
```

### E2E Tests

#### E2E-01: UI 給与日入力 → 秒給表示更新

```
Given: ユーザーが日付入力フィールドで「15」を選択
When: 入力が確定
Then: 「残り勤務秒数」が再計算され、秒給が更新される
```

#### E2E-02: UI ルール追加 → リアルタイム反映

```
Given: ルール管理画面でユーザーが新ルール追加
When: 「保存」をタップ
Then: リアルタイムカウンター画面で新ルール倍率が反映
      （時刻がマッチすれば秒給が変わる）
```

#### E2E-03: ルール優先度変更 → 秒給再計算

```
Given: 複数ルール設定、優先度順序を変更
When: 「保存」をタップ
Then: カウント画面で秒給が新優先度に従って再計算
```

#### E2E-04: 時刻進行による自動更新（22:00 境界）

```
Given: アプリが起動、現在時刻 21:59:30
When: リアルタイムカウントが進行し 22:00:00 に到達
Then: 秒給が自動的に深夜倍率（1.25倍）に更新
```

#### E2E-05: 複雑シナリオ（見なし超過 + 深夜）

```
Given: 見なし 45h、実勤務 50h + 見なし超過時に深夜労働
When: 23:00 時点でカウント
Then: 秒給 = (月給 + 残業代) ÷ 残り勤務秒 × 深夜倍率（1.25）
     計算結果が精度基準（±1円/月）内
```

---

## テストファイル構成

```
tests/
├── unit/
│   ├── salaryCalculator.test.ts         （Unit-01〜03, 09）
│   ├── ruleEngine.test.ts               （Unit-04〜08）
│   └── salaryCounter.test.ts            （Unit-09）
├── integration/
│   └── salaryCounterWithRules.test.ts   （Integ-01〜04）
└── e2e/
    └── salaryCounterApp.test.tsx        （E2E-01〜05）
```

---

## テスト ID 体系

- Unit: `Unit-01`, `Unit-02`, ... （ドメイン関数の単位テスト）
- Integ: `Integ-01`, `Integ-02`, ... （ルール適用と秒給再計算の統合）
- E2E: `E2E-01`, `E2E-02`, ... （UI ユーザーフロー検証）

---

## カバレッジ目標

| 対象 | 目標 | 根拠 |
|---|---|---|
| 秒給計算関数 | Line: 100%, Branch: 100% | 給与計算の精度が最優先 |
| ルール評価関数 | Line: 95%, Branch: 95% | 複数ルール複合のエッジケース |
| React コンポーネント | Line: 80%, Branch: 75% | UI テストコストと実利のバランス |

---

## 成功基準

| クライテリア | 判定基準 |
|---|---|
| **精度テスト** | 全 Unit テストが通過、秒給計算誤差 ≤ 0.0001 円/秒 |
| **ルール評価** | 全 Integ テストが通過、複数ルール複合でも一貫した倍率適用 |
| **UI ユーザーフロー** | 全 E2E テストが通過、ユーザー操作が秒給に正確に反映 |
| **非機能要件** | テスト実行時間 < 5秒、秒給再計算時間 < 100ms |

---

## テスト不実施の判定

| 対象 | 理由 |
|---|---|
| ローカルストレージ永続化 | Out of Scope（本仕様に未含） |
| クラウド同期 | Out of Scope |
| 多言語表示 | Out of Scope |
