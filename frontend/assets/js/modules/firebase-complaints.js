/** Khiếu nại Firestore: quyền gửi theo ownerUid của hồ sơ thành viên. */
import {getAuth,onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {getApp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {getFirestore,collection,doc,getDoc,onSnapshot,query,where,addDoc,updateDoc,serverTimestamp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
const auth=getAuth(getApp()),db=getFirestore(getApp());
let admin=false,uid='',unsub=null;
const notify=()=>window.dispatchEvent(new CustomEvent('daide:complaints',{detail:[...records]}));
let records=[];
const canSubmit=m=>Boolean(uid&&(admin||m?.ownerUid===uid));
window.DaiDeComplaints={
 canSubmit,
 submit:async(m,comment)=>{
  if(!canSubmit(m))throw Error('Không có quyền gửi cho nhân vật này');
  if(!comment||comment.length>2000)throw Error('Nội dung không hợp lệ');
  await addDoc(collection(db,'complaints'),{memberId:m.id,ownerUid:uid,memberName:m.zalo,comment,status:'pending',reviewNote:'',createdAt:serverTimestamp()});
 },
 review:async(id,status,reviewNote)=>{
  if(!admin||!['approved','rejected'].includes(status))throw Error('Không có quyền duyệt');
  if(!reviewNote||reviewNote.length>2000)throw Error('Phản hồi không hợp lệ');
  await updateDoc(doc(db,'complaints',id),{status,reviewNote,reviewedBy:uid,reviewedAt:serverTimestamp()});
 }
};
onAuthStateChanged(auth,async user=>{
 if(unsub){unsub();unsub=null;}uid=user?.uid||'';admin=false;records=[];notify();
 if(!uid)return;
 try{
  const profile=await getDoc(doc(db,'users',uid));
  admin=profile.exists()&&profile.data().status==='active'&&profile.data().role==='admin';
  unsub=onSnapshot(admin?collection(db,'complaints'):query(collection(db,'complaints'),where('ownerUid','==',uid)),snapshot=>{
   records=snapshot.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
   notify();
  },e=>{console.error('Không đọc được khiếu nại:',e);if(typeof showToast==='function')showToast('Lỗi tải khiếu nại: '+e.message);});
 }catch(e){console.error('Không xác minh được quyền khiếu nại:',e);}
});
