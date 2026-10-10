// ============================================================
//  report.js — ตรรกะหน้ารายงาน Dashboard & Analytics
// ============================================================
//
//  สารบัญ (กด Ctrl+F แล้วค้นหาเลขหัวข้อ เช่น "[4]" ได้เลย)
//  เรียงตามลำดับที่แสดงบนหน้าเว็บ จากบนลงล่าง
//
//   [1] ฟังก์ชันช่วยทั่วไป           $, api, formatMoney, pick, rowsOrShowStatus
//   [2] ตัวเลขสรุปด้านบน             loadSummary                -> /api/reports/summary
//   [3] รายได้และส่วนลด              renderRevenueReport        -> /api/reports/revenue
//   [4] Leaderboard คอร์สยอดนิยม     renderPopularLeaderboard   -> /api/reports/popular-courses
//   [5] อัตราการเรียนจบ              renderCompletionCards      -> /api/reports/completion-rate
//   [6] ตารางวิชาบังคับก่อน           fillTable                  -> /api/reports/prerequisites
//   [7] เริ่มต้นระบบ                 loadAll
//
//  หมายเหตุ: หัวคอลัมน์ภาษาไทย (เช่น 'ชื่อคอร์ส') มาจากชื่อ alias ใน SQL ของ db.py
//  ถ้าเปลี่ยนชื่อ alias ใน db.py ต้องมาแก้ที่นี่ให้ตรงกันด้วย
// ============================================================


// ============================================================
// [1] ฟังก์ชันช่วยทั่วไป
// ============================================================

const $ = (s) => document.querySelector(s);

async function api(url) {
  return (await fetch(url)).json();
}

