.PHONY: check

check:
	cargo fmt --manifest-path backend/Cargo.toml --check
	cargo clippy --manifest-path backend/Cargo.toml --all-targets -- -D warnings
	cargo test --manifest-path backend/Cargo.toml --locked
	bun run --cwd frontend typecheck
	bun run --cwd frontend test
	bun run --cwd frontend build
