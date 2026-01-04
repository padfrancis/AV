// Use shared Supabase client from supabase-config.js
const supabase = window.supabaseClient;

// DOM refs
const loginForm = document.getElementById("loginForm");
const adminEmailInput = document.getElementById("adminEmail");
const adminPasswordInput = document.getElementById("adminPassword");
const loginStatus = document.getElementById("loginStatus");
const loginBtn = document.getElementById("loginBtn");

// Redirect if already logged in
async function checkSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.warn("Session check error:", error.message);
    return;
  }
  if (data.session) {
    window.location.href = "index.html";
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = adminEmailInput.value.trim();
  const password = adminPasswordInput.value.trim();

  loginBtn.disabled = true;
  loginStatus.classList.remove("hidden", "error", "success");
  loginStatus.innerHTML = '<span class="spinner"></span> Signing in...';

  const { error, data } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    loginStatus.textContent = error.message || "Invalid credentials";
    loginStatus.classList.add("error");
    loginBtn.disabled = false;
    return;
  }

  // Success
  loginStatus.textContent = "✓ Login successful, redirecting...";
  loginStatus.classList.add("success");
  setTimeout(() => {
    window.location.href = "index.html";
  }, 800);
});

// Listen for auth state changes to redirect if already logged in elsewhere
supabase.auth.onAuthStateChange((_event, session) => {
  if (session) {
    window.location.href = "index.html";
  }
});

// Initial check
checkSession();
