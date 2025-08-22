プロジェクトの動かし方（Docker だけでOK）

このプロジェクトは Docker Desktop だけ入っていれば動きます。ローカルに Node や Python をインストールする必要はありません。
	•	フロント（開発サーバ）: http://localhost:5173
	•	バックエンド（API）: http://localhost:5001（コンテナ内は 5000 → ホストでは 5001 に公開）

⸻

1) 事前準備（全員）

A. ソフトのインストール
	•	macOS: Docker Desktop for Mac をインストールして起動
	•	Windows 10/11: Docker Desktop for Windows をインストールして起動（インストール時に WSL2 を有効化）
	•	再起動を求められたら必ず再起動してください

⚡ Windowsの人へ: プロジェクトフォルダは WSL2（Linux）側に置くと速く・安定します。
例）\\wsl$\Ubuntu\home\<あなたの名前>\work\my-app

B. 動作確認

以下をターミナル/PowerShellで実行し、バージョンが表示されればOKです。

docker --version
docker compose version

C. mac のポート注意

mac は AirPlay Receiver が 5000 番を使うため、API は 5001 で公開しています。特別な設定は不要です。

⸻

2) クイックスタート（初回だけ）

以降はターミナル/PowerShellを開き、灰色のコードブロックだけコピペしてください。

1. リポジトリを取得して移動

git clone https://github.com/akakirishima/my-app.git
cd my-app

2. フロントの依存をインストール（初回のみ）

docker compose run --rm frontend npm ci

3. 起動（初回はビルドあり）

docker compose up --build

4. 開く
	•	フロント: http://localhost:5173
	•	API: http://localhost:5001

終了するときは ターミナルで Ctrl + C を押してください（※これはコマンドではありません）。

⸻

3) クイックスタート（2回目以降）

1. プロジェクトフォルダへ移動

cd my-app

2. 起動

docker compose up

3. 終了
	•	Ctrl + C（コピーしない）
	•	完全に削除する場合:

docker compose down

2回目以降は --build 不要です（依存やDockerfileを変えたときだけ --build を付ける）。

⸻

4) よく使う操作

フロントにライブラリを入れる（例: axios）

docker compose exec frontend npm i axios

バックエンドにライブラリを入れる（例: requests）

docker compose exec backend pip install requests
docker compose exec backend pip freeze > backend/requirements.txt

ログを見る

docker compose logs -f
docker compose logs -f frontend
docker compose logs -f backend

きれいに片付け

docker compose down

依存ボリュームごと削除（フロント node_modules をリセット）

docker compose down -v


⸻

5) うまくいかない時

A. APIにつながらない

docker compose logs backend

	•	API直アクセス: http://localhost:5001/api/hello

B. ポート競合

docker compose down

それでもダメなら、docker-compose.yml の公開ポートを 5002:5000 などに変更。

C. vite not found エラー

初回の依存インストールを忘れている可能性あり。

docker compose run --rm frontend npm ci

D. Windowsで反映が遅い

WSL2 上に置いてください。例：\\wsl$\Ubuntu\home\<you>\work\my-app

⸻

6) Git の使い方（簡単版）
	1.	変更を保存（VS Code など）
	2.	変更点を確認

git status
git diff

	3.	ステージング

git add .

	4.	コミット

git commit -m "作業内容を短く書く"

	5.	プッシュ

git push origin <ブランチ名>

ブランチ名は feat/...（新機能）, fix/...（修正）など。共同開発は PR を経由してマージ。

⸻

7) 用語ミニ辞典（初心者向け）
	•	コンテナ: アプリを動かす“小さな箱”
	•	イメージ: コンテナの元データ（設計図）
	•	ボリューム: データ保存場所（例: node_modules）
	•	ポート: PCとコンテナの入り口番号（5173 / 5001）

⸻

8) 相談の仕方（Issue テンプレ）
	1.	何をしようとしたか
	2.	実行したコマンド
	3.	何が起きたか（エラー全文 or スクショ）
	4.	PC の種別（mac / Windows）

例：
	•	OS: macOS 14
	•	実行コマンド: docker compose up --build
	•	エラー: address already in use …

⸻

9) ルール（重要）
	•	ローカルに Node / Python を入れない（環境統一のため）
	•	README のコマンドは 1行ずつコピペ
	•	わからなければすぐ相談！