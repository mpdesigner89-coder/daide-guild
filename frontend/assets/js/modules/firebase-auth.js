/** Firebase Authentication: đăng ký email, Google, đăng nhập và hồ sơ cơ bản. */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, updateProfile, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
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
  submit.disabled = busy;
  submit.textContent = busy ? "Đang xử lý..." : label;
}
async function saveProfile(user, username, nickname, provider) {
  // Tên tài khoản không phải định danh duy nhất cho tới khi có backend kiểm tra trùng.
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid, email: user.email || "", username: username || "",
    nickname: nickname || user.displayName || "", provider,
    role: "pending", createdAt: serverTimestamp()
  }, { merge: true });
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
  openModal("Đăng ký thành viên Đại Đế", `<form id="firebaseRegisterForm" class="form-grid">${field("registerUsername", "Username (tài khoản đăng nhập)", "text", "username", "3–24 ký tự: chữ không dấu, số hoặc dấu _.")}${field("registerPassword", "Password (mật khẩu)", "password", "new-password")}${field("registerNickname", "Biệt danh", "text", "nickname", "Xin nhập đúng tên ingame.")}</form><p id="firebaseFormError" role="alert" style="color:#e57373"></p><div class="notice warn">Tài khoản mới chưa được cấp quyền quản trị. Không sử dụng chức năng demo để quản lý lương thật.</div><button class="btn" type="button" id="registerGoogle" style="width:100%;margin-top:12px">Đăng ký / đăng nhập bằng Google</button>`, () => {
    const form = document.getElementById("firebaseRegisterForm");
    if (!form.reportValidity()) return false;
    const username = document.getElementById("registerUsername").value.trim();
    const email = usernameEmail(username);
    const password = document.getElementById("registerPassword").value;
    const nickname = document.getElementById("registerNickname").value.trim();
    if (!usernamePattern.test(username)) { document.getElementById("firebaseFormError").textContent = "Username phải dài 3–24 ký tự, chỉ gồm chữ không dấu, số hoặc dấu _."; return false; }
    if (!nickname) return false;
    setBusy(true, "Tạo tài khoản");
    createUserWithEmailAndPassword(auth, email, password).then(async ({user}) => {
      await updateProfile(user, {displayName: nickname});
      try { await saveProfile(user, username, nickname, "password"); }
      catch (e) { notify("Tạo tài khoản thành công nhưng chưa lưu hồ sơ Firestore. Cần thiết lập Security Rules."); }
      closeModal(); notify("Đã đăng ký thành công. Hãy ghi nhớ username và mật khẩu; tài khoản username chưa hỗ trợ khôi phục bằng email.");
    }).catch(showError).finally(() => setBusy(false, "Tạo tài khoản"));
    return false;
  });
  setBusy(false, "Tạo tài khoản");
  document.getElementById("firebaseRegisterForm").addEventListener("submit", e => { e.preventDefault(); document.getElementById("modalSave").click(); });
  document.getElementById("registerGoogle").addEventListener("click", googleLogin);
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
        try { await setDoc(doc(db,"users",user.uid), {uid:user.uid, email:user.email || "", nickname, provider:"google", role:"pending", updatedAt:serverTimestamp()}, {merge:true}); }
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
