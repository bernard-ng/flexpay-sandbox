use std::sync::Arc;

use axum::{Json, extract::State};
use serde_json::{Value, json};

use crate::{ApiError, AppState, error::ApiResult, model::Settings};

pub(super) async fn info(State(state): State<Arc<AppState>>) -> Json<Value> {
    Json(json!({
        "merchant": state.merchant,
        "token": state.token,
        "publicUrl": state.public_url,
    }))
}

pub(super) async fn settings(State(state): State<Arc<AppState>>) -> ApiResult<Json<Settings>> {
    Ok(Json(state.store.settings().await?))
}

pub(super) async fn save_settings(
    State(state): State<Arc<AppState>>,
    Json(settings): Json<Settings>,
) -> ApiResult<Json<Settings>> {
    settings.validate().map_err(ApiError::Invalid)?;
    state.store.save_settings(settings.clone()).await?;

    Ok(Json(settings))
}

pub(super) async fn reset(State(state): State<Arc<AppState>>) -> ApiResult<Json<Value>> {
    state.store.reset().await?;

    Ok(Json(json!({"ok":true})))
}
