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
    learnerCREATE TABLE_id INT AUTO_INCREMENT PRIMARY KEY,
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
    seq_no INT NOT null UNIQUE,
    duration_min INT NOT NULL,
    FOREIGN KEY (course_id) REFERENCES course(course_id) ON DELETE CASCADE);
    
--

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


-- ------------------------------------------------------------
-- 1. ผู้เรียน (learner) — มีครบทั้ง 3 ระดับ
-- ------------------------------------------------------------
INSERT INTO learner (learner_id, name, email, join_date, level) VALUES
(1, 'สมชาย สายโค้ด', 'somchai@email.com', '2026-01-15', 'Gold'),       -- ส่วนลด 20%
(2, 'สมหญิง จริงใจ', 'somying@email.com', '2026-02-01', 'Silver'),     -- ส่วนลด 10%
(3, 'อนันต์ ขยันเรียน', 'anant@email.com', '2026-02-10', 'Standard'),   -- ไม่ลด (0%)
(4, 'กานดา พัฒนาตน', 'kanda@email.com', '2026-03-05', 'Silver'),      -- ส่วนลด 10%
(5, 'ประสิทธิ์ คิดไว', 'prasit@email.com', '2026-03-20', 'Standard'),   -- ไม่ลด (0%)
(6, 'วรัญญา สายดาต้า', 'waranya@email.com', '2026-04-01', 'Gold');     -- ส่วนลด 20%

-- ------------------------------------------------------------
-- 2. คอร์ส (course) — มีราคา, ความจุที่นั่ง, และวิชาบังคับก่อน
-- ------------------------------------------------------------
INSERT INTO course (course_id, title, category, price, max_seats, prerequisite_id) VALUES
(1, 'Basic Database Systems', 'Data', 1500.00, 20, NULL),
(2, 'Advanced Relational Database & SQL', 'Data', 2500.00, 5, 1),      -- ต้องผ่านคอร์ส 1 ก่อน, จำกัด 5 ที่
(3, 'Python Programming for Beginners', 'Programming', 1200.00, 20, NULL),
(4, 'Data Analysis with Pandas & Python', 'Data', 2000.00, 3, 3),      -- ต้องผ่านคอร์ส 3 ก่อน, ตั้งไว้ 3 ที่ (เตรียมเทสต์ใกล้เต็ม)
(5, 'UI/UX Design Essentials', 'Design', 1800.00, 15, NULL);

-- ------------------------------------------------------------
-- 3. บทเรียน (lesson)
-- ------------------------------------------------------------
INSERT INTO lesson (lesson_id, course_id, title, seq_no, duration_min) VALUES
-- บทเรียนคอร์ส 1 (Basic Database) มี 4 บท
(1, 1, 'Introduction to Databases', 1, 30),
(2, 1, 'Entity Relationship Diagram (ERD)', 2, 45),
(3, 1, 'Relational Model & Normalization', 3, 60),
(4, 1, 'Basic SQL Commands', 4, 90),

-- บทเรียนคอร์ส 2 (Advanced DB) มี 3 บท
(5, 2, 'Complex SQL Joins & Subqueries', 1, 60),
(6, 2, 'Indexing & Query Optimization', 2, 75),
(7, 2, 'Transactions & ACID Properties', 3, 80),

-- บทเรียนคอร์ส 3 (Python Beginners) มี 3 บท
(8, 3, 'Python Syntax and Variables', 1, 35),
(9, 3, 'Control Flow & Loops', 2, 50),
(10, 3, 'Functions & Modules', 3, 60),

-- บทเรียนคอร์ส 4 (Data Analysis) มี 2 บท
(11, 4, 'Pandas DataFrames Basics', 1, 60),
(12, 4, 'Data Cleaning & Visualization', 2, 90),

-- บทเรียนคอร์ส 5 (UI/UX) มี 2 บท
(13, 5, 'Design Thinking Principles', 1, 45),
(14, 5, 'Wireframing & Prototyping in Figma', 2, 75);

