// Admin Dashboard Handler with Email & Auto-delete
let currentFilter = 'all';
let applications = [];
let currentActionId = null;
let currentActionType = null;

const IMAGE_EXPIRY_HOURS = 5;
const expiredCleanup = new Set();

// Prefer global client from supabase-config
const adminSupabase = window.supabaseClient;

// Check auth immediately and redirect if not authorized
(async function() {
  try {
    // Wait for supabase to be ready
    let attempts = 0;
    while (!window.supabaseClient && attempts < 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (!window.supabaseClient) {
      window.location.replace('unauthorized.html');
      return;
    }
    
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    
    if (!user) {
      // Not authenticated - redirect immediately
      window.location.replace('unauthorized.html');
      return;
    }
    
    // User is authenticated - allow page to show
    document.body.classList.add('auth-verified');
  } catch (error) {
    console.error('Auth check error:', error);
    window.location.replace('unauthorized.html');
  }
})();

document.addEventListener('DOMContentLoaded', async function() {
  // Check if user is still authenticated
  const { data: { user } } = await adminSupabase.auth.getUser();
  if (!user) {
    window.location.href = 'unauthorized.html';
    return;
  }
  
  // Set user greeting
  if (user && user.email) {
    const username = user.email.split('@')[0];
    const userGreeting = document.getElementById('userGreeting');
    const brandGreeting = document.getElementById('brandGreeting');
    
    if (userGreeting) {
      userGreeting.textContent = `Hi, ${username}`;
      userGreeting.style.display = 'inline-block';
    }
    if (brandGreeting) {
      brandGreeting.textContent = `Hi, ${username}`;
    }
  }
  
  await loadApplications();
  setupFilterTabs();
  setupRealtimeSubscription(); // Try realtime first
  
  // Refresh button
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      refreshBtn.disabled = true;
      refreshBtn.innerHTML = '<span style="font-size: 18px; animation: spin 1s linear infinite;">↻</span> Refreshing...';
      await loadApplications();
      refreshBtn.disabled = false;
      refreshBtn.innerHTML = '<span style="font-size: 18px;">↻</span> Refresh';
    });
  }
  
  // Fix logout button event listeners
  const logoutButtons = document.querySelectorAll('[id="logoutBtn"]');
  logoutButtons.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await logout();
    });
  });

  // Real-time auth updates
  adminSupabase.auth.onAuthStateChange((_event, session) => {
    if (!session) {
      window.location.href = 'unauthorized.html';
    } else {
      const username = session.user.email?.split('@')[0] || 'User';
      const userGreeting = document.getElementById('userGreeting');
      const brandGreeting = document.getElementById('brandGreeting');
      const logoutBtns = document.querySelectorAll('[id="logoutBtn"]');
      
      logoutBtns.forEach(btn => btn.style.display = 'inline-flex');
      
      if (userGreeting) {
        userGreeting.textContent = `Hi, ${username}`;
        userGreeting.style.display = 'inline-block';
      }
      if (brandGreeting) {
        brandGreeting.textContent = `Hi, ${username}`;
      }
    }
  });
});


async function loadApplications() {
  const loadingContainer = document.getElementById('loadingContainer');
  const applicationsContainer = document.getElementById('applicationsContainer');
  const emptyState = document.getElementById('emptyState');
  
  try {
    const { data, error } = await adminSupabase
      .from('applications')
      .select('*')
      .order('created_at', { ascending: false });
    
    console.log('Admin loadApplications result:', { error, count: data?.length, data });
    if (error) throw error;
    
    applications = data || [];
    updateCounts();
    
    if (loadingContainer) loadingContainer.style.display = 'none';
    
    if (applications.length === 0) {
      if (emptyState) emptyState.style.display = 'flex';
      if (applicationsContainer) applicationsContainer.style.display = 'none';
    } else {
      if (emptyState) emptyState.style.display = 'none';
      if (applicationsContainer) applicationsContainer.style.display = 'grid';
      renderApplications();
    }
    
  } catch (error) {
    console.error('Error loading applications:', error);
    if (loadingContainer) {
      loadingContainer.innerHTML = `
        <div style="color: var(--text-secondary); text-align: center; padding: 40px;">
          <div style="font-size: 2rem; margin-bottom: 12px;">⚠️</div>
          <div>Failed to load applications</div>
          <div style="font-size: 0.9rem; margin-top: 8px; color: #ef4444;">${error.message}</div>
        </div>
      `;
    }
  }
}

