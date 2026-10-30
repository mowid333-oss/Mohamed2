@echo off
REM ========================================================
REM سكربت تشغيل سيرفر البورصة المصرية محلياً (Windows)
REM ========================================================

echo 🚀 تجهيز وتشغيل سيرفر البورصة المصرية (FastAPI + SQLite)...

IF NOT EXIST "venv" (
    echo 📦 إنشاء البيئة الافتراضية venv...
    python -m venv venv
)

call venv\Scripts\activate.bat
echo 📥 تثبيت المتطلبات من requirements.txt...
pip install -r requirements.txt

echo ⚡ بدء تشغيل السيرفر على http://localhost:8000
echo 📖 صفحة التوثيق التفاعلية (Swagger): http://localhost:8000/docs
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
pause
