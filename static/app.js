const ENTITIES = {
  "learners": {
    "label": "ผู้เรียน",
    "api": "/api/learners",
    "idKey": "learner_id",
    "search": [
      { "key": "name", "label": "ชื่อ", "type": "text" },
      { "key": "email", "label": "อีเมล", "type": "text" }
    ],
    "form": [
      { "key": "name", "label": "ชื่อ", "type": "text" },
      { "key": "email", "label": "อีเมล", "type": "text" },
      { "key": "join_date", "label": "วันที่สมัคร", "type": "date" }
    ]
  },
  "courses": {
    "label": "คอร์ส",
    "api": "/api/courses",
    "idKey": "course_id",
    "search": [
      { "key": "title", "label": "ชื่อคอร์ส", "type": "text" },
      {
        "key": "category", "label": "หมวดหมู่", "type": "select",
        "options": ["", "Data", "Programming", "Design", "Business"]
      }
    ],
    "form": [
      { "key": "title", "label": "ชื่อคอร์ส", "type": "text" },
      {
        "key": "category", "label": "หมวดหมู่", "type": "select",
        "options": ["Data", "Programming", "Design", "Business"]
      },
      { "key": "price", "label": "ราคา", "type": "number" },
      { "key": "prerequisite_id", "label": "วิชาที่ต้องเรียนก่อน", "type": "dynamic_course" }
    ]
  },
  "lessons": {
    "label": "บทเรียน",
    "api": "/api/lessons",
    "idKey": "lesson_id",
    "search": [
      { "key": "course_id", "label": "รหัสคอร์ส", "type": "number" },
      { "key": "title", "label": "ชื่อบทเรียน", "type": "text" }
    ],
    "form": [
      { "key": "course_id", "label": "คอร์ส (พิมพ์รหัสหรือชื่อ)", "type": "autocomplete_course" },
      { "key": "title", "label": "ชื่อบทเรียน", "type": "text" },
      { "key": "seq_no", "label": "ลำดับตอนที่", "type": "number" },
      { "key": "duration_min", "label": "เวลา (นาที)", "type": "number" }
    ]
  },
  "enrollments": {
    "label": "การลงทะเบียน",
    "api": "/api/enrollments",
    "idKey": "enroll_id",
    "search": [
      { "key": "learner_id", "label": "รหัสผู้เรียน", "type": "number" },
      { "key": "course_id", "label": "รหัสคอร์ส", "type": "number" },
      {
        "key": "status", "label": "สถานะ", "type": "select",
        "options": ["", "studying", "completed"]
      }
    ],
    "form": [
      { "key": "learner_id", "label": "ผู้เรียน (พิมพ์รหัสหรือชื่อ)", "type": "autocomplete_learner" },
      { "key": "course_id", "label": "คอร์ส (พิมพ์รหัสหรือชื่อ)", "type": "autocomplete_course" },
      { "key": "enroll_date", "label": "วันที่ลงทะเบียน", "type": "date" },
      {
        "key": "status", "label": "สถานะ", "type": "select",
        "options": ["studying", "completed"]
      }
    ]
  }
};

let current = Object.keys(ENTITIES)[0];
let editingId = null;
let allCourseOptions = [];
let allLearnerOptions = [];
let activeEnrollId = null;

const $ = (s) => document.querySelector(s);
function setStatus(el, msg, cls = "") { el.className = "status " + cls; el.textContent = msg; }
async function api(url, opts) { const res = await fetch(url, opts); return res.json(); }

