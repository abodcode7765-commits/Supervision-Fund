# وثيقة التسليم والربط البرمجي للخادم — صندوق الإشراف (ذوي محسن)

**الغرض من الوثيقة:** تمثل هذه الوثيقة المرجع الهندسي المعتمد لربط واجهة النظام الأمامية (`React + TypeScript + Vite`) بخدمات الخادم (`Backend API`) وقاعدة البيانات، مع تطابق تام مع العقود البرمجية المعرفة في `src/services/contracts.ts` ونماذج البيانات في `src/types/index.ts`.

---

## 1. الحالة الراهنة للواجهة الأمامية (Frontend Architecture)

- **الحالة الحالية:** الواجهة تعمل كنظام أمامي متكامل (`Frontend-only SPA`) بإدارة حالة محلية (`In-Memory State`) وبيانات تأسيسية متسقة رياضياً في `src/data/mockData.ts`.
- **طبقة العقود:** جميع الواجهات والـ DTOs اللازمة لاستبدال الـ Mock State بنداءات API حقيقية معرّفة في `src/services/contracts.ts`.
- **تنبيه مهم للمصادقة التجريبية:** دالة `authenticateMockUser` في `src/services/contracts.ts` (وكلمة المرور التجريبية `ishraf2026` وميزة تغيير كلمة المرور في `SettingsPage.tsx`) مخصصة للمعاينة فقط، ويجب استبدالها بالكامل عند ربط الخادم بنظام مصادقة حقيقي (`POST /api/auth/login`, `POST /api/auth/change-password`).

---

## 2. الكيانات والعلاقات المقترحة في قاعدة البيانات (Database Schema)

### 2.1 الكيانات الأساسية
1. **`system_users`**
   - `id` (UUID PK), `name`, `username` (UNIQUE), `password_hash` (bcrypt/argon2id), `role` (`مدير الصندوق` | `رئيس المجموعة` | `مسؤول القطات`), `group_id` (FK nullable -> `groups.id`), `permissions` (JSONB array of `PageId`), `status` (`نشط` | `معطل`), `created_at`.
2. **`groups`**
   - `id` (UUID PK), `name` (UNIQUE), `leader_member_id` (FK -> `members.id`), `leader_user_id` (FK nullable -> `system_users.id`), `description`, `created_at`.
3. **`members`**
   - `id` (UUID PK), `serial` (INT UNIQUE), `name`, `national_id` (VARCHAR(20) UNIQUE), `birth_date` (DATE), `group_id` (FK -> `groups.id`), `join_date` (DATE), `member_status` (`نشط` | `موقوف`), `phone` (nullable).
   - **قاعدة الأرشفة:** لا يُحذف العضو حذفاً فيزيائياً (`HARD DELETE`) حفاظاً على السجلات المالية والتقارير التاريخية؛ يُستخدم `member_status = 'موقوف'`.
4. **`year_configs`**
   - `year` (INT PK — يدعم الهجري والميلادي مثل `1447`, `1448`, `2025`, `2026`), `founding_fee_halalas` (BIGINT >= 0), `monthly_fee_halalas` (BIGINT > 0), `months_count` (INT DEFAULT 12).
   - **عزل السنوات:** تعديل رسوم سنة معينة يطبّق على سجلات تلك السنة فقط ولا يمس سجلات السنوات السابقة.
5. **`member_year_subscriptions`**
   - `id` (UUID PK), `member_id` (FK -> `members.id`), `year` (INT FK -> `year_configs.year`), `founding_paid_halalas` (BIGINT DEFAULT 0), `month_paid_halalas` (BIGINT[12] أو جدول فرعي من 12 صفاً).
   - قيد فريد: `UNIQUE (member_id, year)`.
