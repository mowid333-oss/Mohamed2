from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
import logging
from groq import Groq
from database import init_db
from scheduler import start_scheduler

# استيراد محرك التحليل الفني (Quant Engine) الذي تم إنشاؤه
from smart_drawer import compute, load_ohlcv

# مفتاح Groq الخاص بك مدمج مباشرة لتسهيل التشغيل
groq_client = Groq(api_key="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")

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("egx.main")

app = FastAPI(title="EGX Quant Radar API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    logger.info("Initializing EGX Backend...")
    init_db()
    start_scheduler()

def get_db_connection():
    conn = sqlite3.connect('egx_market.db')
    conn.row_factory = sqlite3.Row
    return conn

# ============ مسارات قاعدة البيانات الأساسية ============
@app.get("/api/stocks")
def get_stocks():
    conn = get_db_connection()
    try:
        stocks = conn.execute("SELECT * FROM stocks_latest").fetchall()
    except sqlite3.OperationalError:
        stocks = conn.execute("SELECT * FROM stocks").fetchall()
    conn.close()
    return [dict(row) for row in stocks]

@app.get("/api/indices")
def get_indices():
    conn = get_db_connection()
    try:
        indices = conn.execute("SELECT * FROM market_indices").fetchall()
    except sqlite3.OperationalError:
        indices = []
    conn.close()
    return [dict(row) for row in indices]

# ============ مسارات محرك التحليل (Smart Drawer) ============
@app.get("/indicator/{symbol}")
def indicator(symbol: str, tf: str = "1d", last: int = 30):
    df = load_ohlcv(symbol, tf)
    if df.empty:
        return {"error": f"لا توجد بيانات للسهم {symbol}"}
    out, events, state = compute(df)
    ev = events.tail(last).astype({"time": str}).to_dict("records") if not events.empty else []
    return {"symbol": symbol, "close": float(out.close.iloc[-1]), "state": state, "events": ev}

@app.get("/scan")
def scan(symbols: str, tf: str = "1d", within_bars: int = 3, event: str | None = None):
    res = []
    symbol_list = [s.strip() for s in symbols.split(",") if s.strip()]
    for s in symbol_list:
        df = load_ohlcv(s, tf)
        if df.empty:
            continue
        out, events, state = compute(df)
        if events.empty:
            continue
        fresh = events[events.bar >= len(out) - within_bars]
        if event:
            fresh = fresh[fresh.event == event]
        if not fresh.empty:
            res.append({"symbol": s, "events": fresh.astype({"time": str}).to_dict("records"), "state": state})
    return res

# ============ مسار الذكاء الاصطناعي (الدمج النهائي) ============
@app.get("/api/analyze/{ticker}")
def analyze_stock(ticker: str):
    # 1. سحب بيانات السهم الحالية من قاعدة البيانات (مع حل مشكلة اسم الجدول)
    conn = get_db_connection()
    stock = None
    try:
        stock = conn.execute("SELECT * FROM stocks_latest WHERE ticker = ?", (ticker,)).fetchone()
    except sqlite3.OperationalError:
        try:
            stock = conn.execute("SELECT * FROM stocks WHERE ticker = ?", (ticker,)).fetchone()
        except sqlite3.OperationalError:
            pass
    conn.close()
    
    if not stock:
        return {"error": "عذراً، السهم غير موجود في قاعدة البيانات."}
        
    stock_data = dict(stock)
    
    # 2. تشغيل المحرك الكمي (smart_drawer) لاصطياد الإشارات
    df = load_ohlcv(ticker, "1d")
    recent_events_text = "لا توجد نماذج فنية واضحة أو إشارات كسر ملحوظة اليوم."
    
    if not df.empty:
        out, events, state = compute(df)
        # البحث عن أي إشارات حدثت في آخر 3 شموع
        if not events.empty:
            recent_events = events[events.bar >= len(out) - 3]
            if not recent_events.empty:
                # تجميع أسماء الإشارات لتحويلها لنص يقرأه الذكاء الاصطناعي
                event_list = recent_events["event"].tolist()
                recent_events_text = "، ".join(event_list)

    # 3. توجيه الذكاء الاصطناعي بالبيانات الجديدة
    prompt = f"""
    أنت خبير مالي ومحلل فني محترف في البورصة المصرية. 
    نظامي الخوارزمي المتقدم قام بفحص السهم واستخراج هذه الإشارات اللحظية. 
    اكتب رأيك الفني الحاسم في 3 سطور فقط باللغة العربية بناءً عليها:
    
    - اسم السهم: {stock_data.get('name', ticker)}
    - السعر الحالي: {stock_data.get('price', 0)}
    - نسبة التغير اليوم: {stock_data.get('change_percent', 0)}%
    - الإشارات والنماذج الفنية التي ظهرت الآن: {recent_events_text}
    
    هل السهم إيجابي أم سلبي اليوم؟ اذكر النماذج الفنية في ردك إذا وجدت، واكتب التقرير بشكل احترافي وجذاب.
    """
    
    try:
        chat_completion = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama3-70b-8192", 
        )
        analysis = chat_completion.choices[0].message.content
        return {"ticker": ticker, "analysis": analysis}
    except Exception as e:
        return {"error": f"حدث خطأ في الذكاء الاصطناعي: {str(e)}"}
