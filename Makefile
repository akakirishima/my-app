up:            ## ビルド & 起動
	docker compose up --build

down:          ## 停止
	docker compose down

front-lint:    ## React Lint + 型
	docker compose exec frontend npm run lint

back-test:     ## Flask テスト
	docker compose exec backend pytest
