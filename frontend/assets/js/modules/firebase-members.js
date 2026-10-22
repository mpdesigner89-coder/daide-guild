/** Firestore members: dữ liệu thật, riêng biệt với hồ sơ đăng nhập users. */
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, onSnapshot, setDoc, deleteDoc, serverTimestamp, runTransaction } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
const auth=getAuth(getApp()), db=getFirestore(getApp());
let admin=false, unsubscribe=null, ready=false;
const show=m=>typeof showToast==="function"?showToast(m):alert(m);
const validRecord=r=>({id:Number(r.id),sortOrder:Number.isSafeInteger(r.sortOrder)&&r.sortOrder>=0?r.sortOrder:Number(r.id),ownerUid:String(r.ownerUid||""),zalo:String(r.zalo||""),character:String(r.character||""),sect:String(r.sect||""),guild:String(r.guild||"Đại Đế"),role:String(r.role||"Thành viên"),vehicles:Number(r.vehicles||1),coefBoss:Number(r.coefBoss??1),coefCtc:Number(r.coefCtc??1),secondaryAccounts:Array.isArray(r.secondaryAccounts)?r.secondaryAccounts:[],boss:Array.isArray(r.boss)?r.boss:[],ctc:Array.isArray(r.ctc)?r.ctc:[],paidBoss:String(r.paidBoss||"Chưa nhận"),paidCtc:String(r.paidCtc||"Chưa nhận")});
window.DaiDeMembers={isAdmin:()=>admin,save:async record=>{if(!admin)throw Error("Không có quyền Admin");const r=validRecord(record);const old=members.find(m=>m.id===r.id);if(old?.ownerUid&&!r.ownerUid)r.ownerUid=old.ownerUid;if(!Number.isSafeInteger(record.sortOrder)){const previous=members.find(m=>m.id===r.id);r.sortOrder=previous?memberOrderValue(previous):Math.max(0,...members.map(m=>memberOrderValue(m)))+1;}if(!Number.isSafeInteger(r.id))throw Error("ID không hợp lệ");await setDoc(doc(db,"members",String(r.id)),{...r,updatedAt:serverTimestamp()},{merge:true});},remove:async id=>{if(!admin)throw Error("Không có quyền Admin");await deleteDoc(doc(db,"members",String(id)));},
move:async (firstId,secondId)=>{
  if(!admin)throw Error("Chỉ Admin được sắp xếp.");
  const first=doc(db,"members",String(firstId)), second=doc(db,"members",String(secondId));
  await runTransaction(db,async tx=>{
    const a=await tx.get(first), b=await tx.get(second);
    if(!a.exists()||!b.exists())throw Error("Thành viên không còn tồn tại.");
    const aOrder=Number.isSafeInteger(a.data().sortOrder)?a.data().sortOrder:Number(firstId);
    const bOrder=Number.isSafeInteger(b.data().sortOrder)?b.data().sortOrder:Number(secondId);
    tx.update(first,{sortOrder:bOrder});
    tx.update(second,{sortOrder:aOrder});
  });
}};
onAuthStateChanged(auth,async user=>{
  if(unsubscribe){unsubscribe();unsubscribe=null;}admin=false;ready=false;
  if(!user){show("Hãy đăng nhập để tải danh sách thành viên.");return;}
  try{
    const profile=await getDoc(doc(db,"users",user.uid));
    admin=profile.exists()&&profile.data().role==="admin"&&profile.data().status==="active";
    document.getElementById("addMemberBtn").hidden=!admin;
    document.getElementById("addMemberBtn").hidden=!admin;
    if(admin)show("Đã xác minh quyền Admin từ Firestore.");
    unsubscribe=onSnapshot(collection(db,"members"),snapshot=>{
      members=snapshot.docs.map(d=>validRecord(d.data())).filter(m=>Number.isSafeInteger(m.id));
      nextId=Math.max(20,...members.map(m=>m.id+1));ready=true;renderAll();
    },err=>{show("Không đọc được danh sách thành viên: "+err.message);});
  }catch(e){show("Lỗi đọc quyền truy cập: "+e.message);}
});
