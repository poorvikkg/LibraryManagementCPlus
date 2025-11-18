// Tabs
const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const indicator = document.querySelector(".tab-indicator");

// Switch Forms
loginTab.onclick = () => switchForm("login");
signupTab.onclick = () => switchForm("signup");

document.getElementById("goToSignup").onclick = () => switchForm("signup");
document.getElementById("goToLogin").onclick = () => switchForm("login");

function switchForm(type) {
  if (type === "login") {
    loginForm.classList.remove("hidden");
    signupForm.classList.add("hidden");
    loginTab.classList.add("active");
    signupTab.classList.remove("active");
    indicator.style.transform = "translateX(0%)";
  } else {
    loginForm.classList.add("hidden");
    signupForm.classList.remove("hidden");
    signupTab.classList.add("active");
    loginTab.classList.remove("active");
    indicator.style.transform = "translateX(100%)";
  }
}

// Ripple Effect
document.querySelectorAll(".btn").forEach(btn => {
  btn.addEventListener("click", function(e) {
    const x = e.offsetX;
    const y = e.offsetY;
    this.style.setProperty("--x", x + "px");
    this.style.setProperty("--y", y + "px");
  });
});

// Password Toggle
function togglePassword(id) {
  const field = document.getElementById(id);
  field.type = field.type === "password" ? "text" : "password";
}

// Password Strength
const signupPassword = document.getElementById("signupPassword");
const strengthText = document.getElementById("passwordStrength");

signupPassword.addEventListener("input", () => {
  const pass = signupPassword.value;
  let msg = "Weak";
  let color = "red";

  if (pass.length >= 8 && /\d/.test(pass) && /[A-Z]/.test(pass)) {
    msg = "Strong";
    color = "#00ff99";
  } else if (pass.length >= 6) {
    msg = "Medium";
    color = "orange";
  }

  strengthText.textContent = `Strength: ${msg}`;
  strengthText.style.color = color;
});

// Auth Service
import { authService } from "./js/authService.js";

// Login
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const email = loginEmail.value.trim();
    const password = loginPassword.value.trim();

    await authService.login(email, password);
    window.location.href = "dashboard.html";
  } catch (err) {
    shake(loginForm);
    alert(err.message || "Login failed");
  }
});

// Signup
signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const name = signupName.value.trim();
    const email = signupEmail.value.trim();
    const password = signupPassword.value.trim();

    await authService.register(name, email, password);
    window.location.href = "dashboard.html";
  } catch (err) {
    shake(signupForm);
    alert(err.message || "Signup failed");
  }
});

// Shake Animation
function shake(element) {
  element.classList.add("shake");
  setTimeout(() => element.classList.remove("shake"), 500);
}
