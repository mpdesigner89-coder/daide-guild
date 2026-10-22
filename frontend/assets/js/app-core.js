/* MODULE 1 — CORE APPLICATION
 * Chứa dữ liệu demo, cấu trúc trang, hàm render và sự kiện nền tảng.
 * Các module bổ sung phía sau đang sử dụng một số hàm/biến toàn cục ở đây,
 * vì vậy các tệp được nạp theo thứ tự cố định bằng script thường (không type=module).
 * Khi nối backend: thay lớp dữ liệu demo bằng services/api-client.js và API server.
 */
/* ================================================================
   MỤC LỤC LOGIC JAVASCRIPT
   A. Dữ liệu và cấu hình demo
   B. Hàm tiện ích và công thức lương
   C. Hàm dựng giao diện (render...)
   D. Điều hướng, modal và sự kiện tương tác
   E. Khởi chạy ứng dụng

   Khi nối backend, thay dữ liệu khởi tạo bằng lớp repository/API rồi gọi lại
   các hàm render. Tránh để giao diện tự quyết định quyền truy cập hoặc lương.
   ================================================================ */
/* =========================================================
   DỮ LIỆU DEMO
   Khi kết nối backend, thay phần dữ liệu khởi tạo này bằng
   dữ liệu lấy từ Firestore/API. Không dùng dữ liệu mẫu để trả lương thật.
   ========================================================= */
const GUILDS = ["Đại Đế", "Nhị Đế", "Tam Đế", "Chấp Niệm"];
const SECTS = ["Thiên Vương", "Ngũ Độc", "Đường Môn", "Nga My", "Thúy Yên", "Cái Bang", "Thiên Nhẫn", "Võ Đang", "Côn Lôn"];
const BOSS_TIMES = ["10:00", "15:00", "19:30", "21:30"];
const DAYS = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"];
const CTC_DAYS = [5, 6, 0]; // Chỉ dùng nhãn hiển thị; map 0=Thứ Sáu, 1=Thứ Bảy, 2=Chủ Nhật ở CTC.
let currentPage = "dashboard";
let toastTimer;
let nextId = 20;
let ctcMode = "separate"; // separate = mỗi bang tự chia quỹ; combined = gộp quỹ CTC.
let members = []; // Chỉ tải danh sách thật từ Firestore.

let expenses = [
  {date:"20/10/2026",type:"Chi Boss",by:"Minh Đế",desc:"Hỗ trợ hoạt động bang",amount:500,approved:true},
  {date:"21/10/2026",type:"Chi Boss",by:"Hắc Long",desc:"Vật phẩm sự kiện",amount:250,approved:false},
  {date:"21/10/2026",type:"Doanh thu",by:"Quản trị",desc:"Đấu giá vật phẩm Boss",amount:12000,approved:true}
];
let revenue = 12000; // Doanh thu đấu giá Boss mẫu (đơn vị: Kim đỉnh).
let ctcFunds = {"Đại Đế":6000,"Nhị Đế":4200,"Tam Đế":3500,"Chấp Niệm":2800};

/* ================================================================
   B. HÀM TIỆN ÍCH VÀ QUY TẮC NGHIỆP VỤ
   - money/ctcMoney/pct: định dạng giá trị để hiển thị.
   - esc: thoát ký tự HTML trước khi đưa dữ liệu vào template string.
   - totalBoss/totalCtc: đếm ca trong dữ liệu hiện tại.
   - isEligible: điều kiện KPI Boss; đổi quy tắc tại đây và kiểm thử các bảng.
   - bossPayroll/ctcPayroll: chia quỹ theo tổng công đã nhân hệ số.
   Các hàm hiện chạy trên dữ liệu demo ở bộ nhớ trình duyệt; backend thật nên
   tính lại phía server để người dùng không thể tự sửa kết quả trả lương.
   ================================================================ */
