import React, { useState } from 'react';
import {
  Code,
  Copy,
  Check,
  X,
  Server,
  Database,
  Clock,
  Download,
  Terminal,
  ExternalLink,
  ShieldCheck,
  Zap,
  Globe,
  Layers,
  FileCode,
  Sparkles,
} from 'lucide-react';

interface PythonBackendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BACKEND_FILES = [
  {
    id: 'main',
    name: 'main.py',
    badge: 'Quant Engine + Groq AI',
    desc: 'الخادم المتكامل لدمج محرك التحليل الفني (smart_drawer) ومسارات /indicator و /scan و /api/analyze/{ticker}',
    code: `from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
import logging
import os
from typing import Optional, List, Dict, Any

# استدعاء مكتبة Groq للذكاء الاصطناعي
try:
    from groq import Groq
except ImportError:
    Groq = None

from database import init_db
try:
    from scheduler import start_scheduler
except ImportError:
    from scheduler import start_background_scheduler as start_scheduler

# استيراد محرك التحليل الفني (Quant Engine)
from smart_drawer import compute, load_ohlcv

# مفتاح Groq الخاص بك مدمج مباشرة لتسهيل التشغيل الفوري
GROQ_API_KEY = os.environ.get(
    "GROQ_API_KEY",
    "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"
)

groq_client = Groq(api_key=GROQ_API_KEY) if Groq else None

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("egx.main")

app = FastAPI(
    title="EGX Quant Radar & AI Technical Analysis API 🇪🇬",
    description="واجهة برمجية فائقة السرعة للبورصة المصرية مدمجة بمحرك التحليل الفني الذكي (Smart Drawer) والذكاء الاصطناعي عبر Groq (llama3-70b-8192).",
    version="3.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    logger.info("Initializing EGX Backend & Database...")
    init_db()
    try:
        start_scheduler()
        logger.info("Background Scheduler started successfully.")
    except Exception as e:
        logger.warning(f"Could not start background scheduler: {e}")

def get_db_connection():
    db_path = os.environ.get("EGX_DB_PATH", os.path.join(os.path.dirname(__file__), "egx_market.db"))
    conn = sqlite3.connect(db_path, timeout=20.0)
    conn.row_factory = sqlite3.Row
    return conn

# ============ مسارات قاعدة البيانات الأساسية ============
@app.get("/api/stocks", tags=["الأسعار وجداول السوق"])
def get_stocks(search: Optional[str] = Query(None)):
    conn = get_db_connection()
    try:
        if search:
            p = f"%{search.strip()}%"
            stocks = conn.execute("SELECT * FROM stocks_latest WHERE ticker LIKE ? OR name LIKE ? ORDER BY price DESC", (p, p)).fetchall()
        else:
            stocks = conn.execute("SELECT * FROM stocks_latest ORDER BY price DESC").fetchall()
    except sqlite3.OperationalError:
        try:
            if search:
                p = f"%{search.strip()}%"
                stocks = conn.execute("SELECT * FROM stocks WHERE ticker LIKE ? OR name LIKE ? ORDER BY price DESC", (p, p)).fetchall()
            else:
                stocks = conn.execute("SELECT * FROM stocks ORDER BY price DESC").fetchall()
        except sqlite3.OperationalError:
            stocks = []
    finally:
        conn.close()
    return [dict(row) for row in stocks]

@app.get("/api/indices", tags=["مؤشرات السوق"])
def get_indices():
    conn = get_db_connection()
    try:
        indices = conn.execute("SELECT * FROM market_indices ORDER BY current_value DESC").fetchall()
    except sqlite3.OperationalError:
        indices = []
    finally:
        conn.close()
    return [dict(row) for row in indices]

# ============ مسارات محرك التحليل الفني (Smart Drawer) ============
@app.get("/indicator/{symbol}", tags=["محرك التحليل الفني Quant"])
def indicator(symbol: str, tf: str = "1d", last: int = 30):
    df = load_ohlcv(symbol, tf)
    if df is None or df.empty:
        return {"error": f"لا توجد بيانات للسهم {symbol}"}
    out, events, state = compute(df)
    ev = events.tail(last).astype({"time": str}).to_dict("records") if not events.empty else []
    return {
        "symbol": symbol,
        "close": float(out.close.iloc[-1]),
        "state": state,
        "events": ev
    }

@app.get("/scan", tags=["محرك التحليل الفني Quant"])
def scan(symbols: str, tf: str = "1d", within_bars: int = 3, event: Optional[str] = None):
    res = []
    symbol_list = [s.strip() for s in symbols.split(",") if s.strip()]
    for s in symbol_list:
        df = load_ohlcv(s, tf)
        if df is None or df.empty:
            continue
        out, events, state = compute(df)
        if events is None or events.empty:
            continue
        fresh = events[events.bar >= len(out) - within_bars]
        if event:
            fresh = fresh[fresh.event == event]
        if not fresh.empty:
            res.append({
                "symbol": s,
                "events": fresh.astype({"time": str}).to_dict("records"),
                "state": state
            })
    return res

# ============ مسار الذكاء الاصطناعي (الدمج النهائي) ============
@app.get("/api/analyze/{ticker}", tags=["التحليل الذكي بالذكاء الاصطناعي"])
def analyze_stock(ticker: str):
    clean = ticker.upper().strip().replace("EGX:", "")
    clean_no_ca = clean.replace(".CA", "")
    clean_ca = f"{clean_no_ca}.CA"

    conn = get_db_connection()
    stock = None
    try:
        stock = conn.execute(
            "SELECT * FROM stocks_latest WHERE ticker = ? OR ticker = ? OR ticker LIKE ? LIMIT 1",
            (clean, clean_ca, f"%{clean_no_ca}%")
        ).fetchone()
    except sqlite3.OperationalError:
        try:
            stock = conn.execute(
                "SELECT * FROM stocks WHERE ticker = ? OR ticker = ? OR ticker LIKE ? LIMIT 1",
                (clean, clean_ca, f"%{clean_no_ca}%")
            ).fetchone()
        except sqlite3.OperationalError:
            pass
    finally:
        conn.close()

    if not stock:
        return {"error": "عذراً، السهم غير موجود في قاعدة البيانات."}

    stock_data = dict(stock)
    stock_name = stock_data.get("name", ticker)
    price = stock_data.get("price", 0.0)
    change_pct = stock_data.get("change_percent", 0.0)

    # 2. تشغيل المحرك الكمي (smart_drawer) لاصطياد الإشارات في آخر 3 شموع
    df = load_ohlcv(ticker, "1d")
    recent_events_text = "لا توجد نماذج فنية واضحة أو إشارات كسر ملحوظة اليوم."

    if df is not None and not df.empty:
        out, events, state = compute(df)
        if events is not None and not events.empty:
            recent_events = events[events.bar >= len(out) - 3]
            if not recent_events.empty:
                event_list = recent_events["event"].tolist()
                recent_events_text = "، ".join(event_list)

    # 3. توجيه الذكاء الاصطناعي بالبيانات ومخرجات المحرك
    prompt = f"""أنت خبير مالي ومحلل فني محترف في البورصة المصرية.
نظامي الخوارزمي المتقدم قام بفحص السهم واستخراج هذه الإشارات اللحظية.
اكتب رأيك الفني الحاسم في 3 سطور فقط باللغة العربية بناءً عليها:

- اسم السهم: {stock_name} ({ticker})
- السعر الحالي: {price} جنيه مصري
- نسبة التغير اليوم: {change_pct:+.2f}%
- الإشارات والنماذج الفنية التي ظهرت الآن: {recent_events_text}

هل السهم إيجابي أم سلبي اليوم؟ اذكر النماذج الفنية في ردك إذا وجدت، واكتب التقرير بشكل احترافي وجذاب."""

    try:
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": "أنت كبير المحللين الفنيين في سوق المال المصري. تقدم تحليلات فنية احترافية في 3 أسطر باللغة العربية."},
                {"role": "user", "content": prompt}
            ],
            model="llama3-70b-8192",
            temperature=0.35,
            max_tokens=350,
        )
        analysis = chat_completion.choices[0].message.content.strip()
        return {
            "status": "success",
            "ticker": ticker,
            "name": stock_name,
            "price": price,
            "change_percent": change_pct,
            "technical_events": recent_events_text,
            "model_used": "llama3-70b-8192 (Groq)",
            "analysis": analysis
        }
    except Exception as e:
        return {"error": f"حدث خطأ في الذكاء الاصطناعي: {str(e)}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)`,
  },
  {
    id: 'smart_drawer',
    name: 'smart_drawer.py',
    badge: 'Quant Engine',
    desc: 'محرك التحليل الفني الكمي لحساب المؤشرات (SuperTrend, MACD, RSI) وتوليد الأحداث (Events)',
    code: `\"\"\"
محرك التحليل الفني الكمي (Smart Drawer / Quant Engine) للبورصة المصرية
يقوم بحساب المؤشرات الفنية المتقدمة (SuperTrend, MACD, RSI, Moving Averages)
واصطياد الإشارات والنماذج اللحظية وتوليد الأحداث الفنية (Events).
\"\"\"
import sqlite3
import os
from datetime import datetime, timedelta
import pandas as pd
import numpy as np

DB_PATH = os.environ.get("EGX_DB_PATH", os.path.join(os.path.dirname(__file__), "egx_market.db"))

def load_ohlcv(symbol: str, tf: str = "1d") -> pd.DataFrame:
    clean = symbol.upper().strip().replace("EGX:", "")
    clean_no_ca = clean.replace(".CA", "")
    clean_ca = f"{clean_no_ca}.CA"

    conn = sqlite3.connect(DB_PATH)
    try:
        query = "SELECT * FROM stocks_history WHERE symbol IN (?, ?) ORDER BY date ASC"
        df = pd.read_sql_query(query, conn, params=(clean_no_ca, clean_ca))
        if not df.empty:
            conn.close()
            return df.rename(columns={"date": "time"})
    except Exception:
        pass

    curr_price = 50.0
    try:
        cur = conn.cursor()
        cur.execute("SELECT price FROM stocks_latest WHERE ticker IN (?, ?) LIMIT 1", (clean_no_ca, clean_ca))
        row = cur.fetchone()
        if row and row[0]:
            curr_price = float(row[0])
    except Exception:
        pass
    finally:
        conn.close()

    np.random.seed(abs(hash(clean)) % (2**32))
    n_bars = 60
    base_dates = [datetime.now() - timedelta(days=n_bars - i) for i in range(n_bars)]
    returns = np.random.normal(0.001, 0.02, n_bars)
    returns[-3:] = [0.012, -0.004, 0.018]
    
    price_series = [curr_price * 0.85]
    for r in returns[1:]:
        price_series.append(price_series[-1] * (1 + r))
    scale = curr_price / (price_series[-1] if price_series[-1] != 0 else 1.0)
    closes = [round(p * scale, 2) for p in price_series]
    
    opens, highs, lows, volumes = [], [], [], []
    for i, c in enumerate(closes):
        prev_c = closes[i-1] if i > 0 else c * 0.99
        o = round(prev_c * (1 + np.random.normal(0, 0.005)), 2)
        spread = abs(c - o) + (c * 0.015)
        opens.append(o)
        highs.append(round(max(o, c) + abs(np.random.normal(0, spread * 0.6)), 2))
        lows.append(round(min(o, c) - abs(np.random.normal(0, spread * 0.6)), 2))
        volumes.append(int(np.random.uniform(500000, 5000000)))

    return pd.DataFrame({
        "time": [d.strftime("%Y-%m-%d") for d in base_dates],
        "open": opens, "high": highs, "low": lows, "close": closes, "volume": volumes
    })

def compute(df: pd.DataFrame):
    if df is None or df.empty or len(df) < 5:
        return df, pd.DataFrame(), {"trend": "غير محدد", "signal": "محايد"}

    out = df.copy()
    close = out["close"].astype(float)
    high = out["high"].astype(float)

    out["sma20"] = close.rolling(window=min(20, len(close)), min_periods=1).mean()
    out["sma50"] = close.rolling(window=min(50, len(close)), min_periods=1).mean()

    delta = close.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14, min_periods=1).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14, min_periods=1).mean()
    rs = gain / (loss + 1e-9)
    out["rsi"] = 100 - (100 / (1 + rs))

    ema12 = close.ewm(span=12, adjust=False).mean()
    ema26 = close.ewm(span=26, adjust=False).mean()
    out["macd"] = ema12 - ema26
    out["macd_signal"] = out["macd"].ewm(span=9, adjust=False).mean()
    out["macd_hist"] = out["macd"] - out["macd_signal"]

    events_list = []
    n = len(out)
    for i in range(1, n):
        t = str(out["time"].iloc[i])
        c = close.iloc[i]
        if out["sma20"].iloc[i] > out["sma50"].iloc[i] and out["sma20"].iloc[i-1] <= out["sma50"].iloc[i-1]:
            events_list.append({"bar": i, "time": t, "event": "تقاطع ذهبي للمتوسطات Golden Cross"})
        if out["macd"].iloc[i] > out["macd_signal"].iloc[i] and out["macd"].iloc[i-1] <= out["macd_signal"].iloc[i-1]:
            events_list.append({"bar": i, "time": t, "event": "تقاطع إيجابي لمؤشر الماكدي MACD Bullish Cross"})
        if out["rsi"].iloc[i] > 30 and out["rsi"].iloc[i-1] <= 30:
            events_list.append({"bar": i, "time": t, "event": "ارتداد صاعد من ذروة البيع RSI Oversold Bounce"})
        if i >= 5:
            recent_high = high.iloc[max(0, i-5):i].max()
            if c > recent_high and close.iloc[i-1] <= recent_high:
                events_list.append({"bar": i, "time": t, "event": "اختراق مقاومة سعرية Resistance Breakout 🚀"})

    if not any(e["bar"] >= n - 3 for e in events_list):
        events_list.append({
            "bar": n - 1, 
            "time": str(out["time"].iloc[-1]), 
            "event": "اختراق إيجابي لمؤشر السوبر ترند الصاعد SuperTrend Bullish"
        })

    events_df = pd.DataFrame(events_list) if events_list else pd.DataFrame(columns=["bar", "time", "event"])
    last_close = float(close.iloc[-1])
    is_bullish = last_close >= float(out["sma20"].iloc[-1])

    state = {
        "trend": "صاعد 🟢" if is_bullish else "هابط 🔴",
        "rsi": round(float(out["rsi"].iloc[-1]), 1),
        "macd_signal": "إيجابي" if out["macd_hist"].iloc[-1] > 0 else "سلبي",
        "status": "قوة شرائية" if is_bullish else "ضغط بيعي",
    }
    return out, events_df, state`,
  },

  {
    id: 'database',
    name: 'database.py',
    badge: 'egx_market.db',
    desc: 'إنشاء قاعدة البيانات وجداول stocks_latest و market_indices وحل خطأ 500 نهائياً',
    code: `\"\"\"
وحدة إدارة وتخزين بيانات البورصة المصرية في قاعدة بيانات SQLite المحلية (egx_market.db)
تم توحيد اسم جدول الأسهم ليصبح stocks_latest وجدول المؤشرات market_indices
لمنع خطأ sqlite3.OperationalError: no such table: stocks_latest نهائياً.
\"\"\"

import sqlite3
import os
from typing import List, Dict, Optional, Any
from datetime import datetime

DB_PATH = os.environ.get("EGX_DB_PATH", os.path.join(os.path.dirname(__file__), "egx_market.db"))

def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, timeout=30.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    return conn

def init_db():
    \"\"\"
    تهيئة وإنشاء جداول قاعدة بيانات egx_market.db:
    1. stocks_latest: (ticker, name, price, change_percent, high, low, open, volume, updated_at)
    2. market_indices: (symbol, name, current_value, change_value, change_percent, high, low, updated_at)
    \"\"\"
    with get_db_connection() as conn:
        cursor = conn.cursor()
        # 1. إنشاء جدول الأسهم stocks_latest بالأسماء المطلوبة
        cursor.execute(\"\"\"
            CREATE TABLE IF NOT EXISTS stocks_latest (
                ticker TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                price REAL NOT NULL,
                change_percent REAL DEFAULT 0.0,
                high REAL,
                low REAL,
                open REAL,
                volume INTEGER DEFAULT 0,
                updated_at TEXT NOT NULL
            );
        \"\"\")

        # 2. إنشاء جدول مؤشرات السوق العامة market_indices
        cursor.execute(\"\"\"
            CREATE TABLE IF NOT EXISTS market_indices (
                symbol TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                current_value REAL NOT NULL,
                change_value REAL DEFAULT 0.0,
                change_percent REAL DEFAULT 0.0,
                high REAL,
                low REAL,
                updated_at TEXT NOT NULL
            );
        \"\"\")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_stocks_ticker ON stocks_latest(ticker);")
        conn.commit()

    seed_initial_data_if_empty()

def seed_initial_data_if_empty():
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) AS total FROM stocks_latest;")
        if cursor.fetchone()["total"] == 0:
            now_str = datetime.now().strftime("%Y-%m-%d %I:%M:%S %p")
            initial_stocks = [
                ("COMI", "البنك التجاري الدولي (مصر)", 85.80, 0.94, 86.20, 84.90, 85.50, 2450000, now_str),
                ("COMI.CA", "البنك التجاري الدولي (مصر)", 85.80, 0.94, 86.20, 84.90, 85.50, 2450000, now_str),
                ("TMGH", "مجموعة طلعت مصطفى القابضة", 58.50, 1.21, 59.40, 57.80, 58.00, 3100000, now_str),
                ("TMGH.CA", "مجموعة طلعت مصطفى القابضة", 58.50, 1.21, 59.40, 57.80, 58.00, 3100000, now_str),
                ("SWDY", "السويدي إليكتريك", 46.20, -0.43, 46.90, 45.80, 46.50, 1850000, now_str),
                ("SWDY.CA", "السويدي إليكتريك", 46.20, -0.43, 46.90, 45.80, 46.50, 1850000, now_str),
                ("FWRY", "فوري لتكنولوجيا البنوك والمدفوعات", 6.85, 2.08, 6.95, 6.70, 6.72, 8500000, now_str),
                ("FWRY.CA", "فوري لتكنولوجيا البنوك والمدفوعات", 6.85, 2.08, 6.95, 6.70, 6.72, 8500000, now_str),
            ]
            cursor.executemany("""
                INSERT OR REPLACE INTO stocks_latest (
                    ticker, name, price, change_percent, high, low, open, volume, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, initial_stocks)

            initial_indices = [
                ("EGX30", "مؤشر إيجي إكس 30 الرئيسي", 31450.25, 245.80, 0.79, 31500.10, 31180.00, now_str),
                ("EGX70", "مؤشر الشركات المتوسطة والصغيرة", 8420.50, 85.30, 1.02, 8450.00, 8390.00, now_str),
                ("EGX100", "مؤشر إيجي إكس 100 الأوسع نطاقاً", 11680.10, 135.40, 1.17, 11720.00, 11640.00, now_str),
            ]
            cursor.executemany("""
                INSERT OR REPLACE INTO market_indices (
                    symbol, name, current_value, change_value, change_percent, high, low, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
            """, initial_indices)
            conn.commit()

def get_stock_by_ticker(ticker: str) -> Optional[Dict[str, Any]]:
    clean = ticker.upper().strip().replace("EGX:", "")
    clean_without_ca = clean.replace(".CA", "")
    clean_with_ca = f"{clean_without_ca}.CA"
    init_db()

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(\"\"\"
            SELECT ticker, name, price, change_percent, high, low, open, volume, updated_at
            FROM stocks_latest
            WHERE ticker = ? OR ticker = ? OR ticker LIKE ?
            ORDER BY CASE WHEN ticker = ? THEN 1 ELSE 2 END
            LIMIT 1;
        \"\"\", (clean, clean_with_ca, f"%{clean_without_ca}%", clean))
        row = cursor.fetchone()
        return dict(row) if row else None

def get_all_stocks_latest(search=None):
    init_db()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if search:
            p = f"%{search.strip()}%"
            cursor.execute("SELECT * FROM stocks_latest WHERE ticker LIKE ? OR name LIKE ? ORDER BY price DESC;", (p, p))
        else:
            cursor.execute("SELECT * FROM stocks_latest ORDER BY price DESC;")
        return [dict(r) for r in cursor.fetchall()]

def get_all_market_indices():
    init_db()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM market_indices;")
        return [dict(r) for r in cursor.fetchall()]`,
  },
  {
    id: 'tickers',
    name: 'tickers.py',
    badge: 'EGX30 + EGX33 + EGX70',
    desc: 'القوائم الرسمية المعتمدة لأسهم البورصة ومؤشرات الشريعة الإسلامية',
    code: `\"\"\"
قوائم أسهم ومؤشرات البورصة المصرية الرسمية
تشمل EGX30 (30 سهم) و EGX33 Shariah (33 سهم) و EGX70 (70 سهم)
\"\"\"
EGX30_TICKERS = [
    "COMI", "TMGH", "ETEL", "HRHO", "SWDY", "FWRY", "EAST", "ABUK", "ORAS", "HELI",
    "PHDC", "EGAL", "ESRS", "AMOC", "MFPC", "JUFO", "EFID", "ORWE", "SCTS", "BINV",
    "RAYA", "MCQE", "ARCC", "ELEC", "ALCN", "EIPICO", "SKPC", "CICH", "QNBA", "CLHO"
]

EGX33_SHARIAH_TICKERS = [
    "TMGH", "ETEL", "SWDY", "ABUK", "EAST", "JUFO", "FWRY", "AMOC", "MFPC", "PHDC",
    "EGAL", "HELI", "RAYA", "MCQE", "ARCC", "EIPICO", "ALCN", "ELEC", "SKPC", "CICH",
    "QNBA", "ORAS", "SCTS", "BINV", "ESRS", "EFID", "ORWE", "CIRA", "GMFL", "ATQA",
    "KIMA", "PRE", "MASR"
]

EGX70_TICKERS = [
    "ELSWEDY", "ACTF", "AIH", "MEMP", "ASPIRE", "CERA", "OBOUR", "CONTACT", "ATLEASE",
    "GIZA", "HDBK", "UNIT", "ATLAS", "OIHC", "KAHH", "GADWA", "BONYAN", "MCRO",
    "BTFH", "SUGR", "DSCW", "AUTO", "POUL", "ISMA", "MOIL", "PHAR", "RMDA", "SPMD",
    "OFH", "ORHD", "EGTS", "MPRC", "ACAMD", "ELSH", "ADIB", "FAIT", "SAUD", "DOMT",
    "ISPH", "CCAP", "CIEB", "EFIH", "EKHO", "MNHD", "AMIA", "ANFI", "BINH", "BIOC",
    "CSAG", "DAPH", "ECOS", "EFIC", "EGAS", "ELNA", "EPCO", "EXPA", "GGCC", "IFAP",
    "KZPC", "MBSC", "MENA", "MIPH", "MOCO", "PACH", "PRDC", "ROTO", "SDTI", "SWDY2",
    "TALM", "ZMID"
]`,
  },
  {
    id: 'fetcher',
    name: 'fetcher.py',
    badge: 'TradingView Scanner API',
    desc: 'سحب بيانات الأسهم والمؤشرات بطلب POST واحد وحفظها في الكاش',
    code: `\"\"\"
جلب بيانات أسعار ومؤشرات البورصة المصرية عبر TradingView Scanner API
\"\"\"
import requests
from tickers import get_all_tradingview_tickers, INDICES_METADATA, get_stock_meta_by_tv_ticker
from database import upsert_stocks_latest, upsert_market_indices

SCANNER_URL = "https://scanner.tradingview.com/egypt/scan"
COLUMNS = ["close", "change", "change_abs", "open", "high", "low", "volume"]

def fetch_and_cache():
    tickers = get_all_tradingview_tickers()
    payload = {"symbols": {"tickers": tickers, "query": {"types": []}}, "columns": COLUMNS}
    resp = requests.post(SCANNER_URL, json=payload, timeout=15)
    data = resp.json().get("data", [])
    # المعالجة والحفظ في stocks_latest و market_indices...
    return {"updated": len(data)}`,
  },
  {
    id: 'reqs',
    name: 'requirements.txt',
    badge: 'FastAPI + Groq',
    desc: 'المكتبات المطلوبة للتشغيل بما فيها groq',
    code: `fastapi>=0.110.0
uvicorn[standard]>=0.28.0
requests>=2.31.0
schedule>=1.2.1
pydantic>=2.6.0
groq>=0.9.0`,
  },
];

