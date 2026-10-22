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
 if(secondaryAccounts.length>20||secondaryAccounts.some(a=>!a.name||!guilds.includes(a.guild)))throw Error('Acc phụ không hợp lệ');
 await setDoc(doc(db,'joinRequests',uid),{uid,zalo:data.zalo.trim(),character:data.character.trim(),guild:data.guild,sect:data.sect,vehicles:data.vehicles,secondaryAccounts,status:'pending',createdAt:serverTimestamp()});
}};
const host=document.createElement('section');host.className='card';host.id='guildJoinRequests';host.style.marginTop='16px';
host.innerHTML='<div class="section-head"><div><h2>Đăng ký gia nhập bang hội <span id="joinRequestCount"></span></h2><p>Trạng thái đăng ký được hiển thị cho tất cả thành viên đã đăng nhập.</p></div></div><div id="joinRequestRows">Đang tải...</div>';
document.getElementById('page-members')?.appendChild(host);
function render(){
 const rows=document.getElementById('joinRequestRows');if(!rows)return;
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
   if(approve){const memberRef=doc(db,'members',uid);if((await tx.get(memberRef)).exists())throw Error('Hồ sơ đã tồn tại');
    tx.set(memberRef,{id:Date.now(),ownerUid:uid,zalo:data.zalo,character:data.character,guild:data.guild,sect:data.sect,vehicles:data.vehicles,secondaryAccounts:data.secondaryAccounts||[],role:'Thành viên',coefBoss:1,coefCtc:1,boss:[],ctc:[],paidBoss:'Chưa nhận',paidCtc:'Chưa nhận',createdAt:serverTimestamp()});
   }
   tx.update(reqRef,{status:approve?'approved':'rejected',reason:approve?'':(reason||'Không được chấp thuận').slice(0,300),reviewedAt:serverTimestamp(),reviewedBy:auth.currentUser.uid});
  });toast(approve?'Đã duyệt và thêm thành viên.':'Đã từ chối yêu cầu.');
 }catch(e){toast('Không xử lý được: '+e.message);}
}
host.addEventListener('click',e=>{const a=e.target.closest('[data-join-approve]'),r=e.target.closest('[data-join-reject]');if(a)decide(a.dataset.joinApprove,true);if(r)decide(r.dataset.joinReject,false);});
onAuthStateChanged(auth,async user=>{
 if(unsub){unsub();unsub=null;}requests=[];admin=false;
 if(!user){host.hidden=true;return;}host.hidden=false;
 try{const profile=await getDoc(doc(db,'users',user.uid));admin=profile.exists()&&profile.data().role==='admin'&&profile.data().status==='active';}catch(e){toast('Không đọc được quyền duyệt: '+e.message);}
 unsub=onSnapshot(collection(db,'joinRequests'),snap=>{requests=snap.docs.map(d=>d.data()).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));render();},e=>{document.getElementById('joinRequestRows').textContent='Không tải được yêu cầu: '+e.message;});
});
