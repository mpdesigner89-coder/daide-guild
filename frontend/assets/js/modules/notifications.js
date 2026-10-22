/** Trung tâm thông báo dựa trên các đơn joinRequests đã đồng bộ Firestore.
 * Chưa có collection notifications; trạng thái đã xem lưu theo thiết bị.
 */
import {getAuth,onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {getApp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {getFirestore,getDoc,doc} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
const auth=getAuth(getApp()),db=getFirestore(getApp());
const bell=document.getElementById('notificationBell'),badge=document.getElementById('notificationBadge'),panel=document.getElementById('notificationPanel'),items=document.getElementById('notificationItems');
let uid='',admin=false,requests=[],complaints=[],messages=[];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const key=()=>`daide-notice-seen-${uid}`;
const readSeen=()=>{try{return new Set(JSON.parse(localStorage.getItem(key())||'[]'))}catch{return new Set()}};
function update(){
 const seen=readSeen();messages=requests.filter(r=>admin||r.uid===uid).map(r=>({id:`join-${r.uid}-${r.status}`,title:r.status==='pending'?'Yêu cầu gia nhập đang chờ duyệt':r.status==='approved'?'Đơn gia nhập đã được duyệt':'Đơn gia nhập đã bị từ chối',detail:`${r.character||''} · ${r.guild||''}${r.reason?' · '+r.reason:''}`,pending:r.status==='pending'}));
 messages.push(...complaints.filter(c=>admin||c.ownerUid===uid).map(c=>({id:`complaint-${c.id}-${c.status}`,title:c.status==='pending'?'Khiếu nại đang chờ xử lý':c.status==='approved'?'Khiếu nại đã được duyệt':'Khiếu nại đã bị từ chối',detail:`${c.memberName||''} · ${c.status==='pending'?(c.comment||''):c.reviewNote||''}`})));
 const unread=messages.filter(m=>!seen.has(m.id)).length;
 badge.textContent=unread>99?'99+':String(unread);bell.setAttribute('aria-label',`${unread} thông báo chưa đọc`);
 items.innerHTML=messages.length?messages.map(m=>`<div class="notification-item ${seen.has(m.id)?'':'unread'}"><strong>${esc(m.title)}</strong><div>${esc(m.detail)}</div></div>`).join(''):'<p class="muted">Chưa có thông báo nào.</p>';
}
bell.addEventListener('click',()=>{panel.hidden=!panel.hidden;if(!panel.hidden){localStorage.setItem(key(),JSON.stringify(messages.map(m=>m.id)));update();}});
document.getElementById('notificationClose').addEventListener('click',()=>panel.hidden=true);
window.addEventListener('daide:complaints',e=>{complaints=e.detail||[];update();});
window.addEventListener('daide:join-requests',e=>{if(e.detail.uid!==uid)return;requests=e.detail.requests;admin=e.detail.admin;update();});
onAuthStateChanged(auth,async user=>{
 uid=user?.uid||'';admin=false;requests=[];complaints=[];panel.hidden=true;bell.hidden=!user;
 if(user){try{const snap=await getDoc(doc(db,'users',uid));admin=snap.data()?.role==='admin'&&snap.data()?.status==='active';}catch(e){console.warn('Không đọc được vai trò:',e);}}
 window.dispatchEvent(new CustomEvent('daide:role',{detail:{admin,uid}}));update();
});
