/** Firebase Authentication: đăng ký email, Google, đăng nhập và hồ sơ cơ bản. */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, updateProfile, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const loginButton = document.getElementById("loginBtn");
const registerButton = document.getElementById("registerBtn");
let currentUser = null;
const notify = message => typeof showToast === "function" ? showToast(message) : alert(message);
function errorMessage(code) {
  return ({
    "auth/email-already-in-use": "Username này đã được đăng ký.",
    "auth/invalid-email": "Tên tài khoản không hợp lệ.",
    "auth/invalid-username": "Username phải gồm 3–24 ký tự chữ không dấu, số hoặc dấu _.",
    "auth/weak-password": "Mật khẩu quá yếu (cần ít nhất 6 ký tự).",
    "auth/invalid-credential": "Tài khoản hoặc mật khẩu không đúng.",
    "auth/popup-closed-by-user": "Bạn đã đóng cửa sổ đăng nhập Google.",
    "auth/popup-blocked": "Trình duyệt chặn cửa sổ Google. Hãy cho phép cửa sổ bật lên.",
    "auth/unauthorized-domain": "Tên miền chưa được thêm vào Firebase Authentication → Authorized domains.",
    "auth/operation-not-allowed": "Phương thức đăng nhập chưa được bật trong Firebase Authentication.",
    "auth/account-exists-with-different-credential": "Email đã dùng với phương thức đăng nhập khác.",
    "auth/network-request-failed": "Không thể kết nối Firebase."
  })[code] || `Có lỗi xảy ra (${code || "không xác định"}).`;
}
function field(id, label, type, autocomplete, hint = "") {
  return `<div class="field" style="grid-column:1/-1"><label for="${id}">${label}</label><input id="${id}" type="${type}" autocomplete="${autocomplete}" required ${type === "password" ? 'minlength="6"' : ''}>${hint ? `<small class="muted">${hint}</small>` : ''}</div>`;
}
function showError(error) {
  const target = document.getElementById("firebaseFormError");
  if (target) target.textContent = errorMessage(error.code);
}
function setBusy(busy, label) {
  const submit = document.getElementById("modalSave");
  if (!submit) return;
  submit.disabled = busy;
  submit.textContent = busy ? "Đang xử lý..." : label;
}
async function saveProfile(user, username, nickname) {
  const ref = doc(db, "users", user.uid);
  const existing = await getDoc(ref);
  if (existing.exists()) return; // Không ghi đè role của tài khoản đã có.
  await setDoc(ref, {username, nickname, role:"member", status:"active", createdAt:serverTimestamp()});
}
const usernamePattern = /^[a-zA-Z0-9_]{3,24}$/;
// Firebase Email/Password requires an email identifier. Username-only accounts use a
// deterministic internal identifier; real email accounts continue to work unchanged.
function usernameEmail(username) { return `${username.toLowerCase()}@accounts.daide.invalid`; }
function loginIdentifier(value) {
  const identifier = value.trim();
  if (identifier.includes("@")) return identifier;
  if (!usernamePattern.test(identifier)) throw {code:"auth/invalid-username"};
  return usernameEmail(identifier);
}
function showLogin() {
  openModal("Đăng nhập Đại Đế", `<form id="firebaseLoginForm" class="form-grid">${field("firebaseEmail", "Email hoặc Username", "text", "username")}${field("firebasePassword", "Mật khẩu", "password", "current-password")}</form><p id="firebaseFormError" role="alert" style="color:#e57373"></p><div class="notice warn">Dữ liệu chấm công và lương vẫn là dữ liệu demo.</div>`, () => {
    const form = document.getElementById("firebaseLoginForm");
    if (!form.reportValidity()) return false;
    setBusy(true, "Đăng nhập");
    signInWithEmailAndPassword(auth, loginIdentifier(document.getElementById("firebaseEmail").value), document.getElementById("firebasePassword").value)
      .then(() => { closeModal(); notify("Đăng nhập thành công."); })
      .catch(showError).finally(() => setBusy(false, "Đăng nhập"));
    return false;
  });
  setBusy(false, "Đăng nhập");
  document.getElementById("firebaseLoginForm").addEventListener("submit", e => { e.preventDefault(); document.getElementById("modalSave").click(); });
}
function showRegister() {
  const guilds=["Đại Đế","Nhị Đế","Tam Đế","Chấp Niệm"];
  const sects=["Thiên Vương","Thiếu Lâm","Đường Môn","Ngũ Độc","Nga My","Thúy Yên","Cái Bang","Thiên Nhẫn","Võ Đang","Côn Lôn"];
  const options=items=>items.map(v=>`<option value="${v}">${v}</option>`).join("");
  const secondaryRow=()=>`<div class="secondary-account-form-row" style="border:1px solid var(--line);border-radius:10px;padding:10px;margin:8px 0"><div class="field"><label>Tên acc phụ</label><input name="secondaryName" maxlength="80"></div><div class="field"><label>Bang</label><select name="secondaryGuild">${options(guilds)}</select></div><div class="field"><label>Môn phái</label><select name="secondarySect"><option value="">-- Chọn môn phái --</option>${options(sects)}</select></div><button type="button" class="btn btn-small" data-remove-register-secondary>− Xóa acc phụ</button></div>`;
  openModal("Đăng ký thành viên Đại Đế", `<form id="firebaseRegisterForm" class="form-grid">
    ${field("registerUsername","Username (tài khoản đăng nhập)","text","username","3–24 ký tự: chữ không dấu, số hoặc _.")}
    ${field("registerPassword","Password (mật khẩu)","password","new-password")}
    ${field("registerZalo","Tên Zalo / tên gọi","text","nickname")}
    ${field("registerNickname","Biệt danh / Tên acc chính","text","nickname","Tên ingame của nhân vật chính")}
    <div class="field"><label>Bang hội</label><select id="registerGuild">${options(guilds)}</select></div>
    <div class="field"><label>Môn phái</label><select id="registerSect" required><option value="">-- Chọn môn phái --</option>${options(sects)}</select></div>
    <div class="field"><label>Số acc</label><input id="registerVehicles" type="number" min="1" value="1" required></div>
    <div class="field full" style="grid-column:1/-1"><label>Danh sách acc phụ</label><div id="registerSecondaryRows"></div><button type="button" class="btn btn-small" id="registerAddSecondary">＋ Thêm acc phụ</button></div>
  </form><p id="firebaseFormError" role="alert" style="color:#e57373"></p><div class="notice warn">Hồ sơ gia nhập sẽ ở trạng thái Chờ duyệt, hiển thị công khai cho các thành viên đã đăng nhập. Admin xét duyệt trước khi được chấm công và tính lương.</div>`, () => {
    const form=document.getElementById("firebaseRegisterForm");
    if(!form.reportValidity())return false;
    const username=document.getElementById("registerUsername").value.trim();
    if(!usernamePattern.test(username)){document.getElementById("firebaseFormError").textContent="Username phải gồm 3–24 ký tự chữ không dấu, số hoặc _.";return false;}
    const nickname=document.getElementById("registerNickname").value.trim();
    const zalo=document.getElementById("registerZalo").value.trim();
    if(!nickname||!zalo)return false;
    const secondaryAccounts=[...form.querySelectorAll(".secondary-account-form-row")].map(row=>({name:row.querySelector('[name="secondaryName"]').value.trim(),guild:row.querySelector('[name="secondaryGuild"]').value,sect:row.querySelector('[name="secondarySect"]').value})).filter(a=>a.name);
    const registration={zalo,character:nickname,guild:document.getElementById("registerGuild").value,sect:document.getElementById("registerSect").value,vehicles:Number(document.getElementById("registerVehicles").value),secondaryAccounts};
    setBusy(true,"Đang đăng ký...");
    createUserWithEmailAndPassword(auth,usernameEmail(username),document.getElementById("registerPassword").value).then(async({user})=>{
      await updateProfile(user,{displayName:nickname});
      await saveProfile(user,username,nickname);
      await window.DaiDeRegistration.submit(user.uid,registration);
      closeModal();notify("Đăng ký thành công! Hồ sơ đã được gửi và đang chờ Admin duyệt.");
    }).catch(e=>{const target=document.getElementById("firebaseFormError");if(target)target.textContent=e.code?errorMessage(e.code):`Lỗi lưu hồ sơ: ${e.message}. Nếu tài khoản đã tạo, hãy liên hệ Admin để hoàn tất yêu cầu.`;}).finally(()=>setBusy(false,"Đăng ký"));
    return false;
  });
  setBusy(false,"Đăng ký và gửi xét duyệt");
  document.getElementById("registerAddSecondary").addEventListener("click",()=>document.getElementById("registerSecondaryRows").insertAdjacentHTML("beforeend",secondaryRow()));
  document.getElementById("registerSecondaryRows").addEventListener("click",e=>{if(e.target.closest("[data-remove-register-secondary]"))e.target.closest(".secondary-account-form-row").remove();});
  document.getElementById("firebaseRegisterForm").addEventListener("submit",e=>{e.preventDefault();document.getElementById("modalSave").click();});
}