function fieldHtml(f, prefix, value = "") {
  let input;
  if (f.type === "select") {
    input = '<select id="' + prefix + f.key + '">' +
      f.options.map(o => '<option value="' + o + '"' + (o === value ? " selected" : "") + '>' + (o || "ทั้งหมด") + '</option>').join("") + '</select>';
  } else if (f.type === "dynamic_course") {
    input = '<select id="' + prefix + f.key + '">' +
      '<option value="">— ไม่มี (ไม่ต้องเรียนก่อน) —</option>' +
      allCourseOptions
        .filter(c => c.course_id !== editingId)
        .map(c => '<option value="' + c.course_id + '"' + (String(c.course_id) === String(value) ? " selected" : "") + '>' + c.course_id + ' - ' + c.title + '</option>')
        .join("") +
      '</select>';
  } else if (f.type === "autocomplete_learner") {
    input = '<input list="list_learners" id="' + prefix + f.key + '" placeholder="พิมพ์รหัสหรือชื่อผู้เรียน..." value="' + (value ?? "") + '">' +
      '<datalist id="list_learners">' +
      allLearnerOptions.map(l => '<option value="' + l.learner_id + '">' + l.learner_id + ' : ' + l.name + ' (' + l.email + ')</option>').join("") +
      '</datalist>';
  } else if (f.type === "autocomplete_course") {
    input = '<input list="list_courses" id="' + prefix + f.key + '" placeholder="พิมพ์รหัสหรือชื่อคอร์ส..." value="' + (value ?? "") + '">' +
      '<datalist id="list_courses">' +
      allCourseOptions.map(c => '<option value="' + c.course_id + '">' + c.course_id + ' : ' + c.title + '</option>').join("") +
      '</datalist>';
  } else { 
    input = '<input id="' + prefix + f.key + '" type="' + f.type + '" value="' + (value ?? "") + '">'; 
  }
  return '<div class="field"><label>' + f.label + '</label>' + input + '</div>';
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
  if (!r.ok) { setStatus(st, (r.todo ? "🚧 " : "⚠️ ") + r.error, r.todo ? "todo" : "err"); return; }
  const rows = r.data || [];
  if (rows.length === 0) { setStatus(st, "ไม่พบข้อมูล"); return; }
  setStatus(st, "พบ " + rows.length + " รายการ");
  const cols = Object.keys(rows[0]);
  head.innerHTML = cols.map(c => "<th>" + c + "</th>").join("") + "<th>จัดการ</th>";
  body.innerHTML = rows.map(row => {
    const id = row[ENTITIES[current].idKey];
    return "<tr>" + cols.map(c => "<td>" + (row[c] ?? "—") + "</td>").join("") +
      '<td><button class="btn sm" onclick="editRow(' + id + ')">แก้ไข</button> ' +
      '<button class="btn sm del" onclick="deleteRow(' + id + ')">ลบ</button></td></tr>';
  }).join("");
}

async function openForm(title, data = {}) {
  const cfg = ENTITIES[current];
  
  if (current === "courses" || current === "enrollments" || current === "lessons") {
    const res = await api("/api/courses");
    allCourseOptions = res.ok ? res.data : [];
  }
  if (current === "enrollments") {
    const resL = await api("/api/learners");
    allLearnerOptions = resL.ok ? resL.data : [];
  }

  $("#modalTitle").textContent = title;
  $("#formFields").innerHTML = cfg.form.map(f => fieldHtml(f, "f_", data[f.key])).join("");
  $("#modal").classList.remove("hidden");
}

function collectForm() { 
  const cfg = ENTITIES[current], d = {}; 
  cfg.form.forEach(f => d[f.key] = $("#f_" + f.key).value); 
  return d; 
}

async function editRow(id) {
  const cfg = ENTITIES[current];
  const r = await api(cfg.api + "/" + id);
  if (!r.ok) { alert((r.todo ? "🚧 " : "⚠️ ") + r.error); return; }
  editingId = id; 
  await openForm("แก้ไขข้อมูล", r.data);
}

async function deleteRow(id) {
  if (!confirm("ยืนยันการลบ?")) return;
  const r = await api(ENTITIES[current].api + "/" + id, { method: "DELETE" });
  if (!r.ok) { alert((r.todo ? "🚧 " : "⚠️ ") + r.error); return; }
  doSearch();
}

async function save() {
  const cfg = ENTITIES[current], data = collectForm();
  const opts = { method: editingId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) };
  const r = await api(editingId ? cfg.api + "/" + editingId : cfg.api, opts);
  if (!r.ok) { alert((r.todo ? "🚧 " : "⚠️ ") + r.error); return; }
  $("#modal").classList.add("hidden"); 
  doSearch();
}

// ระบบสลับแท็บ ควบคุมการแสดงผลไม่ให้ส่วน Progress โผล่มาปน
document.querySelectorAll(".tab").forEach(t => t.addEventListener("click", async (e) => {
  document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
  e.currentTarget.classList.add("active"); 
  current = e.currentTarget.dataset.entity;

  const crudSec = document.getElementById("crudSection");
  const progSec = document.getElementById("progressSection");

  if (current === "progress_manager") {
    crudSec.style.display = "none";
    progSec.style.display = "block";
    await initProgressDropdown();
  } else {
    crudSec.style.display = "block";
    progSec.style.display = "none";
    buildSearch(); 
    document.getElementById("tableHead").innerHTML = ""; 
    document.getElementById("tableBody").innerHTML = "";
    setStatus(document.getElementById("status"), 'กด "ค้นหา" เพื่อแสดงข้อมูล');
  }
}));

