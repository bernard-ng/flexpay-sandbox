use std::sync::Arc;

use axum::{
    Json,
    extract::{Path, State, rejection::JsonRejection},
    http::HeaderMap,
};
use serde_json::{Value, json};

use crate::{
    ApiError, AppState,
    error::ApiResult,
    model::{PaymentKind, PaymentRequest},
    payments,
};

use super::auth::authorize;

type PaymentBody = Result<Json<PaymentRequest>, JsonRejection>;

pub(super) async fn mobile(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    body: PaymentBody,
) -> ApiResult<Json<Value>> {
    create(state, headers, body, PaymentKind::Mobile).await
}

pub(super) async fn payout(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    body: PaymentBody,
) -> ApiResult<Json<Value>> {
    create(state, headers, body, PaymentKind::Payout).await
}

pub(super) async fn card(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    body: PaymentBody,
) -> ApiResult<Json<Value>> {
    create(state, headers, body, PaymentKind::Card).await
}

async fn create(
    state: Arc<AppState>,
    headers: HeaderMap,
    body: PaymentBody,
    kind: PaymentKind,
) -> ApiResult<Json<Value>> {
    let Json(request) = body.map_err(|error| ApiError::Invalid(error.body_text()))?;

    authorize(
        &state,
        &headers,
        if kind == PaymentKind::Card {
            request.authorization.as_deref()
        } else {
            None
        },
    )?;

    if request.merchant != state.merchant {
        return Err(ApiError::Unauthorized);
    }

    Ok(Json(payments::create(state, request, kind).await?))
}

pub(super) async fn check(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Path(id): Path<String>,
) -> ApiResult<Json<Value>> {
    authorize(&state, &headers, None)?;

    Ok(Json(match state.store.get(&id).await? {
        Some(transaction) => json!({
            "code": "0",
            "message": "Une transaction a été trouvée",
            "transaction": transaction.wire(),
        }),
        None => json!({
            "code": "1",
            "message": "Aucune transaction trouvée",
            "transaction": null,
        }),
    }))
}
