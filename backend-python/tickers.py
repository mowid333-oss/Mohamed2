"""
قائمة أسهم ومؤشرات البورصة المصرية الرسمية (EGX) المعتمدة لدى TradingView Scanner API
تشمل المؤشرات الرسمية الخمسة:
- EGX:EGX30 (مؤشر إيجي إكس 30 الرئيسي)
- EGX:EGX70EWI (مؤشر الشركات المتوسطة والصغيرة)
- EGX:EGX100 (مؤشر إيجي إكس 100 الأوسع نطاقاً)
- EGX:EGX30SHARIAH (مؤشر الشريعة الإسلامية)
- EGX:EGX30CAPPED (مؤشر إيجي إكس 30 محدد الأوزان)

وتشمل القوائم الرسمية الدقيقة لأسهم:
1. مؤشر EGX 30 (30 شركة قيادية)
2. مؤشر الشريعة الإسلامية EGX 33 Shariah (33 شركة معتمدة شرعياً)
3. مؤشر الشركات المتوسطة والصغيرة EGX 70 EWI (70 شركة)
4. مؤشر EGX 100 الأوسع نطاقاً (100 شركة: EGX30 + EGX70)
"""

from typing import Dict, List, Optional, Set

# =========================================================================
# 1. قائمة رموز المؤشرات الخمسة الرسمية لدى TradingView
# =========================================================================
TRADINGVIEW_INDICES_TICKERS = [
    "EGX:EGX30",
    "EGX:EGX70EWI",
    "EGX:EGX100",
    "EGX:EGX30SHARIAH",
    "EGX:EGX30CAPPED",
]

# بيانات تعريف المؤشرات باللغة العربية
INDICES_METADATA: Dict[str, dict] = {
    "EGX:EGX30": {
        "symbol": "EGX30",
        "tv_ticker": "EGX:EGX30",
        "name_ar": "مؤشر إيجي إكس 30 الرئيسي (EGX 30)",
        "name_en": "EGX 30 Index",
        "default_val": 31450.25,
        "default_change": 245.80,
        "default_pct": 0.79,
    },
    "EGX:EGX70EWI": {
        "symbol": "EGX70",
        "tv_ticker": "EGX:EGX70EWI",
        "name_ar": "مؤشر الشركات المتوسطة والصغيرة (EGX 70 EWI)",
        "name_en": "EGX 70 EWI Index",
        "default_val": 8420.50,
        "default_change": 85.30,
        "default_pct": 1.02,
    },
    "EGX:EGX100": {
        "symbol": "EGX100",
        "tv_ticker": "EGX:EGX100",
        "name_ar": "مؤشر إيجي إكس 100 الأوسع نطاقاً (EGX 100 EWI)",
        "name_en": "EGX 100 EWI Index",
        "default_val": 11680.10,
        "default_change": 135.40,
        "default_pct": 1.17,
    },
    "EGX:EGX30SHARIAH": {
        "symbol": "EGX30_SHARIAH",
        "tv_ticker": "EGX:EGX30SHARIAH",
        "name_ar": "مؤشر الشريعة الإسلامية (EGX 33 Shariah)",
        "name_en": "EGX 33 Shariah Index",
        "default_val": 3280.60,
        "default_change": 28.50,
        "default_pct": 0.88,
    },
    "EGX:EGX30CAPPED": {
        "symbol": "EGX30_CAPPED",
        "tv_ticker": "EGX:EGX30CAPPED",
        "name_ar": "مؤشر إيجي إكس 30 محدد الأوزان (EGX 30 Capped)",
        "name_en": "EGX 30 Capped Index",
        "default_val": 38920.40,
        "default_change": 290.15,
        "default_pct": 0.75,
    },
}

# =========================================================================
# 2. القوائم الرسمية للأسهم حسب التكوين المعتمد
# =========================================================================

# --- قائمة EGX 30 (30 شركة قيادية) ---
EGX30_TICKERS: List[str] = [
    "COMI",   # CIB - البنك التجاري الدولي
    "TMGH",   # Talaat Moustafa - مجموعة طلعت مصطفى
    "ETEL",   # Telecom Egypt - المصرية للاتصالات
    "HRHO",   # EFG Hermes - المجموعة المالية هيرميس
    "SWDY",   # Elsewedy Electric - السويدي إليكتريك
    "FWRY",   # Fawry - فوري لتكنولوجيا البنوك
    "EAST",   # Eastern Company - الشرقية للدخان
    "ABUK",   # Abu Qir Fertilizers - أبو قير للأسمدة
    "ORAS",   # Orascom Construction - أوراسكوم كونستراكشون
    "HELI",   # Heliopolis Housing - مصر الجديدة للإسكان
    "PHDC",   # Palm Hills - بالم هيلز للتعمير
    "EGAL",   # Egyptalum - مصر للألومنيوم
    "ESRS",   # Ezz Steel - حديد عز
    "AMOC",   # Amoc - الإسكندرية للزيوت المعدنية
    "MFPC",   # Mopco - مصر لإنتاج الأسمدة (موبكو)
    "JUFO",   # Juhayna - جهينة للصناعات الغذائية
    "EFID",   # Edita - إيديتا للصناعات الغذائية
    "ORWE",   # Oriental Weavers / Orascom Dev - النساجون الشرقيون
    "SCTS",   # Suez Canal - قناة السويس لتوطين التكنولوجيا
    "BINV",   # B Investments - بي إنفستمنتس القابضة
    "RAYA",   # Raya Holding - راية القابضة للاستثمارات
    "MCQE",   # Misr Beni Suef / Qena Cement - مصر للأسمنت قنا وبني سويف
    "ARCC",   # Arabian Cement - الأسمنت العربية
    "ELEC",   # Electro Cable - الكابلات الكهربائية المصرية
    "ALCN",   # Alex Containers - الإسكندرية لتداول الحاويات
    "EIPICO", # Eipico - المصرية الدولية للصناعات الدوائية (إيبيكو)
    "SKPC",   # Sidi Kerir - سيدي كرير للبتروكيماويات
    "CICH",   # CI Capital - سي آي كابيتال القابضة
    "QNBA",   # QNB AlAhli - بنك قطر الوطني الأهلي
    "CLHO",   # Cleopatra Hospital - مستشفى كليوباترا
]