6. **`payments`**
   - `id` (UUID PK), `member_id` (FK -> `members.id`), `group_id` (FK -> `groups.id`), `year` (INT FK -> `year_configs.year`), `months_label`, `allocated_to_founding_halalas` (BIGINT nullable), `allocated_month_indices` (INT[] nullable), `due_halalas_snapshot` (BIGINT), `amount_halalas` (BIGINT > 0), `remaining_halalas_snapshot` (BIGINT), `payment_method` (`تحويل بنكي` | `نقدي` | `شيك`), `paid_at` (DATE), `status` (`مكتمل` | `مدفوع جزئياً`), `notes`, `recorded_by_user_id` (FK -> `system_users.id`), `created_at`.
7. **`expenses`**
   - `id` (UUID PK), `operation_number` (VARCHAR UNIQUE, مثال `EXP-2026-0042`), `year` (INT), `title`, `reason`, `category`, `amount_halalas` (BIGINT > 0), `balance_before_halalas` (BIGINT), `balance_after_halalas` (BIGINT), `expense_date` (DATE), `recorded_by_user_id` (FK -> `system_users.id`), `notes`, `created_at`.
8. **`qittat`** و **`qitta_participants`**
   - `qittat`: `id` (UUID PK), `name`, `reason`, `description`, `created_at` (DATE), `total_amount_halalas` (BIGINT > 0), `distribution_mode` (`equal` | `custom`), `status` (`جديدة` | `قيد التحصيل` | `مكتملة`), `created_by_user_id`.
   - `qitta_participants`: `id` (UUID PK), `qitta_id` (FK -> `qittat.id`), `member_id` (FK -> `members.id`), `share_amount_halalas` (BIGINT >= 0), `paid_amount_halalas` (BIGINT >= 0), `status` (`لم يدفع` | `دفع جزئياً` | `سدد كامل المبلغ`).
   - قيد فريد: `UNIQUE (qitta_id, member_id)`.
9. **`marriage_aids`**
   - `id` (UUID PK), `member_id` (FK -> `members.id`), `amount_halalas` (BIGINT > 0), `due_date` (DATE), `disbursement_date` (DATE nullable), `status` (`مستحقة` | `تم الصرف` | `قيد الانتظار`), `notes`, `approved_by_user_id`.
10. **`fund_settings`**
    - صف إعدادات وحيد (`id = 1`) يضم `fund_name`, `sub_name`, `currency`, `city`, `notify_on_payment`, `notify_on_overdue`, `notify_on_marriage_aid`, `monthly_reminder_day`, `compact_tables`.
11. **`audit_logs`** (إلزامي في الخادم)
    - يسجل `actor_user_id`, `action`, `entity_type`, `entity_id`, `before_json`, `after_json`, `ip_address`, `created_at` لأي تعديل مالي أو تغيير صلاحيات.

---

## 3. عقود الـ REST API المطابقة لـ `src/services/contracts.ts`

جميع المبالغ في الـ JSON المتبادل مع الواجهة يمكن تمريرها كأرقام بالريال (مع تقريب هللتين كحد أقصى) وتخزينها في قاعدة البيانات بالهللة (`BIGINT`).

