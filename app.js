// Use shared Supabase client from supabase-config.js
const supabase = window.supabaseClient;

const initialMembers = [];

const palette = [
  ["#f5a9c4", "#3b1b2f"],
  ["#c8e7ff", "#1b2d46"],
  ["#ffb7e1", "#2c1a2c"],
  ["#f2d1ff", "#1b1f37"],
  ["#d5f4ff", "#15252f"],
];

const state = {
  isAdmin: false,
  userEmail: null,
  members: [],
};

// DOM refs
const officerGrid = document.getElementById("officerGrid");
const memberGrid = document.getElementById("memberGrid");
const officerCount = document.getElementById("officerCount");
const memberOnlyCount = document.getElementById("memberOnlyCount");
const memberCount = document.getElementById("memberCount");
const adminControls = document.getElementById("adminControls");
const addMemberBtn = document.getElementById("addMemberBtn");
const resetDataBtn = document.getElementById("resetDataBtn");
const logoutBtn = document.getElementById("logoutBtn");
const loginLink = document.getElementById("loginLink");
const applyNav = document.getElementById("applyNav");
const hamburger = document.getElementById("hamburger");
const menuWrapper = document.getElementById("menuWrapper");

// Hamburger menu toggle
if (hamburger && menuWrapper) {
  hamburger.addEventListener("click", () => {
    const isOpen = hamburger.getAttribute("aria-expanded") === "true";
    hamburger.setAttribute("aria-expanded", !isOpen);
    menuWrapper.classList.toggle("active");
  });

  // Close menu when a link is clicked
  const menuLinks = menuWrapper.querySelectorAll("a");
  menuLinks.forEach((link) => {
    link.addEventListener("click", () => {
      hamburger.setAttribute("aria-expanded", "false");
      menuWrapper.classList.remove("active");
    });
  });

  // Close menu when clicking outside
  document.addEventListener("click", (e) => {
    if (
      !hamburger.contains(e.target) &&
      !menuWrapper.contains(e.target) &&
      menuWrapper.classList.contains("active")
    ) {
      hamburger.setAttribute("aria-expanded", "false");
      menuWrapper.classList.remove("active");
    }
  });
}

// Update logout/login visibility in navbar (handles desktop + mobile duplicates)
function updateNavbar() {
  const adminDashboardNav = document.getElementById('adminDashboardNav');
  const userGreeting = document.getElementById('userGreeting');
  const brandGreeting = document.getElementById('brandGreeting');
  const loginLinks = document.querySelectorAll('[id="loginLink"]');
  const logoutButtons = document.querySelectorAll('[id="logoutBtn"]');

  if (state.isAdmin) {
    loginLinks.forEach((el) => (el.style.display = 'none'));
    logoutButtons.forEach((el) => (el.style.display = 'inline-flex'));
    if (adminDashboardNav) adminDashboardNav.style.display = 'block';
    if (applyNav) applyNav.style.display = 'none';

    if (state.userEmail) {
      const username = state.userEmail.split('@')[0];
      if (userGreeting) {
        userGreeting.textContent = `Hi, ${username}`;
        userGreeting.style.display = 'inline-block';
      }
      if (brandGreeting) {
        brandGreeting.textContent = `Hi, ${username}`;
      }
    }
  } else {
    loginLinks.forEach((el) => (el.style.display = 'inline-flex'));
    logoutButtons.forEach((el) => (el.style.display = 'none'));
    if (adminDashboardNav) adminDashboardNav.style.display = 'none';
    if (applyNav) applyNav.style.display = 'block';
    if (userGreeting) userGreeting.style.display = 'none';
    if (brandGreeting) brandGreeting.textContent = 'Hi, Visitor';
  }
}

// Modal refs
const modal = document.getElementById("memberModal");
const modalBackdrop = document.getElementById("modalBackdrop");
const modalMode = document.getElementById("modalMode");
const modalTitle = document.getElementById("modalTitle");
const closeModalBtn = document.getElementById("closeModal");
const cancelModalBtn = document.getElementById("cancelModal");
const memberForm = document.getElementById("memberForm");
const memberIdField = document.getElementById("memberId");
const ignField = document.getElementById("ign");
const roleField = document.getElementById("role");
const modeField = document.getElementById("mode");
  const descField = document.getElementById("description");
const avatarInput = document.getElementById("avatar");
const avatarPreview = document.getElementById("avatarPreview");

function pickPalette(name) {
  const hash = [...name].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return palette[hash % palette.length];
}

