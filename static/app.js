// ============================================================
//  app.js — ฝั่งหน้าเว็บ (Frontend) ของระบบคอร์สออนไลน์
// ============================================================
//
//   [1] ค่าตั้งต้นและตัวแปรสถานะ     ENTITIES, current, editingId, ...
//   [2] ฟังก์ชันช่วยทั่วไป           $, setStatus, api
//   [3] นำทาง (Sidebar / สลับหน้า)   toggleSidebar, switchView
//   [4] หน้า Home (การ์ดคอร์ส)       loadHomeCourses, renderCourseCard
//   [5] หน้า CRUD
//        5.1 สร้างช่องฟอร์ม           fieldHtml (+ ตัวช่วยแต่ละชนิดช่อง)
//        5.2 ค้นหา & ตาราง            buildSearch, doSearch, renderTable
//        5.3 ฟอร์ม Modal & ปุ่มจัดการ  openForm, collectForm, editRow, deleteRow, save
//        5.4 ผูกปุ่ม (Event)
//   [6] หน้าจัดการ Progress          initProgressDropdown, loadEnrollmentProgress, saveEnrollmentProgress
//   [7] เริ่มต้นระบบ                 window.onload
//
//  หมายเหตุ: ฟังก์ชันที่ index.html เรียกผ่าน onclick/onchange ต้องเป็นฟังก์ชันระดับบนสุด (global)
//  ได้แก่ toggleSidebar, switchView, loadEnrollmentProgress, saveEnrollmentProgress,
//        editRow, deleteRow, onLessonToggle  — ห้ามย้ายเข้าไปอยู่ใน block หรือ module
// ============================================================


// ============================================================
// [1] ค่าตั้งต้นและตัวแปรสถานะ
// ============================================================

// นิยามแต่ละตาราง: label=ชื่อที่แสดง, api=URL, idKey=ชื่อคอลัมน์ id,
// search=ช่องค้นหา, form=ช่องในฟอร์มเพิ่ม/แก้ไข
// ชนิดช่อง (type): text | number | date | select | dynamic_course | autocomplete_course | autocomplete_learner
const ENTITIES = {
  "learners": {
    "label": "ผู้เรียน", "api": "/api/learners", "idKey": "learner_id",
    "search": [
      { "key": "name", "label": "ชื่อ", "type": "text" },
      { "key": "email", "label": "อีเมล", "type": "text" },
      { "key": "level", "label": "ระดับผู้เรียน", "type": "select", "options": ["", "Standard", "Silver", "Gold"] }
    ],
    "form": [
      { "key": "name", "label": "ชื่อ", "type": "text" },
      { "key": "email", "label": "อีเมล", "type": "text" },
      { "key": "join_date", "label": "วันที่สมัคร", "type": "date" },
      { "key": "level", "label": "ระดับผู้เรียน", "type": "select", "options": ["Standard", "Silver", "Gold"] }
    ]
  },
  "courses": {
    "label": "คอร์ส", "api": "/api/courses", "idKey": "course_id",
    "search": [
      { "key": "title", "label": "ชื่อคอร์ส", "type": "text" },
      { "key": "category", "label": "หมวดหมู่", "type": "select", "options": ["", "Data", "Programming", "Design", "Business"] }
    ],
    "form": [
      { "key": "title", "label": "ชื่อคอร์ส", "type": "text" },
      { "key": "category", "label": "หมวดหมู่", "type": "select", "options": ["Data", "Programming", "Design", "Business"] },
      { "key": "price", "label": "ราคา", "type": "number" },
      { "key": "max_seats", "label": "จำนวนที่นั่งรับสมัคร", "type": "number" },
      { "key": "prerequisite_id", "label": "วิชาที่ต้องเรียนก่อน", "type": "dynamic_course" }
    ]
  },
  "lessons": {
    "label": "บทเรียน", "api": "/api/lessons", "idKey": "lesson_id",
    "search": [
      { "key": "course_id", "label": "รหัสคอร์ส", "type": "number" },
      { "key": "title", "label": "ชื่อบทเรียน", "type": "text" }
    ],
    "form": [
      { "key": "course_id", "label": "คอร์ส", "type": "autocomplete_course" },
      { "key": "title", "label": "ชื่อบทเรียน", "type": "text" },
      { "key": "seq_no", "label": "ลำดับตอนที่", "type": "number" },
      { "key": "duration_min", "label": "เวลา (นาที)", "type": "number" }
    ]
  },
  "enrollments": {
    "label": "การลงทะเบียน", "api": "/api/enrollments", "idKey": "enroll_id",
    "search": [
      { "key": "learner_id", "label": "รหัสผู้เรียน", "type": "number" },
      { "key": "course_id", "label": "รหัสคอร์ส", "type": "number" },
      { "key": "status", "label": "สถานะ", "type": "select", "options": ["", "studying", "completed"] }
    ],
    "form": [
      { "key": "learner_id", "label": "ผู้เรียน", "type": "autocomplete_learner" },
      { "key": "course_id", "label": "คอร์ส", "type": "autocomplete_course" },
      { "key": "enroll_date", "label": "วันที่ลงทะเบียน", "type": "date" },
      { "key": "status", "label": "สถานะ", "type": "select", "options": ["studying", "completed"] }
    ]
  }
};

