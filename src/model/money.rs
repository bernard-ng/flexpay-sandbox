use serde_json::Value;

pub fn amount_cents(value: &Value) -> Result<i64, String> {
    let text = match value {
        Value::String(s) => s.trim().to_owned(),
        Value::Number(n) => n.to_string(),
        _ => return Err("amount must be a number or decimal string".into()),
    };

    let (whole, fraction) = text.split_once('.').unwrap_or((&text, ""));

    if whole.is_empty()
        || !whole.bytes().all(|b| b.is_ascii_digit())
        || fraction.len() > 2
        || !fraction.bytes().all(|b| b.is_ascii_digit())
    {
        return Err("amount must be positive with at most two decimal places".into());
    }

    let cents = whole
        .parse::<i64>()
        .ok()
        .and_then(|n| n.checked_mul(100))
        .and_then(|n| n.checked_add(format!("{fraction:0<2}").parse::<i64>().ok()?))
        .filter(|n| *n > 0 && *n <= 100_000_000_000)
        .ok_or_else(|| "amount is outside the supported range".to_string())?;

    Ok(cents)
}

pub fn money(cents: i64) -> String {
    format!("{}.{:02}", cents / 100, cents % 100)
}
