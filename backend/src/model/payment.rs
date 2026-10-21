use serde::{Deserialize, Serialize};
use serde_json::Value;

use super::amount_cents;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub(crate) enum PaymentKind {
    Mobile,
    Payout,
    Card,
}

impl PaymentKind {
    pub(crate) fn as_str(self) -> &'static str {
        match self {
            Self::Mobile => "mobile",
            Self::Payout => "payout",
            Self::Card => "card",
        }
    }
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PaymentRequest {
    pub merchant: String,
    #[serde(default)]
    pub authorization: Option<String>,
    #[serde(default, rename = "type")]
    pub payment_type: Option<Value>,
    pub reference: String,
    #[serde(default)]
    pub phone: Option<String>,
    pub amount: Value,
    pub currency: String,
    #[serde(alias = "callback_url")]
    pub callback_url: String,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default, alias = "approve_url")]
    pub approve_url: Option<String>,
    #[serde(default, alias = "cancel_url")]
    pub cancel_url: Option<String>,
    #[serde(default, alias = "decline_url")]
    pub decline_url: Option<String>,
    #[serde(default, alias = "home_url")]
    pub home_url: Option<String>,
}

impl PaymentRequest {
    pub(crate) fn validate(&self, kind: PaymentKind) -> Result<i64, String> {
        let cents = amount_cents(&self.amount)?;

        if !["USD", "CDF"].contains(&self.currency.as_str())
            || self.reference.trim().is_empty()
            || !valid_url(&self.callback_url)
        {
            return Err("currency, reference, and a valid HTTP callbackUrl are required".into());
        }

        if kind == PaymentKind::Card {
            self.validate_card()?;
        } else {
            self.validate_mobile()?;
        }

        Ok(cents)
    }

    fn validate_card(&self) -> Result<(), String> {
        if self.reference.chars().count() > 25
            || self
                .description
                .as_deref()
                .is_none_or(|description| description.trim().is_empty())
            || [
                &self.approve_url,
                &self.cancel_url,
                &self.decline_url,
                &self.home_url,
            ]
            .iter()
            .any(|url| url.as_deref().is_none_or(|url| !valid_url(url)))
        {
            return Err("Card payments require description, reference (1–25 characters), and valid approve/cancel/decline/home URLs".into());
        }

        Ok(())
    }

    fn validate_mobile(&self) -> Result<(), String> {
        let phone = self.phone.as_deref().unwrap_or_default();

        if phone.len() != 12
            || !phone.bytes().all(|byte| byte.is_ascii_digit())
            || !matches!(self.payment_type.as_ref(), Some(Value::Number(number)) if number.as_u64() == Some(1))
                && !matches!(self.payment_type.as_ref(), Some(Value::String(value)) if value == "1")
        {
            return Err("phone must contain 12 digits and type must be 1".into());
        }

        Ok(())
    }
}

fn valid_url(value: &str) -> bool {
    reqwest::Url::parse(value)
        .is_ok_and(|u| ["http", "https"].contains(&u.scheme()) && u.host_str().is_some())
}