function updateCounts() {
  document.getElementById('countAll').textContent = applications.length;
  document.getElementById('countPending').textContent = applications.filter(a => a.status === 'pending').length;
  document.getElementById('countApproved').textContent = applications.filter(a => a.status === 'approved').length;
  document.getElementById('countRejected').textContent = applications.filter(a => a.status === 'rejected').length;
}

function setupFilterTabs() {
  const filterTabs = document.querySelectorAll('.filter-tab');
  
  filterTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      filterTabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      currentFilter = this.dataset.status;
      renderApplications();
    });
  });
}

// Auto-refresh as fallback (2s polling as backup to realtime)
let refreshInterval;
function startAutoRefresh() {
  refreshInterval = setInterval(async () => {
    await refreshApplications();
  }, 2000); // Backup polling every 2 seconds
  
  console.log('⚡ Backup polling enabled - 2s refresh');
}

async function refreshApplications() {
  try {
    const { data, error } = await adminSupabase
      .from('applications')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const oldCount = applications.length;
    const oldData = JSON.stringify(applications);
    applications = data || [];
    const newData = JSON.stringify(applications);
    
    // Check if data changed
    if (oldData !== newData) {
      updateCounts();
      renderApplications();
      
      // Show notification if new application
      if (applications.length > oldCount) {
        showNotification('New application received!', 'success');
      }
      
      // Handle empty state
      const emptyState = document.getElementById('emptyState');
      const applicationsContainer = document.getElementById('applicationsContainer');
      
      if (applications.length === 0) {
        if (emptyState) emptyState.style.display = 'flex';
        if (applicationsContainer) applicationsContainer.style.display = 'none';
      } else {
        if (emptyState) emptyState.style.display = 'none';
        if (applicationsContainer) applicationsContainer.style.display = 'grid';
      }
    }
  } catch (error) {
    console.error('Auto-refresh error:', error);
  }
}

// Setup real-time subscription for instant updates (true 0 delay)
function setupRealtimeSubscription() {
  const channel = adminSupabase
    .channel('applications_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'applications'
      },
      (payload) => {
        console.log('Real-time update:', payload);
        handleRealtimeUpdate(payload);
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Real-time connected - TRUE ZERO DELAY!');
        // Still run backup polling at slower rate
        startAutoRefresh();
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.log('⚠️ Realtime unavailable, using backup polling...');
        startAutoRefresh();
      }
    });
}