const money = n => Math.round(Number(n)||0).toLocaleString("vi-VN") + " Kim";
const ctcMoney = n => Math.round(Number(n)||0).toLocaleString("vi-VN") + " Vạn";
const pct = n => Math.round(n*100) + "%";
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
const totalBoss = m => m.boss.length;
const totalCtc = m => m.ctc.length;
const isEligible = m => totalBoss(m) >= 12; // KPI so sánh số nguyên, không dựa vào % làm tròn.
const statusPill = s => `<span class="pill ${s==="Đã nhận"?"green status-received":s==="Đã duyệt"?"green status-approved":s==="Chờ duyệt"?"gold status-pending":s==="Chưa đạt KPI"?"red status-kpi":"gold"}">${esc(s)}</span>`;
const bossExpense = () => expenses.filter(e=>e.type==="Chi Boss" && e.approved).reduce((a,e)=>a+e.amount,0);
const bossFund = () => revenue - bossExpense();
function bossPayroll(m) {
  const eligible = members.filter(isEligible);
  const eligibleUnits = eligible.reduce((sum,x)=>sum+totalBoss(x)*Number(x.coefBoss??x.coef??1),0);
  if (!isEligible(m) || eligibleUnits<=0 || bossFund()<=0) return 0;
  return (totalBoss(m)*Number(m.coefBoss??m.coef??1)/eligibleUnits)*bossFund();
}
function ctcPayroll(m) {
  // Tính lương CTC theo chế độ được chọn: tách quỹ từng bang hoặc gộp 4 bang.
  const guildMembers = ctcMode==="combined" ? members : members.filter(x=>x.guild===m.guild);
  const units = guildMembers.reduce((sum,x)=>sum+totalCtc(x)*Number(x.coefCtc??x.coef??1),0);
  if (units<=0) return 0;
  const fund = ctcMode==="combined" ? Object.values(ctcFunds).reduce((a,b)=>a+b,0) : (ctcFunds[m.guild]||0);
  return (totalCtc(m)*Number(m.coefCtc??m.coef??1)/units)*fund;
}
/* Chuẩn hóa dữ liệu thành viên phục vụ tìm kiếm, kể cả tài khoản phụ. */
function memberSearchText(m) {
  return [m.zalo,m.character,m.guild,m.sect,m.role,...(m.secondaryAccounts||[]).flatMap(a=>[a.name,a.guild,a.sect,a.role])].filter(Boolean).join(" ").toLocaleLowerCase("vi");
}
/* Tìm kiếm không phân biệt dấu tiếng Việt: "thien vuong" vẫn có thể khớp. */
function normalizeSearch(value) { return String(value||"").toLocaleLowerCase("vi").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/g,"d").trim(); }
function guildChip(guild) {
  const cls={"Đại Đế":"guild-dai-de","Nhị Đế":"guild-nhi-de","Tam Đế":"guild-tam-de","Chấp Niệm":"guild-chap-niem"}[guild]||"";
  return `<span class="guild-chip ${cls}">${esc(guild||"Chưa chọn bang")}</span>`;
}
function roleChip(role) {
  const value=role||"Thành viên";
  const cls=/bang chủ|bang chu/i.test(value)?"role-leader":/trưởng lão|truong lao/i.test(value)?"role-elder":/hộ pháp|ho phap/i.test(value)?"role-guardian":"role-member";
  return `<span class="role-chip ${cls}">${esc(value)}</span>`;
}
function sectChip(sect) {
  const index=SECTS.indexOf(sect);
  return `<span class="sect-chip ${index>=0?`sect-${index}`:"sect-martial"}">${esc(sect||"Chưa chọn môn phái")}</span>`;
}
function memberIdentity(m) {
  const accounts=(m.secondaryAccounts||[]).map((a,i)=>`<li class="secondary-account-row"><strong>${esc(a.name||"Acc phụ")}</strong><span>${guildChip(a.guild)}</span><span>${sectChip(a.sect)}</span></li>`).join("");
  return `<div class="member-identity"><div class="identity-top"><span class="member-dot">${esc((m.zalo||"?").slice(0,1))}</span><span class="member-name">${esc(m.zalo)}</span><span class="main-account"><span class="account-dot" aria-label="Nhân vật" title="Nhân vật">♟</span><span>${esc(m.character)}</span></span></div>${(m.secondaryAccounts||[]).length?`<details class="secondary-accounts"><summary>＋ Xem ${m.secondaryAccounts.length} acc phụ</summary><ul>${accounts}</ul></details>`:`<details class="secondary-accounts"><summary>＋ Acc phụ (chưa có)</summary><small class="muted">Chưa khai báo acc phụ.</small></details>`}</div>`;
}
function showToast(message) {
  const toast=document.getElementById("toast"); toast.textContent=message; toast.classList.add("show");
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>toast.classList.remove("show"),2600);
}
/* ================================================================
   C. ĐIỀU HƯỚNG VÀ DỰNG GIAO DIỆN
   setPage(): đổi trang đang hiển thị và trạng thái nút điều hướng.
   renderKpiCards(): tạo các thẻ số liệu tổng quan dùng lại ở nhiều nơi.
   renderDashboard/Attendance/Ctc/Members/Payroll/Finance(): dựng nội dung
   từng trang từ state trong bộ nhớ (members, expenses, revenue, ctcFunds).
   renderAll(): gọi lại toàn bộ renderer sau thao tác làm thay đổi dữ liệu.
   Khi dùng backend, nên nạp dữ liệu trước rồi render; tránh gọi API riêng lẻ
   từ từng renderer để không tạo ra dữ liệu lệch nhau giữa các bảng.
   ================================================================ */
