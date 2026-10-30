export interface EgxNewsItem {
  id: string;
  headlineAr: string;
  summaryAr: string;
  sourceNameAr: string;
  sourceCategory:
    | 'INVESTING_COM'
    | 'EGX_OFFICIAL'
    | 'MUBASHER'
    | 'BLOOMBERG_ASHARQ'
    | 'ENTERPRISE'
    | 'ALBORSA_NEWS'
    | 'FRA'
    | 'CBE'
    | 'AMWAL_ALGHAD'
    | 'HAPI_JOURNAL'
    | 'CORPORATE_DISCLOSURE';
  isOfficialVerified: boolean;
  publishedAt: string;
  timeAgoAr: string;
  relatedSymbols: string[];
  impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'MATERIAL';
  impactLabelAr: string;
  categoryLabelAr: string;
  url: string; // Direct link to verified article/source
}

export interface VerifiedNewsPortal {
  id: string;
  nameAr: string;
  categoryAr: string;
  descriptionAr: string;
  url: string;
  badgeAr: string;
  badgeColor: string;
  features: string[];
}

export const DIRECT_VERIFIED_PORTALS: VerifiedNewsPortal[] = [
  {
    id: 'investing-com',
    nameAr: 'إنفستنج دوت كوم مصر (Investing.com)',
    categoryAr: 'منصة تحليلات وأخبار أسهم عالمية ومحلية',
    descriptionAr: 'المصدر الرائد عالمياً لمتابعة أسعار الأسهم المصرية اللحظية، التحليل الفني، المفكرة الاقتصادية، وتغطية صفقات كبار المساهمين.',
    url: 'https://sa.investing.com/equities/egypt',
    badgeAr: 'تغطية عالمية فورية ★★★★★',
    badgeColor: 'amber',
    features: ['شاشات أسعار فورية', 'مفكرة اقتصادية وأرباح', 'تحليلات كبار الخبراء', 'تطبيق وموقع عربي'],
  },
  {
    id: 'egx-official',
    nameAr: 'البوابة الرسمية للبورصة المصرية (EGX Official)',
    categoryAr: 'الجهة الرسمية المنظمة للتداول',
    descriptionAr: 'المصدر الأول والأكثر موثوقية لقرارات لجنة القيد، إفصاحات مجالس الإدارات، مواعيد التوزيعات النقدية، وبيانات التداول اليومية الرسمية.',
    url: 'https://www.egx.com.eg',
    badgeAr: 'رسمي معتمد 100% 🏛️',
    badgeColor: 'emerald',
    features: ['إفصاحات الشركات اللحظية', 'قرارات لجنة القيد', 'جداول توزيع الكوبونات', 'قوائم الأسهم والمؤشرات'],
  },
  {
    id: 'mubasher-misr',
    nameAr: 'مباشر مصر (Mubasher Misr)',
    categoryAr: 'شبكة معلومات الأسواق المالية العربية',
    descriptionAr: 'تغطية حية لأخبار الشركات المقيدة، صفقات الحجم الكبير، تحركات المستثمرين العرب والأجانب، والتقارير المالية الدورية.',
    url: 'https://www.mubasher.info/countries/eg',
    badgeAr: 'تغطية لحظية حية ⚡',
    badgeColor: 'cyan',
    features: ['أخبار وتصريحات حصرية', 'رصد صفقات Block Trades', 'بيانات القوائم المالية', 'أخبار السندات وأذون الخزانة'],
  },
  {
    id: 'bloomberg-asharq',
    nameAr: 'اقتصاد الشرق مع بلومبرغ مصر (Bloomberg Asharq)',
    categoryAr: 'وكالة الأخبار الاقتصادية الدولية',
    descriptionAr: 'تحقيقات استقصائية وتحليلات معمقة حول تدفقات الاستثمار الأجنبي، برامج الطروحات الحكومية، وصفقات الاندماج والاستحواذ الكبرى.',
    url: 'https://www.asharqbusiness.com/egypt',
    badgeAr: 'معيار بلومبرغ الدولي 🌐',
    badgeColor: 'indigo',
    features: ['تحليلات الاقتصاد الكلي', 'أخبار الطروحات الحكومية', 'صفقات الاستحواذ الكبرى', 'مؤشرات التضخم وسعر الصرف'],
  },
  {
    id: 'enterprise-egypt',
    nameAr: 'إنتربرايز مصر (Enterprise Egypt)',
    categoryAr: 'النشرة المالية والتحليلية الرائدة',
    descriptionAr: 'النشرة الإخبارية اليومية المرجعية لقادة الأعمال والشركات الاستثمارية وصناديق التحوط في مصر والشرق الأوسط.',
    url: 'https://enterprise.news/egypt/ar',
    badgeAr: 'النشرة الصباحية للنخبة 📰',
    badgeColor: 'violet',
    features: ['ملخص جلسة التداول', 'أجندة الصفقات والاستثمار', 'تقارير أداء الشركات', 'نشرات متخصصة بالصناعة والطاقة'],
  },
  {
    id: 'alborsa-news',
    nameAr: 'جريدة البورصة المصرية (Al Borsa News)',
    categoryAr: 'الصحيفة الاقتصادية اليومية الأولى',
    descriptionAr: 'متابعات يومية مفصلة لحركة الأسهم، حوارات حصرية مع رؤساء الشركات المقيدة، ومؤشرات الأداء المالي والتشغيلي.',
    url: 'https://alborsaanews.com',
    badgeAr: 'صحافة المال والأعمال 📊',
    badgeColor: 'teal',
    features: ['حوارات مجالس الإدارات', 'تحليلات أسهم EGX 30 و 70', 'متابعة قضايا الشركات', 'تقارير القطاعات الاقتصادية'],
  },
  {
    id: 'fra-egypt',
    nameAr: 'الهيئة العامة للرقابة المالية (FRA)',
    categoryAr: 'الجهة الرقابية على الأسواق المالية غير المصرفية',
    descriptionAr: 'إعلانات اعتماد نشرات الاكتتاب، عروض الشراء الإجباري (MTO)، قرارات شطب أو قيد الأوراق المالية، وحماية حقوق صغار المساهمين.',
    url: 'https://fra.gov.eg',
    badgeAr: 'رقابي وتشريعي ملزم ⚖️',
    badgeColor: 'blue',
    features: ['عروض الشراء والاستحواذ', 'تراخيص الخدمات المالية', 'تظلمات المساهمين', 'الرقابة على التمويل متناهي الصغر'],
  },
  {
    id: 'cbe-egypt',
    nameAr: 'البنك المركزي المصري (CBE)',
    categoryAr: 'السلطة النقدية والسياسات المصرفية',
    descriptionAr: 'بيانات الاحتياطي النقدي الأجنبي، قرارات لجنة السياسة النقدية (أسعار الفائدة)، وتقارير الاستقرار المالي والمصرفي.',
    url: 'https://www.cbe.org.eg',
    badgeAr: 'البنك المركزي 🏦',
    badgeColor: 'emerald',
    features: ['قرارات أسعار الفائدة', 'تقارير التضخم والاحتياطي', 'تعليمات الرقابة المصرفية', 'بيانات ميزان المدفوعات'],
  },
  {
    id: 'amwal-alghad',
    nameAr: 'أموال الغد (Amwal Al Ghad)',
    categoryAr: 'منصة استثمار وأسواق المال',
    descriptionAr: 'رصد تدفقات رؤوس الأموال، توسعات الشركات الصناعية والعقارية، ومعارض الاستثمار في السوق المصري.',
    url: 'https://amwalalghad.com',
    badgeAr: 'تغطية استثمارية متكاملة 💼',
    badgeColor: 'sky',
    features: ['توسعات المشروعات', 'مؤشرات القطاع المصرفي', 'أخبار الاستثمار المباشر', 'مؤتمرات الأعمال'],
  },
  {
    id: 'hapi-journal',
    nameAr: 'جريدة حابي الاقتصادية (Hapi Journal)',
    categoryAr: 'صحافة المال المتخصصة',
    descriptionAr: 'تغطية تحليلية مركزة لقطاعات البنوك، التأمين، التمويل غير المصرفي، والصفقات الاستراتيجية.',
    url: 'https://hapijournal.com',
    badgeAr: 'صحافة مالية متخصصة ✒️',
    badgeColor: 'orange',
    features: ['صفقات التمويل المشترك', 'أخبار التأمين والاستثمار', 'استطلاعات الرأي الاقتصادي', 'تحليلات أسواق الائتمان'],
  },
];

