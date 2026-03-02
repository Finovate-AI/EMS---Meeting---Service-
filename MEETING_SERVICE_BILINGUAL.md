# Meeting Service — شرح الخدمة

## English ← → العربية (left to right)

---

### Overview — نظرة عامة

| English | العربية |
|---------|---------|
| This service manages meetings. | الخدمة تدير الاجتماعات. |
| You create meetings, add participants, and they can accept or decline. | تنشئ اجتماعات، تضيف مشاركين، والمشارك يقدر يقبل أو يرفض. |
| All API calls need the header **x-secret-key** (unless DISABLE_AUTH=true). | كل استدعاءات الـ API تحتاج هيدر **x-secret-key** (إلا لو DISABLE_AUTH=true). |

---

### Main concepts — المفاهيم الأساسية

| English | العربية |
|---------|---------|
| **Meeting** — A scheduled event (title, time, status). | **الاجتماع** — حدث مجدول (عنوان، وقت، حالة). |
| **Organizer** — Can update, cancel, add/remove participants. | **المنظم** — يقدر يعدّل، يلغي، يضيف/يزيل مشاركين. |
| **Participant** — Invited to the meeting; can set response: Accepted / Declined / Tentative. | **المشارك** — مدعو للاجتماع؛ يقدر يحدد الرد: مقبول / مرفوض / مؤقت. |
| **Status** — DRAFT, SCHEDULED, or CANCELLED. | **الحالة** — مسودة، مجدول، أو ملغى. |

---

### Endpoints — نقاط النهاية

| English | العربية |
|---------|---------|
| **POST /meetings** — Create a new meeting. | **POST /meetings** — إنشاء اجتماع جديد. |
| **GET /meetings** — List my meetings. Optional: ?status=DRAFT or SCHEDULED or CANCELLED. | **GET /meetings** — قائمة اجتماعاتي. اختياري: ?status=DRAFT أو SCHEDULED أو CANCELLED. |
| **GET /meetings/:id** — Get one meeting with all details. | **GET /meetings/:id** — جلب اجتماع واحد بكل التفاصيل. |
| **PATCH /meetings/:id** — Update meeting (organizers only). | **PATCH /meetings/:id** — تحديث الاجتماع (المنظمون فقط). |
| **DELETE /meetings/:id** — Delete meeting (organizers only). | **DELETE /meetings/:id** — حذف الاجتماع (المنظمون فقط). |
| **POST /meetings/:id/cancel** — Cancel meeting (organizers only). | **POST /meetings/:id/cancel** — إلغاء الاجتماع (المنظمون فقط). |
| **POST /meetings/:id/participants** — Add a participant (organizers only). Body: `{ "userId": "..." }`. | **POST /meetings/:id/participants** — إضافة مشارك (المنظمون فقط). Body: `{ "userId": "..." }`. |
| **GET /meetings/:id/participants** — Get list of participants. | **GET /meetings/:id/participants** — جلب قائمة المشاركين. |
| **PATCH /meetings/:id/participants/:participantId** — Participant updates their response. Body: `{ "response": "ACCEPTED" }` or `"DECLINED"` or `"TENTATIVE"`. | **PATCH /meetings/:id/participants/:participantId** — المشارك يحدّث رده. Body: `{ "response": "ACCEPTED" }` أو `"DECLINED"` أو `"TENTATIVE"`. |
| **DELETE /meetings/:id/participants/:participantId** — Remove participant (organizers only). | **DELETE /meetings/:id/participants/:participantId** — إزالة مشارك (المنظمون فقط). |

---

### Where does the participant set ACCEPTED / DECLINED / TENTATIVE? — المشارك يكتب ACCEPTED / DECLINED / TENTATIVE فين؟

| English | العربية |
|---------|---------|
| The participant sends a **PATCH** request. | المشارك يبعث طلب **PATCH**. |
| URL: **PATCH /meetings/{meetingId}/participants/{participantId}** | الرابط: **PATCH /meetings/{meetingId}/participants/{participantId}** |
| Request body (JSON): `{ "response": "ACCEPTED" }` or `"DECLINED"` or `"TENTATIVE"`. | جسم الطلب (JSON): `{ "response": "ACCEPTED" }` أو `"DECLINED"` أو `"TENTATIVE"`. |
| They get **participantId** from **GET /meetings/:id** or **GET /meetings/:id/participants** (find the row where userId = me). | بياخد **participantId** من **GET /meetings/:id** أو **GET /meetings/:id/participants** (السطر اللي فيه userId = أنا). |
| Only that participant can change their own response. | المشارك نفسه فقط يقدر يغيّر رده. |

---

### Example flow — مثال على التدفق

| English | العربية |
|---------|---------|
| 1. Organizer creates meeting: **POST /meetings** with title, startTime, endTime. | 1. المنظم ينشئ الاجتماع: **POST /meetings** بعنوان، وقت البداية، وقت النهاية. |
| 2. Organizer adds participant: **POST /meetings/:id/participants** with `{ "userId": "user-123" }`. | 2. المنظم يضيف مشارك: **POST /meetings/:id/participants** مع `{ "userId": "user-123" }`. |
| 3. Participant sees meeting (e.g. in app), opens it, gets participantId from GET meeting or GET participants. | 3. المشارك يشوف الاجتماع (مثلاً في التطبيق)، يفتحه، ويجيب participantId من GET meeting أو GET participants. |
| 4. Participant responds: **PATCH /meetings/:id/participants/:participantId** with `{ "response": "ACCEPTED" }`. | 4. المشارك يرد: **PATCH /meetings/:id/participants/:participantId** مع `{ "response": "ACCEPTED" }`. |
| 5. Next time you **GET** the meeting or participants, that participant’s **response** is "ACCEPTED". | 5. أول ما تعمل **GET** للاجتماع أو المشاركين، حقل **response** للمشارك ده هيكون "ACCEPTED". |

---

### Summary — ملخص

| English | العربية |
|---------|---------|
| Add participant = add them to the meeting list (POST). | إضافة مشارك = إضافتهم لقائمة الاجتماع (POST). |
| Respond to invitation = participant sends PATCH with **response** (ACCEPTED / DECLINED / TENTATIVE) in the **body**. | الرد على الدعوة = المشارك يبعث PATCH والـ **response** (ACCEPTED / DECLINED / TENTATIVE) في **body** الطلب. |