function setPage(page) {
  currentPage=page;
  document.querySelectorAll(".page").forEach(el=>el.classList.toggle("active",el.id===`page-${page}`));
  document.querySelectorAll(".nav button").forEach(el=>el.classList.toggle("active",el.dataset.page===page));
  const labels={dashboard:["Bảng điều khiển","Theo dõi chấm công, quỹ lương và tiến độ hoạt động trong tuần."],attendance:["Chấm công Boss","Quản lý 28 khung giờ Boss trong tuần."],ctc:["Chấm công CTC","Theo dõi hoạt động CTC riêng theo bang."],members:["Thành viên","Quản lý hồ sơ, nhân vật và hệ số thành viên."],payroll:["Bảng lương","Tính lương minh họa và xác nhận trạng thái nhận."],finance:["Thu chi & quỹ","Theo dõi doanh thu đấu giá, chi phí và quỹ CTC."],calendar:["Lịch hoạt động","Lịch tuần Boss và CTC, xem nhanh theo ngày hoặc loại hoạt động."],settings:["Quy định & hướng dẫn","Xem công thức, vai trò và phần cần triển khai tiếp."]};
  document.getElementById("pageTitle").textContent=labels[page][0]; document.getElementById("pageSubtitle").textContent=labels[page][1];
  renderAll();
}
/* Render KPI cards dùng chung cho các trang. */
function renderKpiCards(targetId, cards) {
  document.getElementById(targetId).innerHTML=cards.map(c=>`<div class="kpi"><div class="kpi-top"><span>${c.label}</span><span class="kpi-icon">${c.icon}</span></div><div class="kpi-value">${c.value}</div><div class="kpi-note">${c.note}</div></div>`).join("");
}
function renderDashboard() {
  const eligible=members.filter(isEligible).length;
  const avgBoss=members.length?members.reduce((s,m)=>s+totalBoss(m),0)/(members.length*28):0;
  renderKpiCards("dashboardKpis",[
    {label:"Thành viên",icon:"♙",value:members.length,note:"Hồ sơ trong dữ liệu demo"},
    {label:"Đạt KPI Boss",icon:"✓",value:`${eligible}/${members.length}`,note:`${members.length?pct(eligible/members.length):"0%"} thành viên đạt từ 12 công`},
    {label:"Quỹ Boss còn lại",icon:"◈",value:money(bossFund()),note:"Doanh thu trừ chi phí đã duyệt"},
    {label:"Tổng công Boss",icon:"▦",value:members.reduce((s,m)=>s+totalBoss(m),0),note:`Trung bình ${Math.round(avgBoss*28)}% công tối đa mỗi thành viên`}
  ]);
  document.getElementById("progressOverview").innerHTML=`<div class="progress-row"><div class="progress-label"><span>Boss — tổng lượt chấm</span><span>${members.reduce((s,m)=>s+totalBoss(m),0)} / ${members.length*28}</span></div><div class="track"><div class="fill" style="width:${Math.min(100,avgBoss*100)}%"></div></div></div><div class="progress-row"><div class="progress-label"><span>CTC — tổng lượt chấm</span><span>${members.reduce((s,m)=>s+totalCtc(m),0)} / ${members.length*3}</span></div><div class="track"><div class="fill gold" style="width:${Math.min(100,members.reduce((s,m)=>s+totalCtc(m),0)/(Math.max(1,members.length*3))*100)}%"></div></div></div><div class="progress-row"><div class="progress-label"><span>Chi phí Boss đã duyệt</span><span>${money(bossExpense())}</span></div><div class="track"><div class="fill green" style="width:${revenue>0?Math.min(100,bossExpense()/revenue*100):0}%"></div></div></div><div class="notice">Mẹo: bấm “Chấm công Boss” để thay đổi số công. KPI và lương minh họa sẽ tự tính lại.</div>`;
  document.getElementById("guildOverview").innerHTML=GUILDS.map(g=>`<div class="guild-line"><div class="guild-symbol">${esc(g.split(" ").map(x=>x[0]).join(""))}</div><div class="guild-info"><strong>${esc(g)}</strong><small>${members.filter(m=>m.guild===g).length} thành viên · quỹ CTC riêng</small></div><div class="guild-amount">${money(ctcFunds[g]||0)}</div></div>`).join("");
  const needs=members.filter(m=>!isEligible(m)||m.paidBoss!=="Đã nhận").slice(0,6);
  document.getElementById("attentionTable").innerHTML=needs.length?needs.map(m=>`<tr><td><strong>${memberStt(m)}</strong></td><td>${memberIdentity(m)}</td><td>${guildChip(m.guild)}</td><td>${totalBoss(m)}/28</td><td>${isEligible(m)?'<span class="pill green status-approved">Đạt</span>':'<span class="pill red status-kpi">Chưa đạt</span>'}</td><td>${statusPill(m.paidBoss)}</td></tr>`).join(""):`<tr><td colspan="6" class="empty">Không có thành viên cần theo dõi.</td></tr>`;
}
function renderAttendance() {
  const day=Number(document.getElementById("bossDay").value||0);
  document.getElementById("bossDayTitle").textContent=`${DAYS[day]} · Khung giờ Boss`;
  const marked=members.reduce((sum,m)=>sum+BOSS_TIMES.filter((_,t)=>m.boss.includes(day*4+t)).length,0);
  document.getElementById("bossMarkedCount").textContent=`${marked} dấu công`;
  document.getElementById("bossSlots").innerHTML=BOSS_TIMES.map((time,t)=>{const slot=day*4+t;const count=members.filter(m=>m.boss.includes(slot)).length;return `<div class="slot"><strong>${time}</strong><small>${DAYS[day]} · ${count} người được đánh dấu</small><button class="btn ${count?"btn-primary":""}" data-mark-slot="${slot}">${count?"Điều chỉnh công":"Chấm công"}</button></div>`;}).join("");
  const q=(document.getElementById("attendanceSearch").value||"").toLowerCase();
  const rows=members.filter(m=>memberSearchText(m).includes(q));
  document.getElementById("attendanceTable").innerHTML=rows.map(m=>`<tr><td><strong>${memberStt(m)}</strong></td><td>${memberIdentity(m)}</td><td>${guildChip(m.guild)}</td><td><strong>${totalBoss(m)}</strong></td><td>28</td><td>${isEligible(m)?'<span class="pill green status-approved">Đạt KPI</span>':'<span class="pill red status-kpi">Chưa đạt</span>'}</td><td><button class="btn btn-small" data-edit-attendance="${m.id}">Sửa công</button></td></tr>`).join("")||`<tr><td colspan="7" class="empty">Không tìm thấy thành viên.</td></tr>`;
}
function renderCtc() {
  const names=["Thứ Sáu","Thứ Bảy","Chủ Nhật"];
  document.getElementById("ctcDays").innerHTML=names.map((name,i)=>{const count=members.filter(m=>m.ctc.includes(i)).length;return `<div class="day-card ${count?"done":"pending"}"><strong>${name}</strong><small>Buổi tối · CTC</small><div class="day-status">${count} người đã chấm</div><button class="btn btn-small" style="margin-top:10px;width:100%" data-ctc-day="${i}">Quản lý</button></div>`;}).join("");
  const q=(document.getElementById("ctcSearch").value||"").toLocaleLowerCase("vi");const rows=members.filter(m=>memberSearchText(m).includes(q));
  document.getElementById("ctcTable").innerHTML=rows.map(m=>`<tr><td><strong>${memberStt(m)}</strong></td><td>${memberIdentity(m)}</td><td>${guildChip(m.guild)}</td><td><strong>${totalCtc(m)}/3</strong><details class="ctc-work-details"><summary class="btn btn-small">Xem công</summary><div class="ctc-work-list">${names.map((day,i)=>`<div class="ctc-work-row"><span>${day}</span><span class="pill ${m.ctc.includes(i)?"green":"gray"}">${m.ctc.includes(i)?"Đã chấm":"Chưa chấm"}</span></div>`).join("")}</div></details></td><td><span class="coef-chip coef-ctc">${Number(m.coefCtc??m.coef??1).toFixed(1)}×</span></td><td><button class="btn btn-small" data-edit-ctc="${m.id}">Sửa công CTC</button></td></tr>`).join("")||`<tr><td colspan="6" class="empty">Không tìm thấy thành viên.</td></tr>`;
}
// STT và thứ tự chuẩn dùng chung cho mọi tab; Firestore là nguồn dữ liệu duy nhất.
function memberOrderValue(m) {
  return Number.isSafeInteger(m.sortOrder) && m.sortOrder >= 0 ? m.sortOrder : Number(m.id);
}
function memberStt(m) { return members.indexOf(m) + 1; }
function sortMembersEverywhere() {
  members.sort((a,b)=>memberOrderValue(a)-memberOrderValue(b) || a.id-b.id);
}
function renderMembers() {
  const q=(document.getElementById("memberSearch").value||"").toLowerCase();const guild=document.getElementById("guildFilter").value;
  const rows=members.filter(m=>(guild==="all"||m.guild===guild)&&(memberSearchText(m).includes(q)));
  document.getElementById("memberCount").textContent=`${rows.length} thành viên`;
  document.getElementById("memberTable").innerHTML=rows.map(m=>`<tr><td><strong>${members.indexOf(m)+1}</strong></td><td>${memberIdentity(m)}</td><td>${sectChip(m.sect)}</td><td>${guildChip(m.guild)}</td><td>${roleChip(m.role)}</td><td><span class="vehicle-chip">${m.vehicles} acc</span></td><td><span class="coef-chip">${Number(m.coefBoss??m.coef??1).toFixed(1)}×</span></td><td><span class="coef-chip coef-ctc">${Number(m.coefCtc??m.coef??1).toFixed(1)}×</span></td><td><button class="btn btn-small" data-edit-member="${m.id}">Sửa</button> <button class="btn btn-small" data-delete-member="${m.id}">Xóa</button> ${window.DaiDeMembers?.isAdmin()?`<span class="member-order-buttons"><button class="btn btn-small" data-move-member="${m.id}" data-move-direction="-1" title="Đưa thành viên lên" aria-label="Đưa ${esc(m.zalo)} lên" ${members.indexOf(m)===0?"disabled":""}>↑</button><button class="btn btn-small" data-move-member="${m.id}" data-move-direction="1" title="Đưa thành viên xuống" aria-label="Đưa ${esc(m.zalo)} xuống" ${members.indexOf(m)===members.length-1?"disabled":""}>↓</button></span>`:""}</td></tr>`).join("")||`<tr><td colspan="9" class="empty">Không tìm thấy thành viên.</td></tr>`;
}
function renderPayroll() {
  const bossTotal=members.reduce((s,m)=>s+bossPayroll(m),0), ctcTotal=members.reduce((s,m)=>s+ctcPayroll(m),0);
  renderKpiCards("payrollKpis",[
    {label:"Tổng lương Boss dự kiến",icon:"◈",value:money(bossTotal),note:"Chỉ chia cho người đạt KPI"},
    {label:"Tổng lương CTC dự kiến",icon:"⚔",value:money(ctcTotal),note:"Tách quỹ theo bang"},
    {label:"Chưa xác nhận Boss",icon:"…",value:members.filter(m=>m.paidBoss==="Chưa nhận"&&isEligible(m)).length,note:"Người đạt KPI, chưa nhận"},
    {label:"Chưa xác nhận CTC",icon:"…",value:members.filter(m=>m.paidCtc!=="Đã nhận").length,note:"Theo trạng thái CTC demo"}
  ]);
  const q=(document.getElementById("payrollSearch").value||"").toLowerCase(), type=document.getElementById("payTypeFilter").value;
  const rows=members.filter(m=>memberSearchText(m).includes(q));
  document.getElementById("payrollTable").innerHTML=rows.map(m=>`<tr><td><strong>${memberStt(m)}</strong></td><td>${memberIdentity(m)}</td><td><strong>${totalBoss(m)} công · HSL ${Number(m.coefBoss??m.coef??1).toFixed(1)}×</strong><details class="secondary-accounts"><summary>Xem công</summary><div style="display:grid;gap:5px;margin-top:8px">${DAYS.map((day,d)=>`<div style="padding:6px;border:1px solid var(--line);border-radius:7px"><strong>${day}</strong><div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:4px">${BOSS_TIMES.map((time,t)=>{const slot=d*4+t;return `<span class="pill ${m.boss.includes(slot)?'green':'gray'}">${time}: ${m.boss.includes(slot)?'Đã chấm':'Chưa chấm'}</span>`}).join('')}</div></div>`).join('')}</div></details></td><td>${isEligible(m)?'<span class="pill green status-approved">Đạt KPI</span>':'<span class="pill red status-kpi">Không đạt KPI</span>'}</td><td>${type==="ctc"?"—":money(bossPayroll(m))}</td><td><strong>${totalCtc(m)} công · HSL ${Number(m.coefCtc??m.coef??1).toFixed(1)}×</strong></td><td>${type==="boss"?"—":ctcMoney(ctcPayroll(m))}</td><td><div style="display:flex;gap:5px;align-items:center;flex-wrap:wrap"><input class="input" style="width:86px;min-width:86px" type="number" min="0" step="any" data-allowance="${m.id}" value="${Number(m.allowance)||0}" aria-label="Số tiền phụ cấp"><select class="select" style="min-width:76px;width:76px" data-allowance-unit="${m.id}" aria-label="Đơn vị phụ cấp"><option value="Kim" ${(m.allowanceUnit||'Kim')==='Kim'?'selected':''}>Kim</option><option value="Vạn" ${m.allowanceUnit==='Vạn'?'selected':''}>Vạn</option></select></div></td><td>${type==="ctc"?"—":`<button class="btn btn-small ${m.paidBoss==="Đã nhận"?"status-received":m.paidBoss==="Chưa đạt KPI"?"status-kpi":"status-pending"}" data-toggle-paid="boss:${m.id}">${esc(m.paidBoss)}</button>`}</td><td>${type==="boss"?"—":`<button class="btn btn-small ${m.paidCtc==="Đã nhận"?"status-received":"status-pending"}" data-toggle-paid="ctc:${m.id}">${esc(m.paidCtc)}</button>`}</td></tr>`).join("")||`<tr><td colspan="10" class="empty">Không tìm thấy thành viên.</td></tr>`;
}
function renderFinance() {
  renderKpiCards("financeKpis",[
    {label:"Doanh thu đấu giá Boss",icon:"↗",value:money(revenue),note:"Nhập thủ công theo kỳ"},
    {label:"Chi phí Boss đã duyệt",icon:"↘",value:money(bossExpense()),note:"Chỉ khoản đã duyệt được trừ"},
    {label:"Quỹ Boss sau chi phí",icon:"◈",value:money(bossFund()),note:bossFund()<0?"Cảnh báo: quỹ âm":"Quỹ dùng để tính lương mẫu"},
    {label:"Tổng quỹ CTC",icon:"⚔",value:money(Object.values(ctcFunds).reduce((a,b)=>a+b,0)),note:"Tổng của 4 bang"}
  ]);
  document.getElementById("ledgerTable").innerHTML=expenses.map((e,i)=>`<tr><td>${esc(e.date)}</td><td>${e.type==="Doanh thu"?'<span class="pill green">Doanh thu</span>':'<span class="pill blue">Chi Boss</span>'}</td><td>${esc(e.by)}</td><td>${esc(e.desc)}</td><td>${money(e.amount)}</td><td>${e.type==="Doanh thu"?'<span class="pill green status-approved">Đã ghi</span>':`<button class="btn btn-small ${e.approved?"status-approved":"status-pending"}" data-approve-expense="${i}">${e.approved?"Đã duyệt":"Chờ duyệt"}</button>`}</td></tr>`).join("")||`<tr><td colspan="6" class="empty">Chưa có giao dịch.</td></tr>`;
  const expenseNames=[...new Set(expenses.filter(e=>e.type!=="Doanh thu").map(e=>e.by.trim()).filter(Boolean))];
  document.getElementById("expenseByMemberTable").innerHTML=expenseNames.map(name=>{const items=expenses.filter(e=>e.type!=="Doanh thu"&&e.by.trim().toLocaleLowerCase("vi")===name.toLocaleLowerCase("vi"));const total=items.reduce((s,e)=>s+Number(e.amount||0),0),approved=items.filter(e=>e.approved).reduce((s,e)=>s+Number(e.amount||0),0);const linked=members.find(m=>[m.zalo,m.character].some(v=>v?.trim().toLocaleLowerCase("vi")===name.toLocaleLowerCase("vi")));return `<tr><td>${linked?memberStt(linked):"—"}</td><td>${esc(name)}</td><td>${items.length}</td><td><strong>${money(total)}</strong></td><td>${money(approved)}</td><td>${money(total-approved)}</td></tr>`}).join("")||`<tr><td colspan="6" class="empty">Chưa có khoản chi theo thành viên.</td></tr>`;
  document.getElementById("financeGuilds").innerHTML=GUILDS.map(g=>`<div class="guild-line"><div class="guild-symbol">${esc(g.split(" ").map(x=>x[0]).join(""))}</div><div class="guild-info"><strong>${esc(g)}</strong><small>Quỹ CTC riêng</small></div><div class="guild-amount">${money(ctcFunds[g]||0)}</div><button class="btn btn-small" data-edit-fund="${esc(g)}">Sửa</button></div>`).join("");
}
function renderAll() { sortMembersEverywhere();renderDashboard();renderAttendance();renderCtc();renderMembers();renderPayroll();renderFinance(); }

/* Mở modal với form phù hợp. Toàn bộ form được tạo bằng HTML rõ ràng. */
let modalAction=null;
/* ================================================================
   D. FORM, MODAL VÀ THAO TÁC DỮ LIỆU
   openModal/closeModal: quản lý hộp thoại dùng chung.
   memberForm/secondaryAccountFormRow: tạo biểu mẫu thành viên và acc phụ.
   markSlot/editMemberAttendance/editMemberCtc: chỉnh công theo slot.
   addExpense/addRevenue/editFund: ghi khoản thu chi và điều chỉnh quỹ demo.
   exportPayrollCsv: xuất bảng lương hiện tại ra CSV.

   Lưu ý khi chuyển backend: mọi hàm lưu cần gửi dữ liệu lên server, chờ phản
   hồi thành công rồi cập nhật state; không chỉ sửa mảng JavaScript ở máy khách.
   Kiểm tra quyền ở server trước khi chấm công, duyệt chi hoặc sửa quỹ.
   ================================================================ */
function openModal(title, html, action) {
  document.getElementById("modalTitle").textContent=title;document.getElementById("modalContent").innerHTML=html;modalAction=action;
  document.getElementById("modalSave").textContent = title === "Thêm thành viên" || title === "Sửa thành viên" ? "Lưu thành viên" : "Lưu dữ liệu mẫu";
  document.getElementById("modalBackdrop").classList.add("open");
}
function closeModal(){document.getElementById("modalBackdrop").classList.remove("open");modalAction=null;}
function memberForm(m={}) {
  if (!window.DaiDeMembers?.isAdmin()) { showToast("Chỉ Admin được quản lý thành viên."); return; }
  const edit=Boolean(m.id);
  const secondaryRows=(m.secondaryAccounts||[]).map(a=>({name:a.name||"",sect:a.sect||"",guild:a.guild||GUILDS[0],role:a.role||"Thành viên",vehicles:a.vehicles||1,coef:a.coef||1}));
  if(!secondaryRows.length) secondaryRows.push({name:"",sect:"",guild:GUILDS[0],role:"Thành viên",vehicles:1,coef:1});
  const secondaryFields=secondaryRows.map((a,i)=>secondaryAccountFormRow(a,i)).join("");
  openModal(edit?"Sửa thành viên":"Thêm thành viên",`<form id="memberForm" class="form-grid">
    <div class="field"><label for="mZalo">Tên Zalo / tên gọi *</label><input id="mZalo" name="zalo" required value="${esc(m.zalo||"")}" placeholder="Ví dụ: Hắc Long"></div>
    <div class="field"><label for="mCharacter">Tên acc chính / nhân vật *</label><input id="mCharacter" name="character" required value="${esc(m.character||"")}" placeholder="Tên trong game"></div>
    <div class="field"><label for="mSect">Môn phái acc chính</label><select id="mSect" name="sect"><option value="">-- Chọn môn phái --</option>${SECTS.map(s=>`<option ${m.sect===s?"selected":""}>${s}</option>`).join("")}</select></div>
    <div class="field"><label for="mGuild">Bang</label><select id="mGuild" name="guild">${GUILDS.map(g=>`<option ${m.guild===g?"selected":""}>${g}</option>`).join("")}</select></div>
    <div class="field"><label for="mRole">Chức vụ</label><input id="mRole" name="role" value="${esc(m.role||"Thành viên")}"></div>
    <div class="field"><label for="mVehicles">Số acc</label><input id="mVehicles" name="vehicles" type="number" min="1" value="${m.vehicles||1}"></div>
    <div class="field"><label for="mCoefBoss">Hệ số lương Boss</label><input id="mCoefBoss" name="coefBoss" type="number" min="0" step="0.1" value="${Number(m.coefBoss??m.coef??1)}"></div>
    <div class="field"><label for="mCoefCtc">Hệ số lương CTC</label><input id="mCoefCtc" name="coefCtc" type="number" min="0" step="0.1" value="${Number(m.coefCtc??m.coef??1)}"></div>
    <div class="field full" style="grid-column:1/-1"><label>Acc phụ — nhập thông tin riêng cho từng nhân vật</label><div id="secondaryAccountFields">${secondaryFields}</div><button type="button" class="btn btn-small" id="addSecondaryAccount">＋ Thêm acc phụ</button></div>
  </form><div class="notice">Mỗi acc phụ chỉ gồm tên nhân vật, bang và môn phái. Có thể thêm hoặc xóa từng acc phụ.</div>`,()=>{
    const f=document.getElementById("memberForm");if(!f.reportValidity())return false;const d=new FormData(f);const secondaryAccounts=[...f.querySelectorAll(".secondary-account-form-row")].map(row=>({name:row.querySelector('[name="secondaryName"]').value.trim(),sect:row.querySelector('[name="secondarySect"]').value,guild:row.querySelector('[name="secondaryGuild"]').value})).filter(a=>a.name);const obj={zalo:d.get("zalo").trim(),character:d.get("character").trim(),sect:d.get("sect"),guild:d.get("guild"),role:d.get("role").trim()||"Thành viên",vehicles:Math.max(1,Number(d.get("vehicles"))||1),coef:Math.max(0,Number(d.get("coef"))||1),secondaryAccounts};
    obj.coefBoss=Math.max(0,Number(d.get("coefBoss"))||0);obj.coefCtc=Math.max(0,Number(d.get("coefCtc"))||0);delete obj.coef;
    const record = edit ? {...m,...obj} : {id:Date.now()+Math.floor(Math.random()*1000),...obj,boss:[],ctc:[],paidBoss:"Chưa nhận",paidCtc:"Chưa nhận"};
    const saveButton=document.getElementById("modalSave");saveButton.disabled=true;saveButton.textContent="Đang lưu...";
    window.DaiDeMembers.save(record).then(()=>{closeModal();showToast(edit?"Đã cập nhật thành viên trên Firestore.":"Đã thêm thành viên lên Firestore.");}).catch(e=>{showToast("Không thể lưu Firestore: "+e.message);}).finally(()=>{saveButton.disabled=false;saveButton.textContent="Lưu thành viên";});
    return false;
  });
  document.getElementById("addSecondaryAccount").addEventListener("click",()=>{const wrap=document.getElementById("secondaryAccountFields");const index=wrap.querySelectorAll(".secondary-account-form-row").length;wrap.insertAdjacentHTML("beforeend",secondaryAccountFormRow({name:"",sect:"",guild:GUILDS[0],role:"Thành viên",vehicles:1,coef:1},index));});
}
function secondaryAccountFormRow(a,i) {
  return `<div class="secondary-account-form-row"><div class="field"><label>Tên acc phụ</label><input name="secondaryName" value="${esc(a.name||"")}" placeholder="Tên trong game"></div><div class="field"><label>Bang</label><select name="secondaryGuild">${GUILDS.map(g=>`<option value="${esc(g)}" ${a.guild===g?"selected":""}>${esc(g)}</option>`).join("")}</select></div><div class="field"><label>Môn phái</label><select name="secondarySect"><option value="">-- Chọn môn phái --</option>${SECTS.map(v=>`<option value="${esc(v)}" ${a.sect===v?"selected":""}>${esc(v)}</option>`).join("")}</select></div><div class="field full"><button type="button" class="btn btn-small" data-remove-secondary>− Xóa acc phụ này</button></div></div>`;
}
function markSlot(slot) {
  const list=members.map(m=>`<label data-attendance-member="${esc(memberSearchText(m))}" style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--line);font-size:12px"><input type="checkbox" name="present" value="${m.id}" ${m.boss.includes(slot)?"checked":""}> <span><strong>${esc(m.zalo)} · ${esc(m.character)}</strong><br><small class="muted">${esc(m.guild)} · ${esc(m.sect||"Chưa chọn môn phái")}</small></span></label>`).join("");
  openModal(`Chấm Boss · ${DAYS[Math.floor(slot/4)]} ${BOSS_TIMES[slot%4]}`,`<form id="slotForm"><input class="search" id="attendanceModalSearch" placeholder="Lọc thành viên, acc chính/phụ, bang, môn phái..."><div id="attendanceModalList" style="max-height:48vh;overflow:auto">${list}</div></form><div class="notice">Lọc danh sách rồi tích chọn người có mặt. Bỏ lọc không làm thay đổi các dấu đã chọn.</div>`,()=>{const selected=[...document.querySelectorAll('input[name="present"]:checked')].map(x=>Number(x.value));members.forEach(m=>{m.boss=m.boss.filter(x=>x!==slot);if(selected.includes(m.id))m.boss.push(slot);m.boss=[...new Set(m.boss)].sort((a,b)=>a-b);if(!isEligible(m)&&m.paidBoss==="Chưa nhận")m.paidBoss="Chưa đạt KPI";else if(isEligible(m)&&m.paidBoss==="Chưa đạt KPI")m.paidBoss="Chưa nhận";});renderAll();showToast("Đã cập nhật chấm công Boss.");return true;});
  document.getElementById("attendanceModalSearch").addEventListener("input",e=>{const q=normalizeSearch(e.target.value);document.querySelectorAll("[data-attendance-member]").forEach(row=>row.hidden=!normalizeSearch(row.dataset.attendanceMember).includes(q));});
}
function editMemberAttendance(m) {
  const checks=Array.from({length:28},(_,i)=>`<label style="display:flex;gap:6px;align-items:center;padding:7px;border:1px solid var(--line);border-radius:8px;font-size:11px"><input type="checkbox" name="bossMark" value="${i}" ${m.boss.includes(i)?"checked":""}> ${DAYS[Math.floor(i/4)].replace("Thứ ","")}<br>${BOSS_TIMES[i%4]}</label>`).join("");
  openModal(`Sửa công tuần · ${m.zalo}`,`<form id="memberBossForm"><div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;max-height:52vh;overflow:auto">${checks}</div></form>`,()=>{m.boss=[...document.querySelectorAll('input[name="bossMark"]:checked')].map(x=>Number(x.value));if(!isEligible(m)&&m.paidBoss==="Chưa nhận")m.paidBoss="Chưa đạt KPI";else if(isEligible(m)&&m.paidBoss==="Chưa đạt KPI")m.paidBoss="Chưa nhận";renderAll();showToast("Đã cập nhật công của thành viên.");return true;});
}
function editMemberCtc(m) {
  openModal(`Sửa công CTC · ${m.zalo}`,`<form id="memberCtcForm" style="display:grid;gap:12px">${["Thứ Sáu","Thứ Bảy","Chủ Nhật"].map((d,i)=>`<label style="display:flex;gap:10px;align-items:center;padding:12px;border:1px solid var(--line);border-radius:10px"><input type="checkbox" name="ctcMark" value="${i}" ${m.ctc.includes(i)?"checked":""}> <span><strong>${d} buổi tối</strong><br><small class="muted">Hoạt động CTC</small></span></label>`).join("")}</form>`,()=>{m.ctc=[...document.querySelectorAll('input[name="ctcMark"]:checked')].map(x=>Number(x.value));renderAll();showToast("Đã cập nhật công CTC.");return true;});
}
function addExpense() {
  openModal("Thêm khoản chi Boss",`<form id="expenseForm" class="form-grid"><div class="field"><label>Ngày</label><input name="date" value="20/10/2026" required></div><div class="field"><label>Người thanh toán</label><input name="by" required placeholder="Tên thành viên"></div><div class="field" style="grid-column:1/-1"><label>Nội dung / nhiệm vụ</label><input name="desc" required placeholder="Ghi rõ khoản chi"></div><div class="field"><label>Số tiền (Kim)</label><input name="amount" type="number" min="1" required></div><div class="field"><label>Trạng thái duyệt</label><select name="approved"><option value="false">Chờ duyệt</option><option value="true">Đã duyệt</option></select></div></form>`,()=>{const f=document.getElementById("expenseForm");if(!f.reportValidity())return false;const d=new FormData(f);expenses.unshift({date:d.get("date"),type:"Chi Boss",by:d.get("by"),desc:d.get("desc"),amount:Number(d.get("amount")),approved:d.get("approved")==="true"});renderAll();showToast("Đã ghi khoản chi demo.");return true;});
}
function addRevenue() {
  openModal("Ghi doanh thu đấu giá",`<form id="revenueForm" class="form-grid"><div class="field"><label>Ngày</label><input name="date" value="20/10/2026" required></div><div class="field"><label>Người ghi</label><input name="by" value="Quản trị" required></div><div class="field" style="grid-column:1/-1"><label>Nội dung</label><input name="desc" value="Doanh thu đấu giá vật phẩm Boss" required></div><div class="field"><label>Số tiền (Kim)</label><input name="amount" type="number" min="1" required></div></form>`,()=>{const f=document.getElementById("revenueForm");if(!f.reportValidity())return false;const d=new FormData(f), amount=Number(d.get("amount"));revenue+=amount;expenses.unshift({date:d.get("date"),type:"Doanh thu",by:d.get("by"),desc:d.get("desc"),amount,approved:true});renderAll();showToast("Đã ghi doanh thu demo.");return true;});
}
function editFund(guild) {
  openModal(`Cập nhật quỹ CTC · ${guild}`,`<form id="fundForm" class="form-grid"><div class="field" style="grid-column:1/-1"><label>Số dư quỹ (Kim)</label><input name="amount" type="number" min="0" value="${ctcFunds[guild]||0}" required></div></form><div class="notice warn">Bản thật nên ghi sổ giao dịch thay vì chỉ sửa số dư trực tiếp để có lịch sử kiểm toán.</div>`,()=>{const f=document.getElementById("fundForm");if(!f.reportValidity())return false;ctcFunds[guild]=Number(new FormData(f).get("amount"));renderAll();showToast("Đã cập nhật quỹ CTC demo.");return true;});
}
function exportPayrollCsv() {
  const header=["Zalo","Nhân vật","Bang","Công Boss","HSL Boss","KPI Boss","Lương Boss Kim","Công CTC","HSL CTC","Lương CTC Vạn","Trạng thái Boss","Trạng thái CTC"];
  const rows=members.map(m=>[m.zalo,m.character,m.guild,totalBoss(m),Number(m.coefBoss??m.coef??1),isEligible(m)?"Đạt":"Chưa đạt",Math.round(bossPayroll(m)),totalCtc(m),Number(m.coefCtc??m.coef??1),Math.round(ctcPayroll(m)),m.paidBoss,m.paidCtc]);
  const csv=[header,...rows].map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(",")).join("\r\n");
  const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8;"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="bang-luong-dai-de-demo.csv";a.click();URL.revokeObjectURL(url);showToast("Đã tạo file CSV bảng lương demo.");
}

