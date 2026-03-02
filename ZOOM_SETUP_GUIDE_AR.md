

 
 # دليل إعداد Zoom Integration - خطوة بخطوة

## 📋 المتطلبات

- حساب Zoom (Business أو Enterprise)
- Zoom Marketplace Developer Account
- Meeting Service يعمل

---

## الخطوة 1: إنشاء Zoom App في Marketplace

### 1.1 تسجيل الدخول لـ Zoom Marketplace

1. اذهب إلى: **https://marketplace.zoom.us/**
2. اضغط **Sign In** وادخل بحساب Zoom
3. اضغط **Develop** → **Build App**

### 1.2 إنشاء Server-to-Server OAuth App (موصى به للـ Production)

1. اختر **Server-to-Server OAuth** → **Create**
2. املأ البيانات:
   - **App Name:** `Meeting Service Integration` (أو أي اسم)
   - **Company Name:** اسم الشركة
   - **Developer Contact Information:** بريدك الإلكتروني
3. اضغط **Continue**

### 1.3 إعداد App Credentials

1. في صفحة **App Credentials**:
   - **Account ID** — انسخه (هتحتاجه في `.env`)
   - **Client ID** — هذا هو `ZOOM_API_KEY`
   - **Client Secret** — هذا هو `ZOOM_API_SECRET`
2. **مهم:** احفظ الـ credentials في مكان آمن

### 1.4 إعداد Scopes (الصلاحيات)

1. اذهب لـ **Scopes** tab
2. أضف الـ scopes التالية:
   - ✅ **meeting:write:admin** — إنشاء وحذف meetings
   - ✅ **meeting:read:admin** — قراءة معلومات meetings
3. اضغط **Save**

### 1.5 Activate App

1. اذهب لـ **Activation** tab
2. اضغط **Activate your app**
3. اختر الحساب اللي عاوز تستخدمه
4. وافق على الشروط

---

## الخطوة 2: إعداد Environment Variables

### 2.1 افتح ملف `.env`

في مجلد المشروع، افتح ملف `.env`

### 2.2 أضف Zoom Credentials

```env
# Zoom API Configuration
ZOOM_API_KEY="your-client-id-here"
ZOOM_API_SECRET="your-client-secret-here"
ZOOM_ACCOUNT_ID="your-account-id-here"
ZOOM_USER_ID="me"
```

**مثال:**
```env
ZOOM_API_KEY="abc123xyz"
ZOOM_API_SECRET="secret456"
ZOOM_ACCOUNT_ID="account789"
ZOOM_USER_ID="me"
```

**ملاحظات:**
- `ZOOM_API_KEY` = Client ID من Zoom Marketplace
- `ZOOM_API_SECRET` = Client Secret من Zoom Marketplace
- `ZOOM_ACCOUNT_ID` = Account ID من Zoom Marketplace
- `ZOOM_USER_ID` = `"me"` (يعني account owner) أو user ID محدد

---

## الخطوة 3: تثبيت Dependencies

### 3.1 تثبيت jsonwebtoken (للـ JWT authentication - اختياري)

```bash
npm install jsonwebtoken @types/jsonwebtoken
```

**ملاحظة:** لو استخدمت Account-level OAuth (مع `ZOOM_ACCOUNT_ID`)، مش محتاج `jsonwebtoken`.

---

## الخطوة 4: تحديث قاعدة البيانات

### 4.1 تشغيل Migration

```bash
npm run prisma:migrate
```

أو:

```bash
npx prisma db push
```

هذا هيضيف الحقول الجديدة:
- `zoomMeetingId`
- `zoomJoinUrl`
- `zoomStartUrl`
- `zoomPassword`

### 4.2 Regenerate Prisma Client

```bash
npm run prisma:generate
```

---

## الخطوة 5: إعادة تشغيل الخادم

```bash
npm run start:dev
```

الخادم هيشتغل ويقرأ الـ Zoom credentials من `.env`.

---

## الخطوة 6: اختبار Integration

### 6.1 إنشاء Meeting مع Zoom

**Request:**
```http
POST http://localhost:3000/meetings
Headers:
  x-secret-key: your-secret-key
Content-Type: application/json

{
  "title": "Test Zoom Meeting",
  "description": "Testing Zoom integration",
  "startTime": "2026-02-20T10:00:00.000Z",
  "endTime": "2026-02-20T11:00:00.000Z",
  "status": "SCHEDULED"
}
```

