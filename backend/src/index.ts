/**
 * @file index.ts
 * @description Expressを使用したログイン認証バックエンドのエントリポイント
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import データベース, { 初期化 } from './database';
import { パスワードをハッシュ化, パスワードを検証, トークンを生成, トークンを検証 } from './auth';

dotenv.config();

// データベースの初期化
初期化();

// テストユーザーのシード
const テストユーザーをシード = async () => {
  const テストユーザー名 = 'test';
  const テストパスワード = 'password';

  try {
    const ユーザー確認クエリ = データベース.prepare('SELECT id FROM ユーザー WHERE ユーザー名 = ?');
    const 既存ユーザー = ユーザー確認クエリ.get(テストユーザー名);

    if (!既存ユーザー) {
      const ハッシュ = await パスワードをハッシュ化(テストパスワード);
      const ユーザー登録クエリ = データベース.prepare('INSERT INTO ユーザー (ユーザー名, パスワードハッシュ) VALUES (?, ?)');
      ユーザー登録クエリ.run(テストユーザー名, ハッシュ);
      console.log(`テストユーザー ('${テストユーザー名}', パスワード: '${テストパスワード}') を作成しました。`);
    } else {
      console.log(`テストユーザー ('${テストユーザー名}') は既に存在します。`);
    }
  } catch (エラー) {
    console.error('テストユーザーの作成中にエラーが発生しました:', エラー);
  }
};
テストユーザーをシード();

const アプリ = express();
const ポート番号 = process.env.PORT || 3000;

// JSONリクエストボディのパースとCORS設定
アプリ.use(cors());
アプリ.use(express.json());

/**
 * ユーザー登録API
 * クライアントから送信されたユーザー名とパスワードをもとに新規ユーザーを作成します。
 */
アプリ.post('/api/signup', async (リクエスト: Request, レスポンス: Response): Promise<void> => {
  const { ユーザー名, パスワード } = リクエスト.body;

  if (!ユーザー名 || !パスワード) {
    レスポンス.status(400).json({ エラー: 'ユーザー名とパスワードは必須です' });
    return;
  }

  try {
    // ユーザー名が既に存在するか確認
    const ユーザー確認クエリ = データベース.prepare('SELECT id FROM ユーザー WHERE ユーザー名 = ?');
    const 既存ユーザー = ユーザー確認クエリ.get(ユーザー名);

    if (既存ユーザー) {
      レスポンス.status(409).json({ エラー: 'そのユーザー名は既に使用されています' });
      return;
    }

    // パスワードをハッシュ化して保存
    const ハッシュ = await パスワードをハッシュ化(パスワード);
    const ユーザー登録クエリ = データベース.prepare('INSERT INTO ユーザー (ユーザー名, パスワードハッシュ) VALUES (?, ?)');
    const 結果 = ユーザー登録クエリ.run(ユーザー名, ハッシュ);

    const 新規ユーザーID = 結果.lastInsertRowid as number;
    const トークン = トークンを生成(新規ユーザーID, ユーザー名);

    レスポンス.status(201).json({ メッセージ: 'ユーザー登録が完了しました', トークン });
  } catch (エラー) {
    console.error('ユーザー登録エラー:', エラー);
    レスポンス.status(500).json({ エラー: 'サーバー内部エラーが発生しました' });
  }
});

/**
 * ログイン認証API
 * クライアントから送信されたユーザー名とパスワードを検証し、正しければJWTを返します。
 */
アプリ.post('/api/login', async (リクエスト: Request, レスポンス: Response): Promise<void> => {
  const { ユーザー名, パスワード } = リクエスト.body;

  if (!ユーザー名 || !パスワード) {
    レスポンス.status(400).json({ エラー: 'ユーザー名とパスワードは必須です' });
    return;
  }

  try {
    // データベースからユーザーを検索
    const ユーザー検索クエリ = データベース.prepare('SELECT * FROM ユーザー WHERE ユーザー名 = ?');
    const ユーザーデータ: any = ユーザー検索クエリ.get(ユーザー名);

    if (!ユーザーデータ) {
      レスポンス.status(401).json({ エラー: 'ユーザー名またはパスワードが間違っています' });
      return;
    }

    // パスワードのハッシュを検証
    const パスワードが一致 = await パスワードを検証(パスワード, ユーザーデータ.パスワードハッシュ);

    if (!パスワードが一致) {
      レスポンス.status(401).json({ エラー: 'ユーザー名またはパスワードが間違っています' });
      return;
    }

    // 認証成功時、トークンを生成して返す
    const トークン = トークンを生成(ユーザーデータ.id, ユーザーデータ.ユーザー名);
    レスポンス.status(200).json({ メッセージ: 'ログインに成功しました', トークン });
  } catch (エラー) {
    console.error('ログインエラー:', エラー);
    レスポンス.status(500).json({ エラー: 'サーバー内部エラーが発生しました' });
  }
});

/**
 * 認証状態確認API (プライベートエンドポイントの例)
 * Authorizationヘッダーで送信されたトークンを検証し、現在のユーザー情報を返します。
 */
アプリ.get('/api/me', (リクエスト: Request, レスポンス: Response): void => {
  const 認証ヘッダー = リクエスト.headers.authorization;

  if (!認証ヘッダー || !認証ヘッダー.startsWith('Bearer ')) {
    レスポンス.status(401).json({ エラー: '認証トークンが提供されていません' });
    return;
  }

  const トークン = 認証ヘッダー.split(' ')[1];
  const ペイロード = トークンを検証(トークン);

  if (!ペイロード) {
    レスポンス.status(401).json({ エラー: '無効なまたは期限切れのトークンです' });
    return;
  }

  レスポンス.status(200).json({ メッセージ: '認証成功', ユーザー: ペイロード });
});

// サーバー起動
アプリ.listen(ポート番号, () => {
  console.log(`バックエンドサーバーがポート ${ポート番号} で起動しました。`);
});
