/** Đăng ký gia nhập bang: người dùng tạo yêu cầu; Admin duyệt để thêm vào members. */
import {getAuth,onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {getFirestore,doc,getDoc,setDoc,collection,onSnapshot,runTransaction,serverTimestamp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import {getApp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
const auth=getAuth(getApp()),db=getFirestore(getApp());
const guilds=['Đại Đế','Nhị Đế','Tam Đế','Chấp Niệm'];
const escText=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const toast=m=>typeof showToast==='function'?showToast(m):alert(m);
let admin=false,unsub=null,requests=[];
window.DaiDeRegistration={submit:async(uid,data)=>{
 if(auth.currentUser?.uid!==uid)throw Error('Không đúng tài khoản');
 if(!data.zalo?.trim()||!data.character?.trim()||!guilds.includes(data.guild)||!Number.isInteger(data.vehicles)||data.vehicles<1||data.vehicles>20)throw Error('Thông tin nhân vật không hợp lệ');
 const secondaryAccounts=(data.secondaryAccounts||[]).map(a=>({name:String(a.name).trim(),guild:a.guild,sect:a.sect}));
 if(secondaryAccounts.length>20||secondaryAccounts.some(a=>!a.name||!guilds.includes(a.guild)||!a.sect))throw Error('Acc phụ không hợp lệ');
 if((await getDoc(doc(db,'joinRequests',uid))).exists())throw Error('Tài khoản này đã có đơn đăng ký.');
 await setDoc(doc(db,'joinRequests',uid),{uid,zalo:data.zalo.trim(),character:data.character.trim(),guild:data.guild,sect:data.sect,vehicles:data.vehicles,secondaryAccounts,status:'pending',createdAt:serverTimestamp()});
}};
const host=document.createElement('section');host.className='card';host.id='guildJoinRequests';host.style.marginTop='16px';
host.innerHTML='<div class="section-head"><div><h2>Đăng ký gia nhập bang hội <span id="joinRequestCount"></span></h2><p>Trạng thái đăng ký được hiển thị cho tất cả thành viên đã đăng nhập.</p></div></div><div id="joinRequestSelf"></div><div id="joinRequestRows">Đang tải...</div>';
document.getElementById('page-members')?.appendChild(host);
const sects=['Thiên Vương','Thiếu Lâm','Đường Môn','Ngũ Độc','Nga My','Thúy Yên','Cái Bang','Thiên Nhẫn','Võ Đang','Côn Lôn'];
const opts=values=>values.map(v=>`<option value="${escText(v)}">${escText(v)}</option>`).join('');
const secondaryRow=()=>`<div class="secondary-account-form-row" style="padding:10px;margin:8px 0;border:1px solid var(--line);border-radius:8px"><div class="field"><label>Tên acc phụ</label><input name="secondaryName" maxlength="80"></div><div class="field"><label>Bang</label><select name="secondaryGuild">${opts(guilds)}</select></div><div class="field"><label>Môn phái</label><select name="secondarySect" required><option value="">-- Chọn môn phái --</option>${opts(sects)}</select></div><button type="button" class="btn btn-small" data-remove-join-secondary>− Xóa acc phụ</button></div>`;
function showJoinForm(){
 if(!auth.currentUser)return toast('Vui lòng đăng nhập.');
 openModal('Gửi đơn gia nhập bang hội',`<form id="joinExistingForm" class="form-grid">
 <div class="field"><label>Tên Zalo / tên gọi *</label><input id="joinZalo" maxlength="100" required></div>
 <div class="field"><label>Biệt danh / Tên acc chính *</label><input id="joinCharacter" maxlength="100" required></div>
 <div class="field"><label>Bang hội</label><select id="joinGuild">${opts(guilds)}</select></div>
 <div class="field"><label>Môn phái</label><select id="joinSect" required><option value="">-- Chọn môn phái --</option>${opts(sects)}</select></div>
 <div class="field"><label>Số acc</label><input id="joinVehicles" type="number" min="1" max="20" value="1" required></div>
 <div class="field full" style="grid-column:1/-1"><label>Acc phụ</label><div id="joinSecondaryRows"></div><button type="button" class="btn btn-small" id="joinAddSecondary">＋ Thêm acc phụ</button></div>
 </form><p id="joinFormError" role="alert" style="color:#e57373"></p><div class="notice warn">Đơn sẽ hiển thị công khai ở trạng thái Chờ duyệt. Chức vụ và hệ số lương do Admin quản lý.</div>`,()=>{
 const f=document.getElementById('joinExistingForm');if(!f.reportValidity())return false;
 const secondaryAccounts=[...f.querySelectorAll('.secondary-account-form-row')].map(row=>({name:row.querySelector('[name="secondaryName"]').value.trim(),guild:row.querySelector('[name="secondaryGuild"]').value,sect:row.querySelector('[name="secondarySect"]').value}));
 if(secondaryAccounts.some(a=>!a.name||!a.sect)){document.getElementById('joinFormError').textContent='Vui lòng nhập đầy đủ các acc phụ hoặc xóa dòng trống.';return false;}
 const data={zalo:document.getElementById('joinZalo').value,character:document.getElementById('joinCharacter').value,guild:document.getElementById('joinGuild').value,sect:document.getElementById('joinSect').value,vehicles:Number(document.getElementById('joinVehicles').value),secondaryAccounts};
 const save=document.getElementById('modalSave');save.disabled=true;save.textContent='Đang gửi...';
 window.DaiDeRegistration.submit(auth.currentUser.uid,data).then(()=>{closeModal();toast('Đã gửi đơn, đang chờ Admin duyệt.');}).catch(e=>{const el=document.getElementById('joinFormError');if(el)el.textContent='Không gửi được đơn: '+e.message;}).finally(()=>{save.disabled=false;save.textContent='Gửi đơn xét duyệt';});
 return false;
 });
 document.getElementById('modalSave').textContent='Gửi đơn xét duyệt';
 document.getElementById('joinAddSecondary').addEventListener('click',()=>document.getElementById('joinSecondaryRows').insertAdjacentHTML('beforeend',secondaryRow()));
 document.getElementById('joinSecondaryRows').addEventListener('click',e=>{if(e.target.closest('[data-remove-join-secondary]'))e.target.closest('.secondary-account-form-row').remove();});
 document.getElementById('joinExistingForm').addEventListener('submit',e=>{e.preventDefault();document.getElementById('modalSave').click();});
}
function render(){
 const rows=document.getElementById('joinRequestRows');if(!rows)return;
 const mine=requests.find(r=>r.uid===auth.currentUser?.uid);const self=document.getElementById('joinRequestSelf');
 if(self)self.innerHTML=mine?`<p class="notice">Đơn của bạn: <strong>${mine.status==='pending'?'Chờ duyệt':mine.status==='approved'?'Đã duyệt':'Từ chối'}</strong>${mine.reason?' · '+escText(mine.reason):''}</p>`:'<p class="notice">Bạn chưa có đơn gia nhập bang hội. <button type="button" class="btn btn-primary btn-small" id="joinExistingBtn">＋ Gửi đơn gia nhập bang hội</button></p>'; 
 document.getElementById('joinRequestCount').textContent=`(${requests.filter(r=>r.status==='pending').length} chờ duyệt)`;
 rows.innerHTML=requests.length?requests.map(r=>`<div style="padding:12px 0;border-bottom:1px solid var(--line)"><strong>${escText(r.character)}</strong> · ${escText(r.zalo)} · ${escText(r.guild)} · ${escText(r.sect)}<br><small class="muted">Acc phụ: ${(r.secondaryAccounts||[]).map(a=>escText(a.name)+' ('+escText(a.guild)+')').join(', ')||'Không có'}</small><br><strong style="color:${r.status==='approved'?'#36ad79':r.status==='rejected'?'#e57373':'#dba344'}">${r.status==='approved'?'Đã duyệt':r.status==='rejected'?'Từ chối':'Chờ duyệt'}</strong>${r.reason?` · ${escText(r.reason)}`:''}${admin&&r.status==='pending'?` <button class="btn btn-small" data-join-approve="${escText(r.uid)}">Duyệt</button> <button class="btn btn-small" data-join-reject="${escText(r.uid)}">Từ chối</button>`:''}</div>`).join(''):'<p class="muted">Chưa có hồ sơ đăng ký.</p>';
}
async function decide(uid,approve){
 const r=requests.find(x=>x.uid===uid);if(!r||!admin)return;
 const reason=approve?'':prompt('Lý do từ chối (hiển thị cho các thành viên):');if(!approve&&reason===null)return;
 try{
  await runTransaction(db,async tx=>{
   const reqRef=doc(db,'joinRequests',uid),snap=await tx.get(reqRef);
   if(!snap.exists()||snap.data().status!=='pending')throw Error('Yêu cầu đã được xử lý');
   const data=snap.data();
   if(approve){const memberId=String(Date.now());const memberRef=doc(db,'members',memberId);if((await tx.get(memberRef)).exists())throw Error('Hồ sơ đã tồn tại');
    tx.set(memberRef,{id:Number(memberId),ownerUid:uid,zalo:data.zalo,character:data.character,guild:data.guild,sect:data.sect,vehicles:data.vehicles,secondaryAccounts:data.secondaryAccounts||[],role:'Thành viên',coefBoss:1,coefCtc:1,boss:[],ctc:[],paidBoss:'Chưa nhận',paidCtc:'Chưa nhận',createdAt:serverTimestamp()});
   }
   tx.update(reqRef,{status:approve?'approved':'rejected',reason:approve?'':(reason||'Không được chấp thuận').slice(0,300),reviewedAt:serverTimestamp(),reviewedBy:auth.currentUser.uid});
  });toast(approve?'Đã duyệt và thêm thành viên.':'Đã từ chối yêu cầu.');
 }catch(e){toast('Không xử lý được: '+e.message);}
}
host.addEventListener('click',e=>{if(e.target.closest('#joinExistingBtn')){showJoinForm();return;}const a=e.target.closest('[data-join-approve]'),r=e.target.closest('[data-join-reject]');if(a)decide(a.dataset.joinApprove,true);if(r)decide(r.dataset.joinReject,false);});
onAuthStateChanged(auth,async user=>{
 if(unsub){unsub();unsub=null;}requests=[];admin=false;
 if(!user){host.hidden=true;return;}host.hidden=false;
 try{const profile=await getDoc(doc(db,'users',user.uid));admin=profile.exists()&&profile.data().role==='admin'&&profile.data().status==='active';}catch(e){toast('Không đọc được quyền duyệt: '+e.message);}
 unsub=onSnapshot(collection(db,'joinRequests'),snap=>{requests=snap.docs.map(d=>d.data()).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));render();},e=>{document.getElementById('joinRequestRows').textContent='Không tải được yêu cầu: '+e.message;});
});
