# NEXORA — Database Schema

> IndexedDB + localStorage dual-persistence layer.
> Version: `DB_VER = 1`

---

## Tables Overview

| # | Store Name | Purpose | Tier |
|---|-----------|---------|------|
| 1 | `companies` | شركات المقاولات | T2 |
| 2 | `employees` | الموظفون والعمال | T1+T2 |
| 3 | `projects` | المشاريع الإنشائية | T1+T2 |
| 4 | `items` | بنود ومراحل المشاريع | T1+T2 |
| 5 | `tasks` | المهام الفرعية | T1+T2 |
| 6 | `assignments` | تعيينات المهام | T1+T2 |
| 7 | `dailylogs` | السجلات اليومية | T1+T2 |
| 8 | `approvals` | طلبات الاعتماد | T1+T2 |
| 9 | `costs` | التكاليف والمصروفات | T1+T2 |
| 10 | `processes` | حالة عمليات PMBOK | T1+T2 |
| 11 | `process_logs` | سجل تغييرات العمليات | T1+T2 |

---

## 1. companies

```json
{
  "id":          "Number (auto-increment)",
  "name":        "String — اسم الشركة",
  "type":        "String — 'main' | 'sub'",
  "phone":       "String — رقم الهاتف",
  "email":       "String — البريد الإلكتروني",
  "address":     "String — العنوان",
  "created_at":  "String — ISO datetime"
}
```

---

## 2. employees

```json
{
  "id":          "Number (auto-increment)",
  "full_name":   "String — الاسم الكامل",
  "role":        "String — 'admin' | 'engineer' | 'accountant' | 'owner' | 'worker'",
  "phone":       "String — رقم الهاتف",
  "email":       "String — البريد الإلكتروني",
  "company_id":  "Number — FK → companies.id",
  "daily_wage":  "Number — الأجر اليومي (Tier 1)",
  "active":      "Boolean — هل الموظف نشط",
  "created_at":  "String — ISO datetime"
}
```

---

## 3. projects

```json
{
  "id":            "Number (auto-increment)",
  "name":          "String — اسم المشروع",
  "description":   "String — وصف المشروع",
  "client":        "String — اسم العميل",
  "start_date":    "String — تاريخ البداية",
  "end_date":      "String — تاريخ النهاية المتوقع",
  "budget":        "Number — الميزانية الإجمالية",
  "spent":         "Number — المبلغ المنفق",
  "progress":      "Number — نسبة الإنجاز (0-100)",
  "status":        "String — 'planning' | 'active' | 'on_hold' | 'completed'",
  "priority":      "String — 'low' | 'medium' | 'high' | 'critical'",
  "location":      "String — موقع المشروع",
  "company_id":    "Number — FK → companies.id",
  "created_at":    "String — ISO datetime"
}
```

---

## 4. items (بنود المشروع / مراحل)

```json
{
  "id":            "Number (auto-increment)",
  "project_id":    "Number — FK → projects.id",
  "name":          "String — اسم البند/المرحلة",
  "description":   "String — الوصف",
  "status":        "String — 'pending' | 'in_progress' | 'done'",
  "progress":      "Number — نسبة الإنجاز (0-100)",
  "start_date":    "String — تاريخ البداية",
  "end_date":      "String — تاريخ النهاية",
  "created_at":    "String — ISO datetime"
}
```

---

## 5. tasks (المهام الفرعية)

```json
{
  "id":            "Number (auto-increment)",
  "item_id":       "Number — FK → items.id",
  "project_id":    "Number — FK → projects.id",
  "title":         "String — عنوان المهمة",
  "description":   "String — الوصف",
  "status":        "String — 'todo' | 'in_progress' | 'done'",
  "priority":      "String — 'low' | 'medium' | 'high'",
  "assigned_to":   "Number — FK → employees.id (nullable)",
  "due_date":      "String — تاريخ الاستحقاق",
  "created_at":    "String — ISO datetime"
}
```

---

## 6. assignments (تعيينات المهام)

```json
{
  "id":            "Number (auto-increment)",
  "task_id":       "Number — FK → tasks.id",
  "employee_id":   "Number — FK → employees.id",
  "assigned_at":   "String — ISO datetime",
  "status":        "String — 'active' | 'completed'"
}
```

---

## 7. dailylogs (السجلات اليومية)

```json
{
  "id":            "Number (auto-increment)",
  "project_id":    "Number — FK → projects.id",
  "date":          "String — تاريخ السجل (YYYY-MM-DD)",
  "content":       "String — محتوى السجل اليومي",
  "weather":       "String — حالة الطقس",
  "workers_count": "Number — عدد العمال",
  "notes":         "String — ملاحظات إضافية",
  "created_by":    "Number — FK → employees.id",
  "created_at":    "String — ISO datetime"
}
```

---

## 8. approvals (طلبات الاعتماد)

