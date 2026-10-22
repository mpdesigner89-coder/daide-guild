/** Firebase Auth - bước 1: xác thực thật; dữ liệu nghiệp vụ vẫn là demo. */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const button = document.getElementById("loginBtn");
let currentUser = null;

function notify(message) { if (typeof showToast === "function") showToast(message); else alert(message); }
function errorMessage(code) {
  const messages = {
    "auth/invalid-email": "Email không hợp lệ.",
    "auth/invalid-credential": "Email hoặc mật khẩu không đúng.",
    "auth/user-disabled": "Tài khoản đã bị vô hiệu hóa.",
    "auth/too-many-requests": "Đăng nhập quá nhiều lần. Vui lòng thử lại sau.",
    "auth/network-request-failed": "Không thể kết nối Firebase. Kiểm tra mạng."
  };
  return messages[code] || `Không thể đăng nhập (${code || "lỗi không xác định"}).`;
}

onAuthStateChanged(auth, user => {
  currentUser = user;
  button.textContent = user ? `⇥ ${user.email || "Tài khoản"}` : "⇥ Đăng nhập";
  button.title = user ? "Bấm để đăng xuất" : "Đăng nhập bằng Firebase";
});

button.addEventListener("click", async () => {
  if (currentUser) {
    openModal("Đăng xuất", `<p>Đang đăng nhập bằng tài khoản <strong id="currentEmail"></strong>.</p><p class="notice warn">Dữ liệu trên website vẫn là dữ liệu demo, chưa được lưu vào Firestore.</p>`, () => {
      signOut(auth).then(() => notify("Đã đăng xuất.")).catch(e => notify(errorMessage(e.code)));
      return true;
    });
    document.getElementById("currentEmail").textContent = currentUser.email || "";
    document.getElementById("modalSave").textContent = "Đăng xuất";
    return;
  }
  openModal("Đăng nhập Firebase", `<form id="firebaseLoginForm" class="form-grid"><div class="field" style="grid-column:1/-1"><label for="firebaseEmail">Email</label><input id="firebaseEmail" type="email" autocomplete="username" required></div><div class="field" style="grid-column:1/-1"><label for="firebasePassword">Mật khẩu</label><input id="firebasePassword" type="password" autocomplete="current-password" required></div></form><div class="notice warn">Chỉ dùng tài khoản đã được quản trị viên tạo trong Firebase Authentication. Chấm công, lương và thu chi vẫn đang là dữ liệu demo.</div><p id="firebaseLoginError" role="alert" style="color:#c62828"></p>`, () => {
    const form = document.getElementById("firebaseLoginForm");
    if (!form.reportValidity()) return false;
    const email = document.getElementById("firebaseEmail").value.trim();
    const password = document.getElementById("firebasePassword").value;
    const submit = document.getElementById("modalSave");
    submit.disabled = true;
    submit.textContent = "Đang đăng nhập...";
    signInWithEmailAndPassword(auth, email, password).then(() => {
      closeModal();
      notify("Đăng nhập Firebase thành công.");
    }).catch(e => {
      const error = document.getElementById("firebaseLoginError");
      if (error) error.textContent = errorMessage(e.code);
    }).finally(() => { submit.disabled = false; submit.textContent = "Đăng nhập"; });
    return false;
  });
  document.getElementById("modalSave").textContent = "Đăng nhập";
  document.getElementById("firebaseLoginForm").addEventListener("submit", e => {
    e.preventDefault(); document.getElementById("modalSave").click();
  });
});

// Expose auth instance for subsequent Firestore modules; do not treat this as authorization.
window.DaiDeFirebase = { app, auth };
