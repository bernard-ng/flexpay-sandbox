use std::sync::Arc;

use serde_json::{Value, json};

use crate::{ApiError, AppState, error::ApiResult};

use super::finish;

pub(crate) async fn checkout(
    state: &Arc<AppState>,
    id: &str,
    card_number: String,
    cancel: bool,
) -> ApiResult<Value> {
    let tx = state
        .store
        .get(id)
        .await?
        .filter(|tx| tx.kind == "card")
        .ok_or(ApiError::NotFound)?;

    if tx.status != 2 {
        return Err(ApiError::Invalid(
            "Checkout has already been completed".into(),
        ));
    }

    let number: String = card_number
        .chars()
        .filter(|c| !c.is_whitespace() && *c != '-')
        .collect();
    let settings = state.store.settings().await?;

    if !cancel
        && (!(13..=19).contains(&number.len()) || !number.bytes().all(|b| b.is_ascii_digit()))
    {
        return Err(ApiError::Invalid(
            "Enter a test card number (13–19 digits)".into(),
        ));
    }

    let outcome = settings.outcome("card", &number);

    if !cancel && outcome == "pending" {
        return Ok(json!({
            "status": 2,
            "message": "Payment is pending. Resolve it from the dashboard.",
            "redirectUrl": null,
        }));
    }

    let status = if cancel {
        5
    } else if outcome == "success" {
        0
    } else {
        1
    };

    let redirect = if status == 5 {
        tx.request.cancel_url
    } else if status == 0 {
        tx.request.approve_url
    } else {
        tx.request.decline_url
    };
    finish(
        state,
        id,
        status,
        Some(
            if number.starts_with('5') {
                "mastercard"
            } else {
                "visa"
            }
            .into(),
        ),
    )
    .await?
    .ok_or_else(|| ApiError::Invalid("Checkout has already been completed".into()))?;

    Ok(json!({"status": status, "redirectUrl": redirect}))
}
