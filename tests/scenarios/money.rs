use flexpay_proxy::model::amount_cents;
use serde_json::json;

#[test]
fn exact_decimal_amounts() {
    assert_eq!(amount_cents(&json!("0.01")).unwrap(), 1);
    assert_eq!(amount_cents(&json!(25.63)).unwrap(), 2563);
    assert_eq!(amount_cents(&json!("100")).unwrap(), 10000);

    for value in [
        json!("0"),
        json!("-1"),
        json!("1.234"),
        json!("NaN"),
        json!("1e5"),
        json!(null),
        json!("99999999999999999999"),
    ] {
        assert!(amount_cents(&value).is_err(), "{value}");
    }
}
