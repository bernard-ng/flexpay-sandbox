use std::sync::Arc;

use crate::{
    AppState,
    clock::now,
    model::{CallbackAttempt, Transaction},
};

pub(crate) fn queue(state: &Arc<AppState>, transaction: Transaction) {
    let task_state = state.clone();

    state.tasks.spawn(async move {
        tokio::select! {
            () = task_state.shutdown.cancelled() => {},
            () = deliver(&task_state, transaction) => {},
        }
    });
}

async fn deliver(state: &AppState, transaction: Transaction) {
    let payload = transaction.callback();
    let result = state
        .http
        .post(&transaction.request.callback_url)
        .json(&payload)
        .send()
        .await;

    let (status, error) = match result {
        Ok(r) => (
            Some(r.status().as_u16()),
            if r.status().is_success() {
                None
            } else {
                Some(format!("HTTP {}", r.status()))
            },
        ),
        Err(e) => (None, Some(e.to_string())),
    };

    let attempt = CallbackAttempt {
        at: now(),
        status,
        error,
        payload,
    };

    if let Err(e) = state
        .store
        .update(&transaction.order_number, move |transaction| {
            transaction.callback_attempts.push(attempt);
            true
        })
        .await
    {
        tracing::error!(error=%e, "Unable to record callback");
    }
}