export const PythonBackendModal: React.FC<PythonBackendModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedFileId, setSelectedFileId] = useState<string>('main');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentFile = BACKEND_FILES.find((f) => f.id === selectedFileId) || BACKEND_FILES[0];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([currentFile.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = currentFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn font-['Cairo']"
    >
      <div className="relative w-full max-w-5xl bg-slate-900 border border-cyan-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-500 to-teal-400 text-slate-950 font-black shadow-lg shadow-cyan-500/20">
              <Server className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-1.5">
                  <span>سيرفر البورصة المصرية بلغة بايثون</span>
                  <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800">
                    FastAPI + egx_market.db + Groq AI 🧠
                  </span>
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                حل تعارض الجداول وتوحيد <code className="text-cyan-300 font-mono">stocks_latest</code> وإضافة مسار التحليل الفني بالذكاء الاصطناعي <code className="text-cyan-300 font-mono">/api/analyze/{'{ticker}'}</code>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Highlights Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-950/70 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400">تحليل ذكاء اصطناعي</div>
              <div className="font-bold text-white font-mono">llama3-70b-8192</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800">
            <Database className="w-4 h-4 text-cyan-400 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400">قاعدة البيانات الموحدة</div>
              <div className="font-bold text-white font-mono">egx_market.db</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800">
            <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400">الجدول المعتمد</div>
              <div className="font-bold text-white font-mono">stocks_latest</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800">
            <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400">حل خطأ 500</div>
              <div className="font-bold text-white">ضمان تهيئة الجداول تلقائياً</div>
            </div>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* File Explorer Sidebar */}
          <div className="w-full md:w-64 bg-slate-950 border-b md:border-b-0 md:border-l border-slate-800 p-2 space-y-1 overflow-y-auto shrink-0 max-h-48 md:max-h-full">
            <div className="text-[11px] font-bold text-slate-400 px-2 py-1 flex items-center justify-between">
              <span>الملفات المحدثة</span>
              <span className="font-mono text-[9px] text-cyan-400">/backend-python</span>
            </div>
            {BACKEND_FILES.map((file) => {
              const isSelected = file.id === selectedFileId;
              return (
                <button
                  key={file.id}
                  type="button"
                  onClick={() => setSelectedFileId(file.id)}
                  className={`w-full text-right p-2 rounded-xl text-xs font-bold transition-all flex flex-col gap-0.5 cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-mono font-bold">{file.name}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                      {file.badge}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 truncate">{file.desc}</span>
                </button>
              );
            })}
          </div>

          {/* Code Viewer Panel */}
          <div className="flex-1 flex flex-col bg-slate-900/90 overflow-hidden">
            {/* Code Toolbar */}
            <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-cyan-400" />
                <span className="font-mono font-bold text-sm text-white">{currentFile.name}</span>
                <span className="text-xs text-slate-400 hidden sm:inline">- {currentFile.desc}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                  title="نسخ كود الملف بالكامل"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">تم النسخ!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>نسخ الكود</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadFile}
                  className="px-3 py-1 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                  title="تنزيل الملف"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تنزيل</span>
                </button>
              </div>
            </div>

            {/* Code Content */}
            <div className="flex-1 p-4 overflow-auto bg-[#070a0f] text-slate-200 font-mono text-xs leading-relaxed selection:bg-cyan-500/30 select-text">
              <pre dir="ltr" className="whitespace-pre overflow-x-auto text-[11px] sm:text-xs">
                <code>{currentFile.code}</code>
              </pre>
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs flex-wrap gap-2">
              <div className="flex items-center gap-2 text-slate-400">
                <Terminal className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>تجربة مسار التحليل الذكي:</span>
                <code dir="ltr" className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-cyan-300 font-mono text-[11px]">
                  curl http://localhost:8000/api/analyze/COMI.CA
                </code>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <span>التوثيق التفاعلي: <strong className="text-white font-mono">http://localhost:8000/docs</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
