use reqwest::Client;
use serde_json::{Value, json};

use crate::common::{check, create, server};

#[tokio::test]
async fn card_aliases_checkout_outcomes_and_cancel() {
    let (base, state) = server().await;

    for (snake, number, status, cancel) in [
        (true, "4242424242424242", 0, false),
        (false, "4000000000000002", 1, false),
        (false, "4000000000003220", 2, false),
        (true, "", 5, true),
    ] {
        let mut body = json!({
            "merchant": "TESTMERCHANT",
            "authorization": "Bearer test-token",
            "reference": "card-123",
            "amount": 5.25,
            "currency": "USD",
            "description": "Test card",
        });

        for (camel, snake_name) in [
            ("callbackUrl", "callback_url"),
            ("approveUrl", "approve_url"),
            ("declineUrl", "decline_url"),
            ("cancelUrl", "cancel_url"),
            ("homeUrl", "home_url"),
        ] {
            body[if snake { snake_name } else { camel }] = json!(format!("{base}/return"));
        }

        let response = create(&base, &body, "/v1.1/pay").await;
        assert_eq!(response["code"], 0);
        let id = response["orderNumber"].as_str().unwrap();
        assert_eq!(response["url"], format!("{base}/checkout/{id}"));
        let checkout: Value = Client::new()
            .post(format!("{base}/api/simulator/checkout/{id}"))
            .json(&json!({"cardNumber":number,"cancel":cancel}))
            .send()
            .await
            .unwrap()
            .error_for_status()
            .unwrap()
            .json()
            .await
            .unwrap();
        assert_eq!(checkout["status"], status);
        assert_eq!(
            check(&base, id).await["transaction"]["status"],
            status.to_string()
        );

        if status != 2 {
            assert_eq!(checkout["redirectUrl"], format!("{base}/return"));
            let duplicate = Client::new()
                .post(format!("{base}/api/simulator/checkout/{id}"))
                .json(&json!({"cardNumber":number}))
                .send()
                .await
                .unwrap();
            assert_eq!(duplicate.status(), 400);
        }

        let stored = serde_json::to_string(&state.store.get(id).await.unwrap()).unwrap();
        assert!(!stored.contains("Bearer"));
        assert!(!stored.contains("4242424242424242"));
    }
    state.shutdown.cancel();
}
