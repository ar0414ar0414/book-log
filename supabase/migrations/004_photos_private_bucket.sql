-- 写真を署名付き URL 配信に切り替えた後に実行する。
--
-- ★ 実行タイミング ★
-- 署名付き URL 対応（commit b14eae8）が本番にデプロイされた後に流すこと。
-- 署名付き URL は public バケットでも動くので、この順序ならダウンタイムは出ない。
-- 逆順にすると、デプロイが終わるまで既存の写真が全部表示されなくなる。

-- 1. バケットを非公開にする（公開 URL での直接アクセスを止める）
UPDATE storage.buckets SET public = false WHERE id = 'book-photos';

-- 2. 読み取りポリシーに所有者チェックを追加する。
--    従来は bucket_id しか見ていなかったため、バケットを private にしても
--    ログインさえしていれば他人のオブジェクトに署名を発行できてしまう。
--    パスは <user_id>/<book_id>/<uuid>-<filename> なので先頭フォルダで判定する。
DROP POLICY IF EXISTS photos_select ON storage.objects;
CREATE POLICY photos_select ON storage.objects FOR SELECT
  USING (
    bucket_id = 'book-photos'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );
