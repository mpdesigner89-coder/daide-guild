/** Firestore members: dữ liệu thật, riêng biệt với hồ sơ đăng nhập users. */
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, onSnapshot, setDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
const auth=getAuth(getApp()), db=getFirestore(getApp());
let admin=false, unsubscribe=null, ready=false;
const show=m=>typeof showToast==="function"?showToast(m):alert(m);
const validRecord=r=>({id:Number(r.id),zalo:String(r.zalo||""),character:String(r.character||""),sect:String(r.sect||""),guild:String(r.guild||"Đại Đế"),role:String(r.role||"Thành viên"),vehicles:Number(r.vehicles||1),coefBoss:Number(r.coefBoss??1),coefCtc:Number(r.coefCtc??1),secondaryAccounts:Array.isArray(r.secondaryAccounts)?r.secondaryAccounts:[],boss:Array.isArray(r.boss)?r.boss:[],ctc:Array.isArray(r.ctc)?r.ctc:[],paidBoss:String(r.paidBoss||"Chưa nhận"),paidCtc:String(r.paidCtc||"Chưa nhận")});
window.DaiDeMembers={isAdmin:()=>admin,save:async record=>{if(!admin)throw Error("Không có quyền Admin");const r=validRecord(record);if(!Number.isSafeInteger(r.id))throw Error("ID không hợp lệ");await setDoc(doc(db,"members",String(r.id)),{...r,updatedAt:serverTimestamp()},{merge:true});},remove:async id=>{if(!admin)throw Error("Không có quyền Admin");await deleteDoc(doc(db,"members",String(id)));}};
onAuthStateChanged(auth,async user=>{
  if(unsubscribe){unsubscribe();unsubscribe=null;}admin=false;ready=false;
  if(!user){show("Hãy đăng nhập để tải danh sách thành viên.");return;}
  try{
    const profile=await getDoc(doc(db,"users",user.uid));
    admin=profile.exists()&&profile.data().role==="admin"&&profile.data().status==="active";
    document.getElementById("quickAddBtn").hidden=!admin;
    document.getElementById("addMemberBtn").hidden=!admin;
    if(admin)show("Đã xác minh quyền Admin từ Firestore.");
    unsubscribe=onSnapshot(collection(db,"members"),snapshot=>{
      members=snapshot.docs.map(d=>validRecord(d.data())).filter(m=>Number.isSafeInteger(m.id));
      nextId=Math.max(20,...members.map(m=>m.id+1));ready=true;renderAll();
    },err=>{show("Không đọc được danh sách thành viên: "+err.message);});
  }catch(e){show("Lỗi đọc quyền truy cập: "+e.message);}
});
