-- ============================================================
--  schema.sql — ระบบคอร์สออนไลน์ (นิสิตออกแบบและเขียนเอง)
--  กติกา: ลงทะเบียน = M:N (learner × course), ความคืบหน้า = M:N (learner × lesson),
--         บทเรียน 1:M จาก course, คอร์สมี prerequisite อ้างถึง course เอง (self-reference)
-- ============================================================
--CREATE TABLE learner (
  --  learner_id INT AUTO_INCREMENT PRIMARY KEY
    -- TODO: name, email, join_date
--);
--CREATE TABLE course (             -- prerequisite_id = self-reference -> course
 --   course_id INT AUTO_INCREMENT PRIMARY KEY
  ---  -- TODO: title, category, price, prerequisite_id (FK -> course, NULL ได้)
--);
--CREATE TABLE lesson (             -- 1:M จาก course
 --   lesson_id INT AUTO_INCREMENT PRIMARY KEY
    -- TODO: course_id (FK), title, seq_no, duration_min
--);
----CREATE TABLE enrollment (         -- M:N: learner × course--
  --  enroll_id INT AUTO_INCREMENT PRIMARY KEY
    -- TODO: learner_id (FK), course_id (FK), enroll_date, status
--);
--CREATE TABLE progress (           -- M:N: learner × lesson
    -- TODO: learner_id (FK), lesson_id (FK), watched, completed_date ; PRIMARY KEY (learner_id, lesson_id)
--    learner_id INT, lesson_id INT
--);
-- TODO: INSERT ข้อมูลตัวอย่างทุกตาราง


-- ============================================================
-- 1. สร้างตารางทั้งหมด (ลบของเก่าทิ้งก่อนถ้ามี เพื่อเริ่มใหม่)
-- ============================================================
DROP TABLE IF EXISTS progress;
DROP TABLE IF EXISTS enrollment;
DROP TABLE IF EXISTS lesson;
DROP TABLE IF EXISTS course;
DROP TABLE IF EXISTS learner;

-- 1. ผู้เรียน (learner)
CREATE TABLE learner (
    learner_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    join_date DATE NOT NULL
);

-- 2. คอร์ส (course)
CREATE TABLE course (
    course_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,
    price DECIMAL(10, 2) DEFAULT 0.00,
    prerequisite_id INT NULL,
    FOREIGN KEY (prerequisite_id) REFERENCES course(course_id) ON DELETE SET NULL
);

-- 3. บทเรียน (lesson)
CREATE TABLE lesson (
    lesson_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    seq_no INT NOT NULL,
    duration_min INT NOT NULL,
    FOREIGN KEY (course_id) REFERENCES course(course_id) ON DELETE CASCADE
);

-- 4. การลงทะเบียน (enrollment)
CREATE TABLE enrollment (
    enroll_id INT AUTO_INCREMENT PRIMARY KEY,
    learner_id INT NOT NULL,
    course_id INT NOT NULL,
    enroll_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'studying', -- 'studying' หรือ 'completed'
    FOREIGN KEY (learner_id) REFERENCES learner(learner_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES course(course_id) ON DELETE CASCADE
);

CREATE TABLE enrollment (
    enroll_id INT AUTO_INCREMENT PRIMARY KEY,
    learner_id INT NOT NULL,
    course_id INT NOT NULL,
    enroll_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'studying',
    UNIQUE (learner_id, course_id), -- ป้องกันการลงทะเบียนคอร์สเดิมซ้ำ
    FOREIGN KEY (learner_id) REFERENCES learner(learner_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES course(course_id) ON DELETE CASCADE
);

-- 5. ความคืบหน้า (progress)
CREATE TABLE progress (
    learner_id INT NOT NULL,
    lesson_id INT NOT NULL,
    watched BOOLEAN DEFAULT TRUE,
    completed_date DATE NOT NULL,
    PRIMARY KEY (learner_id, lesson_id),
    FOREIGN KEY (learner_id) REFERENCES learner(learner_id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES lesson(lesson_id) ON DELETE CASCADE
);

-- ============================================================
-- 2. ข้อมูลตัวอย่าง (Mock Data)
-- ============================================================

-- เพิ่มผู้เรียน
INSERT INTO learner (name, email, join_date) VALUES 
('สมชาย ใจดี', 'somchai@email.com', '2023-01-15'),
('สมหญิง รักเรียน', 'somying@email.com', '2023-02-10'),
('มานะ มุ่งมั่น', 'mana@email.com', '2023-03-05');

-- เพิ่มคอร์ส (สังเกตคอร์สที่ 2 และ 3 อ้างอิง prerequisite_id ไปยังคอร์สก่อนหน้า)
INSERT INTO course (title, category, price, prerequisite_id) VALUES 
('Basic Database', 'Data', 1500.00, NULL),
('Advanced SQL', 'Data', 2000.00, 1),
('Python for Beginners', 'Programming', 1200.00, NULL);

-- เพิ่มบทเรียน (ผูกกับ course_id)
INSERT INTO lesson (course_id, title, seq_no, duration_min) VALUES 
(1, 'Introduction to Database', 1, 30),
(1, 'Relational Database Concepts', 2, 45),
(1, 'Basic SELECT Statements', 3, 60),
(2, 'SQL JOINs In-depth', 1, 90),
(2, 'Subqueries and CTEs', 2, 80),
(3, 'Variables and Data Types', 1, 40),
(3, 'Control Flows (If, For, While)', 2, 55);

-- เพิ่มการลงทะเบียน
INSERT INTO enrollment (learner_id, course_id, enroll_date, status) VALUES 
(1, 1, '2023-01-20', 'completed'),
(1, 2, '2023-03-01', 'studying'),
(2, 1, '2023-02-15', 'studying'),
(3, 3, '2023-03-10', 'completed');

-- เพิ่มความคืบหน้า (ระบุว่าใครเรียนบทไหนจบแล้วบ้าง)
INSERT INTO progress (learner_id, lesson_id, watched, completed_date) VALUES 
(1, 1, TRUE, '2023-01-22'),
(1, 2, TRUE, '2023-01-25'),
(1, 3, TRUE, '2023-02-05'),
(1, 4, TRUE, '2023-03-05'),
(2, 1, TRUE, '2023-02-16'),
(3, 6, TRUE, '2023-03-12'),
(3, 7, TRUE, '2023-03-15');