const DEFAULT_MAX_SEATS = 20;   // ใช้เมื่อคอร์สไม่ได้กำหนดจำนวนที่นั่ง

// ตัวแปรสถานะ (เปลี่ยนค่าไปตามที่ผู้ใช้กดเมนู/แก้ไข)
let current = "";               // ตารางที่เปิดอยู่ในหน้า CRUD (learners / courses / ...)
let editingId = null;           // id ที่กำลังแก้ไขในฟอร์ม (null = กำลังเพิ่มใหม่)
let allCourseOptions = [];      // รายการคอร์สสำหรับ dropdown / autocomplete
let allLearnerOptions = [];     // รายการผู้เรียนสำหรับ autocomplete
let activeEnrollId = null;      // enrollment ที่เลือกอยู่ในหน้า Progress


// ============================================================
// [2] ฟังก์ชันช่วยทั่วไป
// ============================================================

const $ = (s) => document.querySelector(s);

function setStatus(el, msg, cls = "") {
  el.className = "status " + cls;
  el.textContent = msg;
}

async function api(url, opts) {
  const res = await fetch(url, opts);
  return res.json();
}


// ============================================================
// [3] นำทาง (Sidebar / สลับหน้า)
// ============================================================

function toggleSidebar() {
  $("#sidebar").classList.toggle("closed");
  $("#mainContent").classList.toggle("expanded");
}

async function switchView(viewName, element = null) {
  // เปลี่ยนสถานะแถบเมนูซ้าย
  if (element) {
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
  }

  // ซ่อนหน้าทั้งหมดก่อน
  $("#homeSection").classList.add("hidden");
  $("#crudSection").classList.add("hidden");
  $("#progressSection").classList.add("hidden");

  // แสดงหน้าตามเมนูที่เลือก
  if (viewName === 'home') {
    $("#homeSection").classList.remove("hidden");
    loadHomeCourses();
  }
  else if (viewName === 'progress_manager') {
    $("#progressSection").classList.remove("hidden");
    initProgressDropdown();
  }
  else {
    // โหมด CRUD (ผู้เรียน, คอร์ส, บทเรียน, ลงทะเบียน)
    $("#crudSection").classList.remove("hidden");
    current = viewName;
    buildSearch();
    $("#tableHead").innerHTML = "";
    $("#tableBody").innerHTML = "";
    setStatus($("#status"), 'กด "ค้นหา" เพื่อแสดงข้อมูล');
  }
}


// ============================================================
// [4] หน้า Home (การ์ดคอร์ส — วิบวับเมื่อใกล้เต็ม)
// ============================================================

