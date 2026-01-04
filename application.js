// Application Form Handler with Email Notifications

// Wait for Supabase client to be ready
let appSupabase;

// Protect page - redirect if already authenticated (admin)
async function protectApplicationPage() {
  try {
    const { data: { session } } = await appSupabase.auth.getSession();
    if (session) {
      // Redirect authenticated users to home
      window.location.href = 'index.html';
      return false;
    }
    return true;
  } catch (error) {
    console.error('Auth check error:', error);
    return true;
  }
}

// Auto-calculate age from birthday with leap year handling
function setupAgeCalculation() {
  console.log('Setting up age calculation...');
  const birthdayInput = document.getElementById('birthdayInput');
  const ageInput = document.getElementById('ageInput');
  
  console.log('Birthday input:', birthdayInput);
  console.log('Age input:', ageInput);
  
  if (birthdayInput && ageInput) {
    birthdayInput.addEventListener('change', function() {
      console.log('Birthday changed:', this.value);
      if (this.value) {
        const birthDate = new Date(this.value);
        const today = new Date();
        
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        
        ageInput.value = age;
        console.log('Age calculated:', age);
      }
    });
    console.log('✓ Age calculation setup complete');
  } else {
    console.error('Age calculation failed - inputs not found');
  }
}

// Setup file upload handlers
function setupFileUploads() {
  console.log('Setting up file uploads...');
  const uploadWrappers = document.querySelectorAll('.file-upload-wrapper');
  console.log('Found upload wrappers:', uploadWrappers.length);
  
  uploadWrappers.forEach((wrapper, index) => {
    const input = wrapper.querySelector('.file-upload-input');
    const preview = wrapper.querySelector('.file-upload-preview');
    const filenameEl = wrapper.querySelector('.file-upload-filename');
    
    console.log(`Wrapper ${index}:`, { input: !!input, preview: !!preview, filename: !!filenameEl });
    
    if (!input) return;
    
    // Click wrapper to trigger file input
    wrapper.addEventListener('click', (e) => {
      console.log('Upload wrapper clicked');
      if (e.target.tagName !== 'INPUT') {
        input.click();
      }
    });
    
    input.addEventListener('change', function() {
      console.log('File selected:', this.files[0]?.name);
      if (this.files && this.files[0]) {
        const file = this.files[0];
        wrapper.classList.add('has-file');
        
        if (filenameEl) {
          filenameEl.textContent = `📁 ${file.name}`;
        }
        
        if (preview) {
          preview.style.display = 'block';
        }
        
        // Preview image
        const reader = new FileReader();
        reader.onload = function(e) {
          let img = preview.querySelector('img');
          if (!img) {
            img = document.createElement('img');
            preview.appendChild(img);
          }
          img.src = e.target.result;
          console.log('Image preview loaded');
        };
        reader.readAsDataURL(file);
      }
    });
  });
  console.log('✓ File upload setup complete');
}

// Check authentication and show admin dashboard link if logged in
async function checkAuthAndShowAdminLink() {
  try {
    const { data: { session } } = await appSupabase.auth.getSession();
    const adminDashboardNav = document.getElementById('adminDashboardNav');
    const applyNav = document.getElementById('applyNav');
    const userGreeting = document.getElementById('userGreeting');
    const brandGreeting = document.getElementById('brandGreeting');
    const loginLinks = document.querySelectorAll('[id="loginLink"]');
    const logoutButtons = document.querySelectorAll('[id="logoutBtn"]');
    
    if (session) {
      if (adminDashboardNav) {
        adminDashboardNav.style.display = 'block';
      }
      if (applyNav) {
        applyNav.style.display = 'none';
      }
      loginLinks.forEach((el) => (el.style.display = 'none'));
      logoutButtons.forEach((el) => (el.style.display = 'inline-flex'));
      
      if (userGreeting) {
        const email = session.user.email;
        const username = email.split('@')[0];
        userGreeting.textContent = `Hi, ${username}`;
        userGreeting.style.display = 'inline-block';
      
        if (brandGreeting) {
          const username = email.split('@')[0];
          brandGreeting.textContent = `Hi, ${username}`;
        }
      }
    } else {
      if (adminDashboardNav) {
        adminDashboardNav.style.display = 'none';
      }
      if (applyNav) {
        applyNav.style.display = 'block';
      }
      loginLinks.forEach((el) => (el.style.display = 'inline-flex'));
      logoutButtons.forEach((el) => (el.style.display = 'none'));
      if (userGreeting) userGreeting.style.display = 'none';
      if (brandGreeting) brandGreeting.textContent = 'Hi, Visitor';
    }
  } catch (error) {
    console.log('Not authenticated');
  }
}

