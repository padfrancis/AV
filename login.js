import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://rlgelnedymfzpyiddkna.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_jWtcDBPbRUWuhqTWKk7-AA_-E7CZp7Q";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM refs
const loginForm = document.getElementById("loginForm");
const adminEmailInput = document.getElementById("adminEmail");
const adminPasswordInput = document.getElementById("adminPassword");
const loginStatus = document.getElementById("loginStatus");
const loginBtn = document.getElementById("loginBtn");

// Check if already logged in; redirect to roster
async function checkSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.warn("Session check error:", error.message);
    return;
  }
  if (data.session) {
    // Already logged in, redirect to roster
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

// On page load, check if already authenticated
checkSession();
