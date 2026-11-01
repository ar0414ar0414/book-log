-- 写真を公開 URL ではなく署名付き URL で配信するようにしたため、
-- 公開 URL を保存していた photos.url は不要になった。
-- (値は storage_path から再構成できるため情報は失われない)
--
-- ★ 実行順序に注意 ★
-- STEP 1 は新コードのデプロイ「前」に流してよい（既存コードと互換）。
-- STEP 2 は新コードのデプロイ「後」に流すこと。先に列を消すと、
-- url を INSERT している旧コードが本番で失敗する。

-- STEP 1: 新コードは url を INSERT しないので NOT NULL を外しておく
ALTER TABLE photos ALTER COLUMN url DROP NOT NULL;

-- STEP 2: デプロイ完了後に列を削除（適用済み）
ALTER TABLE photos DROP COLUMN url;