document.addEventListener('DOMContentLoaded', async function() {
  const form = document.getElementById('applicationForm');
  const submitBtn = document.getElementById('submitBtn');
  const alertBox = document.getElementById('alertBox');
  const loginLinks = document.querySelectorAll('[id="loginLink"]');
  const logoutButtons = document.querySelectorAll('[id="logoutBtn"]');

  // If form is missing, nothing to do
  if (!form) {
    console.error('Application form not found');
    return;
  }

  // Wait for Supabase client to be ready
  let attempts = 0;
  while (!window.supabaseClient && attempts < 20) {
    await new Promise(resolve => setTimeout(resolve, 50));
    attempts++;
  }
  
  if (!window.supabaseClient) {
    console.error('Supabase client not loaded');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      e.stopPropagation();
      showErrorModal('Supabase failed to load. Please refresh and try again.');
    });
    return;
  }
  
  appSupabase = window.supabaseClient;
  
  console.log('✓ Supabase client loaded');
  
  // Protect this page from authenticated users
  const isAllowed = await protectApplicationPage();
  
  if (!isAllowed) return;
  
  console.log('✓ Page protection check passed');
  
  await checkAuthAndShowAdminLink();
  console.log('✓ Auth check complete');
  
  setupAgeCalculation();
  
  // Logout functionality
  logoutButtons.forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        const { error } = await appSupabase.auth.signOut();
        if (error) throw error;
        window.location.href = 'index.html';
      } catch (error) {
        console.error('Logout error:', error);
        alert('Error logging out. Please try again.');
      }
    });
  });

  // Real-time auth updates for navbar/greeting
  if (appSupabase?.auth) {
    appSupabase.auth.onAuthStateChange((_event, session) => {
      const adminDashboardNav = document.getElementById('adminDashboardNav');
      const applyNav = document.getElementById('applyNav');
      const userGreeting = document.getElementById('userGreeting');
      const brandGreeting = document.getElementById('brandGreeting');

      if (session) {
        loginLinks.forEach((el) => (el.style.display = 'none'));
        logoutButtons.forEach((el) => (el.style.display = 'inline-flex'));
        if (adminDashboardNav) adminDashboardNav.style.display = 'block';
        if (applyNav) applyNav.style.display = 'none';
        const username = session.user.email?.split('@')[0] || 'User';
        if (userGreeting) {
          userGreeting.textContent = `Hi, ${username}`;
          userGreeting.style.display = 'inline-block';
        }
        if (brandGreeting) brandGreeting.textContent = `Hi, ${username}`;
      } else {
        loginLinks.forEach((el) => (el.style.display = 'inline-flex'));
        logoutButtons.forEach((el) => (el.style.display = 'none'));
        if (adminDashboardNav) adminDashboardNav.style.display = 'none';
        if (applyNav) applyNav.style.display = 'block';
        if (userGreeting) userGreeting.style.display = 'none';
        if (brandGreeting) brandGreeting.textContent = 'Hi, Visitor';
      }
    });
  }

  // Handle conditional field for name change
  const nameChangeRadios = form.querySelectorAll('input[name="can_changename"]');
  const nameChangeField = document.getElementById('nameChangeField');

  console.log('Name change radios:', nameChangeRadios.length);
  console.log('Name change field:', nameChangeField);

  nameChangeRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      console.log('Name change radio changed:', this.value);
      if (this.value === 'yes') {
        nameChangeField.classList.add('active');
        console.log('✓ Name change field activated');
      } else {
        nameChangeField.classList.remove('active');
        console.log('✓ Name change field deactivated');
      }
    });
  });

  console.log('✓ All event listeners set up!');

  // Form submission with email notification
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    console.log('🚀 Form submit event triggered');
    
    // Validate playstyle-based requirements
    const playstyle = document.getElementById('playstyleSelect').value;
    const age = parseInt(document.getElementById('ageInput').value);
    const legendarySeries = parseInt(document.getElementById('legendarySeriesInput').value);
    
    console.log('Validation check:', { playstyle, age, legendarySeries });
    
    // Age validation based on playstyle
    if (playstyle === 'Casual' && age < 16) {
      alert('❌ Casual players must be at least 16 years old!');
      return;
    }
    if (playstyle === 'Compe' && age < 17) {
      alert('❌ Competitive players must be at least 17 years old!');
      return;
    }
    
    // Legendary Series validation based on playstyle
    if (playstyle === 'Casual' && legendarySeries < 3) {
      alert('❌ Casual players need at least 3 Legendary Series!');
      return;
    }
    if (playstyle === 'Compe' && legendarySeries < 10) {
      alert('❌ Competitive players need at least 10 Legendary Series!');
      return;
    }
    
    console.log('✅ All validations passed');
    
    // Show confirmation modal
    const confirmationModal = document.getElementById('confirmationModal');
    confirmationModal.style.display = 'flex';
  });
  
  // Handle actual submission after confirmation
  const proceedSubmitBtn = document.getElementById('proceedSubmitBtn');
  if (proceedSubmitBtn) {
    proceedSubmitBtn.addEventListener('click', async function() {
      // Hide confirmation modal
      const confirmationModal = document.getElementById('confirmationModal');
      confirmationModal.style.display = 'none';
      
      // Now submit the form
      await submitApplication();
    });
  }
});