/* Sự kiện điều hướng và thao tác — gắn một lần cho toàn bộ trang. */
document.querySelectorAll(".nav button").forEach(btn=>btn.addEventListener("click",()=>setPage(btn.dataset.page)));
/* ================================================================
   E. BỘ ĐIỀU PHỐI SỰ KIỆN
   Dùng event delegation để xử lý cả nút được tạo động khi render.
   Khi thêm control mới, gắn data-action hoặc data-* rõ ràng và xử lý ở đây;
   tránh gắn nhiều listener lặp lại sau mỗi lần render bảng.
   ================================================================ */
document.addEventListener("click",e=>{
  const target=e.target.closest("button");if(!target)return;
  if(target.dataset.goto){setPage(target.dataset.goto);return;}
  if(target.id==="addSecondaryAccount"){return;}
  if(target.hasAttribute("data-remove-secondary")){const row=target.closest(".secondary-account-form-row");if(row){const wrap=row.parentElement;row.remove();if(!wrap.querySelector(".secondary-account-form-row"))wrap.insertAdjacentHTML("beforeend",secondaryAccountFormRow({name:"",sect:"",guild:GUILDS[0],role:"Thành viên",vehicles:1,coef:1},0));}return;}
  if(target.dataset.markSlot!==undefined){markSlot(Number(target.dataset.markSlot));return;}
  if(target.dataset.editAttendance){const m=members.find(x=>x.id===Number(target.dataset.editAttendance));if(m)editMemberAttendance(m);return;}
  if(target.dataset.ctcDay!==undefined){const day=Number(target.dataset.ctcDay);const list=members.map(m=>`<label data-ctc-member="${esc(memberSearchText(m))}" style="display:flex;gap:10px;align-items:center;padding:9px 0;border-bottom:1px solid var(--line);font-size:12px"><input type="checkbox" name="ctcPresent" value="${m.id}" ${m.ctc.includes(day)?"checked":""}> <span><strong>${esc(m.zalo)} · ${esc(m.character)}</strong><br><small class="muted">${esc(m.guild)} · ${esc(m.sect||"Chưa chọn môn phái")}</small></span></label>`).join("");openModal(`Chấm CTC · ${["Thứ Sáu","Thứ Bảy","Chủ Nhật"][day]}`,`<form id="ctcDayForm"><input class="search" id="ctcModalSearch" placeholder="Lọc thành viên, acc chính/phụ, bang, môn phái..."><div style="max-height:50vh;overflow:auto">${list}</div></form><div class="notice">Tìm thành viên rồi tích chọn người có mặt.</div>`,()=>{const selected=[...document.querySelectorAll('input[name="ctcPresent"]:checked')].map(x=>Number(x.value));members.forEach(m=>{m.ctc=m.ctc.filter(x=>x!==day);if(selected.includes(m.id))m.ctc.push(day);m.ctc=[...new Set(m.ctc)].sort();});renderAll();showToast("Đã cập nhật danh sách CTC.");return true;});document.getElementById("ctcModalSearch").addEventListener("input",e=>{const q=e.target.value.toLocaleLowerCase("vi");document.querySelectorAll("[data-ctc-member]").forEach(row=>row.hidden=!row.dataset.ctcMember.includes(q));});return;}
  if(target.dataset.editCtc){const m=members.find(x=>x.id===Number(target.dataset.editCtc));if(m)editMemberCtc(m);return;}
  if(target.dataset.moveMember){
    const id=Number(target.dataset.moveMember), direction=Number(target.dataset.moveDirection);
    const index=members.findIndex(m=>m.id===id), other=members[index+direction];
    if(index<0||!other||!window.DaiDeMembers?.isAdmin())return;
    const buttons=document.querySelectorAll('[data-move-member]');buttons.forEach(b=>b.disabled=true);
    window.DaiDeMembers.move(id,other.id).then(()=>showToast("Đã lưu thứ tự thành viên.")).catch(err=>showToast("Không thể đổi thứ tự: "+err.message)).finally(()=>buttons.forEach(b=>b.disabled=false));
    return;
  }
  if(target.dataset.editMember){const m=members.find(x=>x.id===Number(target.dataset.editMember));if(m)memberForm(m);return;}
  if(target.dataset.deleteMember){const m=members.find(x=>x.id===Number(target.dataset.deleteMember));if(m&&window.DaiDeMembers?.isAdmin()){openModal("Xác nhận xóa thành viên",`<p>Bạn chắc chắn muốn xóa <strong>${esc(m.zalo)}</strong> khỏi danh sách?</p><p class="notice warn">Thao tác này không thể hoàn tác.</p>`,()=>{window.DaiDeMembers.remove(m.id).then(()=>showToast("Đã xóa thành viên.")).catch(e=>showToast("Không thể xóa: "+e.message));return true;});document.getElementById("modalSave").textContent="Xác nhận xóa";}else if(!window.DaiDeMembers?.isAdmin())showToast("Chỉ Admin được xóa thành viên.");return;}
  if(target.dataset.togglePaid){const [type,id]=target.dataset.togglePaid.split(":");const m=members.find(x=>x.id===Number(id));if(m){const key=type==="boss"?"paidBoss":"paidCtc";if(type==="boss"&&!isEligible(m)){m[key]="Chưa đạt KPI";showToast("Thành viên chưa đạt KPI Boss, không thể xác nhận nhận lương Boss.");}else{m[key]=m[key]==="Đã nhận"?"Chưa nhận":"Đã nhận";showToast(`Đã cập nhật trạng thái ${type.toUpperCase()} demo.`);}renderAll();}return;}
  if(target.dataset.approveExpense!==undefined){const i=Number(target.dataset.approveExpense);if(expenses[i]){expenses[i].approved=!expenses[i].approved;renderAll();showToast(expenses[i].approved?"Đã duyệt khoản chi.":"Đã chuyển khoản chi về chờ duyệt.");}return;}
  if(target.dataset.editFund){editFund(target.dataset.editFund);return;}
});

