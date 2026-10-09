# ============================================================
#  db.py — ชั้นติดต่อฐานข้อมูล MySQL
# ============================================================
import mysql.connector
import config

# อัตราส่วนลดตามระดับผู้เรียน
LEVEL_DISCOUNT = {
    "Standard": 0.00,  # ไม่ลด
    "Silver": 0.10,    # ลด 10%
    "Gold": 0.20       # ลด 20%
}


def get_connection():
    return mysql.connector.connect(
        host=config.DB_HOST,
        user=config.DB_USER,
        password=config.DB_PASSWORD,
        database=config.DB_NAME,
        port=config.DB_PORT
    )


def run_query(sql, params=None):
    """รันคำสั่ง SELECT คืนผลเป็น list ของ dict"""
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute(sql, params or ())
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return rows


def run_command(sql, params=None):
    """รันคำสั่ง INSERT / UPDATE / DELETE พร้อม commit"""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(sql, params or ())
    conn.commit()
    out = {"new_id": cur.lastrowid, "affected": cur.rowcount}
    cur.close()
    conn.close()
    return out


# ---------- ผู้เรียน (learner) ----------
def search_learners(filters):
    sql = """
        SELECT 
            learner_id, 
            name, 
            email, 
            DATE_FORMAT(join_date, '%Y-%m-%d') AS join_date,
            level
        FROM learner 
        WHERE 1=1
    """
    params = []
    if filters.get("name"):
        sql += " AND name LIKE %s"
        params.append(f"%{filters['name']}%")
    if filters.get("email"):
        sql += " AND email LIKE %s"
        params.append(f"%{filters['email']}%")
    if filters.get("level"):
        sql += " AND level = %s"
        params.append(filters['level'])
    return run_query(sql, tuple(params))


def get_learner(learner_id):
    sql = """
        SELECT 
            learner_id, 
            name, 
            email, 
            DATE_FORMAT(join_date, '%Y-%m-%d') AS join_date,
            level
        FROM learner 
        WHERE learner_id = %s
    """
    rows = run_query(sql, (learner_id,))
    return rows[0] if rows else None


def create_learner(data):
    sql = "INSERT INTO learner (name, email, join_date, level) VALUES (%s, %s, %s, %s)"
    level = data.get('level') or 'Standard'
    return run_command(sql, (data['name'], data['email'], data['join_date'], level))


def update_learner(learner_id, data):
    sql = "UPDATE learner SET name=%s, email=%s, join_date=%s, level=%s WHERE learner_id=%s"
    level = data.get('level') or 'Standard'
    return run_command(sql, (data['name'], data['email'], data['join_date'], level, learner_id))


def delete_learner(learner_id):
    return run_command("DELETE FROM learner WHERE learner_id=%s", (learner_id,))


# ---------- คอร์ส (course) ----------
def search_courses(filters):
    sql = "SELECT course_id, title, category, price, max_seats, prerequisite_id FROM course WHERE 1=1"
    params = []
    if filters.get("title"):
        sql += " AND title LIKE %s"
        params.append(f"%{filters['title']}%")
    if filters.get("category"):
        sql += " AND category LIKE %s"
        params.append(f"%{filters['category']}%")
    return run_query(sql, tuple(params))


def get_course(course_id):
    rows = run_query("SELECT * FROM course WHERE course_id = %s", (course_id,))
    return rows[0] if rows else None


def create_course(data):
    sql = "INSERT INTO course (title, category, price, max_seats, prerequisite_id) VALUES (%s, %s, %s, %s, %s)"
    prereq = data.get('prerequisite_id') or None
    max_seats = int(data.get('max_seats') or 20)
    return run_command(sql, (data['title'], data['category'], data['price'], max_seats, prereq))


def update_course(course_id, data):
    sql = "UPDATE course SET title=%s, category=%s, price=%s, max_seats=%s, prerequisite_id=%s WHERE course_id=%s"
    prereq = data.get('prerequisite_id') or None
    max_seats = int(data.get('max_seats') or 20)
    return run_command(sql, (data['title'], data['category'], data['price'], max_seats, prereq, course_id))


def delete_course(course_id):
    return run_command("DELETE FROM course WHERE course_id=%s", (course_id,))


# ---------- บทเรียน (lesson) ----------
def search_lessons(filters):
    sql = """
        SELECT 
            l.lesson_id, 
            c.title AS course_title,
            l.course_id, 
            l.title, 
            l.seq_no, 
            l.duration_min 
        FROM lesson l
        INNER JOIN course c ON l.course_id = c.course_id
        WHERE 1=1
    """
    params = []
    if filters.get("course_id"):
        sql += " AND l.course_id = %s"
        params.append(filters['course_id'])
    if filters.get("title"):
        sql += " AND l.title LIKE %s"
        params.append(f"%{filters['title']}%")
    sql += " ORDER BY l.course_id ASC, l.seq_no ASC"
    return run_query(sql, tuple(params))


