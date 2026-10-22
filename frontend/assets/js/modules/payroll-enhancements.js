/* MODULE 2 — PAYROLL ENHANCEMENTS
 * Bổ sung bảng lương, xem công CTC và các thao tác/luồng liên quan.
 * Phụ thuộc vào DOM và các hàm nền tảng được khai báo trong app-core.js.
 */
/* ================================================================
   BỔ SUNG BẢNG LƯƠNG: xem công CTC và quy trình khiếu nại.
   Đây là dữ liệu demo ở trình duyệt; quản trị thật cần xác thực và lưu server.
   ================================================================ */
// Khiếu nại hiện là dữ liệu demo trong bộ nhớ, chưa đồng bộ Firestore.
let payrollComplaints = [];
window.addEventListener("daide:complaints", e=>{payrollComplaints=e.detail||[];renderPayroll();});
const complaintIsAdmin=()=>window.DaiDeMembers?.isAdmin()===true;

const originalRenderPayroll = renderPayroll;
renderPayroll = function() {
  originalRenderPayroll();
  const table = document.getElementById("payrollTable");
  if (!table) return;
  [...table.querySelectorAll("tr")].forEach(row => {
    const cells = row.querySelectorAll("td");
    if (cells.length < 10) return;
    const nameCell = cells[1];
    const identity = nameCell.querySelector(".member-identity") || nameCell;
    const memberName = (identity.innerText || "").trim();
    const member = members.find(m => memberName.includes(m.zalo) || memberName.includes(m.character));
    if (!member) return;
    const complaints = payrollComplaints.filter(c => c.memberId === member.id);
    const pending = complaints.filter(c => c.status === "pending").length;
    const controls = document.createElement("div");
    controls.className = "complaint-inline";
    controls.innerHTML = `${window.DaiDeComplaints?.canSubmit(member)?`<button class="btn btn-small" data-new-complaint="${member.id}">Gửi khiếu nại</button>`:""}${complaints.length ? `<button class="btn btn-small" data-list-complaints="${member.id}">Khiếu nại (${pending} cần xử lý · ${complaints.length} tổng)</button>` : ""}`;
    nameCell.appendChild(controls);

    const ctcCell = cells[5];
    const ctcDetails = document.createElement("details");
    ctcDetails.className = "secondary-accounts";
    ctcDetails.innerHTML = `<summary>Xem công CTC</summary><div class="attendance-detail-wrap">${["Thứ Sáu","Thứ Bảy","Chủ Nhật"].map((day,i)=>`<div class="attendance-detail-day"><strong>${day} · Buổi tối</strong><div class="attendance-detail-slots"><span class="pill ${member.ctc.includes(i)?"green":"gray"}">${member.ctc.includes(i)?"Đã chấm công":"Chưa chấm công"}</span></div></div>`).join("")}</div>`;
    ctcCell.appendChild(ctcDetails);
    const bossDetails = cells[2].querySelector("details");
    if (bossDetails) {
      const wrap = bossDetails.querySelector("div[style*='display:grid']");
      if (wrap) {
        wrap.className = "attendance-detail-wrap";
        wrap.style.display = "flex";
        wrap.querySelectorAll(":scope > div").forEach(day => { day.className = "attendance-detail-day"; day.style.padding = "8px"; });
        wrap.querySelectorAll(":scope > div > div").forEach(slots => { slots.className = "attendance-detail-slots"; });
      }
    }
  });
};