-- ------------------------------------------------------------
-- 4. การลงทะเบียน (enrollment) — คิด final_price ตาม level จริง
-- ------------------------------------------------------------
INSERT INTO enrollment (enroll_id, learner_id, course_id, enroll_date, final_price, status) VALUES
-- นายสมชาย (Gold ลด 20%)
(1, 1, 1, '2026-02-15', 1200.00, 'completed'), -- คอร์ส 1 ราคา 1500 ลด 20% = 1200 (เรียนจบแล้ว)
(2, 1, 2, '2026-03-01', 2000.00, 'studying'),  -- คอร์ส 2 ราคา 2500 ลด 20% = 2000

-- นางสาวสมหญิง (Silver ลด 10%)
(3, 2, 1, '2026-02-16', 1350.00, 'completed'), -- คอร์ส 1 ราคา 1500 ลด 10% = 1350 (เรียนจบแล้ว)
(4, 2, 3, '2026-03-10', 1080.00, 'completed'), -- คอร์ส 3 ราคา 1200 ลด 10% = 1080 (เรียนจบแล้ว)
(5, 2, 4, '2026-03-25', 1800.00, 'studying'),  -- คอร์ส 4 ราคา 2000 ลด 10% = 1800

-- นายอนันต์ (Standard ไม่ลด)
(6, 3, 1, '2026-02-20', 1500.00, 'studying'),  -- คอร์ส 1 ราคา 1500 ลด 0% = 1500
(7, 3, 3, '2026-03-12', 1200.00, 'studying'),  -- คอร์ส 3 ราคา 1200 ลด 0% = 1200

-- นางสาวกานดา (Silver ลด 10%)
(8, 4, 3, '2026-03-15', 1080.00, 'completed'), -- คอร์ส 3 ราคา 1200 ลด 10% = 1080 (เรียนจบแล้ว)
(9, 4, 4, '2026-04-02', 1800.00, 'studying'),  -- คอร์ส 4 ราคา 2000 ลด 10% = 1800

-- นายประสิทธิ์ (Standard ไม่ลด)
(10, 5, 5, '2026-03-22', 1800.00, 'studying'), -- คอร์ส 5 ราคา 1800 ลด 0% = 1800

-- นางสาววรัญญา (Gold ลด 20%)
(11, 6, 5, '2026-04-05', 1440.00, 'completed'); -- คอร์ส 5 ราคา 1800 ลด 20% = 1440 (เรียนจบแล้ว)

-- ------------------------------------------------------------
-- 5. ความคืบหน้า (progress) — บันทึกบทเรียนที่ดูแล้ว
-- ------------------------------------------------------------
INSERT INTO progress (learner_id, lesson_id, watched, completed_date) VALUES
-- นายสมชาย (learner 1) เรียนคอร์ส 1 ครบทั้ง 4 บท (จึง status = completed ใน enrollment)
(1, 1, 1, '2026-02-18'),
(1, 2, 1, '2026-02-20'),
(1, 3, 1, '2026-02-22'),
(1, 4, 1, '2026-02-25'),
-- นายสมชาย เรียนคอร์ส 2 ไปแค่ 1 บท (status = studying)
(1, 5, 1, '2026-03-05'),

-- นางสาวสมหญิง (learner 2) เรียนคอร์ส 1 ครบทั้ง 4 บท
(2, 1, 1, '2026-02-19'),
(2, 2, 1, '2026-02-21'),
(2, 3, 1, '2026-02-23'),
(2, 4, 1, '2026-02-26'),
-- นางสาวสมหญิง เรียนคอร์ส 3 ครบทั้ง 3 บท
(2, 8, 1, '2026-03-12'),
(2, 9, 1, '2026-03-15'),
(2, 10, 1, '2026-03-18'),

-- นายอนันต์ (learner 3) เรียนคอร์ส 1 ไป 2 บท
(3, 1, 1, '2026-02-25'),
(3, 2, 1, '2026-02-28'),

-- นางสาวกานดา (learner 4) เรียนคอร์ส 3 ครบทั้ง 3 บท
(4, 8, 1, '2026-03-17'),
(4, 9, 1, '2026-03-20'),
(4, 10, 1, '2026-03-22'),

-- นางสาววรัญญา (learner 6) เรียนคอร์ส 5 ครบทั้ง 2 บท
(6, 13, 1, '2026-04-06'),
(6, 14, 1, '2026-04-08');