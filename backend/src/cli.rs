use clap::Parser;

#[derive(Parser)]
#[command(version, about = "Local FlexPay API simulator and dashboard")]
pub(crate) struct Args {
    #[arg(long, env = "FLEXPAY_BIND", default_value = "127.0.0.1:8080")]
    pub(crate) bind: std::net::SocketAddr,
    #[arg(
        long,
        env = "FLEXPAY_PUBLIC_URL",
        default_value = "http://localhost:8080"
    )]
    pub(crate) public_url: String,
    #[arg(long, env = "FLEXPAY_MERCHANT", default_value = "TESTMERCHANT")]
    pub(crate) merchant: String,
    #[arg(long, env = "FLEXPAY_TOKEN", default_value = "test-token")]
    pub(crate) token: String,
    #[arg(long, env = "FLEXPAY_DATABASE", default_value = "data/flexpay.db")]
    pub(crate) database: String,
    #[arg(long, env = "FLEXPAY_FRONTEND", default_value = "frontend/dist/client")]
    pub(crate) frontend: String,
}