| الخدمة (`Contract`) | المسار المقترح | الميثود | الملاحظات / DTO |
|---|---|---|---|
| `AuthServiceContract` | `/api/auth/login` | `POST` | `LoginCredentialsDTO` -> `AuthSessionDTO` (`HttpOnly` cookie أو Bearer Token) |
| `AuthServiceContract` | `/api/auth/logout` | `POST` | إبطال الجلسة / Refresh Token |
| `AuthServiceContract` | `/api/auth/me` | `GET` | يرجع `SystemUser` المصادق من الجلسة الحالية |
| `AuthServiceContract` | `/api/auth/change-password` | `POST` | `ChangePasswordDTO` (التحقق من `currentPassword` قبل التحديث) |
| `MembersServiceContract` | `/api/members` | `GET` | يدعم `?groupId=&search=&status=` (يعزل تلقائياً لرئيس المجموعة) |
| `MembersServiceContract` | `/api/members` | `POST` | `CreateMemberDTO` -> يتحقق من عدم تكرار `nationalId` + ينشئ سجل اشتراك غير مسدد للسنة النشطة |
| `MembersServiceContract` | `/api/members/:id` | `PATCH` | `UpdateMemberDTO` |
| `MembersServiceContract` | `/api/members/:id/toggle-archive` | `POST` | يبدّل `نشط` <-> `موقوف` دون حذف السجلات المالية |
| `GroupsServiceContract` | `/api/groups` | `GET` / `POST` / `PATCH` | إدارة المجموعات وتعيين `leaderId` و`leaderUserId` |
| `SubscriptionsServiceContract` | `/api/years` | `GET` / `POST` / `PATCH` | `YearConfig` (هجري وميلادي، `monthsCount = 12`) |
| `SubscriptionsServiceContract` | `/api/subscriptions` | `GET` / `PATCH` | يرجع مصفوفة الـ 12 شهراً ومبالغها بالهللة |
| `PaymentsServiceContract` | `/api/payments` | `GET` / `POST` / `PATCH` | `CreatePaymentDTO` / `UpdatePaymentDTO` داخل **Database Transaction** + منع التجاوز |
| `OverdueServiceContract` | `/api/overdue` | `GET` | يرجع المتأخرات لكل `(عضو, سنة)` عبر كل السنوات التي فيها متبقي > 0 |
| `ExpensesServiceContract` | `/api/expenses` | `GET` / `POST` / `PATCH` | يعيد احتساب `balanceBefore`/`balanceAfter` تسلسلياً زمنياً |
| `QittatServiceContract` | `/api/qittat` | `GET` / `POST` | `CreateQittaDTO` مع التحقق أن مجموع الأنصبة يساوي `totalAmount` بالهللة |
| `QittatServiceContract` | `/api/qittat/:id/pay` | `POST` | `{ memberId, amount }` داخل Transaction |
| `MarriageAidServiceContract` | `/api/marriage-aids` | `GET` / `POST` | سجل معونات الزواج |
| `MarriageAidServiceContract` | `/api/marriage-aids/:id/disburse` | `POST` | يغيّر الحالة إلى `تم الصرف` ويثبت `disbursementDate` |
| `ReportsServiceContract` | `/api/reports/generate` | `POST` | `ReportFilterDTO` (للبيانات المجمعة من الخادم) |
| `UsersServiceContract` | `/api/users` | `GET` / `POST` / `PATCH` | إنشاء/تعديل/تعطيل المستخدمين وتطبيق قاعدة مسؤول القطات الوحيد |
| `SettingsServiceContract` | `/api/settings` | `GET` / `PUT` | `FundSettings` |

---

## 4. المعادلات المحاسبية الدقيقة (Business Logic & Arithmetic)

> المرجع البرمجي الفعلي في الواجهة: `src/utils/formatters.ts`

1. **وحدة الحساب الدقيقة (Halala Integer Math):**
   - تُحوَّل كل القيم المالية إلى هللات صحيحة: `halalas = Math.round(amountSar * 100)`.
   - تُمنع الأخطاء العشرية (`Floating-point drift`) عند الجمع والطرح والتقسيم.
2. **معادلة الاشتراك السنوي (12 شهراً + التأسيس):**
   - `totalDue = foundingFee + (monthlyFee * monthsCount)` حيث `monthsCount = 12`.
   - مثال فعلي: إذا كان التأسيس `100` والاشتراك الشهري `20` لسنة `1447`، فإن المستحق السنوي للعضو = `100 + (20 × 12) = 340 ر.س`.
   - لـ 20 عضواً: `20 × 340 = 6,800 ر.س`.
   - المدفوع يحسب من `foundingPaidAmount + sum(monthPaidAmounts[0..11])` وليس من عدّ الخانات فقط (لدعم السداد الجزئي الدقيق).