function renderCourseCard(c) {
  const enrolled = c.enrolled_count || 0;
  const max = c.max_seats || DEFAULT_MAX_SEATS;
  const percent = Math.min((enrolled / max) * 100, 100);

  // ใกล้เต็ม: เหลือที่นั่ง <= 2 หรือถึง 80% (และยังไม่เต็ม 100%)
  const isNearFull = (max - enrolled <= 2 || percent >= 80) && enrolled < max;
  const isFull = enrolled >= max;

  const extraClass = isNearFull ? "near-full" : "";
  const badgeHtml = isNearFull
    ? `<div class="badge-hot">🔥 ใกล้เต็ม!</div>`
    : (isFull ? `<div class="badge-hot" style="background:#475569;">เต็มแล้ว</div>` : "");

  return `
    <div class="course-card ${extraClass}">
      ${badgeHtml}
      <span class="course-tag">${c.category || "ทั่วไป"}</span>
      <h3 class="course-title">${c.title}</h3>
      <div class="course-price">฿ ${c.price}</div>

      <div class="seat-bar-bg">
        <div class="seat-bar-fill" style="width: ${percent}%"></div>
      </div>
      <div class="seat-info">
        <span>คนลงเรียน: <strong>${enrolled}</strong></span>
        <span>รับได้: <strong>${max}</strong></span>
      </div>
    </div>
  `;
}

async function loadHomeCourses() {
  const r = await api("/api/home/courses");
  const grid = $("#courseGrid");

  if (!r.ok || !r.data.length) {
    grid.innerHTML = "<p>ยังไม่มีคอร์สในระบบ</p>";
    return;
  }
  grid.innerHTML = r.data.map(renderCourseCard).join("");
}


// ============================================================
// [5] หน้า CRUD (ใช้ร่วมกันทั้ง ผู้เรียน / คอร์ส / บทเรียน / ลงทะเบียน)
// ============================================================

// ---------- 5.1 สร้างช่องฟอร์ม (แยกตามชนิดช่อง) ----------

function selectInput(f, prefix, value) {
  return `<select id="${prefix}${f.key}">` +
    f.options.map(o => `<option value="${o}" ${o === value ? "selected" : ""}>${o || "ทั้งหมด"}</option>`).join("") +
    `</select>`;
}

// dropdown เลือกวิชาบังคับก่อน (ตัดคอร์สที่กำลังแก้ไขออก)
function courseSelectInput(f, prefix, value) {
  return `<select id="${prefix}${f.key}">` +
    `<option value="">— ไม่มี (ไม่ต้องเรียนก่อน) —</option>` +
    allCourseOptions
      .filter(c => c.course_id !== editingId)
      .map(c => `<option value="${c.course_id}" ${String(c.course_id) === String(value) ? "selected" : ""}>${c.course_id} - ${c.title}</option>`)
      .join("") +
    `</select>`;
}

function learnerAutocompleteInput(f, prefix, value) {
  return `<input list="list_learners" id="${prefix}${f.key}" placeholder="พิมพ์รหัสหรือชื่อ..." value="${value ?? ""}">` +
    `<datalist id="list_learners">` +
    allLearnerOptions.map(l => `<option value="${l.learner_id}">${l.learner_id} : ${l.name}</option>`).join("") +
    `</datalist>`;
}

function courseAutocompleteInput(f, prefix, value) {
  return `<input list="list_courses" id="${prefix}${f.key}" placeholder="พิมพ์รหัสหรือชื่อ..." value="${value ?? ""}">` +
    `<datalist id="list_courses">` +
    allCourseOptions.map(c => `<option value="${c.course_id}">${c.course_id} : ${c.title}</option>`).join("") +
    `</datalist>`;
}

function plainInput(f, prefix, value) {
  return `<input id="${prefix}${f.key}" type="${f.type}" value="${value ?? ""}">`;
}

// prefix: "s_" = ช่องค้นหา, "f_" = ช่องในฟอร์ม Modal
function fieldHtml(f, prefix, value = "") {
  let input;
  if (f.type === "select")                    input = selectInput(f, prefix, value);
  else if (f.type === "dynamic_course")       input = courseSelectInput(f, prefix, value);
  else if (f.type === "autocomplete_learner") input = learnerAutocompleteInput(f, prefix, value);
  else if (f.type === "autocomplete_course")  input = courseAutocompleteInput(f, prefix, value);
  else                                        input = plainInput(f, prefix, value);
  return `<div class="field"><label>${f.label}</label>${input}</div>`;
}

