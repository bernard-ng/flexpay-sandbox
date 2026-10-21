use axum::http::HeaderMap;
use subtle::ConstantTimeEq;

use crate::{ApiError, AppState, error::ApiResult};

pub(super) fn authorize(
    state: &AppState,
    headers: &HeaderMap,
    body_token: Option<&str>,
) -> ApiResult<()> {
    let supplied = headers
        .get("authorization")
        .and_then(|h| h.to_str().ok())
        .or(body_token)
        .unwrap_or_default();
    let expected = format!("Bearer {}", state.token);

    if bool::from(supplied.as_bytes().ct_eq(expected.as_bytes())) {
        Ok(())
    } else {
        Err(ApiError::Unauthorized)
    }
}