// Separate function to handle the actual submission
async function submitApplication() {
  const form = document.getElementById('applicationForm');
  const submitBtn = document.getElementById('submitBtn');
  
  try {
    console.log('🚀 Starting application submission...');
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading-spinner"></span>Submitting...';
    
    if (!appSupabase) {
      throw new Error('Supabase client not initialized');
    }
    
    const formData = new FormData(form);
    const data = {};
    
    console.log('Processing form data...');
    
    for (let [key, value] of formData.entries()) {
      if (!key.includes('screenshot')) {
        data[key] = value;
      }
    }
    
    console.log('Form data processed:', data);
    
    data.user_identifier = data.codm_uid;
      
      // Check for duplicate
      console.log('Checking for duplicate applications...');
      const { data: existingApplication, error: checkError } = await appSupabase
        .from('applications')
        .select('id, status')
        .eq('user_identifier', data.user_identifier)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Duplicate check error:', checkError);
        throw new Error('Failed to check existing applications');
      }
      
      if (existingApplication) {
        console.log('Duplicate found:', existingApplication);
        let message = 'You have already submitted an application.';
        if (existingApplication.status === 'pending') {
          message += ' Your application is currently pending review.';
        } else if (existingApplication.status === 'approved') {
          message += ' Your application has been approved!';
        } else if (existingApplication.status === 'rejected') {
          message += ' Your application was rejected. You can submit again.';
        }
        showAlert(message, 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Submit Application';
        return;
      }
      
      // Upload screenshots
      console.log('Uploading screenshots...');
      const screenshots = {};
      const screenshotFields = ['fb_like_screenshot', 'profile_screenshot', 'clan_join_screenshot'];
      
      for (let field of screenshotFields) {
        const input = form.querySelector(`input[name="${field}"]`);
        if (input && input.files.length > 0) {
          const file = input.files[0];
          console.log(`Uploading ${field}:`, file.name);
          const fileName = `${data.codm_uid}_${field}_${Date.now()}.${file.name.split('.').pop()}`;
          
          const { data: uploadData, error: uploadError } = await appSupabase.storage
            .from('application-screenshots')
            .upload(fileName, file);
          
          if (uploadError) {
            console.error(`Upload error for ${field}:`, uploadError);
            throw new Error(`Failed to upload ${field}: ${uploadError.message}`);
          }
          
          const { data: urlData } = appSupabase.storage
            .from('application-screenshots')
            .getPublicUrl(fileName);
          
          screenshots[field] = urlData.publicUrl;
          console.log(`${field} uploaded:`, urlData.publicUrl);
        }
      }
      
      Object.assign(data, screenshots);
      data.clan_id = '6748765112867225602';
      data.discord_link = 'https://discord.com/invite/jBPFT3BGF';
      data.status = 'pending';
      
      // Debug: log all data before insert
      console.log('📦 Complete data object to insert:', JSON.stringify(data, null, 2));
      console.log('📊 Required fields check:', {
        user_identifier: !!data.user_identifier,
        age: !!data.age,
        fb_account_link: !!data.fb_account_link,
        in_game_ign: !!data.in_game_ign,
        codm_uid: !!data.codm_uid,
        playstyle: !!data.playstyle,
        birthday: !!data.birthday,
        streamer_mode: !!data.streamer_mode,
        can_changename: !!data.can_changename,
        fb_like_screenshot: !!data.fb_like_screenshot,
        profile_screenshot: !!data.profile_screenshot,
        clan_join_screenshot: !!data.clan_join_screenshot
      });
      
      console.log('Inserting application into database...');
      
      // Show loading popup
      showLoadingModal();
      
      // Insert application
      const { data: insertData, error: insertError } = await appSupabase
        .from('applications')
        .insert([data])
        .select();
      
      // Close loading popup
      closeModal();
      
      if (insertError) {
        console.error('❌ Insert error:', insertError);
        console.error('Error details:', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code
        });
        
        // Show error popup
        showErrorModal(insertError.message);
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Submit Application';
        return;
      }
      
      if (!insertData || insertData.length === 0) {
        console.error('❌ No data returned from insert');
        showErrorModal('Submission failed - no data returned. Please try again.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Submit Application';
        return;
      }
      
      console.log('✅ Application submitted successfully:', insertData);
      
      // Send submission notification email
      console.log('Sending email notification...');
      const emailSent = await sendEmailNotification(data.email, 'submission', {
        ign: data.in_game_ign,
        discordLink: data.discord_link
      });
      
      if (!emailSent) {
        console.warn('Email notification failed, but application was submitted');
      } else {
        console.log('Email sent successfully');
      }
      
      // Success confirmation popup
      showSuccessModal(data.in_game_ign);
      
      form.reset();
      
      // Reset file upload previews
      const uploadWrappers = document.querySelectorAll('.file-upload-wrapper');
      uploadWrappers.forEach(wrapper => {
        wrapper.classList.remove('has-file');
        const preview = wrapper.querySelector('.file-upload-preview');
        const filenameEl = wrapper.querySelector('.file-upload-filename');
        if (preview) preview.style.display = 'none';
        if (filenameEl) filenameEl.textContent = '';
      });
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
    } catch (error) {
      console.error('❌ Error submitting application:', error);
      console.error('Error stack:', error.stack);
      closeModal();
      showErrorModal(error.message || 'An unknown error occurred. Please check the console for details.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Submit Application';
    }
}

// Email notification function
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

    return response.ok;
  } catch (error) {
    console.error('Email service error:', error);
    return false;
  }
}

