# ระบบคอร์สออนไลน์ (Online Course) — Term Project Template

เทมเพลตนี้ทำส่วนหน้าเว็บ (frontend) และ API ให้แล้ว
งานของนิสิตคือ **ออกแบบฐานข้อมูล และเขียน SQL** ใน `db.py` กับ `schema.sql`

## เริ่มต้น
1. `pip install -r requirements.txt`
2. แก้ `config.py` ใส่ user/password/host ของ MySQL ที่อาจารย์แจกให้
3. ออกแบบและสร้างตารางใน `schema.sql` แล้วรันบน MySQL ของตัวเอง
4. `python app.py` → เปิด http://127.0.0.1:5000

> เปิดมาจะเห็นหน้าเว็บ แต่กดค้นหาจะขึ้น 🚧 TODO จนกว่าจะเขียน SQL ครบ

## งานที่ต้องทำใน db.py (มองหา # TODO)
**CRUD:**
  - search_learners, get/create/update/delete_learner
  - search_courses, get/create/update/delete_course
  - search_enrollments, get/create/update/delete_enrollment

**รายงาน (JOIN + GROUP BY + subquery):**
  - report_summary — ตัวเลขสรุป dashboard
  - report_popular_courses — 📈 คอร์สยอดนิยม (Most Enrolled)
  - report_completion_rate — ✅ อัตราการเรียนจบต่อคอร์ส (Completion Rate)
  - report_course_prerequisites — 🔗 คอร์สและวิชาที่ต้องเรียนก่อน (Self-Join)

## กติกา
- ใช้ `%s` เป็น placeholder เสมอ (กัน SQL injection)
- query ที่ join หลายตารางเขียนแบบ explicit INNER JOIN ... ON ...
- ชื่อตาราง/คอลัมน์ใน db.py ต้องตรงกับ schema.sql
"# course_system" 