def get_lesson(lesson_id):
    rows = run_query("SELECT * FROM lesson WHERE lesson_id = %s", (lesson_id,))
    return rows[0] if rows else None


def create_lesson(data):
    sql = "INSERT INTO lesson (course_id, title, seq_no, duration_min) VALUES (%s, %s, %s, %s)"
    return run_command(sql, (data['course_id'], data['title'], data['seq_no'], data['duration_min']))


def update_lesson(lesson_id, data):
    sql = "UPDATE lesson SET course_id=%s, title=%s, seq_no=%s, duration_min=%s WHERE lesson_id=%s"
    return run_command(sql, (data['course_id'], data['title'], data['seq_no'], data['duration_min'], lesson_id))


def delete_lesson(lesson_id):
    return run_command("DELETE FROM lesson WHERE lesson_id=%s", (lesson_id,))


# ---------- การลงทะเบียน (enrollment) ----------
def search_enrollments(filters):
    sql = """
        SELECT 
            e.enroll_id, 
            l.name AS learner_name,
            l.level AS learner_level,
            c.title AS course_title,
            e.learner_id,
            e.course_id,
            e.final_price,
            DATE_FORMAT(e.enroll_date, '%Y-%m-%d') AS enroll_date, 
            e.status 
        FROM enrollment e
        INNER JOIN learner l ON e.learner_id = l.learner_id
        INNER JOIN course c ON e.course_id = c.course_id
        WHERE 1=1
    """
    params = []
    if filters.get("learner_id"):
        sql += " AND e.learner_id = %s"
        params.append(filters['learner_id'])
    if filters.get("course_id"):
        sql += " AND e.course_id = %s"
        params.append(filters['course_id'])
    if filters.get("status"):
        sql += " AND e.status = %s"
        params.append(filters['status'])
    return run_query(sql, tuple(params))


def get_enrollment(enroll_id):
    sql = "SELECT enroll_id, learner_id, course_id, final_price, DATE_FORMAT(enroll_date, '%Y-%m-%d') AS enroll_date, status FROM enrollment WHERE enroll_id = %s"
    rows = run_query(sql, (enroll_id,))
    return rows[0] if rows else None


def create_enrollment(data):
    learner_id = data['learner_id']
    course_id = data['course_id']

    # 1. ป้องกันลงซ้ำ (Unique check ตาม ER Diagram M:N)
    if run_query("SELECT enroll_id FROM enrollment WHERE learner_id = %s AND course_id = %s", (learner_id, course_id)):
        raise ValueError("ไม่สามารถลงทะเบียนได้: ผู้เรียนได้ลงทะเบียนในคอร์สนี้ไปแล้ว")

    # 2. ตรวจสอบจำนวนที่นั่งที่รับได้ (Max Seats)
    c_res = run_query("SELECT price, max_seats, prerequisite_id, title FROM course WHERE course_id = %s", (course_id,))
    if not c_res:
        raise ValueError("ไม่พบคอร์สที่ระบุ")
    course_info = c_res[0]
    
    current_enrolled = run_query("SELECT COUNT(*) AS cnt FROM enrollment WHERE course_id = %s", (course_id,))[0]['cnt']
    max_seats = course_info['max_seats'] if course_info['max_seats'] is not None else 20
    if current_enrolled >= max_seats:
        raise ValueError(f"ไม่สามารถลงทะเบียนได้: คอร์สนี้เต็มแล้ว (จำกัด {max_seats} ที่นั่ง)")

    # 3. ตรวจสอบวิชาบังคับก่อน (Prerequisite)
    if course_info['prerequisite_id']:
        prereq_id = course_info['prerequisite_id']
        prereq_title = run_query("SELECT title FROM course WHERE course_id = %s", (prereq_id,))
        title_str = prereq_title[0]['title'] if prereq_title else f"รหัส {prereq_id}"

        passed = run_query("SELECT enroll_id FROM enrollment WHERE learner_id = %s AND course_id = %s AND status = 'completed'", (learner_id, prereq_id))
        if not passed:
            raise ValueError(f"ไม่สามารถลงทะเบียนได้: ต้องผ่านวิชา '{title_str}' ก่อน")

    # 4. คำนวณส่วนลดตามระดับของผู้เรียน (Learner Level Discount)
    l_res = run_query("SELECT level FROM learner WHERE learner_id = %s", (learner_id,))
    learner_level = l_res[0]['level'] if (l_res and l_res[0]['level']) else "Standard"
    discount = LEVEL_DISCOUNT.get(learner_level, 0.00)
    original_price = float(course_info['price'] or 0.00)
    final_price = round(original_price * (1.00 - discount), 2)

    # 5. บันทึกข้อมูลลงทะเบียน
    sql = "INSERT INTO enrollment (learner_id, course_id, enroll_date, final_price, status) VALUES (%s, %s, %s, %s, %s)"
    return run_command(sql, (learner_id, course_id, data['enroll_date'], final_price, data['status']))


