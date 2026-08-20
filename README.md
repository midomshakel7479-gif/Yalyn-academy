# أكاديمية يالين — Yalyn Academy

منصة تعليمية متكاملة (حضور، اختبارات يولّدها الذكاء الاصطناعي، تصحيح تلقائي، رسائل، وتحليلات أداء) — جاهزة للنشر على Vercel.

## محتوى المشروع
```
index.html                  ← الواجهة كاملة (تصميم ثلاثي الأبعاد، عربي/إنجليزي)
api/generate-questions.js   ← دالة خادوم تولّد بنك الأسئلة من محتوى الدرس
api/grade-answers.js        ← دالة خادوم تصحح الإجابات المقالية
package.json
```

## خطوات النشر على Vercel

### الطريقة الأولى — عبر GitHub (الأسهل للمتابعة لاحقًا)
1. ارفع هذا المجلد إلى مستودع جديد على GitHub.
2. ادخل إلى [vercel.com/new](https://vercel.com/new) وسجّل الدخول، ثم اختر "Import Project" وحدد المستودع.
3. اترك الإعدادات الافتراضية (Vercel يتعرف تلقائيًا على أنه مشروع ثابت + دوال Serverless في `api/`).
4. قبل الضغط على Deploy، افتح **Environment Variables** وأضف:
   - **Key:** `ANTHROPIC_API_KEY`
   - **Value:** مفتاحك من [console.anthropic.com](https://console.anthropic.com)
5. اضغط **Deploy**. خلال دقيقة ستحصل على رابط دائم مثل `yalyn-academy.vercel.app`.

### الطريقة الثانية — عبر سطر الأوامر (CLI)
```bash
npm install -g vercel
cd yalyn-academy
vercel login
vercel --prod
```
عند أول تشغيل سيطلب منك ربط المشروع؛ بعد النشر أضف `ANTHROPIC_API_KEY` من لوحة تحكم Vercel (Settings → Environment Variables) ثم أعد النشر بأمر `vercel --prod` مرة أخرى ليتفعل المفتاح.

## ربط نطاقك الخاص (yalynacademy.com)
من لوحة المشروع في Vercel: **Settings → Domains → Add** ثم أدخل نطاقك واتبع تعليمات تحديث DNS عند مزوّد النطاق.

## ربط Supabase (لجعل البيانات مشتركة بين كل المعلمين والطلاب)

بدون هذه الخطوة، بيانات كل مستخدم محفوظة في متصفحه فقط (محليًا). بعد ربط Supabase، تصبح كل البيانات — الطلاب، المحتوى، الاختبارات، النتائج، الرسائل — مشتركة فعليًا ومتزامنة من أي جهاز.

### 1) أنشئ الجدول في مشروع Supabase
افتح مشروعك على [supabase.com](https://supabase.com/dashboard) → **SQL Editor** → **New query**، والصق هذا الكود ثم اضغط **Run**:

```sql
create table if not exists app_data (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table app_data enable row level security;

create policy "public read" on app_data
  for select using (true);

create policy "public insert" on app_data
  for insert with check (true);

create policy "public update" on app_data
  for update using (true);
```

⚠️ **تنبيه أمني صريح:** هذه السياسات (Policies) تسمح لأي شخص يملك رابط موقعك بقراءة وكتابة كل بيانات المنصة — لأن التطبيق حاليًا لا يستخدم نظام مصادقة حقيقي (تسجيل الدخول يعتمد على كلمة مرور بسيطة مخزّنة في الكود). هذا مقبول لمرحلة التجربة أو الاستخدام الصغير الموثوق، لكنه **غير كافٍ لمنصة إنتاجية حقيقية بها بيانات حساسة لطلاب حقيقيين**. الخطوة التالية الموصى بها لاحقًا: تفعيل Supabase Auth (تسجيل دخول حقيقي للمعلم والطلاب) وتضييق الـ Policies بحيث كل مستخدم يرى بياناته فقط.

### 2) احصل على رابط المشروع والمفتاح العام
من لوحة Supabase: **Settings → API**، انسخ:
- **Project URL** (يشبه: `https://yezeowbumicbkvxexxwl.supabase.co`)
- **anon public key** (مفتاح طويل يبدأ بـ `eyJ...`) — هذا المفتاح آمن للاستخدام في المتصفح، فهو محمي بالـ Policies أعلاه، وليس مثل مفتاح Anthropic.

### 3) الصقهما في المشروع
افتح `index.html`، وابحث عن هذا السطرين قرب بداية كود الجافاسكريبت:
```js
const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
```
استبدل القيمتين بقيمك الفعلية، احفظ الملف، ثم انشره على Vercel (أو أعد النشر إذا كان منشورًا بالفعل — عبر `git push` إذا كنت تستخدم GitHub، أو `vercel --prod` إذا كنت تستخدم الأوامر).

### 4) تحقّق
افتح الموقع بعد النشر — سترى في أعلى الصفحة شارة خضراء **"● مشترك (Supabase)"** بدل الشارة الصفراء "محلي فقط". جرّب فتح الموقع من متصفحين مختلفين (أو جهازين) وأضف طالبًا من أحدهما — يجب أن يظهر في الآخر بعد تحديث الصفحة.

## ملاحظات مهمة

**التخزين:** البيانات (الطلاب، المحتوى، النتائج...) تُحفظ حاليًا في متصفح كل مستخدم (localStorage) — أي أنها محلية لكل جهاز ولا تُشارك تلقائيًا بين المعلم والطلاب من أجهزة مختلفة. هذا مناسب للتجربة والعرض، لكن لأكاديمية حقيقية متعددة المستخدمين ستحتاج قاعدة بيانات مشتركة. لاحظت أن لديك بالفعل مشروع Supabase مُجهّز مسبقًا (المرجع: `yezeowbumicbkvxexxwl` كما ورد في ملفكم السابق) — ربطه هو الخطوة الطبيعية التالية لجعل البيانات مشتركة بين الجميع وتعمل من أي جهاز.

**الأمان:** لا تضع مفتاح Anthropic API مباشرة داخل `index.html` أبدًا — استخدم فقط متغير البيئة `ANTHROPIC_API_KEY` في إعدادات Vercel كما هو موضح أعلاه؛ دوال `api/` هي التي تتصل بالمفتاح بشكل آمن من جهة الخادم.

**كلمة مرور المعلّم التجريبية:** `teacher123` — غيّرها في المصدر (`TEACHER_PASS` داخل `index.html`) قبل الاستخدام الفعلي، والأفضل استبدالها لاحقًا بنظام مصادقة حقيقي.
