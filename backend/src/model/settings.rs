use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Rule {
    pub kind: String,
    pub value: String,
    pub outcome: String,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub default_outcome: String,
    pub delay_ms: u64,
    pub fee_basis_points: i64,
    pub rules: Vec<Rule>,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            default_outcome: "success".into(),
            delay_ms: 1500,
            fee_basis_points: 250,
            rules: vec![
                Rule {
                    kind: "phone".into(),
                    value: "243810000001".into(),
                    outcome: "success".into(),
                },
                Rule {
                    kind: "phone".into(),
                    value: "243810000002".into(),
                    outcome: "failure".into(),
                },
                Rule {
                    kind: "phone".into(),
                    value: "243810000003".into(),
                    outcome: "pending".into(),
                },
                Rule {
                    kind: "card".into(),
                    value: "4242424242424242".into(),
                    outcome: "success".into(),
                },
                Rule {
                    kind: "card".into(),
                    value: "4000000000000002".into(),
                    outcome: "failure".into(),
                },
                Rule {
                    kind: "card".into(),
                    value: "4000000000003220".into(),
                    outcome: "pending".into(),
                },
            ],
        }
    }
}

impl Settings {
    pub fn outcome(&self, kind: &str, value: &str) -> &str {
        self.rules
            .iter()
            .find(|r| r.kind == kind && r.value == value)
            .map_or(self.default_outcome.as_str(), |r| r.outcome.as_str())
    }

    pub fn validate(&self) -> Result<(), String> {
        if !["success", "failure", "pending"].contains(&self.default_outcome.as_str())
            || self.delay_ms > 60000
            || !(0..=10000).contains(&self.fee_basis_points)
        {
            return Err("Invalid outcome, delay (0–60000ms), or fee (0–10000 basis points)".into());
        }

        let mut seen = std::collections::HashSet::new();

        for r in &self.rules {
            let length = if r.kind == "phone" {
                12..=12
            } else if r.kind == "card" {
                13..=19
            } else {
                return Err("Rule kind must be phone or card".into());
            };

            if !length.contains(&r.value.len())
                || !r.value.bytes().all(|b| b.is_ascii_digit())
                || !["success", "failure", "pending"].contains(&r.outcome.as_str())
                || !seen.insert((&r.kind, &r.value))
            {
                return Err(
                    "Rules require unique digit-only phone/card values and a valid outcome".into(),
                );
            }
        }

        Ok(())
    }
}
