

プロジェクトの動かし方（Docker だけでOK）

このプロジェクトは Docker Desktop だけ入っていれば動きます。
ローカルに Node や Python をインストールする必要はありません。
	•	フロント（開発サーバ）: http://localhost:5173
	•	バックエンド（API）: http://localhost:5001（コンテナ内は 5000 → ホストでは 5001 に公開）

⸻

1) 事前準備（全員）

A. ソフトのインストール
	•	macOS: [Docker Desktop for Mac] をインストールして起動
	•	Windows 10/11: [Docker Desktop for Windows] をインストールして起動
	•	インストール途中で WSL2 Backend を有効化してください
	•	再起動を求められたら再起動します

Windows の人へ：
プロジェクトフォルダは WSL2（Linux）側に置くと速く・安定します。(らしい、、無理しなくていいです)
例）\\wsl$\Ubuntu\home\<あなたの名前>\work\my-app

B. 動作確認

Docker Desktop を起動した状態で、ターミナルで下を実行：

docker --version
docker compose version

どちらもバージョンが表示されればOKです。

C. （mac の人向け）ポート衝突について

mac は AirPlay Receiver が 5000 番を使う場合があるため、
このプロジェクトでは バックエンドを 5001 番で公開しています。特別な設定は不要です。

⸻

2) クイックスタート（初回だけ）

以降は ターミナル/PowerShell を開いて、1行ずつ実行してください。
場所はプロジェクトのフォルダ（例：my-app）です。

	1.	リポジトリを取得して移動

git clone <このリポジトリのURL>
cd my-app


	2.	フロントの依存を コンテナ専用ボリューム にインストール（初回だけ）

docker compose run --rm frontend npm ci


	3.	起動（初回はビルドが走ります）

docker compose up --build


	4.	開く
	•	フロント：http://localhost:5173
	•	API：http://localhost:5001（APIのパスはプロジェクトの実装に従ってください）

画面が表示されれば成功です。
終了するときは、起動中のターミナルで Ctrl + C を押してください。

⸻

3) クイックスタート（2回目以降の起動）
	1.	プロジェクトフォルダへ移動

cd my-app


	2.	起動

docker compose up


	3.	終了

Ctrl + C
docker compose down



2回目以降は --build なしでOK です（依存やDockerfileを変えたときだけ --build を付ける）。

⸻

4) よく使う操作（コピペOK）

すべて コンテナ内で完結します。ローカルに Node / Python は不要です。

	•	フロントにライブラリを入れる（例：axios）

docker compose exec frontend npm i axios


	•	バックエンドにライブラリを入れる（例：requests）
※ requirements.txt を更新して他メンバーと共有します

docker compose exec backend pip install requests
docker compose exec backend pip freeze > backend/requirements.txt


	•	ログを見る（別タブで流し見が便利）

docker compose logs -f
docker compose logs -f frontend
docker compose logs -f backend


	•	きれいに片付け（コンテナ・ネットワークを削除）

docker compose down


	•	さらに依存ボリュームも削除（フロントの node_modules をリセット）

docker compose down -v



⸻

5) うまくいかない時のチェックリスト

A. ページは開くが、API につながらない
	•	docker compose logs backend を見て、起動していることを確認（エラーがないか）
	•	API を直接開く
例：http://localhost:5001/api/hello（実装によりパスは変わります）
	•	ブラウザの開き直し・キャッシュ削除も有効なことがあります

B. address already in use（ポート競合）と出る
	•	mac：AirPlay Receiver が 5000 を掴みますが、このプロジェクトは 5001 を使うので基本回避済み
	•	それでも衝突するなら、次を試してください：

docker compose down

それでもダメな場合は、バックエンドの公開ポートを空いている番号（例：5002:5000）へ変更してください（開発者に相談）。

C. vite not found / Cannot find module ...
	•	初回の

docker compose run --rm frontend npm ci

を忘れている可能性があります。実行してから再度 docker compose up してください。

D. Windows だけ保存の反映が遅い
	•	プロジェクトを WSL2（Linux）のファイルシステム上に置いてください
例：\\wsl$\Ubuntu\home\<あなた>\work\my-app
	•	それでも遅い場合は開発者へ相談してください（監視設定で改善できます）

⸻

6) Git の使い方（超ざっくり）
	1.	変更を保存（VS Code などでファイルを保存）
	2.	変更点を見る

git status
git diff


	3.	ステージング

git add .


	4.	コミット

git commit -m "作業内容を短く書く（例：トップページの文言更新）"


	5.	プッシュ

git push origin <ブランチ名>



ブランチ名は例として feat/...（新機能）, fix/...（修正）などにすると後で見やすいです。
共同開発では Pull Request を作ってからレビュー＆マージします。

⸻

7) 用語ミニ辞典（初心者向け）
	•	コンテナ：アプリを動かす“小さな箱”。箱の中に必要なソフト一式が入っていて、誰のPCでも同じ動作を再現できます。
	•	イメージ：コンテナの元データ（設計図＋材料の固まり）。最初にビルドして作ります。
	•	ボリューム：コンテナの中のデータを保存しておくための場所。フロントの node_modules をここに入れて、PC側を汚さないようにしています。
	•	ポート：PCとコンテナの出入り口の番号。フロントは 5173、バックエンドは 5001（コンテナ内は 5000）を使っています。

⸻

8) 相談の仕方（Issue テンプレ）
	1.	何をしようとしていたか（例：初回起動したい）
	2.	何を実行したか（コマンドをコピー）
	3.	何が起きたか（エラー全文 or スクショ）
	4.	PC の種別（mac / Windows）

例）
	•	OS: macOS 14
	•	実行コマンド: docker compose up --build
	•	エラー: address already in use ...

⸻

9) ルール（重要）
	•	ローカルに Node / Python を入れないでください（全員の環境をそろえるため）
	•	README のコマンドは 1行ずつ 実行してください（# から始まる説明行はコピーしない）
	•	わからなければすぐ聞いてOKです。迷って時間を使うより効率的です 👍

