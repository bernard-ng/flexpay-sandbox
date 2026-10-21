use flexpay_proxy::{model::Settings, store::Store};

use crate::common::{create, mobile, server};

#[tokio::test]
async fn sqlite_survives_reopen_and_rules_are_validated() {
    let path = std::env::temp_dir().join(format!("flexpay-test-{}.db", uuid::Uuid::new_v4()));
    let (base, state) = server().await;
    let response = create(
        &base,
        &mobile("243810000003", "http://127.0.0.1:1/callback"),
        "/api/rest/v1/paymentService",
    )
    .await;

    let payment = state
        .store
        .get(response["orderNumber"].as_str().unwrap())
        .await
        .unwrap()
        .unwrap();
    state.shutdown.cancel();
    {
        let store = Store::open(path.to_str().unwrap()).unwrap();
        store.insert(payment.clone()).await.unwrap();
        let settings = Settings {
            delay_ms: 300,
            ..Settings::default()
        };
        store.save_settings(settings).await.unwrap();
    }
    {
        let store = Store::open(path.to_str().unwrap()).unwrap();
        assert_eq!(store.settings().await.unwrap().delay_ms, 300);
        assert_eq!(
            store
                .get(&payment.order_number)
                .await
                .unwrap()
                .unwrap()
                .request
                .reference,
            "order-123"
        );
    }
    std::fs::remove_file(path).unwrap();
    let mut settings = Settings::default();
    settings.rules.push(settings.rules[0].clone());
    assert!(settings.validate().is_err());
}