# --- قائمة مؤشر الشريعة EGX 33 Shariah (33 شركة متوافقة) ---
EGX33_SHARIAH_TICKERS: List[str] = [
    "TMGH",   # Talaat Moustafa
    "ETEL",   # Telecom Egypt
    "SWDY",   # Elsewedy Electric
    "ABUK",   # Abu Qir
    "EAST",   # Eastern
    "JUFO",   # Juhayna
    "FWRY",   # Fawry
    "AMOC",   # Amoc
    "MFPC",   # Mopco
    "PHDC",   # Palm Hills
    "EGAL",   # Egyptalum
    "HELI",   # Heliopolis
    "RAYA",   # Raya
    "MCQE",   # Misr Beni Suef
    "ARCC",   # Arabian Cement
    "EIPICO", # Eipico
    "ALCN",   # Alex Containers
    "ELEC",   # Electro Cable
    "SKPC",   # Sidi Kerir
    "CICH",   # CI Capital
    "QNBA",   # QNB AlAhli
    "ORAS",   # Orascom Construction
    "SCTS",   # Suez Canal
    "BINV",   # B Investments
    "ESRS",   # Ezz Steel
    "EFID",   # Edita
    "ORWE",   # Orascom Development / Oriental Weavers
    "CIRA",   # CIRA Education
    "GMFL",   # Gourmet Egypt
    "ATQA",   # Atlas / Ataqa
    "KIMA",   # Kima
    "PRE",    # Pioneers Properties
    "MASR",   # Madinet Masr
]

# --- قائمة مؤشر الشركات المتوسطة والصغيرة EGX 70 (70 شركة) ---
EGX70_TICKERS: List[str] = [
    "ELSWEDY", # Elswedy Electric subsidiary
    "ACTF",    # Act Financial
    "AIH",     # Arabia Investments Holding
    "MEMP",    # Memphis Pharma
    "ASPIRE",  # Aspire Capital
    "CERA",    # Ceramica Remas
    "OBOUR",   # El Obour Real Estate
    "CONTACT", # Contact Financial
    "ATLEASE", # Al Tawfeek Leasing
    "GIZA",    # Giza Contracting
    "HDBK",    # Housing & Development Bank
    "UNIT",    # United Housing
    "ATLAS",   # Atlas Investment
    "OIHC",    # Orascom Investment Holding
    "KAHH",    # Cairo Housing
    "GADWA",   # Gadwa Industrial Development
    "BONYAN",  # Bonyan Real Estate
    "MCRO",    # Macro Group Pharma
    "BTFH",    # Beltone Financial Holding
    "SUGR",    # Delta Sugar
    "DSCW",    # Dice Sport & Casual Wear
    "AUTO",    # GB Corp (Ghabbour Auto)
    "POUL",    # Cairo Poultry
    "ISMA",    # Ismailia Misr Poultry
    "MOIL",    # Maridive & Oil Services
    "PHAR",    # Alexandria Pharmaceuticals
    "RMDA",    # Rameda Pharmaceuticals
    "SPMD",    # Speed Medical
    "OFH",     # Orascom Financial Holding
    "ORHD",    # Orascom Development Egypt
    "EGTS",    # Egyptian Resorts Co
    "MPRC",    # Egyptian Media Production City
    "ACAMD",   # Arab Co for Asset Management
    "ELSH",    # El Shams Housing
    "ADIB",    # Abu Dhabi Islamic Bank
    "FAIT",    # Faisal Islamic Bank
    "SAUD",    # Al Baraka Bank Egypt
    "DOMT",    # Arabian Food - Domty
    "ISPH",    # Ibnsina Pharma
    "CCAP",    # Qalaa Holdings
    "CIEB",    # Credit Agricole Egypt
    "EFIH",    # e-finance Investment Group
    "EKHO",    # Egypt Kuwait Holding
    "MNHD",    # Madinet Masr Housing
    "AMIA",    # Arab Moltaka Investments
    "ANFI",    # Alex National Financial Inv
    "BINH",    # B Investments Holding
    "BIOC",    # GlaxoSmithKline Egypt
    "CSAG",    # Canal Shipping Agencies
    "DAPH",    # Dev & Eng Consultants
    "ECOS",    # Egypt for Construction
    "EFIC",    # Egyptian Financial & Industrial
    "EGAS",    # Egypt Gas
    "ELNA",    # El Nasr Clothing & Textiles
    "EPCO",    # Egypt Pharma
    "EXPA",    # Export Development Bank
    "GGCC",    # Giza General Contracting
    "IFAP",    # International Agri Products
    "KZPC",    # Kafr El Zayat Pesticides
    "MBSC",    # Misr Beni Suef Cement
    "MENA",    # Mena Touristic & Real Estate
    "MIPH",    # Minapharm Pharmaceuticals
    "MOCO",    # Misr Oil & Soap
    "PACH",    # Paints & Chemical - Pachin
    "PRDC",    # Pioneers Real Estate
    "ROTO",    # Misr Hotels
    "SDTI",    # Shuaa Capital
    "SWDY2",   # Elsewedy Power
    "TALM",    # Taaleem Management
    "ZMID",    # Zahraa Maadi Investment
]

# مجموعات سريعة للفحص السريع O(1)
EGX30_SET: Set[str] = set(EGX30_TICKERS)
EGX33_SHARIAH_SET: Set[str] = set(EGX33_SHARIAH_TICKERS)
EGX70_SET: Set[str] = set(EGX70_TICKERS)
# مؤشر EGX 100 الأوسع هو دمج EGX 30 و EGX 70
EGX100_SET: Set[str] = EGX30_SET.union(EGX70_SET)

