use std::{sync::Arc, time::Duration};

use tokio_util::{sync::CancellationToken, task::TaskTracker};

use crate::store::Store;

#[derive(Clone)]
pub struct AppState {
    pub store: Store,
    pub merchant: String,
    pub token: String,
    pub public_url: String,
    pub http: reqwest::Client,
    pub shutdown: CancellationToken,
    pub tasks: TaskTracker,
}

impl AppState {
    pub fn new(
        store: Store,
        merchant: String,
        token: String,
        public_url: String,
    ) -> anyhow::Result<Arc<Self>> {
        Ok(Arc::new(Self {
            store,
            merchant,
            token,
            public_url: public_url.trim_end_matches('/').into(),
            http: reqwest::Client::builder()
                .timeout(Duration::from_secs(10))
                .redirect(reqwest::redirect::Policy::none())
                .build()?,
            shutdown: CancellationToken::new(),
            tasks: TaskTracker::new(),
        }))
    }
}
