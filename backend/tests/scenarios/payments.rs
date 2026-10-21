use reqwest::Client;
use serde_json::json;

use crate::common::{check, create, mobile, server, wait_final};

#[tokio::test]
async fn mobile_success_failure_pending_and_payout() {
    let (base, state) = server().await;

    for (phone, expected, route) in [
        ("243810000001", 0, "paymentService"),
        ("243810000002", 1, "paymentService"),
        ("243810000003", 2, "paymentService"),
        ("243810000001", 0, "merchantPayOutService"),
    ] {
        let response = create(
            &base,
            &mobile(phone, "http://127.0.0.1:1/callback"),
            &format!("/api/rest/v1/{route}"),
        )
        .await;
        assert_eq!(response["code"], "0");
        let id = response["orderNumber"].as_str().unwrap();

        if expected != 2 {
            wait_final(&state, id).await;
        }

        let checked = check(&base, id).await;
        assert_eq!(checked["transaction"]["status"], expected.to_string());
        assert_eq!(checked["transaction"]["amount"], "25.00");
        assert_eq!(checked["transaction"]["amountCustomer"], "25.63");
        assert_eq!(checked["transaction"]["orderNumber"], id);
    }
    assert_eq!(
        check(&base, "missing").await,
        json!({"code":"1","message":"Aucune transaction trouvée","transaction":null})
    );
    state.shutdown.cancel();
}

#[tokio::test]
async fn auth_validation_manual_resolution_and_refunds() {
    let (base, state) = server().await;
    let unauthorized = Client::new()
        .post(format!("{base}/api/rest/v1/paymentService"))
        .json(&mobile("243810000001", "http://localhost/callback"))
        .send()
        .await
        .unwrap();
    assert_eq!(unauthorized.status(), 401);
    let mut bad = mobile("243810000001", "not-a-url");
    let response = Client::new()
        .post(format!("{base}/api/rest/v1/paymentService"))
        .bearer_auth("test-token")
        .json(&bad)
        .send()
        .await
        .unwrap();
    assert_eq!(response.status(), 400);
    bad["callbackUrl"] = json!("http://localhost/callback");
    bad["amount"] = json!(-1);
    let response = Client::new()
        .post(format!("{base}/api/rest/v1/paymentService"))
        .bearer_auth("test-token")
        .json(&bad)
        .send()
        .await
        .unwrap();
    assert_eq!(response.status(), 400);
    let response = create(
        &base,
        &mobile("243810000003", "http://127.0.0.1:1/callback"),
        "/api/rest/v1/paymentService",
    )
    .await;

    let id = response["orderNumber"].as_str().unwrap();

    for status in [0, 3, 4] {
        let response = Client::new()
            .post(format!("{base}/api/simulator/transactions/{id}/resolve"))
            .json(&json!({"status":status}))
            .send()
            .await
            .unwrap();
        assert!(response.status().is_success());
        assert_eq!(
            check(&base, id).await["transaction"]["status"],
            status.to_string()
        );
    }

    let response = Client::new()
        .post(format!("{base}/api/simulator/transactions/{id}/resolve"))
        .json(&json!({"status":0}))
        .send()
        .await
        .unwrap();
    assert_eq!(response.status(), 400);
    state.shutdown.cancel();
}