def update_enrollment(enroll_id, data):
    learner_id = data['learner_id']
    course_id = data['course_id']

    dup = run_query("SELECT enroll_id FROM enrollment WHERE learner_id = %s AND course_id = %s AND enroll_id != %s", (learner_id, course_id, enroll_id))
    if dup:
        raise ValueError("ไม่สามารถแก้ไขได้: มีประวัติการลงทะเบียนคอร์สนี้อยู่แล้ว")

    # คำนวณราคาใหม่เผื่อมีการเปลี่ยนผู้เรียนหรือคอร์ส
    c_res = run_query("SELECT price FROM course WHERE course_id = %s", (course_id,))
    l_res = run_query("SELECT level FROM learner WHERE learner_id = %s", (learner_id,))
    learner_level = l_res[0]['level'] if (l_res and l_res[0]['level']) else "Standard"
    discount = LEVEL_DISCOUNT.get(learner_level, 0.00)
    original_price = float(c_res[0]['price'] or 0.00) if c_res else 0.00
    final_price = round(original_price * (1.00 - discount), 2)

    sql = "UPDATE enrollment SET learner_id=%s, course_id=%s, enroll_date=%s, final_price=%s, status=%s WHERE enroll_id=%s"
    return run_command(sql, (learner_id, course_id, data['enroll_date'], final_price, data['status'], enroll_id))


def delete_enrollment(enroll_id):
    return run_command("DELETE FROM enrollment WHERE enroll_id=%s", (enroll_id,))


# ---------- หน้า 2: จัดการ Progress ราย Enrollment ----------
def get_enrollment_progress_detail(enroll_id):
    """ดึงข้อมูล Enrollment และบทเรียนทั้งหมดพร้อมสถานะ watched"""
    sql_enr = """
        SELECT e.enroll_id, e.learner_id, e.course_id, e.status,
               l.name AS learner_name, c.title AS course_title
        FROM enrollment e
        INNER JOIN learner l ON e.learner_id = l.learner_id
        INNER JOIN course c ON e.course_id = c.course_id
        WHERE e.enroll_id = %s
    """
    enr = run_query(sql_enr, (enroll_id,))
    if not enr:
        return None
    enrollment_data = enr[0]

    sql_lessons = """
        SELECT 
            ls.lesson_id,
            ls.seq_no,
            ls.title,
            ls.duration_min,
            COALESCE(p.watched, 0) AS watched
        FROM lesson ls
        LEFT JOIN progress p 
            ON ls.lesson_id = p.lesson_id AND p.learner_id = %s
        WHERE ls.course_id = %s
        ORDER BY ls.seq_no ASC
    """
    lessons = run_query(sql_lessons, (enrollment_data['learner_id'], enrollment_data['course_id']))
    return {
        "enrollment": enrollment_data,
        "lessons": lessons
    }


def save_enrollment_progress_bulk(enroll_id, watched_lesson_ids):
    """บันทึก Progress ทุกบทเรียน และปรับ status เป็น completed ให้อัตโนมัติเมื่อครบ"""
    enr = run_query("SELECT learner_id, course_id FROM enrollment WHERE enroll_id = %s", (enroll_id,))
    if not enr:
        raise ValueError("ไม่พบข้อมูล Enrollment")
    learner_id = enr[0]['learner_id']
    course_id = enr[0]['course_id']

    all_lessons = run_query("SELECT lesson_id FROM lesson WHERE course_id = %s", (course_id,))
    
    for ls in all_lessons:
        lid = ls['lesson_id']
        is_watched = 1 if lid in watched_lesson_ids else 0
        run_command("""
            INSERT INTO progress (learner_id, lesson_id, watched, completed_date)
            VALUES (%s, %s, %s, CURDATE())
            ON DUPLICATE KEY UPDATE watched = %s, completed_date = CURDATE()
        """, (learner_id, lid, is_watched, is_watched))

    total_count = len(all_lessons)
    watched_count = len(watched_lesson_ids)

    new_status = 'completed' if (total_count > 0 and watched_count >= total_count) else 'studying'
    run_command("UPDATE enrollment SET status = %s WHERE enroll_id = %s", (new_status, enroll_id))

    return {"status": new_status, "watched_count": watched_count, "total_count": total_count}


# ---------- รายงาน (Reports) ----------
def report_summary():
    return {
        "learners": run_query("SELECT COUNT(*) AS c FROM learner")[0]['c'],
        "courses": run_query("SELECT COUNT(*) AS c FROM course")[0]['c'],
        "enrollments": run_query("SELECT COUNT(*) AS c FROM enrollment")[0]['c'],
        "lessons": run_query("SELECT COUNT(*) AS c FROM lesson")[0]['c']
    }


