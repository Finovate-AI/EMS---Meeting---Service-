# إعداد Zoom Credentials - خطوة بخطوة

## ✅ الـ Credentials اللي عندك

من الصور اللي أرسلتها:

- **Account ID:** `BgP77K62QRaCjaqcwg1wMA`
- **Client ID:** `2fGIOK4MQIqwCSLXz0W0g`
- **Client Secret:** `0jV9E5ilojNuaKE33uuUtCAklsyQdau2n`
- **Secret Token:** `AK7gdX2ERUOoBXNmwDuk8A` (هذا للـ webhooks - مش محتاجينه دلوقتي)

---

## 📝 الخطوات

### 1. تم إضافة الـ Credentials في `.env`

تم إضافة التالي في ملف `.env`:

```env
ZOOM_API_KEY="2fGIOK4MQIqwCSLXz0W0g"
ZOOM_API_SECRET="0jV9E5ilojNuaKE33uuUtCAklsyQdau2n"
ZOOM_ACCOUNT_ID="BgP77K62QRaCjaqcwg1wMA"
ZOOM_USER_ID="me"
```

**ملاحظة:** 
- `ZOOM_API_KEY` = Client ID
- `ZOOM_API_SECRET` = Client Secret
- `ZOOM_ACCOUNT_ID` = Account ID
- `ZOOM_USER_ID` = `"me"` (يعني account owner)

---

### 2. تحديث قاعدة البيانات

شغّل الأمر ده عشان تضيف حقول Zoom:

```bash
npx prisma db push
```

أو:

```bash
npm run prisma:migrate
```

بعد كده:

```bash
npm run prisma:generate
```

---

### 3. إعادة تشغيل الخادم

```bash
npm run start:dev
```

الخادم هيقرأ الـ Zoom credentials من `.env` تلقائياً.

---

### 4. اختبار Zoom Integration

**أنشئ meeting بـ status SCHEDULED:**

```http
POST http://localhost:3000/meetings
Headers:
  x-secret-key: your-secret-key
Content-Type: application/json

{
  "title": "Test Zoom Meeting",
  "startTime": "2026-02-20T10:00:00.000Z",
  "endTime": "2026-02-20T11:00:00.000Z",
  "status": "SCHEDULED"
}
```

**الـ Response هيكون فيه:**

```json
{
  "id": "...",
  "title": "Test Zoom Meeting",
  "status": "SCHEDULED",
  "zoomMeetingId": "123456789",
  "zoomJoinUrl": "https://zoom.us/j/123456789",
  "zoomStartUrl": "https://zoom.us/s/123456789?zak=...",
  "zoomPassword": "123456",
  ...
}
```

---

## 🔍 التحقق من نجاح الإعداد

### في الـ Logs:

لو كل حاجة تمام، هتشوف في terminal:

```
[MeetingsService] Zoom meeting created for meeting {id}: {zoom-id}
```

لو في مشكلة:

```
[ZoomService] Failed to get Zoom access token: ...
```

أو:

```
[MeetingsService] Failed to create Zoom meeting for {id}: ...
```

---

## ⚠️ ملاحظات مهمة

1. **Secret Token (`AK7gdX2ERUOoBXNmwDuk8A`):**
   - هذا **للـ webhooks** (لو عاوز تستقبل events من Zoom)
   - **مش محتاجينه** للـ basic integration (إنشاء meetings)
   - ممكن تضيفه بعدين لو محتاج webhooks

2. **Security:**
   - **مش تشارك** الـ `.env` في Git
   - الـ credentials دي **سرية** — احفظها في مكان آمن

3. **Testing:**
   - لو Zoom credentials **فاضية** → الـ service هيكمل عادي (بدون Zoom)
   - لو Zoom API **فشل** → الـ meeting هيتعمل في قاعدة البيانات برضو (بدون Zoom data)

---

## ✅ Checklist

- [x] تم إضافة Zoom credentials في `.env`
- [ ] شغلت `prisma db push` أو `prisma migrate`
- [ ] شغلت `prisma generate`
- [ ] أعدت تشغيل الخادم
- [ ] جربت إنشاء meeting بـ `status: "SCHEDULED"`
- [ ] شفت Zoom data في الـ response

---

## 🎯 الخطوة التالية

بعد ما تخلص الخطوات دي:

1. شغّل `prisma db push` عشان تحدث قاعدة البيانات
2. أعد تشغيل الخادم
3. جرب إنشاء meeting بـ `status: "SCHEDULED"`
4. شوف الـ logs و الـ response

لو في أي مشكلة، شوف الـ logs في terminal — هتقولك إيه المشكلة بالظبط.
