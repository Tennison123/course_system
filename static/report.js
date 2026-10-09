// ============================================================
//  report.js — ตรรกะหน้ารายงาน Dashboard & Analytics
// ============================================================
const $ = (s) => document.querySelector(s);
async function api(url) { return (await fetch(url)).json(); }

function formatMoney(num) {
  return "฿ " + Number(num || 0).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// 💰 1. แสดงรายงานสรุปรายได้และส่วนลด
function renderRevenueReport(r) {
  if (!r.ok || !r.data) return;
  const { overview, tiers } = r.data;

  // ใส่ตัวเลขภาพรวม
  $("#rev_gross").textContent = formatMoney(overview.total_gross_revenue);
  $("#rev_discount").textContent = "- " + formatMoney(overview.total_discount_amount);
  $("#rev_net").textContent = formatMoney(overview.total_net_revenue);

  // วาดการ์ด 3 ระดับ
  const tierGrid = $("#tierGrid");
  const tierConfigs = [
    { key: "Standard", icon: "🥉", class: "tier-standard", title: "Standard Member" },
    { key: "Silver", icon: "🥈", class: "tier-silver", title: "Silver Member" },
    { key: "Gold", icon: "🥇", class: "tier-gold", title: "Gold Member" }
  ];

  tierGrid.innerHTML = tierConfigs.map(cfg => {
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
  }).join("");
}

// 🏆 2. วาด Leaderboard คอร์สยอดนิยม
function renderPopularLeaderboard(r) {
  const container = $("#popularLeaderboard");
  const st = $("#popularStatus");
  container.innerHTML = "";
  
  if (!r.ok) {
    st.className = "status err";
    st.textContent = "⚠️ " + r.error;
    return;
  }
  const rows = r.data || [];
  if (!rows.length) {
    st.className = "status";
    st.textContent = "ยังไม่มีข้อมูลการลงทะเบียน";
    return;
  }
  st.textContent = "";

  const maxEnroll = Math.max(...rows.map(row => Number(row['จำนวนผู้ลงทะเบียน'] || Object.values(row)[1] || 0))) || 1;

  const badges = [
    { rank: "1", icon: "🥇", class: "rank-1" },
    { rank: "2", icon: "🥈", class: "rank-2" },
    { rank: "3", icon: "🥉", class: "rank-3" },
    { rank: "4", icon: "4", class: "rank-other" },
    { rank: "5", icon: "5", class: "rank-other" }
  ];

  container.innerHTML = rows.map((row, index) => {
    const title = row['ชื่อคอร์ส'] || Object.values(row)[0];
    const count = Number(row['จำนวนผู้ลงทะเบียน'] || Object.values(row)[1] || 0);
    const badge = badges[index] || { rank: index + 1, icon: index + 1, class: "rank-other" };
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
  }).join("");
}

// 🎯 3. วาดการ์ด Completion Analytics
function renderCompletionCards(r) {
  const container = $("#completionGrid");
  const st = $("#completionStatus");
  container.innerHTML = "";

  if (!r.ok) {
    st.className = "status err";
    st.textContent = "⚠️ " + r.error;
    return;
  }
  const rows = r.data || [];
  if (!rows.length) {
    st.className = "status";
    st.textContent = "ไม่มีข้อมูลอัตราการเรียนจบ";
    return;
  }
  st.textContent = "";

  container.innerHTML = rows.map(row => {
    const title = row['ชื่อคอร์ส'] || Object.values(row)[0];
    const total = Number(row['ผู้ลงทะเบียนทั้งหมด'] || Object.values(row)[1] || 0);
    const completed = Number(row['เรียนจบแล้ว'] || Object.values(row)[2] || 0);
    const rateStr = row['อัตราการเรียนจบ'] || Object.values(row)[3] || "0 %";
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
  }).join("");
}

// 🔗 4. ตารางวิชาบังคับก่อน
function fillTable(tableSel, statusSel, r) {
  const t = $(tableSel), st =$(statusSel);
  const thead = t.querySelector("thead"), tbody = t.querySelector("tbody");
  thead.innerHTML = ""; tbody.innerHTML = "";
  if (!r.ok) { st.className = "status err"; st.textContent = "⚠️ " + r.error; return; }
  const rows = r.data || [];
  if (!rows.length) { st.className = "status"; st.textContent = "ไม่มีข้อมูล"; return; }
  st.textContent = "";
  const cols = Object.keys(rows[0]);
  thead.innerHTML = "<tr>" + cols.map(c => "<th>" + c + "</th>").join("") + "</tr>";
  tbody.innerHTML = rows.map(row => "<tr>" + cols.map(c => "<td>" + (row[c] ?? "—") + "</td>").join("") + "</tr>").join("");
}

// สรุปตัวเลขด้านบน
async function loadSummary() {
  const r = await api("/api/reports/summary");
  if (!r.ok) return;
  const d = r.data || {};
  if (d.learners !== undefined) $("#m_lrn").textContent = d.learners;
  if (d.courses !== undefined) $("#m_crs").textContent = d.courses;
  if (d.enrollments !== undefined) $("#m_enr").textContent = d.enrollments;
  if (d.lessons !== undefined) $("#m_les").textContent = d.lessons;
}

async function loadAll() {
  loadSummary();
  renderRevenueReport(await api("/api/reports/revenue"));
  renderPopularLeaderboard(await api("/api/reports/popular-courses"));
  renderCompletionCards(await api("/api/reports/completion-rate"));
  fillTable("#prereqTable", "#prereqStatus", await api("/api/reports/prerequisites"));
}

loadAll();