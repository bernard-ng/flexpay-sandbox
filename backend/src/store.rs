use std::sync::{Arc, Mutex};

use anyhow::{Context, Result};
use rusqlite::{Connection, OptionalExtension, params};

use crate::model::{Settings, Transaction};

#[derive(Clone)]
pub struct Store(Arc<Mutex<Connection>>);

impl Store {
    pub fn open(path: &str) -> Result<Self> {
        if path != ":memory:"
            && let Some(parent) = std::path::Path::new(path)
                .parent()
                .filter(|p| !p.as_os_str().is_empty())
        {
            std::fs::create_dir_all(parent)?;
        }

        let connection = Connection::open(path)?;
        connection.execute_batch(
            "PRAGMA journal_mode=WAL;
             CREATE TABLE IF NOT EXISTS transactions (id TEXT PRIMARY KEY, data TEXT NOT NULL);
             CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY CHECK(id=1), data TEXT NOT NULL);",
        )?;

        Ok(Self(Arc::new(Mutex::new(connection))))
    }

    pub async fn run<T: Send + 'static>(
        &self,
        f: impl FnOnce(&Connection) -> Result<T> + Send + 'static,
    ) -> Result<T> {
        let db = self.0.clone();

        tokio::task::spawn_blocking(move || {
            let connection = db
                .lock()
                .map_err(|_| anyhow::anyhow!("Database lock poisoned"))?;

            f(&connection)
        })
        .await?
    }

    pub async fn get(&self, id: &str) -> Result<Option<Transaction>> {
        let id = id.to_owned();

        self.run(move |db| {
            let data: Option<String> = db
                .query_row("SELECT data FROM transactions WHERE id=?1", [id], |r| {
                    r.get(0)
                })
                .optional()?;

            data.map(|d| serde_json::from_str(&d).context("Invalid transaction"))
                .transpose()
        })
        .await
    }

    pub async fn insert(&self, tx: Transaction) -> Result<()> {
        self.run(move |db| {
            db.execute(
                "INSERT INTO transactions (id,data) VALUES (?1,?2)",
                params![tx.order_number, serde_json::to_string(&tx)?],
            )?;

            Ok(())
        })
        .await
    }

    // Mutations read and write under one lock, including reset: background work cannot resurrect deleted records.
    pub async fn update(
        &self,
        id: &str,
        f: impl FnOnce(&mut Transaction) -> bool + Send + 'static,
    ) -> Result<Option<Transaction>> {
        let id = id.to_owned();

        self.run(move |db| {
            let data: Option<String> = db
                .query_row("SELECT data FROM transactions WHERE id=?1", [&id], |r| {
                    r.get(0)
                })
                .optional()?;

            let Some(data) = data else {
                return Ok(None);
            };

            let mut tx: Transaction = serde_json::from_str(&data)?;

            if !f(&mut tx) {
                return Ok(None);
            }

            db.execute(
                "UPDATE transactions SET data=?2 WHERE id=?1",
                params![id, serde_json::to_string(&tx)?],
            )?;

            Ok(Some(tx))
        })
        .await
    }

    pub async fn list(&self) -> Result<Vec<Transaction>> {
        self.run(|db| {
            let mut statement = db.prepare("SELECT data FROM transactions ORDER BY rowid DESC")?;
            let rows = statement.query_map([], |r| r.get::<_, String>(0))?;

            rows.map(|r| Ok(serde_json::from_str(&r?)?)).collect()
        })
        .await
    }

    pub async fn settings(&self) -> Result<Settings> {
        self.run(|db| {
            let data: Option<String> = db
                .query_row("SELECT data FROM settings WHERE id=1", [], |r| r.get(0))
                .optional()?;

            Ok(data
                .map(|d| serde_json::from_str(&d))
                .transpose()?
                .unwrap_or_default())
        })
        .await
    }

    pub async fn save_settings(&self, settings: Settings) -> Result<()> {
        self.run(move |db| {
            db.execute(
                "INSERT INTO settings VALUES (1,?1)
                 ON CONFLICT(id) DO UPDATE SET data=excluded.data",
                [serde_json::to_string(&settings)?],
            )?;

            Ok(())
        })
        .await
    }

    pub async fn reset(&self) -> Result<()> {
        self.run(|db| {
            db.execute("DELETE FROM transactions", [])?;

            Ok(())
        })
        .await
    }
}
