// バックエンドのURL。必要に応じて変更してください。
const バックエンドURL = 'http://localhost:3000';

// DOM要素の取得
const ログインコンテナ = document.getElementById('ログインコンテナ');
const ハローワールドコンテナ = document.getElementById('ハローワールドコンテナ');
const ログインフォーム = document.getElementById('ログインフォーム');
const ユーザー名入力 = document.getElementById('ユーザー名');
const パスワード入力 = document.getElementById('パスワード');
const エラーメッセージ要素 = document.getElementById('エラーメッセージ');
const ログアウトボタン = document.getElementById('ログアウトボタン');

/**
 * ログイン画面とハローワールド画面の表示を切り替える
 * @param {boolean} ログイン中 - trueの場合はハローワールド画面を表示し、falseの場合はログイン画面を表示する
 */
const 画面を切り替える = (ログイン中) => {
  if (ログイン中) {
    ログインコンテナ.classList.add('hidden');
    ハローワールドコンテナ.classList.remove('hidden');
  } else {
    ログインコンテナ.classList.remove('hidden');
    ハローワールドコンテナ.classList.add('hidden');
    // 入力フィールドをクリア
    ユーザー名入力.value = '';
    パスワード入力.value = '';
    エラーメッセージ要素.textContent = '';
    エラーメッセージ要素.classList.add('hidden');
  }
};

/**
 * エラーメッセージを画面に表示する
 * @param {string} メッセージ - 表示するエラーメッセージ
 */
const エラーを表示 = (メッセージ) => {
  エラーメッセージ要素.textContent = メッセージ;
  エラーメッセージ要素.classList.remove('hidden');
};

/**
 * 保存されているトークンを使用して認証状態を確認する
 */
const 認証状態を確認する = async () => {
  const トークン = localStorage.getItem('認証トークン');
  if (!トークン) {
    画面を切り替える(false);
    return;
  }

  try {
    const レスポンス = await fetch(`${バックエンドURL}/api/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${トークン}`,
        'Content-Type': 'application/json'
      }
    });

    if (レスポンス.ok) {
      // 認証成功：ハローワールド画面を表示
      画面を切り替える(true);
      console.log('Hello World from Tauri! (認証成功)');
    } else {
      // トークンが無効または期限切れ
      localStorage.removeItem('認証トークン');
      画面を切り替える(false);
    }
  } catch (エラー) {
    console.error('認証状態の確認中にエラーが発生しました:', エラー);
    // バックエンドに接続できない場合等も一旦ログイン画面に戻す
    画面を切り替える(false);
  }
};

/**
 * ログインフォームの送信処理
 */
ログインフォーム.addEventListener('submit', async (イベント) => {
  イベント.preventDefault(); // デフォルトのフォーム送信を無効化

  const ユーザー名 = ユーザー名入力.value;
  const パスワード = パスワード入力.value;

  if (!ユーザー名 || !パスワード) {
    エラーを表示('ユーザー名とパスワードを入力してください');
    return;
  }

  try {
    const レスポンス = await fetch(`${バックエンドURL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ユーザー名, パスワード })
    });

    const データ = await レスポンス.json();

    if (レスポンス.ok) {
      // ログイン成功
      localStorage.setItem('認証トークン', データ.トークン);
      画面を切り替える(true);
      console.log('Hello World from Tauri! (ログイン成功)');
    } else {
      // ログイン失敗
      エラーを表示(データ.エラー || 'ログインに失敗しました');
    }
  } catch (エラー) {
    console.error('ログイン処理中にエラーが発生しました:', エラー);
    エラーを表示('サーバーに接続できません。バックエンドが起動しているか確認してください。');
  }
});

/**
 * ログアウトボタンの処理
 */
ログアウトボタン.addEventListener('click', () => {
  localStorage.removeItem('認証トークン');
  画面を切り替える(false);
});

// アプリ起動時に認証状態をチェックする
window.addEventListener('DOMContentLoaded', 認証状態を確認する);