function openComplaintForm(member) {
  if (!window.DaiDeComplaints?.canSubmit(member)) {showToast("Bạn không có quyền gửi khiếu nại cho thành viên này.");return;}
  openModal(`Khiếu nại công · ${member.zalo}`, `<form id="complaintForm" class="form-grid"><div class="field" style="grid-column:1/-1"><label>Nội dung khiếu nại</label><textarea id="complaintText" maxlength="2000" rows="5" required placeholder="Ghi rõ ngày, giờ Boss/CTC và số công thiếu..."></textarea></div><div class="notice" style="grid-column:1/-1">Ảnh minh chứng: phiên bản này chưa có Firebase Storage. Không đính kèm ảnh tại đây; chức năng tải ảnh sẽ được bổ sung sau để tránh mất bằng chứng.</div></form>`, () => {
    const f=document.getElementById("complaintForm");if(!f.reportValidity())return false;
    const text=document.getElementById("complaintText").value.trim();if(!text)return false;
    window.DaiDeComplaints.submit(member,text).then(()=>{closeModal();showToast("Đã gửi khiếu nại lên Firebase.");}).catch(e=>showToast("Không gửi được khiếu nại: "+e.message));
    return false;
  });
  document.getElementById("modalSave").textContent="Gửi khiếu nại";
}
function complaintStatus(c){return c.status==='pending'?'Chờ xử lý':c.status==='approved'?'Đã duyệt':'Không duyệt';}
function showMemberComplaints(member) {
  const items=payrollComplaints.filter(c=>c.memberId===member.id);
  const html=items.length?items.map(c=>`<div class="complaint-card"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><strong>Khiếu nại · ${esc(member.zalo)}</strong>${statusPill(complaintStatus(c))}</div><p class="complaint-note">Gửi lúc: ${esc(c.createdAt?.toDate?.().toLocaleString('vi-VN')||'Đang cập nhật')}</p><p>${esc(c.comment)}</p>${c.reviewNote?`<p class="complaint-note"><strong>Phản hồi Admin:</strong> ${esc(c.reviewNote)}</p>`:""}${c.status==='pending'&&complaintIsAdmin()?`<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button class="btn btn-small btn-primary" data-review-complaint="${esc(c.id)}" data-decision="approved">Duyệt khiếu nại</button><button class="btn btn-small" data-review-complaint="${esc(c.id)}" data-decision="rejected">Không duyệt</button></div>`:""}</div>`).join(""):`<p class="complaint-note">Thành viên này chưa gửi khiếu nại.</p>`;
  openModal(`Khiếu nại · ${member.zalo}`,`<div>${html}</div>`,()=>true);
  document.getElementById("modalSave").textContent="Đóng";
}
document.addEventListener("click", e => {
  const btn=e.target.closest("button");if(!btn)return;
  if(btn.dataset.newComplaint){const m=members.find(x=>x.id===Number(btn.dataset.newComplaint));if(m)openComplaintForm(m);return;}
  if(btn.dataset.listComplaints){const m=members.find(x=>x.id===Number(btn.dataset.listComplaints));if(m)showMemberComplaints(m);return;}
  if(btn.dataset.reviewComplaint){
    if(!complaintIsAdmin()){showToast('Chỉ Admin được xử lý khiếu nại.');return;}
    const id=btn.dataset.reviewComplaint,decision=btn.dataset.decision;
    openModal('Phản hồi khiếu nại',`<div class="field"><label>Ghi chú xử lý</label><textarea id="complaintDecisionNote" maxlength="2000" rows="4" required placeholder="Nhập nội dung phản hồi..."></textarea></div>`,()=>{
      const note=document.getElementById('complaintDecisionNote').value.trim();if(!note){showToast('Vui lòng nhập nội dung phản hồi.');return false;}
      window.DaiDeComplaints.review(id,decision,note).then(()=>{closeModal();showToast('Đã lưu phản hồi trên Firebase.');}).catch(e=>showToast('Không phản hồi được: '+e.message));return false;
    });document.getElementById('modalSave').textContent='Gửi phản hồi';return;
  }
});

/* Nút Lưu trong modal khiếu nại phải chờ đọc ảnh xong mới đóng hộp thoại. */
document.getElementById("modalSave").addEventListener("click", e => {
  if (!document.getElementById("complaintForm")) return;
  e.stopImmediatePropagation();
  if (modalAction && modalAction() !== false) closeModal();
}, true);
renderPayroll();
