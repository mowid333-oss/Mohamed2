"""
وحدة جلب بيانات أسعار ومؤشرات البورصة المصرية عبر TradingView Scanner API
تقوم بإرسال طلب POST واحد لجلب الأسهم والمؤشرات وحفظها في قاعدة بيانات egx_market.db
داخل الجداول الموحدة: stocks_latest و market_indices
"""

import logging
from datetime import datetime
from typing import List, Dict, Any, Tuple
import zoneinfo
import requests

from tickers import (
    TRADINGVIEW_INDICES_TICKERS,
    INDICES_METADATA,
    EGX_STOCKS_METADATA,
    get_all_tradingview_tickers,
    get_stock_meta_by_tv_ticker,
)
from database import upsert_stocks_latest, upsert_market_indices

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("TRADINGVIEW_FETCHER")

CAIRO_TZ = zoneinfo.ZoneInfo("Africa/Cairo")
TRADINGVIEW_SCANNER_URL = "https://scanner.tradingview.com/egypt/scan"
REQUESTED_COLUMNS = ["close", "change", "change_abs", "open", "high", "low", "volume"]

def is_egx_market_open() -> Tuple[bool, str]:
    now = datetime.now(CAIRO_TZ)
    weekday = now.weekday()
    if weekday in (4, 5):
        return False, "إجازة نهاية الأسبوع (البورصة مغلقة)"
    market_open = now.replace(hour=10, minute=0, second=0, microsecond=0)
    market_close = now.replace(hour=14, minute=30, second=0, microsecond=0)
    if market_open <= now <= market_close:
        return True, "جلسة التداول مفتوحة ولحظية 🟢"
    elif now < market_open:
        return False, "قبل بدء جلسة التداول (قبل 10:00 ص)"
    else:
        return False, "انتهت جلسة تداول اليوم (إغلاق رسمي)"

def fetch_and_cache_tradingview_data() -> Dict[str, Any]:
    """جلب بيانات TradingView وتخزينها في جداول stocks_latest و market_indices"""
    now_cairo = datetime.now(CAIRO_TZ)
    updated_at_str = now_cairo.strftime("%Y-%m-%d %I:%M:%S %p")
    is_open, market_status = is_egx_market_open()

    all_tv_tickers = get_all_tradingview_tickers()
    payload = {
        "symbols": {
            "tickers": all_tv_tickers,
            "query": {"types": []}
        },
        "columns": REQUESTED_COLUMNS
    }
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    indices_records: List[Dict[str, Any]] = []
    stocks_records: List[Dict[str, Any]] = []

    try:
        response = requests.post(TRADINGVIEW_SCANNER_URL, json=payload, headers=headers, timeout=15)
        response.raise_for_status()
        data_items = response.json().get("data", [])

        for item in data_items:
            s_ticker = item.get("s", "")
            d_vals = item.get("d", [])
            if not s_ticker or len(d_vals) < 7:
                continue

            close_val = float(d_vals[0]) if d_vals[0] is not None else 0.0
            change_pct = round(float(d_vals[1]), 2) if d_vals[1] is not None else 0.0
            change_abs = round(float(d_vals[2]), 2) if d_vals[2] is not None else 0.0
            open_val = float(d_vals[3]) if d_vals[3] is not None else close_val
            high_val = float(d_vals[4]) if d_vals[4] is not None else close_val
            low_val = float(d_vals[5]) if d_vals[5] is not None else close_val
            volume_val = int(d_vals[6]) if d_vals[6] is not None else 0

            # 1. مؤشرات السوق
            if s_ticker in INDICES_METADATA:
                idx_meta = INDICES_METADATA[s_ticker]
                indices_records.append({
                    "symbol": idx_meta["symbol"],
                    "name": idx_meta["name_ar"],
                    "current_value": round(close_val, 2),
                    "change_value": change_abs,
                    "change_percent": change_pct,
                    "high": round(high_val, 2),
                    "low": round(low_val, 2),
                    "updated_at": updated_at_str,
                })
            # 2. الأسهم المصرية
            else:
                stock_meta = get_stock_meta_by_tv_ticker(s_ticker)
                ticker_clean = s_ticker.replace("EGX:", "")
                symbol_ca = f"{ticker_clean}.CA"
                name_ar = stock_meta["name_ar"] if stock_meta else ticker_clean

                record_data = {
                    "name": name_ar,
                    "price": round(close_val, 2),
                    "change_percent": change_pct,
                    "high": round(high_val, 2),
                    "low": round(low_val, 2),
                    "open": round(open_val, 2),
                    "volume": volume_val,
                    "updated_at": updated_at_str,
                }
                # حفظ الرمز بصيغة .CA وبدونها لضمان إيجاده دائماً
                stocks_records.append({**record_data, "ticker": symbol_ca})
                stocks_records.append({**record_data, "ticker": ticker_clean})

    except Exception as e:
        logger.warning(f"ملاحظة: تعذر الاتصال بـ TradingView API مؤقتاً ({e}).")

    saved_indices = upsert_market_indices(indices_records)
    saved_stocks = upsert_stocks_latest(stocks_records)

    return {
        "success": True,
        "indices_updated": saved_indices,
        "stocks_updated": saved_stocks,
        "updated_at": updated_at_str,
        "is_market_open": is_open,
        "market_status": market_status,
    }