// ---------- 5.2 ค้นหา & ตาราง ----------

function buildSearch() {
  const cfg = ENTITIES[current];
  if (!cfg) return;
  $("#searchTitle").textContent = cfg.label;
  $("#searchFields").innerHTML = cfg.search.map(f => fieldHtml(f, "s_")).join("");
}

async function doSearch() {
  const cfg = ENTITIES[current];
  const params = new URLSearchParams();
  cfg.search.forEach(f => {
    const v = $("#s_" + f.key).value;
    if (v) params.append(f.key, v);
  });
  setStatus($("#status"), "กำลังค้นหา...");
  renderTable(await api(cfg.api + "?" + params.toString()));
}

function renderTable(r) {
  const head = $("#tableHead"), body = $("#tableBody"), st = $("#status");
  head.innerHTML = "";
  body.innerHTML = "";
  if (!r.ok) { setStatus(st, "⚠️ " + r.error, "err"); return; }

  const rows = r.data || [];
  if (rows.length === 0) { setStatus(st, "ไม่พบข้อมูล"); return; }
  setStatus(st, `พบ ${rows.length} รายการ`);

  const cols = Object.keys(rows[0]);
  head.innerHTML = cols.map(c => `<th>${c}</th>`).join("") + "<th>จัดการ</th>";
  body.innerHTML = rows.map(row => {
    const id = row[ENTITIES[current].idKey];
    return `<tr>` + cols.map(c => `<td>${row[c] ?? "—"}</td>`).join("") +
      `<td><button class="btn sm" onclick="editRow('${id}')">แก้ไข</button> ` +
      `<button class="btn sm del" onclick="deleteRow('${id}')">ลบ</button></td></tr>`;
  }).join("");
}

// ---------- 5.3 ฟอร์ม Modal & ปุ่มจัดการ (เพิ่ม / แก้ไข / ลบ) ----------

async function openForm(title, data = {}) {
  // โหลดรายการคอร์ส/ผู้เรียนมาใส่ dropdown ตามตารางที่เปิดอยู่
  if (["courses", "enrollments", "lessons"].includes(current)) {
    const res = await api("/api/courses");
    allCourseOptions = res.ok ? res.data : [];
  }
  if (current === "enrollments") {
    const resL = await api("/api/learners");
    allLearnerOptions = resL.ok ? resL.data : [];
  }
  $("#modalTitle").textContent = title;
  $("#formFields").innerHTML = ENTITIES[current].form.map(f => fieldHtml(f, "f_", data[f.key])).join("");
  $("#modal").classList.remove("hidden");
}

function collectForm() {
  const d = {};
  ENTITIES[current].form.forEach(f => d[f.key] = $("#f_" + f.key).value);
  return d;
}

async function editRow(id) {
  const r = await api(ENTITIES[current].api + "/" + id);
  if (!r.ok) return alert("⚠️ " + r.error);
  editingId = id;
  await openForm("แก้ไขข้อมูล", r.data);
}

async function deleteRow(id) {
  if (!confirm("ยืนยันการลบ?")) return;
  const r = await api(ENTITIES[current].api + "/" + id, { method: "DELETE" });
  if (!r.ok) return alert("⚠️ " + r.error);
  doSearch();
}

async function save() {
  const data = collectForm();
  const opts = {
    method: editingId ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  };
  const url = editingId ? `${ENTITIES[current].api}/${editingId}` : ENTITIES[current].api;
  const r = await api(url, opts);
  if (!r.ok) return alert("⚠️ " + r.error);
  $("#modal").classList.add("hidden");
  doSearch();
}

// ---------- 5.4 ผูกปุ่มต่างๆ ของหน้า CRUD ----------

$("#btnSearch").onclick = doSearch;
$("#btnClear").onclick = () => buildSearch();
$("#btnAdd").onclick = async () => { editingId = null; await openForm("เพิ่มข้อมูลใหม่"); };
$("#btnSave").onclick = save;
$("#btnCancel").onclick = () => $("#modal").classList.add("hidden");


