use axum::{
    Json,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use serde_json::json;

#[derive(Debug, thiserror::Error)]
pub enum ApiError {
    #[error("{0}")]
    Invalid(String),
    #[error("Invalid merchant or Bearer token")]
    Unauthorized,
    #[error("Transaction not found")]
    NotFound,
    #[error("{0}")]
    Internal(#[from] anyhow::Error),
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let status = match &self {
            Self::Invalid(_) => StatusCode::BAD_REQUEST,
            Self::Unauthorized => StatusCode::UNAUTHORIZED,
            Self::NotFound => StatusCode::NOT_FOUND,
            Self::Internal(e) => {
                tracing::error!(error=%e, "Request failed");
                StatusCode::INTERNAL_SERVER_ERROR
            }
        };

        let message = if status == StatusCode::INTERNAL_SERVER_ERROR {
            "Internal simulator error".into()
        } else {
            self.to_string()
        };

        let body = json!({
            "code": "1",
            "message": message,
            "error": status.canonical_reason().unwrap_or("error"),
        });

        (status, Json(body)).into_response()
    }
}

pub(crate) type ApiResult<T> = Result<T, ApiError>;
