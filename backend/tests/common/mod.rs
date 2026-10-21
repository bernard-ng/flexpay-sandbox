use std::{sync::Arc, time::Duration};

use flexpay_sandbox::{AppState, model::Settings, router, store::Store};
use reqwest::Client;
use serde_json::{Value, json};

pub(crate) async fn server() -> (String, Arc<AppState>) {
    server_with_frontend("/nonexistent").await
}

pub(crate) async fn server_with_frontend(frontend: &str) -> (String, Arc<AppState>) {
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let base = format!("http://{}", listener.local_addr().unwrap());
    let state = AppState::new(
        Store::open(":memory:").unwrap(),
        "TESTMERCHANT".into(),
        "test-token".into(),
        base.clone(),
    )
    .unwrap();
    state
        .store
        .save_settings(Settings {
            delay_ms: 20,
            ..Settings::default()
        })
        .await
        .unwrap();

    let app = router(state.clone(), frontend);
    tokio::spawn(async move {
        axum::serve(listener, app).await.unwrap();
    });
    (base, state)
}

pub(crate) fn mobile(phone: &str, callback: &str) -> Value {
    json!({
        "merchant": "TESTMERCHANT",
        "type": "1",
        "phone": phone,
        "reference": "order-123",
        "amount": "25.00",
        "currency": "USD",
        "callbackUrl": callback,
    })
}

pub(crate) async fn create(base: &str, body: &Value, route: &str) -> Value {
    Client::new()
        .post(format!("{base}{route}"))
        .bearer_auth("test-token")
        .json(body)
        .send()
        .await
        .unwrap()
        .error_for_status()
        .unwrap()
        .json()
        .await
        .unwrap()
}

pub(crate) async fn check(base: &str, id: &str) -> Value {
    Client::new()
        .get(format!("{base}/api/rest/v1/check/{id}"))
        .bearer_auth("test-token")
        .send()
        .await
        .unwrap()
        .json()
        .await
        .unwrap()
}

pub(crate) async fn wait_final(state: &AppState, id: &str) {
    for _ in 0..100 {
        if state.store.get(id).await.unwrap().unwrap().status != 2 {
            return;
        }
        tokio::time::sleep(Duration::from_millis(10)).await;
    }
    panic!("Payment did not finish");
}
