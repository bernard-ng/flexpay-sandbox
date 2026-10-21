.PHONY: check

check:
	@set -eu; \
	( \
		cargo fmt --manifest-path backend/Cargo.toml --check && \
		cargo clippy --manifest-path backend/Cargo.toml --all-targets -- -D warnings && \
		cargo test --manifest-path backend/Cargo.toml --locked \
	) & backend_pid=$$!; \
	( \
		bun audit --cwd frontend --ignore GHSA-vfj7-8cjw-p6xm && \
		bun run --cwd frontend typecheck && \
		bun run --cwd frontend test && \
		bun run --cwd frontend build \
	) & frontend_pid=$$!; \
	status=0; \
	wait "$$backend_pid" || status=$$?; \
	wait "$$frontend_pid" || status=$$?; \
	exit "$$status"
