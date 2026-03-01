/**
 * @file database.ts
 * @description SQLiteデータベースの初期化と接続を管理するモジュール
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// データベースファイルの保存先ディレクトリを作成
const データディレクトリ = path.join(__dirname, '..', 'data');
if (!fs.existsSync(データディレクトリ)) {
  fs.mkdirSync(データディレクトリ, { recursive: true });
}

// データベースへの接続
const データベースパス = path.join(データディレクトリ, 'database.sqlite');
const データベース = new Database(データベースパス);

/**
 * データベースの初期化処理
 * ユーザーテーブルが存在しない場合は作成します。
 */
export const 初期化 = () => {
  const テーブル作成クエリ = `
    CREATE TABLE IF NOT EXISTS ユーザー (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ユーザー名 TEXT UNIQUE NOT NULL,
      パスワードハッシュ TEXT NOT NULL,
      作成日時 DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  データベース.exec(テーブル作成クエリ);
};

export default データベース;