3. **معادلة المتأخرات التراكمية:**
   - تُحسب المتأخرات على مستوى كل سجل `(memberId, year)` وليس للعضو كصف وحيد مدموج، بحيث تظهر متأخرات سنة `1447` جنباً إلى جنب مع متأخرات `1448` أو أي سنة أخرى، ولا تضيع متأخرات السنوات السابقة عند إضافة سنة مالية جديدة.
4. **توزيع القطة المتساوي بدون كسور مفقودة (`distributeAmountExactly`):**
   - يتم توزيع `totalHalalas` على `N` مشاركين:
     - `base = Math.floor(totalHalalas / N)`
     - `remainder = totalHalalas % N`
     - يحصل أول `remainder` مشاركين على `base + 1` هللة، والبقية على `base` هللة.
   - النتيجة مضمونة 100%: `sum(shares) === totalHalalas` دائماً (مثل `1000 / 7` تعطي `142.86` لـ 5 مشاركين و`142.85` لمشاركين = `1000.00` بالضبط).
5. **الرصيد التراكمي للمصروفات (`recalculateExpensesRunningBalance`):**
   - `totalRevenue = sum(payments.amount)` (جميع المدفوعات المسجلة فعلياً، دون أي أرقام ابتدائية ثابتة).
   - عند إضافة أو تعديل مصروف أو دفعة سداد، تُرتب المصروفات زمنياً من الأقدم للأحدث ويُعاد احتساب `balanceBefore` و`balanceAfter` بالترتيب.

---

## 5. مصفوفة الصلاحيات والعزل الأمني (RBAC Matrix)

يجب تطبيق التحقق من الصلاحيات على **مستوى الخادم (Server-Side Middleware)** في كل طلب، وليس في الواجهة فقط:

| الدور | الصفحات الافتراضية | نطاق البيانات المسموح | صلاحية التعديل المالي |
|---|---|---|---|
| `مدير الصندوق` | كافة الـ 12 صفحة | جميع المجموعات والأعضاء والمصروفات والإعدادات | كاملة (قراءة + إضافة + تعديل + أرشفة) |
| `رئيس المجموعة` | `dashboard`, `members`, `groups`, `subscriptions`, `overdue`, `reports` | **أعضاء مجموعته (`user.groupId`) فقط**؛ ممنوع الوصول لبيانات المجموعات الأخرى أو مصروفات الصندوق العامة أو الرصيد العام | قراءة/مشاهدة فقط (`Read-Only`) |
| `مسؤول القطات` | `qittat` فقط | قسم القطات فقط دون الوصول لبقية أقسام الصندوق أو الإعدادات | إدارة القطات وتسجيل دفعات المشاركين |

- **قيد مسؤول القطات:** النظام يسمح بمستخدم نشط واحد غير مدير يحمل صلاحية `qittat` في وقت واحد؛ عند تعيين مستخدم جديد تُسحب صلاحية `qittat` تلقائياً من غير المدير السابق مع سجل تدقيق (`Audit Log`).

---

## 6. متطلبات الأمان في الخادم (Production Security Requirements)

1. **تشفير كلمات المرور:** استخدام `Argon2id` أو `bcrypt` (`cost >= 12`). يُمنع تخزين أو تمرير كلمات المرور كنص صريح.
2. **الجلسات والرموز:** JWT قصير العمر مع Refresh Token في `HttpOnly; Secure; SameSite=Strict` Cookie.
3. **منع التكرار (Idempotency):** دعم ترويسة `Idempotency-Key` في طلبات `POST /api/payments` و`POST /api/expenses` و`POST /api/qittat/:id/pay` لمنع تسجيل الدفع مرتين عند النقر المزدوج أو بطء الشبكة.
4. **Transactions & Locking:** استخدام `SELECT ... FOR UPDATE` على صف `member_year_subscriptions` أو `qitta_participants` أثناء تسجيل أو تعديل السداد لضمان عدم تجاوز المستحق عند الطلبات المتزامنة.

---

## 7. تقارير Excel و PDF

