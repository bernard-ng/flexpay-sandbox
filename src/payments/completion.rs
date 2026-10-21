use std::{sync::Arc, time::Duration};

use crate::{AppState, callbacks, error::ApiResult, model::Transaction};

pub(super) fn schedule(state: &Arc<AppState>, id: String, outcome: String, delay_ms: u64) {
    let task_state = state.clone();

    state.tasks.spawn(async move {
        tokio::select! {
            () = task_state.shutdown.cancelled() => {},
            () = tokio::time::sleep(Duration::from_millis(delay_ms)) => {
                let status = if outcome == "success" { 0 } else { 1 };

                if let Err(error) = finish(&task_state, &id, status, None).await {
                    tracing::error!(error = %error, "Auto completion failed");
                }
            }
        }
    });
}

pub(crate) async fn finish(
    state: &Arc<AppState>,
    id: &str,
    status: u8,
    card_channel: Option<String>,
) -> ApiResult<Option<Transaction>> {
    let transaction = state
        .store
        .update(id, move |transaction| {
            transaction.resolve(status, card_channel)
        })
        .await?;

    if let Some(transaction) = &transaction
        && [0, 1, 5].contains(&status)
    {
        callbacks::queue(state, transaction.clone());
    }

    Ok(transaction)
}