# =========================================================================
# 3. قاعدة البيانات الوصفية الشاملة لجميع الأسهم المصرية
# =========================================================================
EGX_STOCKS_METADATA: Dict[str, dict] = {
    # --- شركات EGX 30 القيادية (30 شركة) ---
    "EGX:COMI": {
        "tv_symbol": "EGX:COMI",
        "ticker": "COMI",
        "symbol_ca": "COMI.CA",
        "name_ar": "البنك التجاري الدولي (مصر)",
        "name_en": "Commercial International Bank",
        "sector": "البنوك والخدمات المالية",
        "is_shariah": False,
        "is_egx30": True,
        "is_egx70": False,
        "is_egx100": True,
        "default_price": 85.80,
    },
    "EGX:TMGH": {
        "tv_symbol": "EGX:TMGH",
        "ticker": "TMGH",
        "symbol_ca": "TMGH.CA",
        "name_ar": "مجموعة طلعت مصطفى القابضة",
        "name_en": "Talaat Moustafa Group",
        "sector": "العقارات والإنشاءات",
        "is_shariah": True,
        "is_egx30": True,
        "is_egx70": False,
        "is_egx100": True,
        "default_price": 58.50,
    },
    "EGX:ETEL": {
        "tv_symbol": "EGX:ETEL",
        "ticker": "ETEL",
        "symbol_ca": "ETEL.CA",
        "name_ar": "المصرية للاتصالات - وي",
        "name_en": "Telecom Egypt",
        "sector": "الاتصالات وتكنولوجيا المعلومات",
        "is_shariah": True,
        "is_egx30": True,
        "is_egx70": False,
        "is_egx100": True,
        "default_price": 34.60,
    },
    "EGX:HRHO": {
        "tv_symbol": "EGX:HRHO",
        "ticker": "HRHO",
        "symbol_ca": "HRHO.CA",
        "name_ar": "المجموعة المالية هيرميس القابضة",
        "name_en": "EFG Hermes Holding",
        "sector": "الخدمات المالية والاستثمار",
        "is_shariah": False,
        "is_egx30": True,
        "is_egx70": False,
        "is_egx100": True,
        "default_price": 19.85,
    },
    "EGX:SWDY": {
        "tv_symbol": "EGX:SWDY",
        "ticker": "SWDY",
        "symbol_ca": "SWDY.CA",
        "name_ar": "السويدي إليكتريك",
        "name_en": "Elsewedy Electric",
        "sector": "السلع الصناعية والمقاولات",
        "is_shariah": True,
        "is_egx30": True,
        "is_egx70": False,
        "is_egx100": True,
        "default_price": 46.20,
    },
    "EGX:FWRY": {
        "tv_symbol": "EGX:FWRY",
        "ticker": "FWRY",
        "symbol_ca": "FWRY.CA",
        "name_ar": "فوري لتكنولوجيا البنوك والمدفوعات الإلكترونية",
        "name_en": "Fawry for Banking & Payment",
        "sector": "التكنولوجيا والمدفوعات الرقمية",
        "is_shariah": True,
        "is_egx30": True,
        "is_egx70": False,
        "is_egx100": True,
        "default_price": 6.85,
    },
    "EGX:EAST": {
        "tv_symbol": "EGX:EAST",
        "ticker": "EAST",
        "symbol_ca": "EAST.CA",
        "name_ar": "الشرقية - إيسترن كومباني",
        "name_en": "Eastern Company",
        "sector": "الأغذية والمشروبات والتبغ",
        "is_shariah": True,
        "is_egx30": True,
        "is_egx70": False,
        "is_egx100": True,
        "default_price": 28.30,
    },
    "EGX:ABUK": {
        "tv_symbol": "EGX:ABUK",
        "ticker": "ABUK",
        "symbol_ca": "ABUK.CA",
        "name_ar": "أبو قير للأسمدة والصناعات الكيماوية",
        "name_en": "Abu Qir Fertilizers",
        "sector": "الكيماويات والأسمدة",
        "is_shariah": True,
        "is_egx30": True,
        "is_egx70": False,
        "is_egx100": True,
        "default_price": 62.10,
    },
    "EGX:ORAS": {
        "tv_symbol": "EGX:ORAS",
        "ticker": "ORAS",
        "symbol_ca": "ORAS.CA",
        "name_ar": "أوراسكوم كونستراكشون بي إل سي",
        "name_en": "Orascom Construction PLC",
        "sector": "السلع الصناعية والمقاولات",
        "is_shariah": True,
        "is_egx30": True,
        "is_egx70": False,
        "is_egx100": True,
        "default_price": 224.00,
    },
    "EGX:HELI": {
        "tv_symbol": "EGX:HELI",
        "ticker": "HELI",
        "symbol_ca": "HELI.CA",
        "name_ar": "مصر الجديدة للإسكان والتعمير",
        "name_en": "Heliopolis Housing",
        "sector": "العقارات والإنشاءات",
        "is_shariah": True,
        "is_egx30": True,
        "is_egx70": False,
        "is_egx100": True,
        "default_price": 11.20,
    },
    "EGX:PHDC": {
        "tv_symbol": "EGX:PHDC",
        "ticker": "PHDC",
        "symbol_ca": "PHDC.CA",
        "name_ar": "بالم هيلز للتعمير",
        "name_en": "Palm Hills Developments",
        "sector": "العقارات والإنشاءات",
        "is_shariah": True,
        "is_egx30": True,
        "is_egx70": False,
        "is_egx100": True,
        "default_price": 5.40,
    },
    "EGX:EGAL": {
        "tv_symbol": "EGX:EGAL",
        "ticker": "EGAL",
        "symbol_ca": "EGAL.CA",
        "name_ar": "مصر للألومنيوم",
        "name_en": "Egypt Aluminium",
        "sector": "المعادن والموارد الأساسية",
        "is_shariah": True,
        "is_egx30": True,
        "is_egx70": False,
        "is_egx100": True,
        "default_price": 104.50,
    },
    "EGX:ESRS": {
        "tv_symbol": "EGX:ESRS",
        "ticker": "ESRS",
        "symbol_ca": "ESRS.CA",
        "name_ar": "حديد عز",
        "name_en": "Ezz Steel",
        "sector": "المعادن والموارد الأساسية",
        "is_shariah": True,
        "is_egx30": True,
        "is_egx70": False,
        "is_egx100": True,
        "default_price": 98.40,
    },
    "EGX:AMOC": {
        "tv_symbol": "EGX:AMOC",
        "ticker": "AMOC",
        "symbol_ca": "AMOC.CA",
        "name_ar": "الإسكندرية للزيوت المعدنية - أموك",
        "name_en": "Alexandria Mineral Oils Co",
        "sector": "الطاقة والخدمات البترولية",
        "is_shariah": True,
        "is_egx30": True,
        "is_egx70": False,
        "is_egx100": True,
        "default_price": 9.45,
    },
    "EGX:MFPC": {
        "tv_symbol": "EGX:MFPC",
        "ticker": "MFPC",
        "symbol_ca": "MFPC.CA",
        "name_ar": "مصر لإنتاج الأسمدة - موبكو",
        "name_en": "Misr Fertilizers Production - MOPCO",
        "sector": "الكيماويات والأسمدة",
        "is_shariah": True,
        "is_egx30": True,
        "is_egx70": False,
        "is_egx100": True,
        "default_price": 48.75,
    },
    "EGX:JUFO": {
        "tv_symbol": "EGX:JUFO",
        "ticker": "JUFO",
        "symbol_ca": "JUFO.CA",
        "name_ar": "جهينة للصناعات الغذائية",
        "name_en": "Juhayna Food Industries",
        "sector": "الأغذية والمشروبات",
        "is_shariah": True,
        "is_egx30": True,
        "is_egx70": False,
        "is_egx100": True,
        "default_price": 26.80,
    },
    "EGX:EFID": {
        "tv_symbol": "EGX:EFID",
        "ticker": "EFID",
        "symbol_ca": "EFID.CA",
        "name_ar": "إيديتا للصناعات الغذائية",
        "name_en": "Edita Food Industries",
        "sector": "الأغذية والمشروبات",
        "is_shariah": True,
        "is_egx30": True,
        "is_egx70": False,
        "is_egx100": True,
        "default_price": 31.50,
    },
    "EGX:ORWE": {
        "tv_symbol": "EGX:ORWE",
        "ticker": "ORWE",
        "symbol_ca": "ORWE.CA",
        "name_ar": "النساجون الشرقيون للسجاد",
        "name_en": "Oriental Weavers Carpet",
        "sector": "المنسوجات والسلع المعمرة",
        "is_shariah": True,
        "is_egx30": True,
        "is_egx70": False,
        "is_egx100": True,
        "default_price": 23.90,
    },
    "EGX:SCTS": {
        "tv_symbol": "EGX:SCTS",
        "ticker": "SCTS",
        "symbol_ca": "SCTS.CA",
        "name_ar": "قناة السويس لتوطين التكنولوجيا",
        "name_en": "Suez Canal for Technology Settlement",
        "sector": "التعليم والتكنولوجيا",
        "is_shariah": True,
        "is_egx30": True,
        "is_egx70": False,
        "is_egx100": True,
        "default_price": 145.00,
    },
    "EGX:BINV": {
        "tv_symbol": "EGX:BINV",
        "ticker": "BINV",
        "symbol_ca": "BINV.CA",
        "name_ar": "بي إنفستمنتس القابضة",
        "name_en": "B Investments Holding",
        "sector": "الخدمات المالية والاستثمار",
        "is_shariah": True,
        "is_egx30": True,
        "is_egx70": False,
        "is_egx100": True,
        "default_price": 24.20,
    },
    "EGX:RAYA": {
        "tv_symbol": "EGX:RAYA",
        "ticker": "RAYA",
        "symbol_ca": "RAYA.CA",
        "name_ar": "راية القابضة للاستثمارات المالية",
        "name_en": "Raya Holding",
        "sector": "الخدمات المالية والتكنولوجيا",
        "is_shariah": True,
        "is_egx30": True,
        "is_egx70": False,
        "is_egx100": True,
        "default_price": 3.80,
    },
    "EGX:MCQE": {
        "tv_symbol": "EGX:MCQE",
        "ticker": "MCQE",
        "symbol_ca": "MCQE.CA",
        "name_ar": "مصر للأسمنت - قنا وبني سويف",
        "name_en": "Misr Cement - Qena / Beni Suef",
        "sector": "مواد البناء والتشييد",
        "is_shariah": True,
        "is_egx30": True,
        "is_egx70": False,
        "is_egx100": True,
        "default_price": 23.80,
    },
    "EGX:ARCC": {
        "tv_symbol": "EGX:ARCC",
        "ticker": "ARCC",
        "symbol_ca": "ARCC.CA",
        "name_ar": "الأسمنت العربية",
        "name_en": "Arabian Cement",
        "sector": "مواد البناء والتشييد",
        "is_shariah": True,
        "is_egx30": True,
        "is_egx70": False,
        "is_egx100": True,
        "default_price": 14.50,
    },
    "EGX:ELEC": {
        "tv_symbol": "EGX:ELEC",
        "ticker": "ELEC",
        "symbol_ca": "ELEC.CA",
        "name_ar": "الكابلات الكهربائية المصرية",
        "name_en": "Electro Cable Egypt",
        "sector": "السلع الصناعية والهندسية",
        "is_shariah": True,
        "is_egx30": True,
        "is_egx70": False,
        "is_egx100": True,
        "default_price": 2.85,
    },
    "EGX:ALCN": {
        "tv_symbol": "EGX:ALCN",
        "ticker": "ALCN",
        "symbol_ca": "ALCN.CA",
        "name_ar": "الإسكندرية لتداول الحاويات والبضائع",
        "name_en": "Alexandria Container & Cargo Handling",
        "sector": "خدمات النقل والشحن",
        "is_shariah": True,
        "is_egx30": True,
        "is_egx70": False,
        "is_egx100": True,
        "default_price": 45.30,
    },
    "EGX:EIPICO": {
        "tv_symbol": "EGX:EIPICO",
        "ticker": "EIPICO",
        "symbol_ca": "EIPICO.CA",
        "name_ar": "المصرية الدولية للصناعات الدوائية - إيبيكو",
        "name_en": "Egyptian International Pharma - EIPICO",
        "sector": "الرعاية الصحية والأدوية",
        "is_shariah": True,
        "is_egx30": True,
        "is_egx70": False,
        "is_egx100": True,
        "default_price": 43.50,
    },
    "EGX:SKPC": {
        "tv_symbol": "EGX:SKPC",
        "ticker": "SKPC",
        "symbol_ca": "SKPC.CA",
        "name_ar": "سيدي كرير للبتروكيماويات - سيدبك",
        "name_en": "Sidi Kerir Petrochemicals",
        "sector": "الكيماويات والأسمدة",
        "is_shariah": True,
        "is_egx30": True,
        "is_egx70": False,
        "is_egx100": True,
        "default_price": 27.50,
    },
    "EGX:CICH": {
        "tv_symbol": "EGX:CICH",
        "ticker": "CICH",
        "symbol_ca": "CICH.CA",
        "name_ar": "سي آي كابيتال القابضة للاستثمارات المالية",
        "name_en": "CI Capital Holding",
        "sector": "الخدمات المالية والاستثمار",
        "is_shariah": True,
        "is_egx30": True,
        "is_egx70": False,
        "is_egx100": True,
        "default_price": 5.90,
    },
    "EGX:QNBA": {
        "tv_symbol": "EGX:QNBA",
        "ticker": "QNBA",
        "symbol_ca": "QNBA.CA",
        "name_ar": "بنك قطر الوطني الأهلي",
        "name_en": "Qatar National Bank Alahly",
        "sector": "البنوك والخدمات المالية",
        "is_shariah": True,
        "is_egx30": True,
        "is_egx70": False,
        "is_egx100": True,
        "default_price": 32.50,
    },
    "EGX:CLHO": {
        "tv_symbol": "EGX:CLHO",
        "ticker": "CLHO",
        "symbol_ca": "CLHO.CA",
        "name_ar": "مستشفى كليوباترا",
        "name_en": "Cleopatra Hospital",
        "sector": "الرعاية الصحية والمستشفيات",
        "is_shariah": True,
        "is_egx30": True,
        "is_egx70": False,
        "is_egx100": True,
        "default_price": 7.30,
    },

    # --- شركات إضافية في مؤشر الشريعة EGX 33 Shariah ---
    "EGX:CIRA": {
        "tv_symbol": "EGX:CIRA",
        "ticker": "CIRA",
        "symbol_ca": "CIRA.CA",
        "name_ar": "القاهرة للاستثمار والتنمية العقارية (سيرا للتعليم)",
        "name_en": "CIRA Education",
        "sector": "خدمات التعليم",
        "is_shariah": True,
        "is_egx30": False,
        "is_egx70": True,
        "is_egx100": True,
        "default_price": 14.80,
    },
    "EGX:GMFL": {
        "tv_symbol": "EGX:GMFL",
        "ticker": "GMFL",
        "symbol_ca": "GMFL.CA",
        "name_ar": "جورميه إيجيبت / جنة للفواكه",
        "name_en": "Gourmet Egypt",
        "sector": "الأغذية والمشروبات",
        "is_shariah": True,
        "is_egx30": False,
        "is_egx70": True,
        "is_egx100": True,
        "default_price": 8.40,
    },
    "EGX:ATQA": {
        "tv_symbol": "EGX:ATQA",
        "ticker": "ATQA",
        "symbol_ca": "ATQA.CA",
        "name_ar": "مصر الوطنية للصلب - عتاقة",
        "name_en": "Misr National Steel - Ataqa",
        "sector": "المعادن والموارد الأساسية",
        "is_shariah": True,
        "is_egx30": False,
        "is_egx70": True,
        "is_egx100": True,
        "default_price": 4.10,
    },
    "EGX:KIMA": {
        "tv_symbol": "EGX:KIMA",
        "ticker": "KIMA",
        "symbol_ca": "KIMA.CA",
        "name_ar": "الصناعات الكيماوية المصرية - كيما",
        "name_en": "Egyptian Chemical Industries - KIMA",
        "sector": "الكيماويات والأسمدة",
        "is_shariah": True,
        "is_egx30": False,
        "is_egx70": True,
        "is_egx100": True,
        "default_price": 8.65,
    },
    "EGX:PRE": {
        "tv_symbol": "EGX:PRE",
        "ticker": "PRE",
        "symbol_ca": "PRE.CA",
        "name_ar": "بايونيرز بروبرتيز للتنمية العمرانية",
        "name_en": "Pioneers Properties for Urban Dev",
        "sector": "العقارات والإنشاءات",
        "is_shariah": True,
        "is_egx30": False,
        "is_egx70": True,
        "is_egx100": True,
        "default_price": 3.12,
    },
    "EGX:MASR": {
        "tv_symbol": "EGX:MASR",
        "ticker": "MASR",
        "symbol_ca": "MASR.CA",
        "name_ar": "مدينة مصر للإسكان والتعمير",
        "name_en": "Madinet Masr for Housing",
        "sector": "العقارات والإنشاءات",
        "is_shariah": True,
        "is_egx30": False,
        "is_egx70": True,
        "is_egx100": True,
        "default_price": 4.15,
    },

    # --- شركات مؤشر EGX 70 EWI والسيولة النشطة ---
    "EGX:ACTF": {
        "tv_symbol": "EGX:ACTF",
        "ticker": "ACTF",
        "symbol_ca": "ACTF.CA",
        "name_ar": "أكت فاينانشال للاستشارات",
        "name_en": "Act Financial",
        "sector": "الخدمات المالية والاستثمار",
        "is_shariah": True,
        "is_egx30": False,
        "is_egx70": True,
        "is_egx100": True,
        "default_price": 3.90,
    },
    "EGX:AIH": {
        "tv_symbol": "EGX:AIH",
        "ticker": "AIH",
        "symbol_ca": "AIH.CA",
        "name_ar": "العربية للاستثمارات والتنمية القابضة",
        "name_en": "Arabia Investments Holding",
        "sector": "الخدمات المالية والاستثمار",
        "is_shariah": True,
        "is_egx30": False,
        "is_egx70": True,
        "is_egx100": True,
        "default_price": 0.65,
    },
    "EGX:MEMP": {
        "tv_symbol": "EGX:MEMP",
        "ticker": "MEMP",
        "symbol_ca": "MEMP.CA",
        "name_ar": "ممفيس للأدوية والصناعات الكيماوية",
        "name_en": "Memphis Pharmaceuticals",
        "sector": "الرعاية الصحية والأدوية",
        "is_shariah": True,
        "is_egx30": False,
        "is_egx70": True,
        "is_egx100": True,
        "default_price": 62.00,
    },
    "EGX:ASPIRE": {
        "tv_symbol": "EGX:ASPIRE",
        "ticker": "ASPIRE",
        "symbol_ca": "ASPIRE.CA",
        "name_ar": "أسباير كابيتال القابضة للاستثمارات",
        "name_en": "Aspire Capital Holding",
        "sector": "الخدمات المالية والاستثمار",
        "is_shariah": True,
        "is_egx30": False,
        "is_egx70": True,
        "is_egx100": True,
        "default_price": 0.38,
    },
    "EGX:CERA": {
        "tv_symbol": "EGX:CERA",
        "ticker": "CERA",
        "symbol_ca": "CERA.CA",
        "name_ar": "العز للسيراميك والبورسلين - ريماس / الجوهرة",
        "name_en": "Ceramica Remas",
        "sector": "مواد البناء والتشييد",
        "is_shariah": True,
        "is_egx30": False,
        "is_egx70": True,
        "is_egx100": True,
        "default_price": 1.15,
    },
    "EGX:OBOUR": {
        "tv_symbol": "EGX:OBOUR",
        "ticker": "OBOUR",
        "symbol_ca": "OBOUR.CA",
        "name_ar": "العبور للاستثمار العقاري",
        "name_en": "El Obour Real Estate",
        "sector": "العقارات والإنشاءات",
        "is_shariah": True,
        "is_egx30": False,
        "is_egx70": True,
        "is_egx100": True,
        "default_price": 10.80,
    },
    "EGX:CONTACT": {
        "tv_symbol": "EGX:CONTACT",
        "ticker": "CONTACT",
        "symbol_ca": "CONTACT.CA",
        "name_ar": "كونتكت المالية القابضة",
        "name_en": "Contact Financial Holding",
        "sector": "الخدمات المالية والاستثمار",
        "is_shariah": True,
        "is_egx30": False,
        "is_egx70": True,
        "is_egx100": True,
        "default_price": 4.60,
    },
    "EGX:ATLEASE": {
        "tv_symbol": "EGX:ATLEASE",
        "ticker": "ATLEASE",
        "symbol_ca": "ATLEASE.CA",
        "name_ar": "التوفيق للتأجير التمويلي - أيه تي ليز",
        "name_en": "Al Tawfeek Leasing - AT Lease",
        "sector": "الخدمات المالية غير المصرفية",
        "is_shariah": True,
        "is_egx30": False,
        "is_egx70": True,
        "is_egx100": True,
        "default_price": 4.90,
    },
    "EGX:GIZA": {
        "tv_symbol": "EGX:GIZA",
        "ticker": "GIZA",
        "symbol_ca": "GIZA.CA",
        "name_ar": "الجيزة العامة للمقاولات والاستثمار العقاري",
        "name_en": "Giza General Contracting",
        "sector": "الإنشاءات والمقاولات",
        "is_shariah": True,
        "is_egx30": False,
        "is_egx70": True,
        "is_egx100": True,
        "default_price": 0.45,
    },
    "EGX:HDBK": {
        "tv_symbol": "EGX:HDBK",
        "ticker": "HDBK",
        "symbol_ca": "HDBK.CA",
        "name_ar": "بنك التعمير والإسكان",
        "name_en": "Housing & Development Bank",
        "sector": "البنوك والخدمات المالية",
        "is_shariah": False,
        "is_egx30": False,
        "is_egx70": True,
        "is_egx100": True,
        "default_price": 48.00,
    },
    "EGX:UNIT": {
        "tv_symbol": "EGX:UNIT",
        "ticker": "UNIT",
        "symbol_ca": "UNIT.CA",
        "name_ar": "المتحدة للإسكان والتعمير",
        "name_en": "United Housing & Development",
        "sector": "العقارات والإنشاءات",
        "is_shariah": True,
        "is_egx30": False,
        "is_egx70": True,
        "is_egx100": True,
        "default_price": 6.20,
    },
    "EGX:ATLAS": {
        "tv_symbol": "EGX:ATLAS",
        "ticker": "ATLAS",
        "symbol_ca": "ATLAS.CA",
        "name_ar": "أطلس للاستثمار والصناعات الغذائية",
        "name_en": "Atlas Investment",
        "sector": "الأغذية والاستثمار",
        "is_shariah": True,
        "is_egx30": False,
        "is_egx70": True,
        "is_egx100": True,
        "default_price": 0.58,
    },
    "EGX:BTFH": {
        "tv_symbol": "EGX:BTFH",
        "ticker": "BTFH",
        "symbol_ca": "BTFH.CA",
        "name_ar": "بلتون المالية القابضة",
        "name_en": "Beltone Financial Holding",
        "sector": "الخدمات المالية والاستثمار",
        "is_shariah": True,
        "is_egx30": False,
        "is_egx70": True,
        "is_egx100": True,
        "default_price": 2.95,
    },
    "EGX:SUGR": {
        "tv_symbol": "EGX:SUGR",
        "ticker": "SUGR",
        "symbol_ca": "SUGR.CA",
        "name_ar": "الدلتا للسكر",
        "name_en": "Delta Sugar",
        "sector": "الأغذية والمشروبات",
        "is_shariah": True,
        "is_egx30": False,
        "is_egx70": True,
        "is_egx100": True,
        "default_price": 72.00,
    },
    "EGX:DSCW": {
        "tv_symbol": "EGX:DSCW",
        "ticker": "DSCW",
        "symbol_ca": "DSCW.CA",
        "name_ar": "دايس للملابس الجاهزة",
        "name_en": "Dice Sport & Casual Wear",
        "sector": "المنسوجات والملابس",
        "is_shariah": True,
        "is_egx30": False,
        "is_egx70": True,
        "is_egx100": True,
        "default_price": 1.48,
    },
    "EGX:AUTO": {
        "tv_symbol": "EGX:AUTO",
        "ticker": "AUTO",
        "symbol_ca": "AUTO.CA",
        "name_ar": "جي بي كوربوريشن (غبور أوتو)",
        "name_en": "GB Corp",
        "sector": "السيارات وقطع الغيار",
        "is_shariah": True,
        "is_egx30": False,
        "is_egx70": True,
        "is_egx100": True,
        "default_price": 12.30,
    },
    "EGX:POUL": {
        "tv_symbol": "EGX:POUL",
        "ticker": "POUL",
        "symbol_ca": "POUL.CA",
        "name_ar": "القاهرة للدواجن",
        "name_en": "Cairo Poultry",
        "sector": "الأغذية والمشروبات والإنتاج الحيواني",
        "is_shariah": True,
        "is_egx30": False,
        "is_egx70": True,
        "is_egx100": True,
        "default_price": 10.15,
    },
    "EGX:ISMA": {
        "tv_symbol": "EGX:ISMA",
        "ticker": "ISMA",
        "symbol_ca": "ISMA.CA",
        "name_ar": "الإسماعيلية مصر للدواجن",
        "name_en": "Ismailia Misr Poultry",
        "sector": "الأغذية والمشروبات والإنتاج الحيواني",
        "is_shariah": True,
        "is_egx30": False,
        "is_egx70": True,
        "is_egx100": True,
        "default_price": 11.80,
    },
    "EGX:MOIL": {
        "tv_symbol": "EGX:MOIL",
        "ticker": "MOIL",
        "symbol_ca": "MOIL.CA",
        "name_ar": "الخدمات الملاحية والبترولية - ماريديف",
        "name_en": "Maridive & Oil Services",
        "sector": "خدمات النفط والغاز",
        "is_shariah": True,
        "is_egx30": False,
        "is_egx70": True,
        "is_egx100": True,
        "default_price": 0.28,
    },
    "EGX:PHAR": {
        "tv_symbol": "EGX:PHAR",
        "ticker": "PHAR",
        "symbol_ca": "PHAR.CA",
        "name_ar": "الإسكندرية للأدوية والصناعات الكيماوية",
        "name_en": "Alexandria Pharmaceuticals",
        "sector": "الرعاية الصحية والأدوية",
        "is_shariah": True,
        "is_egx30": False,
        "is_egx70": True,
        "is_egx100": True,
        "default_price": 185.00,
    },
    "EGX:RMDA": {
        "tv_symbol": "EGX:RMDA",
        "ticker": "RMDA",
        "symbol_ca": "RMDA.CA",
        "name_ar": "العاشر من رمضان للصناعات الدوائية - راميدا",
        "name_en": "Rameda Pharmaceuticals",
        "sector": "الرعاية الصحية والأدوية",
        "is_shariah": True,
        "is_egx30": False,
        "is_egx70": True,
        "is_egx100": True,
        "default_price": 2.50,
    },
    "EGX:SPMD": {
        "tv_symbol": "EGX:SPMD",
        "ticker": "SPMD",
        "symbol_ca": "SPMD.CA",
        "name_ar": "سبيد ميديكال للتحاليل والعيادات",
        "name_en": "Speed Medical",
        "sector": "الرعاية الصحية",
        "is_shariah": True,
        "is_egx30": False,
        "is_egx70": True,
        "is_egx100": True,
        "default_price": 0.49,
    },
    "EGX:OIHC": {
        "tv_symbol": "EGX:OIHC",
        "ticker": "OIHC",
        "symbol_ca": "OIHC.CA",
        "name_ar": "أوراسكوم للاستثمار القابضة",
        "name_en": "Orascom Investment Holding",
        "sector": "الخدمات المالية والاستثمار",
        "is_shariah": True,
        "is_egx30": False,
        "is_egx70": True,
        "is_egx100": True,
        "default_price": 0.42,
    },
    "EGX:OFH": {
        "tv_symbol": "EGX:OFH",
        "ticker": "OFH",
        "symbol_ca": "OFH.CA",
        "name_ar": "أوراسكوم المالية القابضة",
        "name_en": "Orascom Financial Holding",
        "sector": "الخدمات المالية والاستثمار",
        "is_shariah": True,
        "is_egx30": False,
        "is_egx70": True,
        "is_egx100": True,
        "default_price": 0.54,
    },
    "EGX:ORHD": {
        "tv_symbol": "EGX:ORHD",
        "ticker": "ORHD",
        "symbol_ca": "ORHD.CA",
        "name_ar": "أوراسكوم للتنمية مصر",
        "name_en": "Orascom Development Egypt",
        "sector": "السياحة والفنادق والعقارات",
        "is_shariah": True,
        "is_egx30": False,
        "is_egx70": True,
        "is_egx100": True,
        "default_price": 15.60,
    },
    "EGX:EGTS": {
        "tv_symbol": "EGX:EGTS",
        "ticker": "EGTS",
        "symbol_ca": "EGTS.CA",
        "name_ar": "المصرية للمنتجعات السياحية",
        "name_en": "Egyptian Resorts Co",
        "sector": "السياحة والترفيه",
        "is_shariah": True,
        "is_egx30": False,
        "is_egx70": True,
        "is_egx100": True,
        "default_price": 5.15,
    },
    "EGX:MPRC": {
        "tv_symbol": "EGX:MPRC",
        "ticker": "MPRC",
        "symbol_ca": "MPRC.CA",
        "name_ar": "مدينة الإنتاج الإعلامي المصرية",
        "name_en": "Egyptian Media Production City",
        "sector": "الإعلام والترفيه",
        "is_shariah": True,
        "is_egx30": False,
        "is_egx70": True,
        "is_egx100": True,
        "default_price": 18.90,
    },
    "EGX:ACAMD": {
        "tv_symbol": "EGX:ACAMD",
        "ticker": "ACAMD",
        "symbol_ca": "ACAMD.CA",
        "name_ar": "العربية لإدارة وتطوير الأصول",
        "name_en": "Arab Co for Asset Management",
        "sector": "العقارات وإدارة الأصول",
        "is_shariah": True,
        "is_egx30": False,
        "is_egx70": True,
        "is_egx100": True,
        "default_price": 0.88,
    },
    "EGX:ELSH": {
        "tv_symbol": "EGX:ELSH",
        "ticker": "ELSH",
        "symbol_ca": "ELSH.CA",
        "name_ar": "الشمس للإسكان والتعمير",
        "name_en": "El Shams Housing & Urbanization",
        "sector": "العقارات والإنشاءات",
        "is_shariah": True,
        "is_egx30": False,
        "is_egx70": True,
        "is_egx100": True,
        "default_price": 8.75,
    },
    "EGX:ADIB": {
        "tv_symbol": "EGX:ADIB",
        "ticker": "ADIB",
        "symbol_ca": "ADIB.CA",
        "name_ar": "مصرف أبوظبي الإسلامي - مصر",
        "name_en": "Abu Dhabi Islamic Bank - Egypt",
        "sector": "البنوك والمصارف الإسلامية",
        "is_shariah": True,
        "is_egx30": False,
        "is_egx70": True,
        "is_egx100": True,
        "default_price": 44.90,
    },
    "EGX:FAIT": {
        "tv_symbol": "EGX:FAIT",
        "ticker": "FAIT",
        "symbol_ca": "FAIT.CA",
        "name_ar": "بنك فيصل الإسلامي المصري",
        "name_en": "Faisal Islamic Bank of Egypt",
        "sector": "البنوك والمصارف الإسلامية",
        "is_shariah": True,
        "is_egx30": False,
        "is_egx70": True,
        "is_egx100": True,
        "default_price": 36.80,
    },
    "EGX:SAUD": {
        "tv_symbol": "EGX:SAUD",
        "ticker": "SAUD",
        "symbol_ca": "SAUD.CA",
        "name_ar": "بنك البركة مصر",
        "name_en": "Al Baraka Bank Egypt",
        "sector": "البنوك والمصارف الإسلامية",
        "is_shariah": True,
        "is_egx30": False,
        "is_egx70": True,
        "is_egx100": True,
        "default_price": 14.20,
    },
    "EGX:DOMT": {
        "tv_symbol": "EGX:DOMT",
        "ticker": "DOMT",
        "symbol_ca": "DOMT.CA",
        "name_ar": "الصناعات الغذائية العربية - دومتي",
        "name_en": "Arabian Food Industries - Domty",
        "sector": "الأغذية والمشروبات",
        "is_shariah": True,
        "is_egx30": False,
        "is_egx70": True,
        "is_egx100": True,
        "default_price": 19.30,
    },
    "EGX:ISPH": {
        "tv_symbol": "EGX:ISPH",
        "ticker": "ISPH",
        "symbol_ca": "ISPH.CA",
        "name_ar": "ابن سينا فارما",
        "name_en": "Ibnsina Pharma",
        "sector": "الرعاية الصحية والأدوية",
        "is_shariah": True,
        "is_egx30": False,
        "is_egx70": True,
        "is_egx100": True,
        "default_price": 3.45,
    },
    "EGX:CCAP": {
        "tv_symbol": "EGX:CCAP",
        "ticker": "CCAP",
        "symbol_ca": "CCAP.CA",
        "name_ar": "القلعة للاستشارات المالية",
        "name_en": "Qalaa Holdings",
        "sector": "الخدمات المالية والاستثمار",
        "is_shariah": True,
        "is_egx30": False,
        "is_egx70": True,
        "is_egx100": True,
        "default_price": 3.75,
    },
    "EGX:CIEB": {
        "tv_symbol": "EGX:CIEB",
        "ticker": "CIEB",
        "symbol_ca": "CIEB.CA",
        "name_ar": "بنك كريدي أجريكول مصر",
        "name_en": "Credit Agricole Egypt",
        "sector": "البنوك والخدمات المالية",
        "is_shariah": False,
        "is_egx30": False,
        "is_egx70": True,
        "is_egx100": True,
        "default_price": 20.80,
    },
    "EGX:EFIH": {
        "tv_symbol": "EGX:EFIH",
        "ticker": "EFIH",
        "symbol_ca": "EFIH.CA",
        "name_ar": "إي فاينانس للاستثمارات المالية والرقمية",
        "name_en": "e-finance Investment Group",
        "sector": "التكنولوجيا والاتصالات",
        "is_shariah": True,
        "is_egx30": False,
        "is_egx70": True,
        "is_egx100": True,
        "default_price": 24.60,
    },
    "EGX:EKHO": {
        "tv_symbol": "EGX:EKHO",
        "ticker": "EKHO",
        "symbol_ca": "EKHO.CA",
        "name_ar": "القابضة المصرية الكويتية",
        "name_en": "Egypt Kuwait Holding",
        "sector": "الخدمات المالية والاستثمار",
        "is_shariah": True,
        "is_egx30": False,
        "is_egx70": True,
        "is_egx100": True,
        "default_price": 42.10,
    },
}