function initials(ign) {
  return ign
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function cardTemplate(member) {
  const [tone, base] = pickPalette(member.ign);
  const isOfficer = ["Clan Master", "Vice Clan Master", "Tryout Handler", "Scrim Handler", "Recruiter", "Admin", "Page Handler"].includes(member.role);
  const modeBadge = member.mode === "MP & BR" ? "MP & BR" : member.mode;

  return `
    <article class="card" data-id="${member.id}">
      <div class="card__header">
        <div class="avatar" style="background: linear-gradient(135deg, ${tone}, ${base});">
          ${member.photo_url ? `<img src="${member.photo_url}" alt="${member.ign}" />` : `<span>${initials(member.ign)}</span>`}
        </div>
        <div>
          <h3 class="card__title">${member.ign}</h3>
          <div class="badges">
            <span class="badge ${isOfficer ? "badge--gold" : "badge--accent"}">${member.role}</span>
            <span class="badge">${modeBadge}</span>
          </div>
        </div>
      </div>
      <p class="card__desc">${member.description}</p>
      <div class="card__actions ${state.isAdmin ? "" : "hidden"}">
        <button class="icon-btn" data-action="edit">Edit</button>
        <button class="icon-btn" data-action="delete">Delete</button>
      </div>
    </article>
  `;
}

function render() {
  const officerRoles = ["Clan Master", "Vice Clan Master", "Tryout Handler", "Scrim Handler", "Recruiter", "Admin", "Page Handler"];
  const officers = state.members.filter((m) => officerRoles.includes(m.role));
  const regulars = state.members.filter((m) => !officerRoles.includes(m.role));

  officerGrid.innerHTML = officers.map(cardTemplate).join("");
  memberGrid.innerHTML = regulars.map(cardTemplate).join("");

  officerCount.textContent = `${officers.length}`;
  memberOnlyCount.textContent = `${regulars.length}`;
  memberCount.textContent = `${state.members.length}`;

  adminControls.classList.toggle("hidden", !state.isAdmin);
  updateNavbar();
}

async function fetchMembers() {
  const { data, error } = await supabase
    .from("members")
    .select("id, ign, role, mode, description, photo_url")
    .order("role", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.warn("Falling back to mock data due to fetch error", error.message);
    state.members = structuredClone(initialMembers);
  } else {
    state.members = data ?? [];
  }
  render();
}

async function ensureSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    state.isAdmin = false;
    state.userEmail = null;
    return;
  }
  const session = data.session;
  state.isAdmin = !!session;
  state.userEmail = session?.user?.email || null;
}

function openModal(mode, member = null) {
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  modalMode.textContent = mode === "edit" ? "Edit" : "Create";
  modalTitle.textContent = mode === "edit" ? "Edit Clan Member" : "Add Clan Member";

  if (member) {
    memberIdField.value = member.id;
    ignField.value = member.ign;
    roleField.value = member.role;
    modeField.value = member.mode;
    descField.value = member.description;
    if (member.photo_url) {
      avatarPreview.innerHTML = `<img src="${member.photo_url}" alt="${member.ign}" />`;
    } else {
      avatarPreview.textContent = "No image";
    }
  } else {
    memberIdField.value = "";
    memberForm.reset();
    avatarPreview.textContent = "No image";
  }
}

function closeModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  avatarInput.value = "";
}

async function upsertMember(payload) {
  const { error } = await supabase.from("members").upsert(payload);
  if (error) {
    alert("Failed to save member: " + error.message);
    return;
  }
  await fetchMembers();
}

async function handleCardAction(event) {
  const actionBtn = event.target.closest("[data-action]");
  if (!actionBtn) return;
  const card = actionBtn.closest(".card");
  const id = card?.dataset.id;
  if (!id) return;

  const member = state.members.find((m) => m.id === id);
  if (!member) return;

  if (actionBtn.dataset.action === "edit") {
    openModal("edit", member);
  }

  if (actionBtn.dataset.action === "delete") {
    const confirmDelete = confirm(`Remove ${member.ign} from the roster?`);
    if (confirmDelete) {
      const { error } = await supabase.from("members").delete().eq("id", id);
      if (error) {
        alert("Failed to delete: " + error.message);
      } else {
        await fetchMembers();
      }
    }
  }
}

addMemberBtn.addEventListener("click", () => openModal("create"));

resetDataBtn.addEventListener("click", () => {
  fetchMembers();
});

document.querySelectorAll('[id="logoutBtn"]').forEach((btn) => {
  btn.addEventListener("click", async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      window.location.href = "index.html";
    } catch (error) {
      console.error('Logout error:', error);
      alert('Error logging out. Please try again.');
    }
  });
});

[officerGrid, memberGrid].forEach((grid) =>
  grid.addEventListener("click", (event) => {
    if (!state.isAdmin) return;
    handleCardAction(event);
  })
);

closeModalBtn.addEventListener("click", closeModal);
modalBackdrop.addEventListener("click", closeModal);
cancelModalBtn.addEventListener("click", closeModal);

avatarInput.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (!file) {
    avatarPreview.textContent = "No image";
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    avatarPreview.innerHTML = `<img src="${e.target.result}" alt="Preview" />`;
  };
  reader.readAsDataURL(file);
});

memberForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const id = memberIdField.value || crypto.randomUUID();
  const payload = {
    id,
    ign: ignField.value.trim(),
    role: roleField.value,
    mode: modeField.value,
    description: descField.value.trim(),
    photo_url:
      avatarPreview.querySelector("img")?.getAttribute("src") ||
      state.members.find((m) => m.id === id)?.photo_url ||
      null,
  };
  await upsertMember(payload);
  closeModal();
});

// init
avatarPreview.textContent = "No image";
(async function init() {
  await ensureSession();
  updateNavbar();
  await fetchMembers();

  // Real-time auth state updates (login/logout)
  if (supabase?.auth) {
    supabase.auth.onAuthStateChange(async (_event, session) => {
      state.isAdmin = !!session;
      state.userEmail = session?.user?.email || null;
      updateNavbar();
    });
  }
})();
