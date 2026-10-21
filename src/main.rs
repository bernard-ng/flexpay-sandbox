mod cli;

use clap::Parser;
use flexpay_proxy::{AppState, router, store::Store};

use cli::Args;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();

    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "flexpay_proxy=info,tower_http=info".into()),
        )
        .init();

    let args = Args::parse();

    let state = AppState::new(
        Store::open(&args.database)?,
        args.merchant,
        args.token,
        args.public_url,
    )?;

    let listener = tokio::net::TcpListener::bind(args.bind).await?;

    tracing::info!(address=%listener.local_addr()?, "FlexPay simulator ready");

    let shutdown = state.shutdown.clone();

    axum::serve(listener, router(state.clone(), &args.frontend))
        .with_graceful_shutdown(async move {
            let _ = tokio::signal::ctrl_c().await;

            shutdown.cancel();
        })
        .await?;

    state.tasks.close();
    state.tasks.wait().await;

    Ok(())
}