def is_in_egx30(ticker: str) -> bool:
    """التحقق مما إذا كان السهم مدرجاً ضمن مؤشر EGX 30 الرسمي"""
    clean = ticker.upper().replace("EGX:", "").replace(".CA", "").strip()
    return clean in EGX30_SET

def is_in_shariah(ticker: str) -> bool:
    """التحقق مما إذا كان السهم مدرجاً ضمن مؤشر الشريعة الإسلامية EGX 33 Shariah"""
    clean = ticker.upper().replace("EGX:", "").replace(".CA", "").strip()
    return clean in EGX33_SHARIAH_SET

def is_in_egx70(ticker: str) -> bool:
    """التحقق مما إذا كان السهم مدرجاً ضمن مؤشر الشركات المتوسطة والصغيرة EGX 70"""
    clean = ticker.upper().replace("EGX:", "").replace(".CA", "").strip()
    return clean in EGX70_SET

def is_in_egx100(ticker: str) -> bool:
    """التحقق مما إذا كان السهم مدرجاً ضمن مؤشر EGX 100 الأوسع نطاقاً"""
    clean = ticker.upper().replace("EGX:", "").replace(".CA", "").strip()
    return clean in EGX100_SET

def get_all_tradingview_tickers() -> List[str]:
    """
    إرجاع القائمة الكاملة لجميع الرموز (المؤشرات + الأسهم)
    لإرسالها في طلب POST واحد إلى TradingView Scanner API
    """
    return TRADINGVIEW_INDICES_TICKERS + list(EGX_STOCKS_METADATA.keys())

def get_stock_meta_by_tv_ticker(tv_ticker: str) -> Optional[dict]:
    """إرجاع البيانات الوصفية لسهم محدد من خلال رمز تريدنج فيو أو الرمز العادي"""
    clean = tv_ticker.upper().strip()
    if not clean.startswith("EGX:"):
        clean = f"EGX:{clean.replace('.CA', '')}"
    return EGX_STOCKS_METADATA.get(clean)
