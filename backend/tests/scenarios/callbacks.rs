use std::time::Duration;

use axum::{Json, Router, routing::post};
use flexpay_sandbox::model::Settings;
use reqwest::Client;
use serde_json::{Value, json};
use tokio::sync::mpsc;

use crate::common::{check, create, mobile, server, wait_final};

#[tokio::test]
async fn callback_delivery_replay_and_reset() {
    let (sender, mut receiver) = mpsc::channel::<Value>(10);
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let callback = format!("http://{}/callback", listener.local_addr().unwrap());
    let sink = Router::new().route(
        "/callback",
        post(move |Json(body): Json<Value>| {
            let sender = sender.clone();
            async move {
                sender.send(body).await.unwrap();
                Json(json!({"ok":true}))
            }
        }),
    );
    tokio::spawn(async move {
        axum::serve(listener, sink).await.unwrap();
    });

    let (base, state) = server().await;
    let response = create(
        &base,
        &mobile("243810000001", &callback),
        "/api/rest/v1/paymentService",
    )
    .await;

    let id = response["orderNumber"].as_str().unwrap();
    let payload = tokio::time::timeout(Duration::from_secs(2), receiver.recv())
        .await
        .unwrap()
        .unwrap();
    assert_eq!(payload["code"], "0");
    assert_eq!(payload["amountCustomer"], "25.63");
    assert_eq!(payload["phone"], "243810000001");
    assert_eq!(payload["channel"], "mpesa");
    assert!(!payload["provider_reference"].as_str().unwrap().is_empty());
    assert!(payload.get("status").is_none());
    Client::new()
        .post(format!("{base}/api/simulator/transactions/{id}/callback"))
        .send()
        .await
        .unwrap()
        .error_for_status()
        .unwrap();
    assert_eq!(
        tokio::time::timeout(Duration::from_secs(2), receiver.recv())
            .await
            .unwrap()
            .unwrap(),
        payload
    );
    // Delete an auto-resolving payment before its timer fires; it must stay deleted.
    state
        .store
        .save_settings(Settings {
            delay_ms: 100,
            ..Settings::default()
        })
        .await
        .unwrap();
    create(
        &base,
        &mobile("243810000001", &callback),
        "/api/rest/v1/paymentService",
    )
    .await;
    Client::new()
        .post(format!("{base}/api/simulator/reset"))
        .send()
        .await
        .unwrap()
        .error_for_status()
        .unwrap();
    tokio::time::sleep(Duration::from_millis(200)).await;
    assert!(state.store.list().await.unwrap().is_empty());
    assert!(receiver.try_recv().is_err());
    assert_eq!(state.store.settings().await.unwrap().delay_ms, 100);
    state.shutdown.cancel();
}

#[tokio::test]
async fn configurable_rules_and_callback_errors_are_visible() {
    let (base, state) = server().await;
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let callback = format!("http://{}/callback", listener.local_addr().unwrap());
    let sink = Router::new().route(
        "/callback",
        post(|| async { axum::http::StatusCode::SERVICE_UNAVAILABLE }),
    );
    tokio::spawn(async move {
        axum::serve(listener, sink).await.unwrap();
    });

    let mut settings = Settings {
        default_outcome: "failure".into(),
        delay_ms: 0,
        fee_basis_points: 200,
        ..Settings::default()
    };
    settings.rules[0].value = "243810000009".into();
    Client::new()
        .put(format!("{base}/api/simulator/settings"))
        .json(&settings)
        .send()
        .await
        .unwrap()
        .error_for_status()
        .unwrap();

    let response = create(
        &base,
        &mobile("243810000009", &callback),
        "/api/rest/v1/paymentService",
    )
    .await;

    let id = response["orderNumber"].as_str().unwrap();

    for _ in 0..100 {
        if !state
            .store
            .get(id)
            .await
            .unwrap()
            .unwrap()
            .callback_attempts
            .is_empty()
        {
            break;
        }
        tokio::time::sleep(Duration::from_millis(10)).await;
    }

    let tx = state.store.get(id).await.unwrap().unwrap();
    assert_eq!(tx.status, 0);
    assert_eq!(tx.amount_customer, "25.50");
    assert_eq!(tx.callback_attempts.len(), 1);
    assert_eq!(tx.callback_attempts[0].status, Some(503));
    assert!(tx.callback_attempts[0].error.is_some());
    let failed = create(
        &base,
        &mobile("243810000008", &callback),
        "/api/rest/v1/paymentService",
    )
    .await;
    wait_final(&state, failed["orderNumber"].as_str().unwrap()).await;
    assert_eq!(
        check(&base, failed["orderNumber"].as_str().unwrap()).await["transaction"]["status"],
        "1"
    );
    state.shutdown.cancel();
}
