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

let current = "";
let editingId = null;
let allCourseOptions = [];
let allLearnerOptions = [];
let activeEnrollId = null;

const $ = (s) => document.querySelector(s);
function setStatus(el, msg, cls = "") { el.className = "status " + cls; el.textContent = msg; }
async function api(url, opts) { const res = await fetch(url, opts); return res.json(); }

// ----------------------------------------------------
// 1. ระบบจัดการโครงสร้าง UI (Sidebar & Navigation)
// ----------------------------------------------------
function toggleSidebar() {
  $("#sidebar").classList.toggle("closed");
  $("#mainContent").classList.toggle("expanded");
}

async function switchView(viewName, element = null) {
  // เปลี่ยนสถานะแถบเมนูซ้าย
  if(element) {
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
  }

  // ซ่อนหน้าทั้งหมดก่อน
  $("#homeSection").classList.add("hidden");
  $("#crudSection").classList.add("hidden");
  $("#progressSection").classList.add("hidden");

  // ตรวจสอบว่าเลือกเมนูไหน
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

// ----------------------------------------------------
// 2. ระบบดึงข้อมูลและวาดการ์ดหน้า Home (วิบวับเมื่อใกล้เต็ม)
// ----------------------------------------------------
async function loadHomeCourses() {
  const r = await api("/api/home/courses");
  const grid = $("#courseGrid");
  
  if (!r.ok || !r.data.length) {
    grid.innerHTML = "<p>ยังไม่มีคอร์สในระบบ</p>";
    return;
  }

  grid.innerHTML = r.data.map(c => {
    const enrolled = c.enrolled_count || 0;
    const max = c.max_seats || 20;
    const percent = Math.min((enrolled / max) * 100, 100);
    
    // เงื่อนไขใกล้เต็ม: ถ้าน้อยกว่าหรือเท่ากับ 2 ที่ หรือ ถึง 80% แล้ว (และยังไม่เต็ม 100%)
    const isNearFull = (max - enrolled <= 2 || percent >= 80) && enrolled < max;
    const isFull = enrolled >= max;
    
    let extraClass = isNearFull ? "near-full" : "";
    let badgeHtml = isNearFull ? `<div class="badge-hot">🔥 ใกล้เต็ม!</div>` : (isFull ? `<div class="badge-hot" style="background:#475569;">เต็มแล้ว</div>` : "");

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
  }).join("");
}

// ----------------------------------------------------
// 3. ระบบ CRUD (ฟังก์ชันเดิมที่นำมาจัดหมวดหมู่)
// ----------------------------------------------------
function fieldHtml(f, prefix, value = "") {
  let input;
  if (f.type === "select") {
    input = `<select id="${prefix}${f.key}">` +
      f.options.map(o => `<option value="${o}" ${o === value ? "selected" : ""}>${o || "ทั้งหมด"}</option>`).join("") + `</select>`;
  } else if (f.type === "dynamic_course") {
    input = `<select id="${prefix}${f.key}">` +
      `<option value="">— ไม่มี (ไม่ต้องเรียนก่อน) —</option>` +
      allCourseOptions.filter(c => c.course_id !== editingId).map(c => `<option value="${c.course_id}" ${String(c.course_id) === String(value) ? "selected" : ""}>${c.course_id} - ${c.title}</option>`).join("") +
      `</select>`;
  } else if (f.type === "autocomplete_learner") {
    input = `<input list="list_learners" id="${prefix}${f.key}" placeholder="พิมพ์รหัสหรือชื่อ..." value="${value ?? ""}">` +
      `<datalist id="list_learners">` + allLearnerOptions.map(l => `<option value="${l.learner_id}">${l.learner_id} : ${l.name}</option>`).join("") + `</datalist>`;
  } else if (f.type === "autocomplete_course") {
    input = `<input list="list_courses" id="${prefix}${f.key}" placeholder="พิมพ์รหัสหรือชื่อ..." value="${value ?? ""}">` +
      `<datalist id="list_courses">` + allCourseOptions.map(c => `<option value="${c.course_id}">${c.course_id} : ${c.title}</option>`).join("") + `</datalist>`;
  } else { 
    input = `<input id="${prefix}${f.key}" type="${f.type}" value="${value ?? ""}">`; 
  }
  return `<div class="field"><label>${f.label}</label>${input}</div>`;
}

function buildSearch() {
  const cfg = ENTITIES[current];
  if (!cfg) return;
  $("#searchTitle").textContent = cfg.label;
  $("#searchFields").innerHTML = cfg.search.map(f => fieldHtml(f, "s_")).join("");
}

async function doSearch() {
  const cfg = ENTITIES[current];
  const params = new URLSearchParams();
  cfg.search.forEach(f => { const v = $("#s_" + f.key).value; if (v) params.append(f.key, v); });
  setStatus($("#status"), "กำลังค้นหา...");
  renderTable(await api(cfg.api + "?" + params.toString()));
}

function renderTable(r) {
  const head = $("#tableHead"), body = $("#tableBody"), st = $("#status");
  head.innerHTML = ""; body.innerHTML = "";
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

async function openForm(title, data = {}) {
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
  const d = {}; ENTITIES[current].form.forEach(f => d[f.key] = $("#f_" + f.key).value); return d; 
}

async function editRow(id) {
  const r = await api(ENTITIES[current].api + "/" + id);
  if (!r.ok) return alert("⚠️ " + r.error);
  editingId = id; await openForm("แก้ไขข้อมูล", r.data);
}

async function deleteRow(id) {
  if (!confirm("ยืนยันการลบ?")) return;
  const r = await api(ENTITIES[current].api + "/" + id, { method: "DELETE" });
  if (!r.ok) return alert("⚠️ " + r.error);
  doSearch();
}

async function save() {
  const data = collectForm();
  const opts = { method: editingId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) };
  const r = await api(editingId ? `${ENTITIES[current].api}/${editingId}` : ENTITIES[current].api, opts);
  if (!r.ok) return alert("⚠️ " + r.error);
  $("#modal").classList.add("hidden"); 
  doSearch();
}

// ผูก Event ปุ่มต่างๆ หน้า CRUD
$("#btnSearch").onclick = doSearch;
$("#btnClear").onclick = () => buildSearch();
$("#btnAdd").onclick = async () => { editingId = null; await openForm("เพิ่มข้อมูลใหม่"); };
$("#btnSave").onclick = save;
$("#btnCancel").onclick = () => $("#modal").classList.add("hidden");


// ----------------------------------------------------
// 4. หน้าจัดการ Progress (ราย Enrollment)
// ----------------------------------------------------
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

  const container = $("#lessonList");
  if (!lessons.length) {
    container.innerHTML = "<div>คอร์สนี้ยังไม่มีบทเรียน</div>";
  } else {
    container.innerHTML = lessons.map(ls => `
      <label class="lesson-item">
        <span><strong>${ls.seq_no}.</strong> ${ls.title} <small>(${ls.duration_min} min)</small></span>
        <span style="display: flex; align-items: center; gap: 8px;">
          <input type="checkbox" class="chk-lesson" value="${ls.lesson_id}" ${ls.watched ? "checked" : ""} 
                 onchange="const txt = this.nextElementSibling; if(this.checked){txt.textContent='✓ เรียนแล้ว'; txt.style.color='#16a34a';}else{txt.textContent='ยังไม่เรียน'; txt.style.color='#64748b';}">
          <span style="font-size: 13px; font-weight: bold; color: ${ls.watched ? '#16a34a' : '#64748b'};">${ls.watched ? "✓ เรียนแล้ว" : "ยังไม่เรียน"}</span>
        </span>
      </label>
    `).join("");
  }
  card.classList.remove("hidden");
}

async function saveEnrollmentProgress() {
  if (!activeEnrollId) return;
  const watchedIds = Array.from(document.querySelectorAll(".chk-lesson:checked")).map(cb => parseInt(cb.value));
  const msg = $("#progressMsg");
  setStatus(msg, "กำลังบันทึก...");

  const res = await api(`/api/enrollments/${activeEnrollId}/progress`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ watched_lesson_ids: watchedIds })
  });

  if (!res.ok) return setStatus(msg, res.error, "err");
  
  alert(`บันทึกเรียบร้อย! สถานะปัจจุบัน: ${res.data.status}`);
  await loadEnrollmentProgress(activeEnrollId);
  await initProgressDropdown();
}

// ----------------------------------------------------
// เริ่มต้นระบบ (Initialize)
// ----------------------------------------------------
// เปิดหน้า Home เป็นค่าเริ่มต้นเมื่อโหลดเว็บ
window.onload = () => {
  switchView('home', document.querySelector('.nav-link.active'));
};