async function googleLogin() {
  try {
    const {user} = await signInWithPopup(auth, new GoogleAuthProvider());
    closeModal();
    // Prompt for an in-game nickname immediately after Google authentication.
    openModal("Tên nhân vật trong game", `<div class="field"><label for="googleNickname">Biệt danh</label><input id="googleNickname" autocomplete="nickname" required value=""><small class="muted">Xin nhập đúng tên ingame.</small></div><p id="firebaseFormError" role="alert" style="color:#e57373"></p>`, () => {
      const nickname = document.getElementById("googleNickname").value.trim();
      if (!nickname) { document.getElementById("firebaseFormError").textContent = "Vui lòng nhập tên ingame."; return false; }
      setBusy(true, "Lưu tên ingame");
      updateProfile(user, {displayName:nickname}).then(async () => {
        try { const ref=doc(db,"users",user.uid);
          const existing=await getDoc(ref);
          if (!existing.exists()) await setDoc(ref,{username:"",nickname,role:"member",status:"active",createdAt:serverTimestamp()});
          else if(existing.data().nickname!==nickname) await updateProfile(user,{displayName:existing.data().nickname||nickname}); }
        catch (e) { notify("Đã cập nhật tên hiển thị nhưng chưa lưu được Firestore. Kiểm tra Security Rules."); }
        closeModal(); notify("Đăng nhập Google thành công.");
      }).catch(showError).finally(() => setBusy(false, "Lưu tên ingame"));
      return false;
    });
    setBusy(false, "Lưu tên ingame");
  } catch (e) { showError(e); }
}
onAuthStateChanged(auth, user => {
  currentUser = user;
  loginButton.textContent = user ? `⇥ ${user.displayName || (user.email?.endsWith("@accounts.daide.invalid") ? user.email.split("@")[0] : user.email) || "Tài khoản"}` : "⇥ Đăng nhập";
  loginButton.title = user ? "Bấm để đăng xuất" : "Đăng nhập";
  registerButton.hidden = !!user;
});
loginButton.addEventListener("click", () => {
  if (!currentUser) return showLogin();
  openModal("Đăng xuất", `<p>Bạn đang đăng nhập với tài khoản <strong id="currentEmail"></strong>.</p>`, () => {
    signOut(auth).then(() => notify("Đã đăng xuất.")).catch(e => notify(errorMessage(e.code)));
    return true;
  });
  document.getElementById("currentEmail").textContent = currentUser.email || "";
  document.getElementById("modalSave").textContent = "Đăng xuất";
});
registerButton.addEventListener("click", showRegister);
window.DaiDeFirebase = {app, auth, db};
