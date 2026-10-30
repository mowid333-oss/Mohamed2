"""
وحدة الجدولة الزمنية في الخلفية (Background Scheduler)
تعمل كل 15 دقيقة فقط في خيط مستقل (Thread) لتحديث قاعدة بيانات SQLite عبر TradingView Scanner API.
تقوم بإرسال طلب واحد يجلب بيانات الأسهم ومؤشرات السوق الخمسة معاً دون إبطاء خادم FastAPI.
"""

import threading
import time
import logging
import schedule
from fetcher import fetch_and_cache_tradingview_data

logger = logging.getLogger("EGX_SCHEDULER")

_scheduler_running = False
_scheduler_thread = None

def sync_all_egx_data():
    """
    [تحديث TradingView]: مهمة الجدولة الموحدة لجلب وتحديث:
    1. مؤشرات السوق الخمسة (EGX30, EGX70, EGX100, EGX30 Shariah, EGX30 Capped)
    2. أسعار جميع أسهم البورصة المصرية اللحظية
    يتم الجلب عبر طلب POST موحد إلى TradingView Scanner API وتخزينه في SQLite.
    """
    logger.info("بدء جولة التحديث الدوري الموحد عبر TradingView Scanner كل 15 دقيقة...")
    try:
        result = fetch_and_cache_tradingview_data()
        logger.info(f"اكتمل التحديث الدوري بنجاح: {result.get('indices_updated', 0)} مؤشرات و {result.get('stocks_updated', 0)} سهم.")
    except Exception as e:
        logger.error(f"خطأ أثناء تحديث بيانات TradingView الدوري: {e}", exc_info=True)

def _run_schedule_loop():
    """حلقة تكرار فحص وتشغيل المهام المجدولة كل 15 دقيقة"""
    logger.info("تم تشغيل محرك الجدولة في الخلفية: سيتم تحديث الأسهم والمؤشرات كل 15 دقيقة عبر TradingView API.")
    while _scheduler_running:
        try:
            schedule.run_pending()
        except Exception as e:
            logger.error(f"خطأ غير متوقع في محرك الجدولة: {e}")
        time.sleep(1)

def start_background_scheduler(interval_minutes: int = 15, run_immediately: bool = True):
    """بدء تشغيل الجدولة التلقائية في الخلفية"""
    global _scheduler_running, _scheduler_thread

    if _scheduler_running:
        logger.warning("المجدول يعمل بالفعل في الخلفية.")
        return

    # تفريغ أي مهام سابقة
    schedule.clear()

    # جدولة التحديث الدوري كل 15 دقيقة
    schedule.every(interval_minutes).minutes.do(sync_all_egx_data)

    _scheduler_running = True
    _scheduler_thread = threading.Thread(target=_run_schedule_loop, daemon=True)
    _scheduler_thread.start()

    # تنفيذ التحديث الأولي فور الإقلاع لملء قاعدة البيانات بالأسعار والمؤشرات
    if run_immediately:
        threading.Thread(target=sync_all_egx_data, daemon=True).start()

# الاسم المختصر المتوافق مع main.py
start_scheduler = start_background_scheduler

def stop_background_scheduler():
    """إيقاف المجدول في الخلفية"""
    global _scheduler_running
    _scheduler_running = False
    schedule.clear()
    logger.info("تم إيقاف محرك الجدولة في الخلفية.")

def trigger_immediate_sync():
    """تشغيل تحديث فوري في الخلفية"""
    thread = threading.Thread(target=sync_all_egx_data, daemon=True)
    thread.start()
    return {"message": "تم إطلاق عملية التحديث اللحظي عبر TradingView API بنجاح ⚡"}
