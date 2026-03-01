/**
 * @file auth.ts
 * @description パスワードのハッシュ化およびJWT認証トークンの生成と検証を行うモジュール
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// セキュリティのためのシークレットキーとソルトのラウンド数
const ソルトラウンド = 10;
const シークレットキー = process.env.JWT_SECRET || 'デフォルトのシークレットキー';

/**
 * 平文のパスワードをハッシュ化します。
 * @param 平文パスワード - ハッシュ化する元のパスワード
 * @returns ハッシュ化されたパスワードの文字列
 */
export const パスワードをハッシュ化 = async (平文パスワード: string): Promise<string> => {
  return await bcrypt.hash(平文パスワード, ソルトラウンド);
};

/**
 * 入力されたパスワードがハッシュ化されたパスワードと一致するか検証します。
 * @param 入力パスワード - 検証する平文のパスワード
 * @param 保存されたハッシュ - データベースに保存されているハッシュ化されたパスワード
 * @returns 一致する場合はtrue、それ以外はfalse
 */
export const パスワードを検証 = async (入力パスワード: string, 保存されたハッシュ: string): Promise<boolean> => {
  return await bcrypt.compare(入力パスワード, 保存されたハッシュ);
};

/**
 * 認証成功後にクライアントへ返すJWTトークンを生成します。
 * @param ユーザーID - トークンに含めるユーザーのID
 * @param ユーザー名 - トークンに含めるユーザー名
 * @returns 生成されたJWTトークン文字列
 */
export const トークンを生成 = (ユーザーID: number, ユーザー名: string): string => {
  const ペイロード = { id: ユーザーID, ユーザー名 };
  return jwt.sign(ペイロード, シークレットキー, { expiresIn: '24h' } as jwt.SignOptions);
};

/**
 * クライアントから送信されたJWTトークンを検証し、ペイロードを返します。
 * @param トークン - 検証するJWTトークン文字列
 * @returns 検証成功時はペイロードのオブジェクト、失敗時はnull
 */
export const トークンを検証 = (トークン: string): any | null => {
  try {
    return jwt.verify(トークン, シークレットキー);
  } catch (エラー) {
    return null;
  }
};
