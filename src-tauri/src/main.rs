// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Serialize)]
struct FinancialMetrics {
    ticker: String,
    period: String,
    metrics: HashMap<String, f64>,
    metadata: Metadata,
}

#[derive(Debug, Serialize)]
struct Metadata {
    currency: String,
    fiscal_year: i32,
    last_updated: String,
}

#[derive(Debug, Deserialize)]
struct MetricsRequest {
    ticker: String,
    period: String,
    metrics: Option<Vec<String>>,
}

#[tauri::command]
async fn get_financial_metrics(request: MetricsRequest) -> Result<FinancialMetrics, String> {
    // 这里是模拟数据，实际应用中会调用金融数据API
    let mut metrics = HashMap::new();
    metrics.insert("return_on_equity".to_string(), 0.245);
    metrics.insert("return_on_assets".to_string(), 0.178);
    metrics.insert("debt_to_equity".to_string(), 1.2);
    metrics.insert("current_ratio".to_string(), 1.8);
    metrics.insert("quick_ratio".to_string(), 1.5);
    metrics.insert("operating_margin".to_string(), 0.21);
    metrics.insert("net_margin".to_string(), 0.185);
    metrics.insert("price_to_earnings".to_string(), 18.5);
    metrics.insert("price_to_book".to_string(), 3.2);
    metrics.insert("price_to_sales".to_string(), 1.9);
    metrics.insert("revenue_growth".to_string(), 0.15);
    metrics.insert("earnings_growth".to_string(), 0.12);

    let metadata = Metadata {
        currency: "USD".to_string(),
        fiscal_year: 2023,
        last_updated: chrono::Utc::now().to_rfc3339(),
    };

    Ok(FinancialMetrics {
        ticker: request.ticker,
        period: request.period,
        metrics,
        metadata,
    })
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_financial_metrics])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
