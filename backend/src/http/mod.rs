//! HTTP routes and transport-specific extraction and authorization.

mod auth;
mod checkout;
mod payments;
mod simulator;
mod transactions;

use std::sync::Arc;

use axum::{
    Json, Router,
    routing::{get, post},
};
use serde_json::json;
use tower_http::services::{ServeDir, ServeFile};

use crate::AppState;

pub fn router(state: Arc<AppState>, frontend: &str) -> Router {
    Router::new()
        .route("/health", get(|| async { Json(json!({"status":"ok"})) }))
        .route("/api/rest/v1/paymentService", post(payments::mobile))
        .route("/api/rest/v1/merchantPayOutService", post(payments::payout))
        .route("/api/rest/v1/check/{id}", get(payments::check))
        .route("/v1.1/pay", post(payments::card))
        .route("/api/simulator/info", get(simulator::info))
        .route("/api/simulator/transactions", get(transactions::list))
        .route(
            "/api/simulator/transactions/{id}",
            get(transactions::detail),
        )
        .route(
            "/api/simulator/transactions/{id}/resolve",
            post(transactions::resolve),
        )
        .route(
            "/api/simulator/transactions/{id}/callback",
            post(transactions::replay),
        )
        .route(
            "/api/simulator/checkout/{id}",
            get(checkout::info).post(checkout::pay),
        )
        .route(
            "/api/simulator/settings",
            get(simulator::settings).put(simulator::save_settings),
        )
        .route("/api/simulator/reset", post(simulator::reset))
        .fallback_service(
            ServeDir::new(frontend).fallback(ServeFile::new(format!("{frontend}/_shell.html"))),
        )
        .with_state(state)
}
