# ============================================================
#  app.py — Flask REST API Server (ระบบคอร์สออนไลน์)
# ============================================================
#
#   [1] ตั้งค่าแอป และฟังก์ชันช่วยตอบ JSON   ok(), fail(), not_found()
#   [2] หน้าเว็บ (HTML)                      /  ,  /report
#   [3] API หน้า Home                        /api/home/courses
#   [4] API ผู้เรียน (learners)              /api/learners
#   [5] API คอร์ส (courses)                  /api/courses
#   [6] API บทเรียน (lessons)                /api/lessons
#   [7] API การลงทะเบียน (enrollments)       /api/enrollments
#   [8] API Progress ราย Enrollment          /api/enrollments/<id>/progress
#   [9] API รายงาน (reports)                 /api/reports/...
#   [10] รันเซิร์ฟเวอร์
#
# ============================================================
from flask import Flask, render_template, request, jsonify
import db


# ============================================================
# [1] ตั้งค่าแอป และฟังก์ชันช่วยตอบ JSON
# ============================================================
app = Flask(__name__)


def ok(data):
    """ตอบสำเร็จ: {"ok": True, "data": ...}"""
    return jsonify({"ok": True, "data": data})


def fail(message, status=400):
    """ตอบผิดพลาด: {"ok": False, "error": ...} พร้อมรหัส HTTP"""
    return jsonify({"ok": False, "error": str(message)}), status


def not_found():
    return fail("ไม่พบข้อมูล", 404)


# ============================================================
# [2] หน้าเว็บ (HTML)
# ============================================================

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/report')
def report_page():
    return render_template('report.html')


# ============================================================
# [3] API หน้า Home
# ============================================================

@app.route('/api/home/courses', methods=['GET'])
def api_home_courses():
    try:
        return ok(db.get_homepage_courses())
    except Exception as e:
        return fail(e)


# ============================================================
# [4] API ผู้เรียน (learners)
# ============================================================

@app.route('/api/learners', methods=['GET', 'POST'])
def api_learners():
    if request.method == 'GET':
        return ok(db.search_learners(request.args))
    try:
        return ok(db.create_learner(request.json))
    except Exception as e:
        return fail(e)


@app.route('/api/learners/<int:id>', methods=['GET', 'PUT', 'DELETE'])
def api_learner_item(id):
    if request.method == 'GET':
        item = db.get_learner(id)
        return ok(item) if item else not_found()
    elif request.method == 'PUT':
        try:
            return ok(db.update_learner(id, request.json))
        except Exception as e:
            return fail(e)
    elif request.method == 'DELETE':
        return ok(db.delete_learner(id))


# ============================================================
# [5] API คอร์ส (courses)
# ============================================================

@app.route('/api/courses', methods=['GET', 'POST'])
def api_courses():
    if request.method == 'GET':
        return ok(db.search_courses(request.args))
    try:
        return ok(db.create_course(request.json))
    except Exception as e:
        return fail(e)


@app.route('/api/courses/<int:id>', methods=['GET', 'PUT', 'DELETE'])
def api_course_item(id):
    if request.method == 'GET':
        item = db.get_course(id)
        return ok(item) if item else not_found()
    elif request.method == 'PUT':
        try:
            return ok(db.update_course(id, request.json))
        except Exception as e:
            return fail(e)
    elif request.method == 'DELETE':
        return ok(db.delete_course(id))


# ============================================================
# [6] API บทเรียน (lessons)
# ============================================================

@app.route('/api/lessons', methods=['GET', 'POST'])
def api_lessons():
    if request.method == 'GET':
        return ok(db.search_lessons(request.args))
    try:
        return ok(db.create_lesson(request.json))
    except Exception as e:
        return fail(e)


@app.route('/api/lessons/<int:id>', methods=['GET', 'PUT', 'DELETE'])
def api_lesson_item(id):
    if request.method == 'GET':
        item = db.get_lesson(id)
        return ok(item) if item else not_found()
    elif request.method == 'PUT':
        try:
            return ok(db.update_lesson(id, request.json))
        except Exception as e:
            return fail(e)
    elif request.method == 'DELETE':
        return ok(db.delete_lesson(id))


# ============================================================
# [7] API การลงทะเบียน (enrollments)
#     หมายเหตุ: db.create_enrollment / update_enrollment อาจ raise ValueError
#     (เช่น ลงซ้ำ, ที่นั่งเต็ม, ยังไม่ผ่านวิชาบังคับ) จึงถูกจับด้วย except เดียวกัน
# ============================================================

@app.route('/api/enrollments', methods=['GET', 'POST'])
def api_enrollments():
    if request.method == 'GET':
        return ok(db.search_enrollments(request.args))
    try:
        return ok(db.create_enrollment(request.json))
    except Exception as e:
        return fail(e)


@app.route('/api/enrollments/<int:id>', methods=['GET', 'PUT', 'DELETE'])
def api_enrollment_item(id):
    if request.method == 'GET':
        item = db.get_enrollment(id)
        return ok(item) if item else not_found()
    elif request.method == 'PUT':
        try:
            return ok(db.update_enrollment(id, request.json))
        except Exception as e:
            return fail(e)
    elif request.method == 'DELETE':
        return ok(db.delete_enrollment(id))


# ============================================================
# [8] API Progress ราย Enrollment (หน้า "จัดการ Progress")
# ============================================================

@app.route('/api/enrollments/<int:id>/progress', methods=['GET', 'POST'])
def handle_enrollment_progress(id):
    if request.method == 'GET':
        data = db.get_enrollment_progress_detail(id)
        return ok(data) if data else not_found()
    elif request.method == 'POST':
        try:
            watched_ids = request.json.get('watched_lesson_ids', [])
            return ok(db.save_enrollment_progress_bulk(id, watched_ids))
        except Exception as e:
            return fail(e)


# ============================================================
# [9] API รายงาน (reports)
# ============================================================

@app.route('/api/reports/summary')
def api_report_summary():
    return ok(db.report_summary())


@app.route('/api/reports/popular-courses')
def api_report_popular():
    return ok(db.report_popular_courses())


@app.route('/api/reports/completion-rate')
def api_report_completion():
    return ok(db.report_completion_rate())


@app.route('/api/reports/prerequisites')
def api_report_prereq():
    return ok(db.report_course_prerequisites())


@app.route('/api/reports/revenue', methods=['GET'])
def api_report_revenue():
    try:
        return ok(db.report_revenue_summary())
    except Exception as e:
        return fail(e)


# ============================================================
# [10] รันเซิร์ฟเวอร์
# ============================================================
if __name__ == '__main__':
    app.run(debug=True, port=5000)