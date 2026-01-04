// Simple Application Form Handler
console.log('🚀 Application script loading...');

// Wait for everything to load
window.addEventListener('load', function() {
  console.log('✅ Page loaded, initializing...');
  
  // 1. AGE CALCULATOR
  const birthdayInput = document.getElementById('birthdayInput');
  const ageInput = document.getElementById('ageInput');
  
  if (birthdayInput && ageInput) {
    console.log('✅ Age inputs found');
    
    // Set max date to 16 years ago (minimum age requirement)
    const today = new Date();
    const maxDate = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());
    const maxDateString = maxDate.toISOString().split('T')[0];
    birthdayInput.setAttribute('max', maxDateString);
    console.log('📅 Max birthday date set to:', maxDateString);
    birthdayInput.addEventListener('change', function() {
      console.log('📅 Birthday changed:', this.value);
      if (this.value) {
        const birthDate = new Date(this.value);
        const today = new Date();
        
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        
        ageInput.value = age;
        console.log('✅ Age calculated:', age);
        
        // Age validation - must be 16+
        if (age < 16) {
          ageInput.style.border = '2px solid #ef4444';
          alert('❌ You must be 16 years or older to apply!');
          birthdayInput.value = '';
          ageInput.value = '';
        } else {
          ageInput.style.border = '2px solid #10b981';
        }
      }
    });
  } else {
    console.error('❌ Age inputs NOT found');
  }
  
  // 2. FILE UPLOADS
  const uploadWrappers = document.querySelectorAll('.file-upload-wrapper');
  console.log('📁 Found upload wrappers:', uploadWrappers.length);
  
  uploadWrappers.forEach((wrapper, index) => {
    const input = wrapper.querySelector('.file-upload-input');
    const filenameEl = wrapper.querySelector('.file-upload-filename');
    const preview = wrapper.querySelector('.file-upload-preview');
    let isPicking = false;
    let lastPick = 0;

    // Prevent the input's own click from bubbling and retriggering the wrapper handler
    if (input) {
      input.addEventListener('click', (e) => {
        // Prevent bubbling back to wrapper
        e.stopPropagation();
      });
    }
    
    if (!input) {
      console.error(`❌ No input in wrapper ${index}`);
      return;
    }
    
    console.log(`✅ Setting up wrapper ${index}`);
    
    // Click on wrapper (except preview) to open file picker
    wrapper.addEventListener('click', function(e) {
      const clickedPreview = e.target.closest('.file-upload-preview');
      if (clickedPreview) return; // don't reopen when clicking the preview
      if (isPicking) return; // guard against immediate re-entry
      isPicking = true;
      console.log('🖱️ Upload wrapper clicked');
      input.click();
    });
    
    // When file selected
    input.addEventListener('change', function() {
      // Release guard once the dialog actually closes
      setTimeout(() => { isPicking = false; }, 0);
      if (this.files && this.files[0]) {
        const file = this.files[0];
        console.log('✅ File selected:', file.name);
        
        wrapper.classList.add('has-file');
        
        if (filenameEl) {
          filenameEl.textContent = `📁 ${file.name}`;
          filenameEl.style.display = 'block';
          filenameEl.style.color = '#10b981';
          filenameEl.style.marginTop = '8px';
          filenameEl.style.fontWeight = '500';
        }
        
        // Show image preview
        if (preview) {
          const reader = new FileReader();
          reader.onload = function(e) {
            let img = preview.querySelector('img');
            if (!img) {
              img = document.createElement('img');
              img.style.maxWidth = '100%';
              img.style.borderRadius = '8px';
              img.style.marginTop = '12px';
              img.style.border = '2px solid #10b981';
              preview.appendChild(img);
            }
            img.src = e.target.result;
            preview.style.display = 'block';
            console.log('✅ Image preview loaded');
          };
          reader.readAsDataURL(file);
        }
      }
    });
  });
  
  // 3. NAME CHANGE RADIO BUTTONS
  const nameChangeRadios = document.querySelectorAll('input[name="can_changename"]');
  const changenameTimeField = document.getElementById('changenameTimeField');
  
  console.log('🔘 Found radios:', nameChangeRadios.length);
  console.log('📝 Time field:', changenameTimeField);
  
  nameChangeRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      console.log('🔘 Radio changed:', this.value);
      if (this.value === 'no') {
        changenameTimeField.style.display = 'block';
        changenameTimeField.querySelector('input').required = true;
        console.log('✅ Time left field shown');
      } else {
        changenameTimeField.style.display = 'none';
        changenameTimeField.querySelector('input').required = false;
        changenameTimeField.querySelector('input').value = '';
        console.log('✅ Time left field hidden');
      }
    });
  });
  
  console.log('🎉 All features initialized!');
  
  // 4. PLAYSTYLE-BASED VALIDATION
  const playstyleSelect = document.getElementById('playstyleSelect');
  const legendarySeriesInput = document.getElementById('legendarySeriesInput');
  const legendaryMinText = document.getElementById('legendaryMinText');
  
  if (playstyleSelect && legendarySeriesInput) {
    console.log('✅ Playstyle validation setup');
    
    // Update legendary series minimum when playstyle changes
    playstyleSelect.addEventListener('change', function() {
      const playstyle = this.value;
      console.log('🎮 Playstyle changed to:', playstyle);
      
      if (playstyle === 'Casual') {
        legendarySeriesInput.setAttribute('min', '3');
        legendaryMinText.textContent = '(Min: 3)';
      } else if (playstyle === 'Compe') {
        legendarySeriesInput.setAttribute('min', '10');
        legendaryMinText.textContent = '(Min: 10)';
      } else {
        legendarySeriesInput.setAttribute('min', '1');
        legendaryMinText.textContent = '';
      }
    });
    
    // Validate legendary series on input
    legendarySeriesInput.addEventListener('input', function() {
      const playstyle = playstyleSelect.value;
      const value = parseInt(this.value);
      
      let min = 1;
      if (playstyle === 'Casual') min = 3;
      if (playstyle === 'Compe') min = 10;
      
      if (value < min) {
        this.style.border = '2px solid #ef4444';
      } else {
        this.style.border = '2px solid #10b981';
      }
    });
  }
  
  // 5. CONFIRMATION MODAL
  const confirmationModal = document.getElementById('confirmationModal');
  const confirmCheckbox = document.getElementById('confirmCheckbox');
  const proceedSubmitBtn = document.getElementById('proceedSubmitBtn');
  const cancelConfirmBtn = document.getElementById('cancelConfirmBtn');
  
  if (confirmCheckbox && proceedSubmitBtn) {
    // Enable/disable submit button based on checkbox
    confirmCheckbox.addEventListener('change', function() {
      if (this.checked) {
        proceedSubmitBtn.disabled = false;
        proceedSubmitBtn.style.cursor = 'pointer';
        proceedSubmitBtn.style.opacity = '1';
      } else {
        proceedSubmitBtn.disabled = true;
        proceedSubmitBtn.style.cursor = 'not-allowed';
        proceedSubmitBtn.style.opacity = '0.5';
      }
    });
  }
  
  if (cancelConfirmBtn && confirmationModal) {
    cancelConfirmBtn.addEventListener('click', function() {
      confirmationModal.style.display = 'none';
      confirmCheckbox.checked = false;
      proceedSubmitBtn.disabled = true;
      proceedSubmitBtn.style.cursor = 'not-allowed';
      proceedSubmitBtn.style.opacity = '0.5';
    });
  }
});
