#!/usr/bin/env bash
# ========================================================
# سكربت تشغيل سيرفر البورصة المصرية محلياً (Linux / macOS)
# ========================================================

set -e

echo "🚀 تجهيز بيئة تشغيل سيرفر البورصة المصرية (FastAPI + SQLite)..."

# إنشاء البيئة الافتراضية إذا لم تكن موجودة
if [ ! -d "venv" ]; then
    echo "📦 إنشاء البيئة الافتراضية venv..."
    python3 -m venv venv
fi

# تفعيل البيئة وتثبيت المتطلبات
source venv/bin/activate
echo "📥 تثبيت المتطلبات من requirements.txt..."
pip install -r requirements.txt

# تشغيل السيرفر
echo "⚡ بدء تشغيل السيرفر على http://localhost:8000"
echo "📖 صفحة التوثيق التفاعلية (Swagger): http://localhost:8000/docs"
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
