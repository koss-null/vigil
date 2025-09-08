all: prepare
	go run ./cmd/...

.PHONY: build
build: prepare
	go build -o ./build/vigil ./cmd/...

.PHONY: prepare
prepare:
	rm -rf ./internal/api/web/
	mkdir -p ./internal/api/web/static/
	ln $(CURDIR)/web/static/index.html ./internal/api/web/static/
	ln $(CURDIR)/web/static/js/app.js ./internal/api/web/static/
	ln $(CURDIR)/web/static/css/styles.css ./internal/api/web/static/