function handleRealtimeUpdate(payload) {
  const { eventType, new: newRecord, old: oldRecord } = payload;
  
  if (eventType === 'INSERT') {
    // New application submitted
    applications.unshift(newRecord);
    showNotification('New application received!', 'success');
  } else if (eventType === 'UPDATE') {
    // Application updated
    const index = applications.findIndex(app => app.id === newRecord.id);
    if (index !== -1) {
      applications[index] = newRecord;
    }
    showNotification('Application updated', 'info');
  } else if (eventType === 'DELETE') {
    // Application deleted
    applications = applications.filter(app => app.id !== oldRecord.id);
    showNotification('Application removed', 'info');
  }
  
  updateCounts();
  renderApplications();
  
  // Handle empty state
  const emptyState = document.getElementById('emptyState');
  const applicationsContainer = document.getElementById('applicationsContainer');
  
  if (applications.length === 0) {
    if (emptyState) emptyState.style.display = 'flex';
    if (applicationsContainer) applicationsContainer.style.display = 'none';
  } else {
    if (emptyState) emptyState.style.display = 'none';
    if (applicationsContainer) applicationsContainer.style.display = 'grid';
  }
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `realtime-notification ${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
    font-weight: 500;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function renderApplications() {
  const container = document.getElementById('applicationsContainer');
  
  let filteredApps = applications;
  if (currentFilter !== 'all') {
    filteredApps = applications.filter(app => app.status === currentFilter);
  }
  
  if (filteredApps.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary);">No applications found</div>`;
    return;
  }
  
  const rows = filteredApps.map(app => {
    const submitted = app.created_at ? new Date(app.created_at).toLocaleString() : '—';
    const notes = app.admin_notes || '—';
    const expiry = getExpiryInfo(app);
    if (expiry.expired && (app.status === 'approved' || app.status === 'rejected')) {
      handleExpiredImages(app, expiry.expiresAt);
    }
    const renderThumb = (url, label) => {
      if (!url) return '<span class="thumb-empty">Missing</span>';
      if (expiry.expired && (app.status === 'approved' || app.status === 'rejected')) return '<span class="thumb-expired">Expired</span>';
      return `<img src="${url}" alt="${label}" class="thumb-img" onclick="viewImage('${app.id}', '${url}', '${label}', ${expiry.expiresAt || null})" />`;
    };
    const actions = app.status === 'pending'
      ? `<div class="apps-actions-inline">
           <button class="btn-action btn-approve" onclick="prepareAction('${app.id}', 'approved')">Approve</button>
           <button class="btn-action btn-reject" onclick="prepareAction('${app.id}', 'rejected')">Reject</button>
         </div>`
      : `<div class="apps-status-wrapper"><span class="apps-status ${app.status}">${app.status}</span><div class="apps-expiry-text">${expiry.expiresAt && (app.status === 'approved' || app.status === 'rejected') ? (expiry.expired ? 'Images expired' : `Images expire in ${expiry.remainingText}`) : 'Awaiting review'}</div></div>`;

    const birthday = app.birthday ? new Date(app.birthday).toLocaleDateString() : '—';
    const changeName = app.can_changename ? `${app.can_changename}${app.changename_time_left ? ` (${app.changename_time_left})` : ''}` : '—';
    const legendary = app.legendary_series || '—';
    const contactBlock = `
      <div>${app.email || '—'}</div>
      <div><a href="${app.fb_account_link || '#'}" target="_blank" rel="noreferrer">FB Profile</a></div>
    `;
    const playBlock = `
      <div>${app.playstyle || '—'}</div>
      <div style="color: var(--text-secondary); font-size:0.9rem;">${app.streamer_mode || '—'}</div>
    `;
    const submissionBlock = `${submitted}<div style="color: var(--text-secondary); font-size:0.85rem;">${expiry.expiresAt && (app.status === 'approved' || app.status === 'rejected') ? (expiry.expired ? 'Images expired' : `Expires ${new Date(expiry.expiresAt).toLocaleTimeString()}`) : '—'}</div>`;

    return `
      <tr>
        <td><div style="font-weight:600;">${app.in_game_ign || '—'}</div><div style="color: var(--text-secondary); font-size:0.9rem;">${app.codm_uid || ''}</div></td>
        <td>${contactBlock}</td>
        <td>${app.age ?? '—'}<div style="color: var(--text-secondary); font-size:0.9rem;">${birthday}</div></td>
        <td>${playBlock}</td>
        <td>${legendary}</td>
        <td>${changeName}</td>
        <td>${renderThumb(app.fb_like_screenshot, 'FB Like')}</td>
        <td>${renderThumb(app.profile_screenshot, 'CODM Profile')}</td>
        <td>${renderThumb(app.clan_join_screenshot, 'Clan Join')}</td>
        <td class="apps-notes">${notes}</td>
        <td>${submissionBlock}</td>
        <td>${actions}</td>
      </tr>
    `;
  }).join('');

  container.innerHTML = `
    <div class="table-responsive">
      <table class="applications-table">
        <thead>
          <tr>
            <th>IGN / UID</th>
            <th>Contact</th>
            <th>Age / Birthday</th>
            <th>Playstyle / Streamer Mode</th>
            <th>Legendary Series</th>
            <th>Name Change</th>
            <th>FB Like</th>
            <th>CODM Profile</th>
            <th>Clan Join</th>
            <th>Admin Notes</th>
            <th>Submitted / Expiry</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

function getExpiryInfo(app) {
  if (!app.reviewed_date) return { expiresAt: null, expired: false, remainingText: '' };
  const reviewedAt = new Date(app.reviewed_date).getTime();
  const expiresAt = reviewedAt + IMAGE_EXPIRY_HOURS * 60 * 60 * 1000;
  const diff = expiresAt - Date.now();
  const expired = diff <= 0;
  return {
    expiresAt,
    expired,
    remainingText: expired ? '0h' : formatDuration(diff)
  };
}

function formatDuration(ms) {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

function prepareAction(appId, action) {
  currentActionId = appId;
  currentActionType = action;
  const modal = document.getElementById('actionModal');
  const modalTitle = document.getElementById('modalTitle');
  
  modalTitle.textContent = action === 'approved' ? 'Approve Application?' : 'Reject Application?';
  modal.style.display = 'flex';
}

function closeModal() {
  document.getElementById('actionModal').style.display = 'none';
  document.getElementById('adminNotes').value = '';
}

document.getElementById('confirmActionBtn')?.addEventListener('click', async () => {
  const adminNotes = document.getElementById('adminNotes').value;
  
  const app = applications.find(a => a.id === currentActionId);
  if (!app) return;
  
  try {
    // Update status in database
    const { error: updateError } = await adminSupabase
      .from('applications')
      .update({
        status: currentActionType,
        admin_notes: adminNotes,
        reviewed_date: new Date().toISOString()
      })
      .eq('id', currentActionId);
    
    if (updateError) throw updateError;
    
    // Send email notification
    const emailSent = await sendEmailNotification(app.email, currentActionType, {
      ign: app.in_game_ign,
      adminNotes: adminNotes,
      discordLink: app.discord_link
    });
    
    // Reload applications
    await loadApplications();
    closeModal();
    
    if (!emailSent) {
      showNotification('Status updated but email failed to send. Please retry.', 'error');
    } else {
      showNotification(`Application ${currentActionType} and email sent.`, 'success');
    }
    
  } catch (error) {
    console.error('Error processing action:', error);
    alert('Error: ' + error.message);
  }
});

// Send email notification
async function sendEmailNotification(email, type, data = {}) {
  try {
    const response = await fetch(`${window.SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        email,
        type,
        ign: data.ign,
        adminNotes: data.adminNotes,
        discordLink: data.discordLink || 'https://discord.com/invite/jBPFT3BGF'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Email service failed:', response.status, errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Email service error:', error);
    return false;
  }
}

