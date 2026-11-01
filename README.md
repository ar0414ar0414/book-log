# Folio

読んだ本を記録し、引用を保存し、AI と対話しながら読書を振り返る PWA。

スマートフォンでの利用を前提にしたレイアウトで、ホーム画面に追加するとアプリとして動作します。

## 主な機能

- **本棚** — Google Books 検索・ISBN バーコードスキャンからの登録、積読/読中/読了の管理、読書ページ数の記録
- **引用** — 本の一文を保存し、タグ付け・お気に入り・横断検索
- **写真** — 本のページを撮影して保存、AI による OCR でテキスト抽出、そのまま引用化
- **AI 対話** — 書籍情報と保存した引用を文脈に、本について AI と対話。読書記録や要約の生成
- **統計** — 年ごとの読了冊数、月別ペース、ジャンル・著者の傾向、平均読了日数

## 技術構成

| 領域 | 使用技術 |
|---|---|
| フレームワーク | Next.js 16 (App Router) / React 19 |
| スタイル | Tailwind CSS 4 |
| DB | Supabase (PostgreSQL) + Drizzle ORM |
| 認証 | Supabase Auth (Google OAuth) |
| ストレージ | Supabase Storage（非公開バケット + 署名付き URL） |
| AI | Gemini (`gemini-2.5-flash`) / Claude (`claude-haiku-4-5`) を設定で切り替え |
| ホスティング | Vercel |
| テスト | Vitest |

Node.js は 24 系を使います（Vercel のランタイムに合わせています）。

## セットアップ

### 1. 依存のインストール

```bash
npm ci
```

### 2. 環境変数

`.env.local.example` をコピーして `.env.local` を作り、値を埋めます。

```bash
cp .env.local.example .env.local
```

| 変数 | 必須 | 用途 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase プロジェクト URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon キー |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | サーバー側の管理操作 |
| `DATABASE_URL` | ✅ | Drizzle からの接続（**後述の注意点を参照**） |
| `GEMINI_API_KEY` | △ | Gemini プロバイダーを有効にする |
| `ANTHROPIC_API_KEY` | △ | Claude プロバイダーを有効にする |
| `GOOGLE_BOOKS_API_KEY` | △ | 無くても検索は動くが制限が緩くなる |
| `CRON_SECRET` | △ | keep-alive Cron の認証用。**本番 (Vercel) のみ**で、ローカルでは不要 |

AI キーは最低どちらか 1 つあれば動きます。設定画面に表示されるプロバイダーは
`GET /api/ai/providers` がキーの有無から判定しています。

### 3. データベース

スキーマは `supabase/migrations/*.sql` を Supabase の SQL Editor で順に実行して作ります。
**`npm run db:migrate` は使えません**（後述）。

ストレージは `book-photos` バケットを**非公開**で作成し、`supabase/migrations/004_photos_private_bucket.sql`
のポリシーを適用します。

### 4. 起動

```bash
npm run dev
```

初回ログイン時に、引用用のデフォルトタグ 8 件が自動で作成されます（`app/auth/callback/route.ts`）。

## ⚠️ 注意点

知らないと必ず詰まる点です。

### `npm run db:migrate` は動きません

テーブルは `supabase/migrations/001_initial.sql` を手で流して作られており、Drizzle 側の
管理テーブル `drizzle.__drizzle_migrations` が空のままです。この状態で `db:migrate` を実行すると
`drizzle/0000_*.sql` の `CREATE TABLE` から適用しにいき、既存テーブルと衝突します。

**スキーマ変更の手順:**

1. `db/schema.ts` を編集
2. `npm run db:generate` で `drizzle/` に差分 SQL を生成（レビュー用）
3. 同じ内容を `supabase/migrations/` に連番の `.sql` として追加
4. その SQL を Supabase の SQL Editor で実行

Drizzle の journal をベースライン化すれば `db:migrate` を使えるようになりますが、現状は未対応です。

### `DATABASE_URL` は Connection Pooler を使う

Supabase の直接接続 (`db.<ref>.supabase.co:5432`) は **IPv6 のみ**です。
IPv6 が通らない環境では名前解決に失敗して接続できません。

- **ローカル**: Session pooler (`aws-1-ap-northeast-1.pooler.supabase.com:5432`)
- **本番 (Vercel)**: Transaction pooler (`:6543`) ※サーバーレスは接続数が多いため

ユーザー名は直接接続の `postgres` ではなく `postgres.<project-ref>` になります。
URL は Supabase ダッシュボードの Connect から取得してください。

なお `lib/db.ts` では Pool の上限を 5 に制限し、dev では HMR で Pool が増殖しないよう使い回しています。

### 写真は署名付き URL で配信する

`book-photos` バケットは**非公開**です。公開 URL (`getPublicUrl`) は機能しません。
読み取り時に `lib/supabase/photo-urls.ts` の `withSignedUrls()` で署名付き URL（有効期限 1 時間）を
発行してください。`photos` テーブルに URL 列は無く、`storage_path` から都度生成します。

ストレージのパスは `<user_id>/<book_id>/<uuid>-<filename>` で、RLS ポリシーが先頭フォルダを
`auth.uid()` と突き合わせて所有者のみに読み取りを許可しています。

### ビルドには Supabase の公開環境変数が必要

`/login` は静的プリレンダリングされ、その中で Supabase クライアントを生成するため、
`NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` が無いとビルドが失敗します。
CI では疎通確認が目的ではないのでダミー値を渡しています（`.github/workflows/ci.yml`）。

## スクリプト

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバー |
| `npm run build` / `npm start` | 本番ビルド / 起動 |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Vitest（1 回実行） |
| `npm run test:watch` | Vitest（監視） |
| `npm run db:generate` | スキーマ差分から SQL 生成 |

`db:*` は `.env.local` を読み込むよう `node --env-file-if-exists` を経由しています。

## テストと CI

`__tests__/` に純粋なロジックのテストを置いています。コンポーネントのレンダリングテストは
まだありません。追加する場合は `@vitejs/plugin-react-swc` + `jsdom` + `@testing-library/react` を入れてください
（`vitest.config.mts` のコメント参照）。

GitHub Actions で `typecheck → lint → test → build` を実行します。

ESLint の既知の違反は `eslint-suppressions.json` に記録済みです。**新しく増えた違反は CI で落ちます**。
記録されているのは `react-hooks/set-state-in-effect` の 4 件で、いずれも localStorage の読み出しや
props 由来の状態リセットによるものです。未解決の課題として残しています。

## デプロイ

Vercel の GitHub 連携により `main` への push で自動デプロイされます。

Supabase の無料プランは 7 日間アクセスが無いとプロジェクトが自動停止するため、
`vercel.json` の Cron で毎日 `GET /api/cron/keep-alive` を叩いています（18:00 UTC = 翌 03:00 JST）。
このエンドポイントは `CRON_SECRET` による Bearer 認証を要求します。

## ディレクトリ構成

```
app/
  (app)/          認証後の画面（本棚・引用・統計・設定）
  (auth)/login/   ログイン
  api/            API ルート
  auth/callback/  OAuth コールバック（初回のデフォルトタグ投入もここ）
components/       UI コンポーネント
db/schema.ts      Drizzle スキーマ
drizzle/          Drizzle が生成した SQL（レビュー用・適用はしない）
supabase/migrations/  本番に適用する SQL（こちらが正）
lib/              Supabase / AI / DB クライアントと純粋ロジック
__tests__/        Vitest
```