```json
{
  "id":            "Number (auto-increment)",
  "project_id":    "Number — FK → projects.id",
  "type":          "String — 'task' | 'cost' | 'change' | 'procurement'",
  "title":         "String — عنوان الطلب",
  "description":   "String — وصف الطلب",
  "status":        "String — 'pending' | 'approved' | 'rejected'",
  "amount":        "Number — المبلغ (إن وجد)",
  "requested_by":  "Number — FK → employees.id",
  "reviewed_by":   "Number — FK → employees.id (nullable)",
  "reviewed_at":   "String — ISO datetime (nullable)",
  "created_at":    "String — ISO datetime"
}
```

---

## 9. costs (التكاليف)

```json
{
  "id":            "Number (auto-increment)",
  "project_id":    "Number — FK → projects.id",
  "category":      "String — 'materials' | 'labor' | 'equipment' | 'subcontract' | 'other'",
  "description":   "String — وصف التكلفة",
  "amount":        "Number — المبلغ",
  "date":          "String — تاريخ التكلفة",
  "receipt_no":    "String — رقم الإيصال (اختياري)",
  "created_by":    "Number — FK → employees.id",
  "created_at":    "String — ISO datetime"
}
```

---

## 10. processes (حالة عمليات PMBOK)

```json
{
  "id":            "Number (auto-increment)",
  "process_id":    "String — معرّف العملية (P1–P49)",
  "project_id":    "Number — FK → projects.id",
  "status":        "String — 'pending' | 'in_progress' | 'done'",
  "note":          "String — ملاحظات (اختياري)",
  "created_at":    "String — ISO datetime",
  "updated_at":    "String — ISO datetime"
}
```

### Unique constraint:
- (`process_id`, `project_id`) — حالة كل عملية لكل مشروع

---

## 11. process_logs (سجل تغييرات العمليات)

```json
{
  "id":            "Number (auto-increment)",
  "process_id":    "String — معرّف العملية (P1–P49)",
  "project_id":    "Number — FK → projects.id",
  "status":        "String — الحالة الجديدة",
  "note":          "String — ملاحظات التغيير",
  "changed_by":    "Number — FK → employees.id",
  "changed_at":    "String — ISO datetime"
}
```

---

## Relationships Diagram

```
companies (1) ──→ (N) employees
companies (1) ──→ (N) projects
projects  (1) ──→ (N) items
projects  (1) ──→ (N) tasks
projects  (1) ──→ (N) dailylogs
projects  (1) ──→ (N) approvals
projects  (1) ──→ (N) costs
projects  (1) ──→ (N) processes
projects  (1) ──→ (N) process_logs
items     (1) ──→ (N) tasks
tasks     (1) ──→ (N) assignments
employees (1) ──→ (N) assignments
employees (1) ──→ (N) process_logs (changed_by)
employees (1) ──→ (N) dailylogs (created_by)
employees (1) ──→ (N) approvals (requested_by / reviewed_by)
employees (1) ──→ (N) costs (created_by)
```

---

## PMBOK Process Matrix

### Tier 1 (Basic — Small Contractors): 21 process

| # | Process ID | Name | Group |
|---|-----------|------|-------|
| 1 | P5 | جمع المتطلبات | تخطيط |
| 2 | P6 | تحديد نطاق المشروع | تخطيط |
| 3 | P7 | إنشاء هيكل تفكيك العمل | تخطيط |
| 4 | P8 | وضع خطة إدارة الجدول الزمني | تخطيط |
| 5 | P9 | تحديد الأنشطة | تخطيط |
| 6 | P11 | تقدير مدة الأنشطة | تخطيط |
| 7 | P14 | تقدير التكاليف | تخطيط |
| 8 | P21 | تحديد المخاطر | تخطيط |
| 9 | P25 | وضع خطة إدارة المشتريات | تخطيط |
| 10 | P28 | إدارة المعرفة | تنفيذ |
| 11 | P29 | إدارة الجودة | تنفيذ |
| 12 | P30 | توظيف الموارد | تنفيذ |
| 13 | P31 | تطوير الفريق | تنفيذ |
| 14 | P32 | إدارة الفريق | تنفيذ |
| 15 | P35 | مراقبة الأداء | متابعة وتحكم |
| 16 | P36 | التحكم المتكامل في التغييرات | متابعة وتحكم |
| 17 | P37 | التحقق من النطاق | متابعة وتحكم |
| 18 | P38 | التحكم في النطاق | متابعة وتحكم |
| 19 | P41 | مراقبة الجودة | متابعة وتحكم |
| 20 | P45 | مراقبة تفاعل أصحاب المصلحة | متابعة وتحكم |
| 21 | P46 | تقرير أداء المشروع | متابعة وتحكم |

### Tier 2 (Enterprise — Full PMBOK): 49 processes

All 49 processes (P1–P49) covering:
- **بدء (Initiating):** P1–P2
- **تخطيط (Planning):** P3–P26 (24 عملية)
- **تنفيذ (Executing):** P27–P34 (8 عمليات)
- **متابعة وتحكم (M&C):** P35–P46 (12 عملية)
- **إغلاق (Closing):** P47–P49 (3 عمليات)