document.getElementById("addMemberBtn").addEventListener("click",()=>memberForm());
document.getElementById("addExpenseBtn").addEventListener("click",addExpense);
document.getElementById("addRevenueBtn").addEventListener("click",addRevenue);
document.getElementById("payrollExportBtn").addEventListener("click",exportPayrollCsv);
document.getElementById("bossDay").addEventListener("change",renderAttendance);
document.getElementById("attendanceSearch").addEventListener("input",renderAttendance);
document.getElementById("ctcSearch").addEventListener("input",renderCtc);
document.getElementById("memberSearch").addEventListener("input",renderMembers);
document.getElementById("guildFilter").addEventListener("change",renderMembers);
document.getElementById("payrollSearch").addEventListener("input",renderPayroll);
/* Phụ cấp demo: lưu tạm giá trị nhập vào đối tượng thành viên trong bộ nhớ.
   Chưa lưu bền vững, chưa cộng vào tổng lương và chưa xuất trong CSV. */
document.addEventListener("input",e=>{const input=e.target.closest("[data-allowance]");if(!input)return;const m=members.find(x=>x.id===Number(input.dataset.allowance));if(m){m.allowance=Math.max(0,Number(input.value)||0);}});
document.addEventListener("change",e=>{const select=e.target.closest("[data-allowance-unit]");if(!select)return;const m=members.find(x=>x.id===Number(select.dataset.allowanceUnit));if(m)m.allowanceUnit=select.value;});
document.getElementById("payTypeFilter").addEventListener("change",renderPayroll);
document.getElementById("ctcPayrollMode").addEventListener("change",e=>{ctcMode=e.target.value;renderPayroll();showToast(ctcMode==="combined"?"Đã chọn chế độ gộp quỹ CTC demo.":"Đã chọn chế độ tách quỹ CTC demo.");});
document.getElementById("weekSelect").addEventListener("change",()=>showToast("Bộ chọn tuần là giao diện mẫu; lịch sử tuần chưa được lưu vào backend."));
document.getElementById("helpBtn").addEventListener("click",()=>openHelp());
// Firebase Authentication is initialized by modules/firebase-auth.js.
document.getElementById("bossUploadBtn").addEventListener("click",()=>document.getElementById("bossImageInput").click());
document.getElementById("ctcUploadBtn").addEventListener("click",()=>document.getElementById("ctcImageInput").click());
document.getElementById("bossImageInput").addEventListener("change",e=>{if(e.target.files&&e.target.files[0])showToast(`Đã chọn ảnh Boss: ${e.target.files[0].name}. OCR chưa kết nối; chưa ghi công.`);});
document.getElementById("ctcImageInput").addEventListener("change",e=>{if(e.target.files&&e.target.files[0])showToast(`Đã chọn ảnh CTC: ${e.target.files[0].name}. OCR chưa kết nối; chưa ghi công.`);});
document.getElementById("rulesHelpBtn").addEventListener("click",()=>openHelp());
function openHelp(){openModal("Hướng dẫn nhanh",`<div style="font-size:12px;line-height:1.8"><p><strong>1. Chấm công Boss:</strong> vào mục Chấm công Boss, chọn ngày, chọn khung giờ, đánh dấu người có mặt và lưu.</p><p><strong>2. KPI:</strong> từ 12/28 công Boss trở lên thì đạt KPI.</p><p><strong>3. CTC:</strong> quản lý 3 buổi riêng, không cộng vào KPI Boss.</p><p><strong>4. Thu chi:</strong> khoản chi Boss chỉ trừ quỹ sau khi được duyệt.</p><p><strong>5. Bảng lương:</strong> có thể đổi trạng thái nhận trong bản demo; triển khai thật phải khóa quyền và ghi nhật ký thao tác.</p><p><strong>6. Gia nhập:</strong> Đăng ký tài khoản, khai tên Zalo, acc chính, bang, môn phái, số acc và acc phụ; vào Thành viên → Gửi đơn nếu chưa có đơn. Chờ Admin duyệt và theo dõi trạng thái ở danh sách cùng chuông.</p><p><strong>7. Lưu ý:</strong> chấm công và lương vẫn là dữ liệu demo, chưa lưu Firestore.</p></div>`,()=>true);document.getElementById("modalSave").textContent="Đã hiểu";}
document.getElementById("modalClose").addEventListener("click",closeModal);
document.getElementById("modalCancel").addEventListener("click",closeModal);
document.getElementById("modalBackdrop").addEventListener("click",e=>{if(e.target.id==="modalBackdrop")closeModal();});
document.getElementById("modalSave").addEventListener("click",()=>{if(modalAction&&modalAction()!==false)closeModal();});

/* Khởi chạy giao diện lần đầu với dữ liệu demo. */
/* ĐIỂM KHỞI CHẠY: dựng các bảng lần đầu từ dữ liệu demo. */
renderAll();
