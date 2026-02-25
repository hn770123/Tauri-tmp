# GitHub Actions を利用した Tauri v1 アプリのビルド・リリース手順

このドキュメントでは、Tauri v1 アプリケーションを GitHub Actions を使用して Windows および macOS 向けにビルドし、GitHub Releases に公開する手順を説明します。

## 前提条件

*   GitHub リポジトリに Tauri プロジェクトが存在すること。
*   ローカル環境でビルドが成功することを確認済みであること。

## 1. プロジェクト設定の確認

`src-tauri/tauri.conf.json` の設定を確認します。特に以下の項目が適切に設定されているか確認してください。

*   `package.version`: バージョン番号（例: "0.1.0"）
*   `tauri.bundle.identifier`: 一意の識別子（例: "com.example.app"）

## 2. GitHub Actions ワークフローの作成

リポジトリのルートディレクトリに以下のディレクトリ構造を作成し、その中にワークフローファイルを作成します。

**ファイルパス:** `.github/workflows/release.yml`

以下の内容を `release.yml` に記述します。この設定は、`v` で始まるタグ（例: `v0.1.0`）がプッシュされたときに自動的に実行されます。

```yaml
name: Release App

on:
  push:
    tags:
      - 'v*' # vから始まるタグがプッシュされたときにトリガー

jobs:
  create-release:
    permissions:
      contents: write
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          draft: false
          prerelease: false
          generate_release_notes: true

  build-tauri:
    needs: create-release
    permissions:
      contents: write
    strategy:
      fail-fast: false
      matrix:
        include:
          - platform: 'macos-latest' # macOS向け
            args: '--target universal-apple-darwin'
          - platform: 'windows-latest' # Windows向け
            args: ''

    runs-on: ${{ matrix.platform }}
    steps:
      - uses: actions/checkout@v3

      - name: Setup node
        uses: actions/setup-node@v3
        with:
          node-version: 16

      - name: Install Rust stable
        uses: dtolnay/rust-toolchain@stable
        with:
          # macOSの場合はユニバーサルバイナリ用のターゲットを追加
          targets: ${{ matrix.platform == 'macos-latest' && 'aarch64-apple-darwin,x86_64-apple-darwin' || '' }}

      - name: Install frontend dependencies
        # パッケージマネージャに合わせて変更してください (npm ci, yarn install, pnpm install 等)
        run: npm install

      - name: Build and Upload Assets
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          # releaseId を指定しない場合、タグ名から自動的にリリースを特定します
          args: ${{ matrix.args }}
```

### ポイント解説

*   **トリガー**: `tags: - 'v*'` により、`v0.1.0` などのタグをプッシュしたときのみ実行されます。
*   **リリース作成**: `create-release` ジョブで空のリリースを作成します。`softprops/action-gh-release` を使用しています。
*   **プラットフォーム**: `matrix` 設定により、Windows (`windows-latest`) と macOS (`macos-latest`) の両方で並列にビルドが走ります。
*   **Tauri Action**: `tauri-apps/tauri-action@v0` を使用して、ビルドと成果物のアップロードを自動化しています。タグ名に基づいて作成済みのリリースを探し、そこにアップロードします。
*   **依存関係**: フロントエンドのパッケージマネージャー（npm/yarn/pnpm）に合わせて `Install frontend dependencies` ステップを調整してください。

## 3. リリースの実行手順

準備ができたら、実際にリリースを行います。

1.  **バージョンの更新**
    `package.json` および `src-tauri/tauri.conf.json` のバージョン番号を更新します（例: `0.1.0` -> `0.1.1`）。

2.  **変更のコミット**
    ```bash
    git add .
    git commit -m "Bump version to 0.1.1"
    git push
    ```

3.  **タグの作成とプッシュ**
    ```bash
    git tag v0.1.1
    git push origin v0.1.1
    ```

4.  **GitHub Actions の確認**
    GitHub リポジトリの「Actions」タブを開き、ワークフローが実行されていることを確認します。

5.  **成果物の確認**
    ビルドが完了すると、リポジトリの「Releases」ページに新しいリリースが作成され、インストーラー（`.msi`, `.dmg` など）がアップロードされています。

## 補足: コード署名について

Windows や macOS で配布するアプリケーションには、通常コード署名が推奨されます。署名がない場合、インストール時に警告が表示されることがあります。

*   **Windows**: `.pfx` 証明書が必要です。
*   **macOS**: Apple Developer Program への登録と証明書が必要です。

これらを設定する場合は、GitHub Secrets に証明書情報を登録し、ワークフロー内で環境変数として読み込ませる必要があります。詳細は [Tauri 公式ドキュメント](https://tauri.app/v1/guides/distribution/sign-macos/) を参照してください。