def report_popular_courses():
    sql = """
        SELECT 
            c.title AS 'ชื่อคอร์ส', 
            COUNT(e.enroll_id) AS 'จำนวนผู้ลงทะเบียน'
        FROM course c
        INNER JOIN enrollment e ON c.course_id = e.course_id
        GROUP BY c.course_id, c.title
        ORDER BY COUNT(e.enroll_id) DESC
        LIMIT 5
    """
    return run_query(sql)


def report_completion_rate():
    sql = """
        SELECT 
            c.title AS 'ชื่อคอร์ส',
            COUNT(e.enroll_id) AS 'ผู้ลงทะเบียนทั้งหมด',
            SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END) AS 'เรียนจบแล้ว',
            CONCAT(ROUND((SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END) / COUNT(e.enroll_id)) * 100, 2), ' %') AS 'อัตราการเรียนจบ'
        FROM course c
        INNER JOIN enrollment e ON c.course_id = e.course_id
        GROUP BY c.course_id, c.title
    """
    return run_query(sql)


def report_course_prerequisites():
    sql = """
        SELECT 
            c.title AS 'ชื่อคอร์ส', 
            COALESCE(pre.title, '-') AS 'วิชาที่ต้องเรียนก่อน'
        FROM course c
        LEFT JOIN course pre ON c.prerequisite_id = pre.course_id
    """
    return run_query(sql)

# ---------- เพิ่มใหม่: ดึงข้อมูลคอร์สหน้า Home ----------
def get_homepage_courses():
    """ดึงคอร์สทั้งหมด พร้อมคำนวณจำนวนคนที่ลงทะเบียนแล้วในปัจจุบัน"""
    sql = """
        SELECT 
            c.course_id, 
            c.title, 
            c.category, 
            c.price, 
            c.max_seats,
            (SELECT COUNT(*) FROM enrollment WHERE course_id = c.course_id) AS enrolled_count
        FROM course c
        ORDER BY c.course_id DESC
    """
    return run_query(sql)

# ---------- เพิ่มใหม่: รายงานรายได้และส่วนลดตามระดับผู้เรียน ----------
# ---------- รายงานรายได้และส่วนลด (ฉบับแก้ไขคำนวณแม่นยำ) ----------
def report_revenue_summary():
    # 1. คำนวณรายได้และส่วนลดของแต่ละระดับ
    sql = """
        SELECT 
            COALESCE(l.level, 'Standard') AS level,
            COUNT(e.enroll_id) AS enroll_count,
            COALESCE(SUM(c.price), 0.00) AS gross_amount,
            COALESCE(SUM(
                ROUND(c.price * CASE 
                    WHEN l.level = 'Gold' THEN 0.20
                    WHEN l.level = 'Silver' THEN 0.10
                    ELSE 0.00
                END, 2)
            ), 0.00) AS discount_amount,
            COALESCE(SUM(
                ROUND(c.price * (1.00 - CASE 
                    WHEN l.level = 'Gold' THEN 0.20
                    WHEN l.level = 'Silver' THEN 0.10
                    ELSE 0.00
                END), 2)
            ), 0.00) AS net_amount
        FROM enrollment e
        INNER JOIN learner l ON e.learner_id = l.learner_id
        INNER JOIN course c ON e.course_id = c.course_id
        GROUP BY l.level
    """
    rows = run_query(sql)

    tier_data = {
        "Standard": {"enroll_count": 0, "discount_pct": "0%", "discount_amount": 0.0, "net_amount": 0.0},
        "Silver": {"enroll_count": 0, "discount_pct": "10%", "discount_amount": 0.0, "net_amount": 0.0},
        "Gold": {"enroll_count": 0, "discount_pct": "20%", "discount_amount": 0.0, "net_amount": 0.0}
    }

    total_gross = 0.0
    total_discount = 0.0
    total_net = 0.0

    for r in rows:
        lvl = r['level'] or 'Standard'
        if lvl in tier_data:
            enroll_cnt = int(r['enroll_count'] or 0)
            gross = float(r['gross_amount'] or 0.0)
            disc = float(r['discount_amount'] or 0.0)
            net = float(r['net_amount'] or 0.0)

            tier_data[lvl]["enroll_count"] = enroll_cnt
            tier_data[lvl]["discount_amount"] = disc
            tier_data[lvl]["net_amount"] = net

            total_gross += gross
            total_discount += disc
            total_net += net

    return {
        "overview": {
            "total_gross_revenue": total_gross,
            "total_discount_amount": total_discount,
            "total_net_revenue": total_net
        },
        "tiers": tier_data
    }