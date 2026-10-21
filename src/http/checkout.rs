use std::sync::Arc;

use axum::{
    Json,
    extract::{Path, State},
};
use serde::Deserialize;
use serde_json::{Value, json};

use crate::{ApiError, AppState, error::ApiResult, payments};

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct Checkout {
    #[serde(default)]
    card_number: String,
    #[serde(default)]
    cancel: bool,
}

pub(super) async fn info(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> ApiResult<Json<Value>> {
    let transaction = state
        .store
        .get(&id)
        .await?
        .filter(|transaction| transaction.kind == "card")
        .ok_or(ApiError::NotFound)?;

    Ok(Json(json!({
        "orderNumber": transaction.order_number,
        "merchant": transaction.request.merchant,
        "reference": transaction.request.reference,
        "amount": transaction.amount,
        "amountCustomer": transaction.amount_customer,
        "currency": transaction.request.currency,
        "description": transaction.request.description,
        "status": transaction.status,
    })))
}

pub(super) async fn pay(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(body): Json<Checkout>,
) -> ApiResult<Json<Value>> {
    Ok(Json(
        payments::checkout(&state, &id, body.card_number, body.cancel).await?,
    ))
}
