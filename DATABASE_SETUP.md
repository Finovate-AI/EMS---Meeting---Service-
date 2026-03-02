# Database Setup Guide - MySQL

## إعداد قاعدة البيانات MySQL

### 1. التأكد من تشغيل MySQL

**Windows:**
- افتح Services (Win + R، اكتب `services.msc`)
- ابحث عن خدمة "MySQL"
- تأكد من أنها تعمل (الحالة يجب أن تكون "Running")

**أو تحقق عبر PowerShell:**
```powershell
Get-Service -Name "*mysql*"
```

### 2. التحقق من بيانات الاتصال

ملف `.env` يجب أن يحتوي على:
```
DATABASE_URL="mysql://root:password@localhost:3306/Meeting-db"
```

**تحقق من:**
- Username: `root` (أو اسم المستخدم الخاص بك)
- Password: `password` (أو كلمة المرور الفعلية)
- Database: `Meeting-db` (يجب أن تكون موجودة)
- Port: `3306` (المنفذ الافتراضي لـ MySQL)

### 3. إنشاء قاعدة البيانات

إذا لم تكن قاعدة البيانات موجودة، أنشئها:

**Option A: Using MySQL Workbench (GUI)**
1. افتح MySQL Workbench
2. اتصل بخادم MySQL الخاص بك
3. انقر بزر الماوس الأيمن على "Schemas" → "Create Schema"
4. اسم القاعدة: `Meeting-db`
5. انقر "Apply"

**Option B: Using MySQL Command Line**
اتصل بـ MySQL وشغّل:
```sql
CREATE DATABASE `Meeting-db`;
```

**Option C: Using PowerShell**
```powershell
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS \`Meeting-db\`;"
```

### 4. تشغيل Migrations

بعد التأكد من تشغيل MySQL وإنشاء قاعدة البيانات:
```bash
npm run prisma:migrate
```

أو استخدم `db push` للتطوير:
```bash
npx prisma db push
```

### 5. التحقق من الاتصال

اختبر الاتصال:
```bash
npx prisma studio
```

إذا فتح Prisma Studio، فالاتصال يعمل!

### المشاكل الشائعة:

1. **MySQL غير قيد التشغيل**: ابدأ خدمة MySQL
2. **كلمة مرور خاطئة**: حدّث `.env` بكلمة المرور الصحيحة
3. **قاعدة البيانات غير موجودة**: أنشئ قاعدة البيانات أولاً
4. **تعارض المنفذ**: تحقق من أن MySQL على المنفذ 3306
5. **جدار الحماية**: اسمح لـ MySQL من خلال Windows Firewall

### اختبار سريع للاتصال

يمكنك اختبار ما إذا كان MySQL يمكن الوصول إليه:
```powershell
Test-NetConnection -ComputerName localhost -Port 3306
```

إذا أظهر "TcpTestSucceeded: True"، فـ MySQL يعمل ويمكن الوصول إليه.

### ملاحظات MySQL:

- MySQL لا يدعم UUID() الافتراضي مثل PostgreSQL
- Prisma سينشئ UUIDs في طبقة التطبيق تلقائياً
- تأكد من استخدام `utf8mb4` كـ charset للدعم الكامل لـ Unicode