// ============================================================
// [6] หน้าจัดการ Progress (ราย Enrollment)
// ============================================================

// ---------- 6.1 Dropdown เลือก Enrollment ----------
async function initProgressDropdown() {
  const r = await api("/api/enrollments");
  const sel = $("#selEnrollment");
  sel.innerHTML = '<option value="">— กรุณาเลือกรายการลงทะเบียน —</option>';
  if (r.ok && r.data) {
    r.data.forEach(e => {
      sel.innerHTML += `<option value="${e.enroll_id}">Enrollment #${e.enroll_id}: ${e.learner_name} — ${e.course_title} [${e.status}]</option>`;
    });
  }
}

// ---------- 6.2 โหลด & แสดงรายการบทเรียนของ Enrollment ----------

// สลับข้อความ "เรียนแล้ว / ยังไม่เรียน" ทันทีที่ติ๊ก checkbox (เรียกจาก onchange)
function onLessonToggle(cb) {
  const txt = cb.nextElementSibling;
  if (cb.checked) {
    txt.textContent = '✓ เรียนแล้ว';
    txt.style.color = '#16a34a';
  } else {
    txt.textContent = 'ยังไม่เรียน';
    txt.style.color = '#64748b';
  }
}

function renderLessonItem(ls) {
  return `
    <label class="lesson-item">
      <span><strong>${ls.seq_no}.</strong> ${ls.title} <small>(${ls.duration_min} min)</small></span>
      <span style="display: flex; align-items: center; gap: 8px;">
        <input type="checkbox" class="chk-lesson" value="${ls.lesson_id}" ${ls.watched ? "checked" : ""}
               onchange="onLessonToggle(this)">
        <span style="font-size: 13px; font-weight: bold; color: ${ls.watched ? '#16a34a' : '#64748b'};">${ls.watched ? "✓ เรียนแล้ว" : "ยังไม่เรียน"}</span>
      </span>
    </label>
  `;
}

async function loadEnrollmentProgress(enrollId) {
  activeEnrollId = enrollId;
  const card = $("#progressCard"), msg = $("#progressMsg");
  if (!enrollId) return card.classList.add("hidden");

  setStatus(msg, "กำลังโหลด...");
  const r = await api(`/api/enrollments/${enrollId}/progress`);
  if (!r.ok) return setStatus(msg, r.error, "err");
  setStatus(msg, "");

  const { enrollment, lessons } = r.data;
  $("#p_enroll_title").textContent = `Enrollment #${enrollment.enroll_id}`;
  $("#p_learner_name").textContent = enrollment.learner_name;
  $("#p_course_title").textContent = enrollment.course_title;
  $("#p_status").textContent = enrollment.status;
  $("#p_status").className = "status " + (enrollment.status === "completed" ? "todo" : "");

  $("#lessonList").innerHTML = lessons.length
    ? lessons.map(renderLessonItem).join("")
    : "<div>คอร์สนี้ยังไม่มีบทเรียน</div>";
  card.classList.remove("hidden");
}

// ---------- 6.3 บันทึก Progress ----------
async function saveEnrollmentProgress() {
  if (!activeEnrollId) return;
  const watchedIds = Array.from(document.querySelectorAll(".chk-lesson:checked")).map(cb => parseInt(cb.value));
  const msg = $("#progressMsg");
  setStatus(msg, "กำลังบันทึก...");

  const res = await api(`/api/enrollments/${activeEnrollId}/progress`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ watched_lesson_ids: watchedIds })
  });

  if (!res.ok) return setStatus(msg, res.error, "err");

  alert(`บันทึกเรียบร้อย! สถานะปัจจุบัน: ${res.data.status}`);
  await loadEnrollmentProgress(activeEnrollId);
  await initProgressDropdown();
}


// ============================================================
// [7] เริ่มต้นระบบ (Initialize)
// ============================================================

// เปิดหน้า Home เป็นค่าเริ่มต้นเมื่อโหลดเว็บ
window.onload = () => {
  switchView('home', document.querySelector('.nav-link.active'));
};