**Response:**
```json
{
  "id": "meeting-uuid",
  "title": "Test Zoom Meeting",
  "status": "SCHEDULED",
  "zoomMeetingId": "123456789",
  "zoomJoinUrl": "https://zoom.us/j/123456789",
  "zoomStartUrl": "https://zoom.us/s/123456789?zak=...",
  "zoomPassword": "123456",
  ...
}
```

### 6.2 التحقق من Zoom Meeting

1. افتح `zoomJoinUrl` في المتصفح
2. أو افتح Zoom app وابحث عن الـ meeting بالـ ID

---

## 🔍 Troubleshooting - حل المشاكل

### المشكلة: Zoom meeting مش بيتعمل

**الحل:**
1. ✅ تأكد من Zoom credentials في `.env` صحيحة
2. ✅ تأكد من `status: "SCHEDULED"` (مش `DRAFT`)
3. ✅ شوف الـ logs في terminal — ممكن يكون في error من Zoom API
4. ✅ تأكد من الـ Scopes في Zoom Marketplace (meeting:write:admin)

### المشكلة: "Zoom credentials not configured"

**الحل:**
- تأكد من إضافة Zoom credentials في `.env`
- أعد تشغيل الخادم بعد إضافة الـ credentials

### المشكلة: "Failed to authenticate with Zoom API"

**الحل:**
1. تحقق من `ZOOM_API_KEY` و `ZOOM_API_SECRET` صحيحة
2. لو استخدمت Account-level OAuth، تأكد من `ZOOM_ACCOUNT_ID` موجود
3. تأكد من الـ App في Zoom Marketplace **Activated**

### المشكلة: "JWT library not found"

**الحل:**
```bash
npm install jsonwebtoken @types/jsonwebtoken
```

أو استخدم Account-level OAuth بدلاً من JWT (أضف `ZOOM_ACCOUNT_ID`).

---

## 📝 ملاحظات مهمة

### 1. متى يتم إنشاء Zoom Meeting؟

- ✅ **يتم إنشاء Zoom meeting** لو `status: "SCHEDULED"`
- ❌ **لا يتم إنشاء Zoom meeting** لو `status: "DRAFT"` أو `"CANCELLED"`

### 2. ماذا لو Zoom API فشل؟

- الـ meeting **هيتعمل في قاعدة البيانات** عادي
- Zoom meeting **مش هيتعمل**
- الـ error **هيتسجل في logs**
- الـ API **هيرجع الـ meeting بدون Zoom data**

### 3. حذف Meeting

- لما تحذف meeting (`DELETE /meetings/:id`):
  - الـ meeting **هيتحذف من قاعدة البيانات**
  - Zoom meeting **هيتحذف من Zoom تلقائياً**
  - لو حذف Zoom فشل، الـ meeting **هيتحذف من قاعدة البيانات** برضو (error logged)

### 4. تحديث Meeting Status

- لو غيرت status من `DRAFT` لـ `SCHEDULED`:
  - Zoom meeting **هيتعمل تلقائياً**
  - (ممكن تضيف logic في `update()` method عشان تعمل Zoom meeting لو status اتغير)

---

## 🎯 Checklist - قائمة التحقق

- [ ] أنشأت Zoom App في Marketplace
- [ ] نسخت Client ID, Client Secret, Account ID
- [ ] أضفت Zoom credentials في `.env`
- [ ] ثبتت `jsonwebtoken` (لو محتاج)
- [ ] شغلت `prisma db push` أو `prisma migrate`
- [ ] شغلت `prisma generate`
- [ ] أعدت تشغيل الخادم
- [ ] جربت إنشاء meeting بـ `status: "SCHEDULED"`
- [ ] شفت Zoom data في الـ response
- [ ] جربت الـ Zoom link

---

## 📚 مراجع

- [Zoom Marketplace](https://marketplace.zoom.us/)
- [Zoom API Documentation](https://marketplace.zoom.us/docs/api-reference/zoom-api/)
- [Server-to-Server OAuth Guide](https://marketplace.zoom.us/docs/guides/build/server-to-server-oauth-app/)

---

## 💡 نصائح

1. **للـ Production:** استخدم Account-level OAuth (مع `ZOOM_ACCOUNT_ID`)
2. **للـ Development:** ممكن تستخدم JWT App (بدون `ZOOM_ACCOUNT_ID`)
3. **Testing:** لو مش عاوز Zoom، اترك Zoom credentials فاضية — الـ service هيكمل عادي
4. **Security:** **مش تشارك** Zoom credentials في Git — استخدم `.env` وضيفه في `.gitignore`
