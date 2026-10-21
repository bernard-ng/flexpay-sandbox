use serde::{Deserialize, Serialize};
use serde_json::{Value, json};

use crate::clock::now;

use super::{PaymentKind, PaymentRequest, money};

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Transaction {
    pub order_number: String,
    pub kind: String,
    pub request: PaymentRequest,
    pub amount: String,
    pub amount_customer: String,
    pub status: u8,
    pub channel: String,
    pub provider_reference: String,
    pub created_at: String,
    pub callback_attempts: Vec<CallbackAttempt>,
}

impl Transaction {
    pub(crate) fn pending(
        request: PaymentRequest,
        kind: PaymentKind,
        cents: i64,
        fee_basis_points: i64,
    ) -> Self {
        let channel = if kind == PaymentKind::Card {
            "visa".into()
        } else {
            mobile_channel(request.phone.as_deref().unwrap_or_default())
        };

        Self {
            order_number: format!("SIM{}", uuid::Uuid::new_v4().simple()),
            kind: kind.as_str().into(),
            amount: money(cents),
            amount_customer: money(cents + (cents * fee_basis_points + 5000) / 10000),
            status: 2,
            channel,
            provider_reference: String::new(),
            created_at: now(),
            request,
            callback_attempts: vec![],
        }
    }

    pub(crate) fn resolve(&mut self, status: u8, card_channel: Option<String>) -> bool {
        let allowed = self.status == 2 && [0, 1, 5].contains(&status)
            || self.status == 0 && status == 3
            || self.status == 3 && status == 4;

        if !allowed {
            return false;
        }

        self.status = status;

        if let Some(channel) = card_channel {
            self.channel = channel;
        }

        self.provider_reference = if status == 0 {
            format!("SIM-{}", &self.order_number[3..15])
        } else {
            String::new()
        };

        true
    }

    pub fn wire(&self) -> Value {
        json!({
            "reference": self.request.reference,
            "orderNumber": self.order_number,
            "amount": self.amount,
            "amountCustomer": self.amount_customer,
            "currency": self.request.currency,
            "createdAt": self.created_at,
            "status": self.status.to_string(),
            "channel": self.channel,
        })
    }

    pub fn callback(&self) -> Value {
        let mut body = self.wire();
        let object = body.as_object_mut().expect("wire is an object");
        object.remove("status");
        object.insert(
            "code".into(),
            json!(if self.status == 0 { "0" } else { "1" }),
        );
        object.insert(
            "phone".into(),
            json!(self.request.phone.clone().unwrap_or_default()),
        );
        object.insert("provider_reference".into(), json!(self.provider_reference));
        body
    }
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CallbackAttempt {
    pub at: String,
    pub status: Option<u16>,
    pub error: Option<String>,
    pub payload: Value,
}

fn mobile_channel(phone: &str) -> String {
    match phone.get(3..5).unwrap_or_default() {
        "81" | "82" | "83" => "mpesa",
        "84" | "85" | "89" => "om",
        "97" | "98" | "99" => "airtelmoney",
        _ => "afrimoney",
    }
    .into()
}
