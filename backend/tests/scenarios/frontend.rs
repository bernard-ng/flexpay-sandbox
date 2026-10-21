use reqwest::Client;

use crate::common::server_with_frontend;

#[tokio::test]
async fn dashboard_deep_links_and_assets_are_served_successfully() {
    let frontend = std::env::temp_dir().join(format!("flexpay-ui-{}", uuid::Uuid::new_v4()));
    std::fs::create_dir_all(frontend.join("assets")).unwrap();
    std::fs::write(frontend.join("_shell.html"), "<html>Dashboard</html>").unwrap();
    std::fs::write(frontend.join("assets/app.js"), "console.log('dashboard')").unwrap();

    let (base, _) = server_with_frontend(frontend.to_str().unwrap()).await;
    let client = Client::new();

    for path in ["/", "/settings", "/checkout/order-123"] {
        let response = client.get(format!("{base}{path}")).send().await.unwrap();

        assert_eq!(response.status(), 200, "dashboard route {path}");
        assert_eq!(
            response.headers()["content-type"],
            "text/html",
            "dashboard route {path}"
        );
        assert_eq!(response.text().await.unwrap(), "<html>Dashboard</html>");
    }

    let asset = client
        .get(format!("{base}/assets/app.js"))
        .send()
        .await
        .unwrap();

    assert_eq!(asset.status(), 200);
    assert_eq!(asset.text().await.unwrap(), "console.log('dashboard')");

    std::fs::remove_dir_all(frontend).unwrap();
}