$("#btnSearch").onclick = doSearch;
$("#btnClear").onclick = () => buildSearch();
$("#btnAdd").onclick = async () => { editingId = null; await openForm("เพิ่มข้อมูลใหม่"); };
$("#btnSave").onclick = save;
$("#btnCancel").onclick = () => $("#modal").classList.add("hidden");

// ---------- ส่วนจัดการ Progress ราย Enrollment ----------
async function initProgressDropdown() {
  const r = await api("/api/enrollments");
  const sel = document.getElementById("selEnrollment");
  sel.innerHTML = '<option value="">— กรุณาเลือกรายการลงทะเบียน —</option>';
  if (r.ok && r.data) {
    r.data.forEach(e => {
      sel.innerHTML += `<option value="${e.enroll_id}">Enrollment #${e.enroll_id}: ${e.learner_name} — ${e.course_title} [${e.status}]</option>`;
    });
  }
}

async function loadEnrollmentProgress(enrollId) {
  activeEnrollId = enrollId;
  const card = document.getElementById("progressCard");
  const msg = document.getElementById("progressMsg");
  if (!enrollId) {
    card.style.display = "none";
    return;
  }

  setStatus(msg, "กำลังโหลดข้อมูลบทเรียน...");
  const r = await api(`/api/enrollments/${enrollId}/progress`);
  if (!r.ok) {
    setStatus(msg, r.error, "err");
    return;
  }
  setStatus(msg, "");

  const { enrollment, lessons } = r.data;
  document.getElementById("p_enroll_title").textContent = `Enrollment #${enrollment.enroll_id}`;
  document.getElementById("p_learner_name").textContent = enrollment.learner_name;
  document.getElementById("p_course_title").textContent = enrollment.course_title;
  document.getElementById("p_status").textContent = enrollment.status;
  document.getElementById("p_status").className = "status " + (enrollment.status === "completed" ? "todo" : "");

  const container = document.getElementById("lessonList");
  if (!lessons.length) {
    container.innerHTML = "<div>คอร์สนี้ยังไม่มีบทเรียน</div>";
  } else {
    container.innerHTML = lessons.map(ls => `
      <label style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; cursor: pointer;">
        <span><strong>${ls.seq_no}.</strong> ${ls.title} <small style="color: #64748b;">(${ls.duration_min} min)</small></span>
        <span style="display: flex; align-items: center; gap: 8px;">
          <input type="checkbox" class="chk-lesson" value="${ls.lesson_id}" ${ls.watched ? "checked" : ""} onchange="const txt = this.nextElementSibling; if (this.checked) { txt.textContent = '✓ เรียนแล้ว'; txt.style.color = '#16a34a'; } else { txt.textContent = 'ยังไม่เรียน'; txt.style.color = '#64748b'; }">
          <span style="font-size: 13px; font-weight: bold; color: ${ls.watched ? '#16a34a' : '#64748b'};">${ls.watched ? "✓ เรียนแล้ว" : "ยังไม่เรียน"}</span>
        </span>
      </label>
    `).join("");
  }

  card.style.display = "block";
}

async function saveEnrollmentProgress() {
  if (!activeEnrollId) return;
  const checkboxes = document.querySelectorAll(".chk-lesson:checked");
  const watchedIds = Array.from(checkboxes).map(cb => parseInt(cb.value));

  const msg = document.getElementById("progressMsg");
  setStatus(msg, "กำลังบันทึกความคืบหน้า...");

  const res = await api(`/api/enrollments/${activeEnrollId}/progress`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ watched_lesson_ids: watchedIds })
  });

  if (!res.ok) {
    alert("บันทึกไม่สำเร็จ: " + res.error);
    setStatus(msg, res.error, "err");
    return;
  }

  alert(`บันทึกเรียบร้อย! สถานะปัจจุบัน: ${res.data.status}`);
  await loadEnrollmentProgress(activeEnrollId);
  await initProgressDropdown();
}

// เริ่มต้นระบบ
buildSearch();
setStatus($("#status"), 'กด "ค้นหา" เพื่อแสดงข้อมูล');