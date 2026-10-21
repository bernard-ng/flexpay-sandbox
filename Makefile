.PHONY: setup run frontend-dev check
setup:
	bun install --cwd frontend --frozen-lockfile
	bun run --cwd frontend build
run:
	cargo run
	bun run --cwd frontend dev
check:
	cargo fmt --check
	cargo clippy --all-targets -- -D warnings
	cargo test
	bun run --cwd frontend typecheck
	bun run --cwd frontend test
	bun run --cwd frontend build
