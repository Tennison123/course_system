# ============================================================
#  app.py — Flask REST API Server
# ============================================================
from flask import Flask, render_template, request, jsonify
import db

app = Flask(__name__)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/report')
def report_page():
    return render_template('report.html')


# ---------- Learners ----------
@app.route('/api/learners', methods=['GET', 'POST'])
def api_learners():
    if request.method == 'GET':
        return jsonify({"ok": True, "data": db.search_learners(request.args)})
    try:
        return jsonify({"ok": True, "data": db.create_learner(request.json)})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 400


@app.route('/api/learners/<int:id>', methods=['GET', 'PUT', 'DELETE'])
def api_learner_item(id):
    if request.method == 'GET':
        item = db.get_learner(id)
        return jsonify({"ok": True, "data": item}) if item else (jsonify({"ok": False, "error": "ไม่พบข้อมูล"}), 404)
    elif request.method == 'PUT':
        try:
            return jsonify({"ok": True, "data": db.update_learner(id, request.json)})
        except Exception as e:
            return jsonify({"ok": False, "error": str(e)}), 400
    elif request.method == 'DELETE':
        return jsonify({"ok": True, "data": db.delete_learner(id)})


# ---------- Courses ----------
@app.route('/api/courses', methods=['GET', 'POST'])
def api_courses():
    if request.method == 'GET':
        return jsonify({"ok": True, "data": db.search_courses(request.args)})
    try:
        return jsonify({"ok": True, "data": db.create_course(request.json)})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 400


@app.route('/api/courses/<int:id>', methods=['GET', 'PUT', 'DELETE'])
def api_course_item(id):
    if request.method == 'GET':
        item = db.get_course(id)
        return jsonify({"ok": True, "data": item}) if item else (jsonify({"ok": False, "error": "ไม่พบข้อมูล"}), 404)
    elif request.method == 'PUT':
        try:
            return jsonify({"ok": True, "data": db.update_course(id, request.json)})
        except Exception as e:
            return jsonify({"ok": False, "error": str(e)}), 400
    elif request.method == 'DELETE':
        return jsonify({"ok": True, "data": db.delete_course(id)})


# ---------- Lessons ----------
@app.route('/api/lessons', methods=['GET', 'POST'])
def api_lessons():
    if request.method == 'GET':
        return jsonify({"ok": True, "data": db.search_lessons(request.args)})
    try:
        return jsonify({"ok": True, "data": db.create_lesson(request.json)})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 400


@app.route('/api/lessons/<int:id>', methods=['GET', 'PUT', 'DELETE'])
def api_lesson_item(id):
    if request.method == 'GET':
        item = db.get_lesson(id)
        return jsonify({"ok": True, "data": item}) if item else (jsonify({"ok": False, "error": "ไม่พบข้อมูล"}), 404)
    elif request.method == 'PUT':
        try:
            return jsonify({"ok": True, "data": db.update_lesson(id, request.json)})
        except Exception as e:
            return jsonify({"ok": False, "error": str(e)}), 400
    elif request.method == 'DELETE':
        return jsonify({"ok": True, "data": db.delete_lesson(id)})


# ---------- Enrollments ----------
@app.route('/api/enrollments', methods=['GET', 'POST'])
def api_enrollments():
    if request.method == 'GET':
        return jsonify({"ok": True, "data": db.search_enrollments(request.args)})
    try:
        return jsonify({"ok": True, "data": db.create_enrollment(request.json)})
    except ValueError as ve:
        return jsonify({"ok": False, "error": str(ve)}), 400
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 400


@app.route('/api/enrollments/<int:id>', methods=['GET', 'PUT', 'DELETE'])
def api_enrollment_item(id):
    if request.method == 'GET':
        item = db.get_enrollment(id)
        return jsonify({"ok": True, "data": item}) if item else (jsonify({"ok": False, "error": "ไม่พบข้อมูล"}), 404)
    elif request.method == 'PUT':
        try:
            return jsonify({"ok": True, "data": db.update_enrollment(id, request.json)})
        except ValueError as ve:
            return jsonify({"ok": False, "error": str(ve)}), 400
        except Exception as e:
            return jsonify({"ok": False, "error": str(e)}), 400
    elif request.method == 'DELETE':
        return jsonify({"ok": True, "data": db.delete_enrollment(id)})


# ---------- จัดการ Progress ราย Enrollment ----------
@app.route('/api/enrollments/<int:id>/progress', methods=['GET', 'POST'])
def handle_enrollment_progress(id):
    if request.method == 'GET':
        data = db.get_enrollment_progress_detail(id)
        return jsonify({"ok": True, "data": data}) if data else (jsonify({"ok": False, "error": "ไม่พบข้อมูล"}), 404)
    elif request.method == 'POST':
        try:
            watched_ids = request.json.get('watched_lesson_ids', [])
            res = db.save_enrollment_progress_bulk(id, watched_ids)
            return jsonify({"ok": True, "data": res})
        except Exception as e:
            return jsonify({"ok": False, "error": str(e)}), 400


# ---------- Reports ----------
@app.route('/api/reports/summary')
def api_report_summary():
    return jsonify({"ok": True, "data": db.report_summary()})


@app.route('/api/reports/popular-courses')
def api_report_popular():
    return jsonify({"ok": True, "data": db.report_popular_courses()})


@app.route('/api/reports/completion-rate')
def api_report_completion():
    return jsonify({"ok": True, "data": db.report_completion_rate()})


@app.route('/api/reports/prerequisites')
def api_report_prereq():
    return jsonify({"ok": True, "data": db.report_course_prerequisites()})


if __name__ == '__main__':
    app.run(debug=True, port=5000)