export const OFFICIAL_NEWS_SOURCES = [
  { id: 'ALL', nameAr: 'جميع المصادر المعتمدة' },
  { id: 'INVESTING_COM', nameAr: 'إنفستنج دوت كوم (Investing) 🌐' },
  { id: 'EGX_OFFICIAL', nameAr: 'البورصة المصرية (EGX الرسمية) ✅' },
  { id: 'MUBASHER', nameAr: 'مباشر مصر (تغطية حية) ⚡' },
  { id: 'BLOOMBERG_ASHARQ', nameAr: 'اقتصاد الشرق مع بلومبرغ 🌍' },
  { id: 'ENTERPRISE', nameAr: 'إنتربرايز مصر (Enterprise) 📰' },
  { id: 'ALBORSA_NEWS', nameAr: 'جريدة البورصة المصرية 📊' },
  { id: 'FRA', nameAr: 'الرقابة المالية (FRA) 🏛️' },
  { id: 'CBE', nameAr: 'البنك المركزي المصري (CBE) 🏦' },
  { id: 'CORPORATE_DISCLOSURE', nameAr: 'إفصاحات الشركات المقيدة 📋' },
];

export const MOCK_VERIFIED_NEWS: EgxNewsItem[] = [
  {
    id: 'news-inv-1',
    headlineAr: 'إنفستنج: مكاسب قوية لمؤشر EGX 30 بقيادة قطاعي الأسمدة والعقارات وسط تدفق سيولة مؤسسية نشطة',
    summaryAr: 'أفادت منصة إنفستنج دوت كوم (Investing.com) بارتفاع جماعي لمؤشرات البورصة المصرية، حيث قادت أسهم طلعت مصطفى وموبكو وأبو قير وسويدي إليكتريك السيولة المنفذة لتتجاوز 4.2 مليار جنيه، مع إشارات استمرار الزخم الإيجابي وفق المؤشرات الفنية.',
    sourceNameAr: 'إنفستنج دوت كوم مصر (Investing.com)',
    sourceCategory: 'INVESTING_COM',
    isOfficialVerified: true,
    publishedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    timeAgoAr: 'منذ 10 دقائق ⚡',
    relatedSymbols: ['TMGH', 'MFPC', 'ABUK', 'SWDY'],
    impact: 'POSITIVE',
    impactLabelAr: 'إيجابي قوي 🟢',
    categoryLabelAr: 'تحليل إنفستنج دوت كوم',
    url: 'https://sa.investing.com/equities/egypt',
  },
  {
    id: 'news-1',
    headlineAr: 'البورصة المصرية: قيد أسهم زيادة رأس مال مجموعة طلعت مصطفى القابضة وبدء التداول عليها',
    summaryAr: 'وافقت لجنة القيد بالبورصة المصرية بجلستها المنعقدة على قيد أسهم زيادة رأس المال المصدر والمدفوع لشركة مجموعة طلعت مصطفى القابضة (TMGH) من مصادر التمويل الذاتية، مع استيفاء شروط الإفصاح والحوكمة.',
    sourceNameAr: 'إدارة الإفصاح - البورصة المصرية (EGX)',
    sourceCategory: 'EGX_OFFICIAL',
    isOfficialVerified: true,
    publishedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    timeAgoAr: 'منذ 25 دقيقة',
    relatedSymbols: ['TMGH'],
    impact: 'POSITIVE',
    impactLabelAr: 'إيجابي جوهري 🟢',
    categoryLabelAr: 'إفصاح رسمي معتمد',
    url: 'https://www.egx.com.eg',
  },
  {
    id: 'news-asharq-1',
    headlineAr: 'اقتصاد الشرق مع بلومبرغ: مفاوضات متقدمة لدخول مستثمرين استراتيجيين خليجيين في حصص بمشروعات طاقة وبتروكيماويات مصرية',
    summaryAr: 'كشفت مصادر مطلعة لبلومبرغ الشرق عن محادثات إيجابية لتنفيذ استثمارات صناعية جديدة وتوسعات شريكة مع شركات مقيدة مثل سيدي كرير للبتروكيماويات وموبكو ومصر للألومنيوم بقيمة تقارب مليار دولار.',
    sourceNameAr: 'اقتصاد الشرق مع بلومبرغ (Bloomberg Asharq)',
    sourceCategory: 'BLOOMBERG_ASHARQ',
    isOfficialVerified: true,
    publishedAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    timeAgoAr: 'منذ 40 دقيقة',
    relatedSymbols: ['SKPC', 'MFPC', 'EGAL'],
    impact: 'POSITIVE',
    impactLabelAr: 'صفقات استراتيجية 💼',
    categoryLabelAr: 'تقرير بلومبرغ الشرق',
    url: 'https://www.asharqbusiness.com/egypt',
  },
  {
    id: 'news-2',
    headlineAr: 'السويدي إليكتريك تعلن توقيع عقود مشروعات طاقة وبنية تحتية جديدة بقيمة 12.8 مليار جنيه',
    summaryAr: 'أعلنت شركة السويدي إليكتريك (SWDY) في إفصاح رسمي مرسل لإدارة البورصة عن إسناد وتوقيع عقود توريد وتنفيذ خطوط نقل جهد فائق ومحطات محولات مع جهات حكومية وإقليمية، ما يدعم محفظة الأعمال والتدفقات النقدية التشغيلية للعام المالي الجاري.',
    sourceNameAr: 'إفصاحات الشركات المقيدة - EGX',
    sourceCategory: 'CORPORATE_DISCLOSURE',
    isOfficialVerified: true,
    publishedAt: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
    timeAgoAr: 'منذ 55 دقيقة',
    relatedSymbols: ['SWDY'],
    impact: 'POSITIVE',
    impactLabelAr: 'إيجابي جوهري 🟢',
    categoryLabelAr: 'إفصاح شركة مقيدة',
    url: 'https://www.egx.com.eg',
  },
  {
    id: 'news-ent-1',
    headlineAr: 'إنتربرايز مصر: قفزة في صافي مشتريات الصناديق والمؤسسات المحلية تدفع مؤشر البورصة لقمم تاريخية جديدة',
    summaryAr: 'أشارت النشرة الصباحية لإنتربرايز إلى عودة قوية للسيولة المؤسسية لأسهم القيمة في السوق المصري مع تسجيل تداولات نشطة على أسهم فوري والبنك التجاري الدولي وحديد عز، مدعومة بتوقعات نتائج الأعمال الربع سنوية.',
    sourceNameAr: 'إنتربرايز مصر (Enterprise Egypt)',
    sourceCategory: 'ENTERPRISE',
    isOfficialVerified: true,
    publishedAt: new Date(Date.now() - 70 * 60 * 1000).toISOString(),
    timeAgoAr: 'منذ ساعة و10 دقائق',
    relatedSymbols: ['FWRY', 'COMI', 'ESRS'],
    impact: 'POSITIVE',
    impactLabelAr: 'سيولة مؤسسية 📈',
    categoryLabelAr: 'نشرة إنتربرايز المالية',
    url: 'https://enterprise.news/egypt/ar',
  },
  {
    id: 'news-3',
    headlineAr: 'الرقابة المالية تمنح موافقة لشركة فوري لتوسيع خدمات التمويل متناهي الصغر والمدفوعات اللحظية',
    summaryAr: 'أصدرت الهيئة العامة للرقابة المالية (FRA) قراراً باعتماد التراخيص التشغيلية الجديدة لشركة فوري لتكنولوجيا البنوك والمدفوعات الإلكترونية (FWRY)، بما يعزز مكانتها كقائد لحلول الشمول المالي الرقمي بالتعاون مع شبكة ميزة والبنك المركزي.',
    sourceNameAr: 'الهيئة العامة للرقابة المالية (FRA)',
    sourceCategory: 'FRA',
    isOfficialVerified: true,
    publishedAt: new Date(Date.now() - 85 * 60 * 1000).toISOString(),
    timeAgoAr: 'منذ ساعة و25 دقيقة',
    relatedSymbols: ['FWRY'],
    impact: 'POSITIVE',
    impactLabelAr: 'إيجابي 🟢',
    categoryLabelAr: 'قرار تنظيمي رسمي',
    url: 'https://fra.gov.eg',
  },
  {
    id: 'news-alborsa-1',
    headlineAr: 'جريدة البورصة: شركات الأسمدة تبحث خطط توسعية لزيادة إنتاج اليوريا والأمونيا الخضراء وتأمين التصدير لأوروبا',
    summaryAr: 'نقلت جريدة البورصة عن قيادات في قطاع البتروكيماويات بدء دراسات جدوى مشتركة بين شركتي أبوقير للأسمدة وموبكو لاستغلال الطاقات الفائضة في مشروعات الطاقة المتجددة، مع استقرار إمدادات الغاز الطبيعي بصورة كاملة.',
    sourceNameAr: 'جريدة البورصة المصرية (Al Borsa)',
    sourceCategory: 'ALBORSA_NEWS',
    isOfficialVerified: true,
    publishedAt: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    timeAgoAr: 'منذ ساعتين',
    relatedSymbols: ['ABUK', 'MFPC', 'SKPC'],
    impact: 'POSITIVE',
    impactLabelAr: 'توسعات استثمارية 🌿',
    categoryLabelAr: 'تحقيق جريدة البورصة',
    url: 'https://alborsaanews.com',
  },
  {
    id: 'news-4',
    headlineAr: 'مصر لإنتاج الأسمدة (موبكو) تقر توزيع كوبون نقدي بقيمة 3.50 جنيه للسهم لحاملي نهاية جلسة اليوم',
    summaryAr: 'أقرت الجمعية العامة العادية لشركة مصر لإنتاج الأسمدة - موبكو (MFPC) توزيعات الأرباح النقدية للمساهمين عن أرباح العام المالي المنصرم، مع تحديد تاريخ الصرف واستحقاق الكوبون النقدي عبر شركة مصر للمقاصة.',
    sourceNameAr: 'البورصة المصرية - قسم العمليات',
    sourceCategory: 'EGX_OFFICIAL',
    isOfficialVerified: true,
    publishedAt: new Date(Date.now() - 130 * 60 * 1000).toISOString(),
    timeAgoAr: 'منذ ساعتين و10 دقائق',
    relatedSymbols: ['MFPC', 'ABUK'],
    impact: 'POSITIVE',
    impactLabelAr: 'توزيع أرباح 💰',
    categoryLabelAr: 'قرارات جمعيات عمومية',
    url: 'https://www.egx.com.eg',
  },
  {
    id: 'news-5',
    headlineAr: 'البنك المركزي المصري: صافي احتياطي النقد الأجنبي يواصل الارتفاع للشهر الثامن على التوالي',
    summaryAr: 'أعلن البنك المركزي المصري (CBE) عن ارتفاع صافي الاحتياطيات الدولية من النقد الأجنبي ليسجل مستويات قياسية، مدفوعاً بنمو الصادرات وتحويلات المصريين بالخارج وتدفقات الاستثمار الأجنبي المباشر، مما يدعم استقرار العملة الوطنية وسوق الصرف.',
    sourceNameAr: 'البنك المركزي المصري (CBE)',
    sourceCategory: 'CBE',
    isOfficialVerified: true,
    publishedAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    timeAgoAr: 'منذ 3 ساعات',
    relatedSymbols: ['ADIB', 'FAITA', 'CIEB'],
    impact: 'POSITIVE',
    impactLabelAr: 'اقتصادي كلي إيجابي 🏦',
    categoryLabelAr: 'بيان البنك المركزي',
    url: 'https://www.cbe.org.eg',
  },
  {
    id: 'news-mubasher-1',
    headlineAr: 'مباشر مصر: صفقة شراء لافتة على أسهم إيفرجرو وإسكان مصر وبالم هيلز بقيمة تتجاوز 145 مليون جنيه',
    summaryAr: 'رصدت شاشات التداول بالبورصة المصرية تنفيذ عمليات نقل ملكية وصفقات ذات حجم كبير (Block Trades) على أسهم قطاع العقارات والتنمية العمرانية لصالح مؤسسات محلية وإقليمية متخصصة في إدارة الأصول العقارية.',
    sourceNameAr: 'مباشر مصر (Mubasher)',
    sourceCategory: 'MUBASHER',
    isOfficialVerified: true,
    publishedAt: new Date(Date.now() - 220 * 60 * 1000).toISOString(),
    timeAgoAr: 'منذ 3 ساعات و40 دقيقة',
    relatedSymbols: ['PHDC', 'TMGH', 'ORAS'],
    impact: 'NEUTRAL',
    impactLabelAr: 'صفقات ذات حجم كبير 📊',
    categoryLabelAr: 'شاشات صفقات مباشر',
    url: 'https://www.mubasher.info/countries/eg',
  },
  {
    id: 'news-inv-2',
    headlineAr: 'إنفستنج دوت كوم: توقعات بنمو أرباح قطاع الرعاية الصحية والأدوية بالبورصة بنسبة 28% مدفوعة بزيادة التصدير',
    summaryAr: 'نشرت منصة Investing.com دراسة تحليلية تسلط الضوء على فرص النمو لأسهم إيبيكو (PHAR) وراميدا (RMDA) وممفيس (MPCI) وابن سينا فارما، مع تسعير المنتجات الجديد والطلب الإقليمي في أسواق إفريقيا والخليج.',
    sourceNameAr: 'إنفستنج دوت كوم مصر (Investing.com)',
    sourceCategory: 'INVESTING_COM',
    isOfficialVerified: true,
    publishedAt: new Date(Date.now() - 280 * 60 * 1000).toISOString(),
    timeAgoAr: 'منذ 4 ساعات و40 دقيقة',
    relatedSymbols: ['PHAR', 'RMDA', 'MPCI', 'ISPH'],
    impact: 'POSITIVE',
    impactLabelAr: 'تحليل قطاعي إيجابي 💊',
    categoryLabelAr: 'أبحاث إنفستنج',
    url: 'https://sa.investing.com/news/stock-market-news',
  },
];