async function handleExpiredImages(app, expiresAt) {
  if (!expiresAt || expiredCleanup.has(app.id)) return;
  expiredCleanup.add(app.id);
  const deleted = await deleteScreenshots(app);
  if (!deleted) return;
  try {
    await adminSupabase
      .from('applications')
      .update({
        fb_like_screenshot: null,
        profile_screenshot: null,
        clan_join_screenshot: null
      })
      .eq('id', app.id);
  } catch (error) {
    console.error('Failed to mark screenshots expired:', error);
  }
}

// Auto-delete screenshots from storage
async function deleteScreenshots(app) {
  try {
    const paths = [];
    
    if (app.fb_like_screenshot) {
      const filename = extractFilename(app.fb_like_screenshot);
      if (filename) paths.push(filename);
    }
    if (app.profile_screenshot) {
      const filename = extractFilename(app.profile_screenshot);
      if (filename) paths.push(filename);
    }
    if (app.clan_join_screenshot) {
      const filename = extractFilename(app.clan_join_screenshot);
      if (filename) paths.push(filename);
    }
    
    if (paths.length === 0) return true;

    const { error } = await adminSupabase.storage
      .from('application-screenshots')
      .remove(paths);

    if (error) {
      console.error('Failed to delete screenshots:', error);
      return false;
    }

    console.log(`Deleted ${paths.length} screenshots for application ${app.id}`);
    return true;
  } catch (error) {
    console.error('Screenshot deletion error:', error);
    return false;
  }
}

function extractFilename(url) {
  try {
    const parsed = new URL(url);
    return parsed.pathname.split('/').pop();
  } catch (_e) {
    return url?.split('/').pop();
  }
}

function viewImage(appId, src, label, expiresAt) {
  if (!src) {
    alert('No image available.');
    return;
  }
  if (expiresAt && Date.now() > expiresAt) {
    alert('This image has expired and has been removed.');
    return;
  }
  openImageModal(src, label);
}

function openImageModal(src) {
  const modal = document.getElementById('imageModal');
  const img = document.getElementById('modalImage');
  img.src = src;
  modal.style.display = 'flex';
}

function closeImageModal() {
  document.getElementById('imageModal').style.display = 'none';
}

async function logout() {
  try {
    const { error } = await adminSupabase.auth.signOut();
    if (error) throw error;
    window.location.href = 'index.html';
  } catch (error) {
    console.error('Error signing out:', error);
    alert('Error signing out. Please try again.');
  }
}
