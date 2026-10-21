use std::sync::Arc;

use serde_json::{Value, json};

use crate::{
    ApiError, AppState,
    error::ApiResult,
    model::{PaymentKind, PaymentRequest, Transaction},
};

use super::completion;

pub(crate) async fn create(
    state: Arc<AppState>,
    mut request: PaymentRequest,
    kind: PaymentKind,
) -> ApiResult<Value> {
    let cents = request.validate(kind).map_err(ApiError::Invalid)?;

    request.authorization = None;

    let settings = state.store.settings().await?;

    let outcome = settings
        .outcome("phone", request.phone.as_deref().unwrap_or_default())
        .to_owned();
    let transaction = Transaction::pending(request, kind, cents, settings.fee_basis_points);
    let id = transaction.order_number.clone();

    state.store.insert(transaction).await?;

    if kind != PaymentKind::Card && outcome != "pending" {
        completion::schedule(&state, id.clone(), outcome, settings.delay_ms);
    }

    Ok(if kind == PaymentKind::Card {
        json!({
            "code": 0,
            "message": "Redirection en cours",
            "orderNumber": id,
            "url": format!("{}/checkout/{id}", state.public_url),
        })
    } else {
        json!({
            "code": "0",
            "message": if kind == PaymentKind::Payout {
                "Transaction envoyée avec succès."
            } else {
                "Transaction envoyée avec succès. Veuillez valider le push message"
            },
            "orderNumber": id,
        })
    })
}
