/* MODULE 2 — PAYROLL ENHANCEMENTS
 * Bổ sung bảng lương, xem công CTC và các thao tác/luồng liên quan.
 * Phụ thuộc vào DOM và các hàm nền tảng được khai báo trong app-core.js.
 */
/* ================================================================
   BỔ SUNG BẢNG LƯƠNG: xem công CTC và quy trình khiếu nại.
   Đây là dữ liệu demo ở trình duyệt; quản trị thật cần xác thực và lưu server.
   ================================================================ */
// Khiếu nại hiện là dữ liệu demo trong bộ nhớ, chưa đồng bộ Firestore.
const payrollComplaints = [];
const complaintIsAdmin=()=>window.DaiDeMembers?.isAdmin()===true;
let nextComplaintId = 1;
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
    const pending = complaints.filter(c => c.status === "Chờ duyệt").length;
    const controls = document.createElement("div");
    controls.className = "complaint-inline";
    controls.innerHTML = `<button class="btn btn-small" data-new-complaint="${member.id}">Gửi khiếu nại</button>${pending ? `<button class="complaint-count" data-list-complaints="${member.id}">Đang có ${pending} khiếu nại đang chờ phê duyệt</button>` : complaints.length ? `<button class="btn btn-small" data-list-complaints="${member.id}">Xem khiếu nại (${complaints.length})</button>` : ""}`;
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
  openModal(`Khiếu nại công · ${member.zalo}`, `<form id="complaintForm" style="display:grid;gap:12px"><div class="field"><label for="complaintText">Nội dung khiếu nại</label><textarea id="complaintText" name="comment" rows="4" required placeholder="Mô tả ngày, buổi và số công bạn cho rằng đang bị thiếu..."></textarea></div><div class="notice"><strong>Chú giải:</strong> Tải lên hình ảnh cho rằng bạn đang thiếu công, thể hiện ngày giờ tham gia hoạt động (ví dụ ảnh chụp màn hình có thời gian hoặc bằng chứng liên quan). Vui lòng không tải ảnh không liên quan.</div><div class="field"><label for="complaintFiles">Hình ảnh minh chứng (có thể chọn nhiều ảnh)</label><input id="complaintFiles" name="images" type="file" accept="image/*" multiple><div id="complaintPreview" class="complaint-images"></div></div></form>`, () => {
    const form = document.getElementById("complaintForm");
    if (!form.reportValidity()) return false;
    const files = [...(document.getElementById("complaintFiles").files || [])];
    if (files.some(file => !file.type.startsWith("image/"))) { showToast("Chỉ được tải lên tệp hình ảnh."); return false; }
    if (files.some(file => file.size > 5 * 1024 * 1024)) { showToast("Mỗi ảnh phải nhỏ hơn 5 MB trong bản demo."); return false; }
    Promise.all(files.map(file => new Promise((resolve,reject) => { const reader=new FileReader(); reader.onload=()=>resolve({name:file.name,data:reader.result}); reader.onerror=reject; reader.readAsDataURL(file); }))).then(images => {
      payrollComplaints.push({id:nextComplaintId++,memberId:member.id,comment:document.getElementById("complaintText").value.trim(),images,status:"Chờ duyệt",createdAt:new Date().toLocaleString("vi-VN"),reviewNote:""});
      closeModal(); renderPayroll(); showToast("Đã gửi khiếu nại, đang chờ quản trị viên phê duyệt.");
    }).catch(()=>showToast("Không đọc được ảnh. Vui lòng thử lại."));
    return false;
  });
  document.getElementById("complaintFiles").addEventListener("change", e => {
    const preview=document.getElementById("complaintPreview"); preview.innerHTML="";
    [...e.target.files].forEach(file=>{if(!file.type.startsWith("image/"))return;const img=document.createElement("img");img.alt=file.name;img.src=URL.createObjectURL(file);preview.appendChild(img);});
  });
  document.getElementById("modalSave").textContent="Gửi khiếu nại";
}

function showMemberComplaints(member) {
  const items=payrollComplaints.filter(c=>c.memberId===member.id);
  const html=items.length?items.map(c=>`<div class="complaint-card"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><strong>Khiếu nại #${c.id}</strong>${statusPill(c.status)}</div><p class="complaint-note">Gửi lúc: ${esc(c.createdAt)}</p><p>${esc(c.comment)}</p>${c.images.length?`<div class="complaint-images">${c.images.map(img=>`<a href="${img.data}" target="_blank" rel="noopener"><img src="${img.data}" alt="${esc(img.name)}"></a>`).join("")}</div>`:`<p class="complaint-note">Không có ảnh minh chứng.</p>`}${c.reviewNote?`<p class="complaint-note"><strong>Ghi chú duyệt:</strong> ${esc(c.reviewNote)}</p>`:""}${c.status==="Chờ duyệt"&&complaintIsAdmin()?`<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button class="btn btn-small btn-primary" data-review-complaint="${c.id}" data-decision="Đã duyệt">Duyệt khiếu nại</button><button class="btn btn-small" data-review-complaint="${c.id}" data-decision="Không duyệt">Không duyệt</button></div>`:""}</div>`).join(""):`<p class="complaint-note">Thành viên này chưa gửi khiếu nại.</p>`;
  openModal(`Khiếu nại · ${member.zalo}`,`<div>${html}<p class="complaint-note">Khiếu nại hiện chỉ lưu trong phiên demo, chưa được đồng bộ Firestore.</p></div>`,()=>true);
  document.getElementById("modalSave").textContent="Đóng";
}

document.addEventListener("click", e => {
  const btn=e.target.closest("button"); if(!btn)return;
  if(btn.dataset.newComplaint){const m=members.find(x=>x.id===Number(btn.dataset.newComplaint));if(m)openComplaintForm(m);return;}
  if(btn.dataset.listComplaints){const m=members.find(x=>x.id===Number(btn.dataset.listComplaints));if(m)showMemberComplaints(m);return;}
  if(btn.dataset.reviewComplaint){
    if(!complaintIsAdmin()){showToast('Chỉ Admin được xử lý khiếu nại.');return;}
    const c=payrollComplaints.find(x=>x.id===Number(btn.dataset.reviewComplaint));if(!c||c.status!=='Chờ duyệt')return;
    const decision=btn.dataset.decision;
    openModal('Phản hồi khiếu nại',`<div class="field"><label>Ghi chú xử lý ${esc(decision)}</label><textarea id="complaintDecisionNote" rows="3" placeholder="Nhập nội dung phản hồi..."></textarea></div>`,()=>{
      const note=document.getElementById('complaintDecisionNote').value.trim();
      if(!note){showToast('Vui lòng nhập nội dung phản hồi.');return false;}
      c.status=decision;c.reviewNote=note;c.reviewedAt=new Date().toLocaleString('vi-VN');
      renderPayroll();showToast('Đã phản hồi khiếu nại trong phiên demo; lịch sử vẫn được giữ.');return true;
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
