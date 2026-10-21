use std::sync::Arc;

use axum::{
    Json,
    extract::{Path, State},
};
use serde::Deserialize;
use serde_json::{Value, json};

use crate::{
    ApiError, AppState, callbacks, error::ApiResult, model::Transaction, payments::finish,
};

#[derive(Deserialize)]
pub(super) struct Resolution {
    status: u8,
}

pub(super) async fn list(State(state): State<Arc<AppState>>) -> ApiResult<Json<Vec<Transaction>>> {
    Ok(Json(state.store.list().await?))
}

pub(super) async fn detail(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> ApiResult<Json<Transaction>> {
    Ok(Json(state.store.get(&id).await?.ok_or(ApiError::NotFound)?))
}

pub(super) async fn resolve(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(body): Json<Resolution>,
) -> ApiResult<Json<Transaction>> {
    if ![0, 1, 3, 4, 5].contains(&body.status) {
        return Err(ApiError::Invalid("status must be 0, 1, 3, 4, or 5".into()));
    }

    let transaction = finish(&state, &id, body.status, None)
        .await?
        .ok_or_else(|| {
            ApiError::Invalid(
                "Transaction has already been resolved or transition is invalid".into(),
            )
        })?;

    Ok(Json(transaction))
}

pub(super) async fn replay(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> ApiResult<Json<Value>> {
    let transaction = state.store.get(&id).await?.ok_or(ApiError::NotFound)?;

    if ![0, 1, 5].contains(&transaction.status) {
        return Err(ApiError::Invalid(
            "Only completed payments have a callback".into(),
        ));
    }

    callbacks::queue(&state, transaction);

    Ok(Json(json!({"ok":true})))
}