function showAlert(message, type) {
  const alertBox = document.getElementById('alertBox');
  if (alertBox) {
    alertBox.textContent = message;
    alertBox.className = `alert alert-${type} show`;
    
    if (type !== 'error') {
      setTimeout(() => {
        alertBox.classList.remove('show');
      }, 8000);
    }
  }
}

function showSuccessModal(ign) {
  // Create modal overlay
  const overlay = document.createElement('div');
    overlay.id = 'submissionModal';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.3s ease;
    `;
    
    // Create modal
    const modal = document.createElement('div');
    modal.style.cssText = `
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      padding: 40px;
      border-radius: 16px;
      text-align: center;
      max-width: 500px;
      border: 2px solid #10b981;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      animation: slideUp 0.4s ease;
    `;
    
    modal.innerHTML = `
      <div style="font-size: 4rem; margin-bottom: 20px;">✅</div>
      <h2 style="color: #10b981; margin-bottom: 16px; font-size: 2rem;">Application Submitted!</h2>
      <p style="color: #e5e5e5; font-size: 1.1rem; margin-bottom: 12px;">Welcome, <strong style="color: #10b981;">${ign}</strong>!</p>
      <p style="color: #a0a0a0; margin-bottom: 24px;">Your application has been successfully saved to our database. We'll review it soon!</p>
      <button onclick="document.getElementById('submissionModal').remove(); window.scrollTo({top:0,behavior:'smooth'});" style="
        background: #10b981;
        color: white;
        border: none;
        padding: 14px 32px;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s;
      " onmouseover="this.style.background='#059669'" onmouseout="this.style.background='#10b981'">
        Awesome! 🎉
      </button>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Add animations
    if (!document.getElementById('modal-animations')) {
      const style = document.createElement('style');
      style.id = 'modal-animations';
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(50px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }
  }

function showErrorModal(errorMessage) {
    const overlay = document.createElement('div');
    overlay.id = 'submissionModal';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.3s ease;
    `;
    
    const modal = document.createElement('div');
    modal.style.cssText = `
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      padding: 40px;
      border-radius: 16px;
      text-align: center;
      max-width: 500px;
      border: 2px solid #ef4444;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      animation: slideUp 0.4s ease;
    `;
    
    modal.innerHTML = `
      <div style="font-size: 4rem; margin-bottom: 20px;">❌</div>
      <h2 style="color: #ef4444; margin-bottom: 16px; font-size: 2rem;">Submission Failed</h2>
      <p style="color: #e5e5e5; font-size: 1rem; margin-bottom: 12px;">We couldn't submit your application:</p>
      <p style="color: #ef4444; margin-bottom: 24px; font-family: monospace; font-size: 0.9rem; background: rgba(239,68,68,0.1); padding: 12px; border-radius: 8px;">${errorMessage}</p>
      <p style="color: #a0a0a0; font-size: 0.9rem; margin-bottom: 24px;">Please check the console (F12) for more details and try again.</p>
      <button onclick="document.getElementById('submissionModal').remove()" style="
        background: #ef4444;
        color: white;
        border: none;
        padding: 14px 32px;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s;
      " onmouseover="this.style.background='#dc2626'" onmouseout="this.style.background='#ef4444'">
        Try Again
      </button>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }
  
  function showLoadingModal() {
    const overlay = document.createElement('div');
    overlay.id = 'submissionModal';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.3s ease;
    `;
    
    const modal = document.createElement('div');
    modal.style.cssText = `
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      padding: 40px;
      border-radius: 16px;
      text-align: center;
      max-width: 400px;
      border: 2px solid #3b82f6;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    `;
    
    modal.innerHTML = `
      <div style="font-size: 3rem; margin-bottom: 20px; animation: spin 1s linear infinite;">⏳</div>
      <h2 style="color: #3b82f6; margin-bottom: 16px; font-size: 1.5rem;">Submitting Application...</h2>
      <p style="color: #a0a0a0;">Please wait while we save your data</p>
      <style>
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      </style>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }
  
  function closeModal() {
    const modal = document.getElementById('submissionModal');
    if (modal) modal.remove();
  }

