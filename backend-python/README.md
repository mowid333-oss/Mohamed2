# 🇪🇬 سيرفر البورصة المصرية - كود Backend بلغة بايثون (FastAPI + SQLite + TradingView API)

نظام متكامل ومجاني لجلب أسعار البورصة المصرية ومؤشرات السوق العامة (EGX) بالاعتماد على **TradingView Scanner API** وتخزينها مؤقتاً في قاعدة بيانات محلية SQLite، مع جدولة تلقائية في الخلفية كل 15 دقيقة، وتوفير واجهة برمجة تطبيقات (REST API) فائقة السرعة تتحمل ملايين الزوار.

---

## 🌟 المميزات والتحسينات الرئيسية

1. **الاعتماد على TradingView Scanner API**:
   - إرسال طلب `POST` واحد مباشر إلى `https://scanner.tradingview.com/egypt/scan`.
   - جلب بيانات مؤشرات السوق والأسهم دفعة واحدة بصيغة JSON.
   - الاستغناء التام عن `yfinance` ومشاكل الـ Web Scraping.
2. **تغطية مؤشرات السوق العامة الخمسة**:
   - `EGX30` (مؤشر إيجي إكس 30 الرئيسي)
   - `EGX70` (مؤشر الشركات المتوسطة والصغيرة EGX70 EWI)
   - `EGX100` (مؤشر إيجي إكس 100 الأوسع نطاقاً EGX100 EWI)
   - `EGX30_SHARIAH` (مؤشر الشريعة الإسلامية)
   - `EGX30_CAPPED` (مؤشر إيجي إكس 30 محدد الأوزان)
3. **تخزين مؤقت عالي الأداء (SQLite WAL)**:
   - الاستجابة من جدول `stocks_latest` وجدول `market_indices` في أقل من **3 مللي ثانية**.
4. **جدولة في الخلفية كل 15 دقيقة**:
   - تحديث دوري تلقائي بدون تعطيل السيرفر أو تأخير طلبات الزوار.
5. **مراعاة مواعيد جلسة البورصة المصرية**:
   - التحقق التلقائي من أيام التداول (الأحد - الخميس) وساعات العمل (10:00 ص - 2:30 م بتوقيت القاهرة).
6. **توثيق تفاعلي فوري (Swagger UI)**:
   - تجربة جميع نقاط الاتصال من المتصفح عبر `/docs`.

---

## 📁 هيكلية ملفات المشروع

```
backend-python/
├── main.py              # تطبيق FastAPI ونقاط الاتصال GET /api/stocks و GET /api/indices
├── database.py          # إدارة قاعدة بيانات SQLite وجداول stocks_latest و market_indices
├── fetcher.py           # محرك طلب POST إلى TradingView Scanner API وتفكيك المؤشرات والأسهم
├── tickers.py           # قاموس رموز TradingView للمؤشرات والأسهم المصرية
├── scheduler.py         # المشغل المجدول في الخلفية كل 15 دقيقة
├── requirements.txt     # المكتبات المطلوبة (FastAPI, uvicorn, requests, schedule, pydantic)
├── Procfile             # ملف إعداد التشغيل السحابي لـ Render و Railway
├── Dockerfile           # ملف بناء حاوية Docker
├── run.sh               # سكربت التشغيل السريع لأنظمة Linux و macOS
├── run.bat              # سكربت التشغيل السريع لأنظمة Windows
└── README.md            # دليل التشغيل والنشر
```

---

## 🌐 نقاط الاتصال المتاحة (API Endpoints)

| المسار (Endpoint) | الطريقة (Method) | الوصف |
| :--- | :--- | :--- |
| `/` | `GET` | فحص حالة السيرفر ومصدر البيانات وموعد آخر تحديث |
| `/api/indices` | `GET` | إرجاع بيانات مؤشرات البورصة المصرية الخمسة المخزنة في الكاش |
| `/api/stocks` | `GET` | إرجاع جميع أسهم البورصة المصرية من جدول stocks_latest |
| `/api/stocks/{symbol}` | `GET` | إرجاع بيانات وتفاصيل سهم محدد (يقبل `COMI.CA` أو `COMI` أو `EGX:COMI`) |
| `/api/stocks/{symbol}/history` | `GET` | إرجاع الشموع التاريخية (OHLC) للسهم |
| `/api/sync` | `POST` | إطلاق تحديث فوري فوري للأسعار في الخلفية عبر TradingView API |
| `/api/status` | `GET` | إحصائيات مفصلة لقاعدة البيانات المحلية وحالة جلسة التداول |
| `/docs` | `GET` | صفحة Swagger التفاعلية لتجربة جميع الطلبات |

---

## 🚀 طريقة التشغيل

```bash
cd backend-python
python -m venv venv
# تفعيل البيئة:
# على Windows: venv\Scripts\activate
# على Linux/macOS: source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
رابط التوثيق: `http://localhost:8000/docs`