- **الحالي في الواجهة (`src/utils/exportReports.ts`):**
  - **Excel (`.xlsx`):** مبني بمكتبة `xlsx` مع تفعيل اتجاه الورقة من اليمين لليسار (`RTL: true`, `rightToLeft: true`) وعرض أعمدة متناسب وتضمين صفوف التلخيص والبيانات المطابقة للفلتر النشط لحظياً.
  - **PDF (`.pdf`):** مبني بمكتبتي `html2canvas-pro` + `jspdf` لدعم الخط العربي وRTL وتقسيم الصفحات A4 تلقائياً دون تعارض مع ألوان `oklch` في Tailwind CSS v4.
- **في الخادم مستقبلاً:** يُنصح لاحقاً بإضافة `GET /api/reports/export?format=xlsx|pdf` لتقارير تزيد عن عدة آلاف من الصفوف مع الحفاظ على التصدير الفوري في الواجهة للكشوفات السريعة.

---

## 8. قرارات تنظيمية ومالية معلقة من مالك الصندوق (لم تُخترع افتراضياً)

النقاط التالية تم عزلها وتوثيقها لتتخذ الإدارة قراراً نهائياً بشأنها قبل برمجة قواعدها الصارمة في الخادم:

1. **معونة الزواج — التكرار:** هل يحق للعضو الحصول على معونة الزواج **مرة واحدة فقط** طوال عضويته أم يمكن تسجيلها أكثر من مرة (مثلاً في حالات خاصة)؟ (حالياً يسمح السجل بالتسجيل مع التنبيه دون قيد صارم).
2. **معونة الزواج — الأثر على الرصيد العام:** هل تُخصم معونة الزواج المصروفة تلقائياً من رصيد الصندوق العام للاشتراكات، أم لها وعاء/ميزانية منفصلة وتُسجل يدوياً عند الحاجة في المصروفات؟ (حالياً مستقلة في سجلها الخاص وموضحة بلافتة في الواجهة).
3. **الدفعات الزائدة عن المستحق السنوي (Overpayment):** عند دفع عضو مبلغاً يتجاوز المتبقي عليه للسنة، هل يُمنع السداد نهائياً (السلوك الحالي الصارم في الواجهة)، أم يُرحَّل الفائض كـ **رصيد دائن / مقدم للسنة التالية**؟
4. **تسجيل مصروف أكبر من رصيد الصندوق:** هل يُسمح بتسجيل المصروف مع تحذير وظهور الرصيد بالسالب (السلوك الحالي مع تنبيه واضح)، أم يُمنع الصرف إذا كان `amount > currentFundBalance`؟
5. **المشاركون في القطات:** هل يُسمح بمشاركة أشخاص من خارج قائمة أعضاء الصندوق المسجلين في القطة مستقبلاً (Guest Participant)، أم تقتصر القطات على أعضاء الصندوق فقط (السلوك الحالي)؟

---

## 9. دليل ربط الصفحات عند توفر الخادم (Step-by-Step Integration Guide)

1. إنشاء طبقة تنفيذية في `src/services/api/` تطبّق كافة واجهات `src/services/contracts.ts` باستخدام `fetch` أو `axios` مع إرسال `Authorization` و`Idempotency-Key`.
2. استبدال الحالة الابتدائية `INITIAL_*` في `src/App.tsx` بدوال تحميل من الـ API عبر `useEffect` / `React Query` عند نجاح المصادقة.
3. استبدال `authenticateMockUser` في `src/components/auth/LoginPage.tsx` باستدعاء `authService.login(credentials)`.
4. ربط نموذج تغيير كلمة المرور في `src/pages/SettingsPage.tsx` باستدعاء `authService.changePassword(dto)`.
5. تفعيل إعادة التحقق من الصلاحيات عند بدء تشغيل التطبيق عبر `GET /api/auth/me` وإزالة أي كلمة مرور تجريبية من الواجهة نهائياً.