function formatMoney(num) {
  return "฿ " + Number(num || 0).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// อ่านค่าจากแถวข้อมูลด้วยชื่อคอลัมน์ ถ้าไม่พบให้ใช้คอลัมน์ลำดับที่ index แทน
function pick(row, key, index) {
  return row[key] || Object.values(row)[index];
}

// ตรวจผลลัพธ์จาก API: ถ้า error หรือไม่มีข้อมูล จะแสดงข้อความสถานะแล้วคืน null
// ถ้ามีข้อมูล จะล้างข้อความสถานะแล้วคืน rows
function rowsOrShowStatus(r, st, emptyMsg) {
  if (!r.ok) {
    st.className = "status err";
    st.textContent = "⚠️ " + r.error;
    return null;
  }
  const rows = r.data || [];
  if (!rows.length) {
    st.className = "status";
    st.textContent = emptyMsg;
    return null;
  }
  st.textContent = "";
  return rows;
}


// ============================================================
// [2] ตัวเลขสรุปด้านบน
// ============================================================

async function loadSummary() {
  const r = await api("/api/reports/summary");
  if (!r.ok) return;
  const d = r.data || {};
  if (d.learners !== undefined) $("#m_lrn").textContent = d.learners;
  if (d.courses !== undefined) $("#m_crs").textContent = d.courses;
  if (d.enrollments !== undefined) $("#m_enr").textContent = d.enrollments;
  if (d.lessons !== undefined) $("#m_les").textContent = d.lessons;
}


// ============================================================
// [3] 💰 รายงานสรุปรายได้และส่วนลด
// ============================================================

// รูปแบบการ์ดของแต่ละระดับสมาชิก (key ต้องตรงกับ tiers ที่ db.py ส่งมา)
const TIER_CONFIGS = [
  { key: "Standard", icon: "🥉", class: "tier-standard", title: "Standard Member" },
  { key: "Silver",   icon: "🥈", class: "tier-silver",   title: "Silver Member" },
  { key: "Gold",     icon: "🥇", class: "tier-gold",     title: "Gold Member" }
];

function renderTierCard(cfg, tiers) {
  const t = tiers[cfg.key] || { enroll_count: 0, discount_pct: "0%", discount_amount: 0, net_amount: 0 };
  return `
    <div class="tier-card ${cfg.class}">
      <div class="tier-header">
        <span class="tier-name">${cfg.icon} ${cfg.title}</span>
        <span class="tier-badge">ลด ${t.discount_pct}</span>
      </div>
      <div class="tier-stats">
        <div class="tier-stat-row">
          <span>ลงทะเบียนแล้ว:</span>
          <strong>${t.enroll_count} คน</strong>
        </div>
        <div class="tier-stat-row discount-row">
          <span>ประหยัด/ส่วนลดรวม:</span>
          <strong>- ${formatMoney(t.discount_amount)}</strong>
        </div>
        <div class="tier-stat-row" style="border-top: 1px dashed #e2e8f0; padding-top: 6px;">
          <span>รายได้สุทธิ:</span>
          <strong style="color: #16a34a;">${formatMoney(t.net_amount)}</strong>
        </div>
      </div>
    </div>
  `;
}

function renderRevenueReport(r) {
  if (!r.ok || !r.data) return;
  const { overview, tiers } = r.data;

  // ตัวเลขภาพรวม
  $("#rev_gross").textContent = formatMoney(overview.total_gross_revenue);
  $("#rev_discount").textContent = "- " + formatMoney(overview.total_discount_amount);
  $("#rev_net").textContent = formatMoney(overview.total_net_revenue);

  // การ์ด 3 ระดับ
  $("#tierGrid").innerHTML = TIER_CONFIGS.map(cfg => renderTierCard(cfg, tiers)).join("");
}


// ============================================================
// [4] 🏆 Leaderboard คอร์สยอดนิยม
// ============================================================

// ป้ายอันดับ 1-5 (อันดับที่เกินนี้ใช้ค่าเริ่มต้นในฟังก์ชันด้านล่าง)
const RANK_BADGES = [
  { icon: "🥇", class: "rank-1" },
  { icon: "🥈", class: "rank-2" },
  { icon: "🥉", class: "rank-3" },
  { icon: "4",  class: "rank-other" },
  { icon: "5",  class: "rank-other" }
];

function renderRankingCard(row, index, maxEnroll) {
  const title = pick(row, 'ชื่อคอร์ส', 0);
  const count = Number(pick(row, 'จำนวนผู้ลงทะเบียน', 1) || 0);
  const badge = RANK_BADGES[index] || { icon: index + 1, class: "rank-other" };
  const percent = Math.min(Math.round((count / maxEnroll) * 100), 100);

  return `
    <div class="ranking-card ${badge.class}">
      <div class="ranking-badge">${badge.icon}</div>
      <div class="ranking-info">
        <div class="ranking-header">
          <span class="ranking-title">${title}</span>
          <span class="ranking-count">👥 <strong>${count}</strong> คน</span>
        </div>
        <div class="ranking-bar-bg">
          <div class="ranking-bar-fill" style="width: ${percent}%;"></div>
        </div>
      </div>
    </div>
  `;
}

function renderPopularLeaderboard(r) {
  const container = $("#popularLeaderboard");
  container.innerHTML = "";

  const rows = rowsOrShowStatus(r, $("#popularStatus"), "ยังไม่มีข้อมูลการลงทะเบียน");
  if (!rows) return;

  // จำนวนสูงสุด ใช้เป็น 100% ของแถบกราฟ
  const maxEnroll = Math.max(...rows.map(row => Number(pick(row, 'จำนวนผู้ลงทะเบียน', 1) || 0))) || 1;

  container.innerHTML = rows.map((row, index) => renderRankingCard(row, index, maxEnroll)).join("");
}


// ============================================================
// [5] 🎯 Completion Analytics (อัตราการเรียนจบ)
// ============================================================

function renderCompletionCard(row) {
  const title = pick(row, 'ชื่อคอร์ส', 0);
  const total = Number(pick(row, 'ผู้ลงทะเบียนทั้งหมด', 1) || 0);
  const completed = Number(pick(row, 'เรียนจบแล้ว', 2) || 0);
  const rateStr = pick(row, 'อัตราการเรียนจบ', 3) || "0 %";
  const percentNum = parseFloat(rateStr) || 0;
  const isPerfect = percentNum >= 100;
  const studying = Math.max(total - completed, 0);

  return `
    <div class="completion-card ${isPerfect ? 'perfect-score' : ''}">
      <div class="completion-header">
        <div>
          <h4 class="completion-title">${title}</h4>
          <span class="completion-sub">ลงทะเบียนทั้งหมด ${total} คน</span>
        </div>
        <div class="rate-badge ${isPerfect ? 'badge-perfect' : ''}">
          ${rateStr}
        </div>
      </div>

      <div class="completion-progress-bg">
        <div class="completion-progress-fill" style="width: ${percentNum}%;"></div>
      </div>

      <div class="completion-metrics">
        <div class="c-metric">
          <span class="dot done"></span>
          <span>เรียนจบแล้ว: <strong>${completed}</strong></span>
        </div>
        <div class="c-metric">
          <span class="dot pending"></span>
          <span>กำลังเรียน: <strong>${studying}</strong></span>
        </div>
      </div>
    </div>
  `;
}

function renderCompletionCards(r) {
  const container = $("#completionGrid");
  container.innerHTML = "";

  const rows = rowsOrShowStatus(r, $("#completionStatus"), "ไม่มีข้อมูลอัตราการเรียนจบ");
  if (!rows) return;

  container.innerHTML = rows.map(renderCompletionCard).join("");
}


// ============================================================
// [6] 🔗 ตารางวิชาบังคับก่อน (ตารางทั่วไป วาดตามคอลัมน์ที่ได้มา)
// ============================================================

function fillTable(tableSel, statusSel, r) {
  const t = $(tableSel), st = $(statusSel);
  const thead = t.querySelector("thead"), tbody = t.querySelector("tbody");
  thead.innerHTML = "";
  tbody.innerHTML = "";

  const rows = rowsOrShowStatus(r, st, "ไม่มีข้อมูล");
  if (!rows) return;

  const cols = Object.keys(rows[0]);
  thead.innerHTML = "<tr>" + cols.map(c => "<th>" + c + "</th>").join("") + "</tr>";
  tbody.innerHTML = rows.map(row =>
    "<tr>" + cols.map(c => "<td>" + (row[c] ?? "—") + "</td>").join("") + "</tr>"
  ).join("");
}


// ============================================================
// [7] เริ่มต้นระบบ (โหลดรายงานทั้งหมดตามลำดับบนหน้าเว็บ)
// ============================================================

async function loadAll() {
  loadSummary();
  renderRevenueReport(await api("/api/reports/revenue"));
  renderPopularLeaderboard(await api("/api/reports/popular-courses"));
  renderCompletionCards(await api("/api/reports/completion-rate"));
  fillTable("#prereqTable", "#prereqStatus", await api("/api/reports/prerequisites"));
}

loadAll();