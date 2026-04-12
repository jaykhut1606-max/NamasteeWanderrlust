// ═══════════════════════════════════════════
// Booking Modal — State Machine
// Flow: Email → (New: OTP → Password Setup) or (Returning: Password) → Details → Package → Pay → Success
// ═══════════════════════════════════════════

const BookingModal = {
  currentStep: 1,
  tripId: null,
  tripName: null,
  isNewUser: false,
  state: {
    email: '',
    otp: '',
    name: '',
    phone: '',
    password: '',
    packageType: null,
    amount: 0,
  },

  packages: {
    per_person: { label: 'Per Person', amount: 3001000, display: '₹30,010', gst: 'Including GST' },
    per_couple: { label: 'Per Couple', amount: 4044000, display: '₹40,440', gst: 'Including GST' },
  },

  open(tripId, tripName) {
    this.tripId = tripId;
    this.tripName = tripName;
    this.currentStep = 1;
    this.isNewUser = false;
    this.state = { email: '', otp: '', name: '', phone: '', password: '', packageType: null, amount: 0 };

    // If already logged in, skip to details/package
    if (Auth.isLoggedIn()) {
      this.state.email = Auth.currentUser.email;
      this.state.name = Auth.currentUser.name || '';
      this.state.phone = Auth.currentUser.phone || '';
      this.currentStep = 4; // Skip to package selection
    }

    document.getElementById('bookingModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    this.render();
  },

  close() {
    document.getElementById('bookingModal').classList.add('hidden');
    document.body.style.overflow = '';
  },

  goTo(step) {
    this.currentStep = step;
    this.render();

    // Step-specific setup
    if (step === 2) {
      // OTP step
      const emailDisplay = document.getElementById('otpEmailDisplay');
      if (emailDisplay) emailDisplay.textContent = this.state.email;
      const inputs = document.querySelectorAll('.otp-input');
      inputs.forEach(i => i.value = '');
      setTimeout(() => { if (inputs[0]) inputs[0].focus(); }, 100);
    }
    if (step === 3) {
      // Returning user — password login
      const setupTitle = document.getElementById('setupTitle');
      const setupDesc = document.getElementById('setupDesc');
      const namePhoneFields = document.getElementById('namePhoneFields');
      const passwordField = document.getElementById('passwordField');

      if (setupTitle) setupTitle.textContent = 'Welcome Back!';
      if (setupDesc) setupDesc.textContent = 'Enter your password to continue';
      if (namePhoneFields) namePhoneFields.classList.add('hidden');
      if (passwordField) passwordField.classList.remove('hidden');
    }
  },

  render() {
    const container = document.getElementById('bookingModalContent');
    const steps = container.querySelectorAll('.booking-step');
    steps.forEach(s => s.classList.add('hidden'));

    const active = container.querySelector(`[data-step="${this.currentStep}"]`);
    if (active) active.classList.remove('hidden');

    // Update step indicator
    document.querySelectorAll('.step-dot').forEach((dot, i) => {
      dot.classList.toggle('bg-sunset', i < this.currentStep);
      dot.classList.toggle('bg-sand/40', i >= this.currentStep);
    });

    const headerEl = document.getElementById('bookingTripName');
    if (headerEl) headerEl.textContent = this.tripName || 'Book Your Trip';
  },

  // Switch step 1 to email-only mode for returning users
  showLoginMode() {
    const container = document.querySelector('[data-step="1"]');
    if (!container) return;
    container.innerHTML = `
      <div class="text-center mb-6">
        <div class="w-14 h-14 mx-auto mb-4 rounded-2xl bg-sunset/10 flex items-center justify-center">
          <svg class="w-7 h-7 text-sunset" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
        </div>
        <h4 class="font-display text-2xl font-bold text-warm-brown mb-1">Welcome Back!</h4>
        <p class="font-body text-sm text-muted-brown">Enter your email to sign in</p>
      </div>
      <input id="authEmail" type="email" class="modal-input mb-3" placeholder="Email Address" autocomplete="email">
      <p id="emailError" class="error-text"></p>
      <button id="sendOtpBtn" onclick="BookingModal.submitEmail()" class="modal-btn modal-btn-primary mt-4">Continue</button>
      <p class="text-center mt-3 font-body text-sm text-muted-brown">New here? <button onclick="BookingModal.showSignupMode()" class="text-sunset font-semibold hover:underline">Sign Up</button></p>
    `;
  },

  // Switch step 1 back to sign-up mode
  showSignupMode() {
    const container = document.querySelector('[data-step="1"]');
    if (!container) return;
    container.innerHTML = `
      <div class="text-center mb-6">
        <div class="w-14 h-14 mx-auto mb-4 rounded-2xl bg-sunset/10 flex items-center justify-center">
          <svg class="w-7 h-7 text-sunset" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
        </div>
        <h4 class="font-display text-2xl font-bold text-warm-brown mb-1">Create Your Account</h4>
        <p class="font-body text-sm text-muted-brown">Sign up to book your trip</p>
      </div>
      <input id="authName" type="text" class="modal-input mb-3" placeholder="Full Name" autocomplete="name">
      <input id="authPhone" type="tel" class="modal-input mb-3" placeholder="Phone Number (10 digits)" maxlength="10" inputmode="numeric">
      <input id="authEmail" type="email" class="modal-input mb-3" placeholder="Email Address" autocomplete="email">
      <p id="emailError" class="error-text"></p>
      <button id="sendOtpBtn" onclick="BookingModal.submitEmail()" class="modal-btn modal-btn-primary mt-4">Continue</button>
      <p class="text-center mt-3 font-body text-sm text-muted-brown">Already have an account? <button onclick="BookingModal.showLoginMode()" class="text-sunset font-semibold hover:underline">Sign In</button></p>
    `;
  },

  // ─── Step 1: Name + Phone + Email (new users) or Email only (returning) ───
  async submitEmail() {
    const emailInput = document.getElementById('authEmail');
    const email = emailInput.value.trim().toLowerCase();
    const errorEl = document.getElementById('emailError');
    const btn = document.getElementById('sendOtpBtn');

    // If name/phone fields exist (sign-up mode), validate them
    const nameInput = document.getElementById('authName');
    const phoneInput = document.getElementById('authPhone');

    if (nameInput && phoneInput) {
      const name = nameInput.value.trim();
      const phone = phoneInput.value.trim();

      if (!name || name.length < 2) { errorEl.textContent = 'Please enter your full name'; return; }
      if (!phone || !/^[6-9]\d{9}$/.test(phone)) { errorEl.textContent = 'Please enter a valid 10-digit phone number'; return; }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { errorEl.textContent = 'Please enter a valid email address'; return; }

      this.state.name = name;
      this.state.phone = phone;
    } else {
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { errorEl.textContent = 'Please enter a valid email address'; return; }
    }

    errorEl.textContent = '';
    btn.disabled = true;
    btn.textContent = 'Sending OTP...';

    try {
      const result = await Auth.sendOtp(email);
      this.state.email = email;

      if (result.has_password) {
        // Returning user — go to password login (skip OTP)
        this.isNewUser = false;
        this.goTo(3);
      } else {
        // New user — verify OTP first
        this.isNewUser = true;
        this.goTo(2);
      }
    } catch (err) {
      errorEl.textContent = err.message || 'Failed to send OTP. Try again.';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Continue';
    }
  },

  // ─── Step 2: OTP Verification ───
  async submitOtp() {
    const inputs = document.querySelectorAll('.otp-input');
    const otp = Array.from(inputs).map(i => i.value).join('');
    const errorEl = document.getElementById('otpError');
    const btn = document.getElementById('verifyOtpBtn');

    errorEl.textContent = '';
    if (otp.length !== 6) {
      errorEl.textContent = 'Please enter the 6-digit code';
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Verifying...';

    try {
      await Auth.verifyOtp(this.state.email, otp);
      this.state.otp = otp;

      if (this.isNewUser && this.state.name) {
        // New user with name+phone already collected — auto-register and go to package
        const autoPassword = 'NW_' + Math.random().toString(36).slice(2, 10) + '!';
        await Auth.register(this.state.email, autoPassword, this.state.name, this.state.phone);
        Auth._updateUI();
        this.goTo(4); // Skip setup, go to package selection
      } else {
        // Go to account setup (password + name/phone)
        this.goTo(3);
      }
    } catch (err) {
      errorEl.textContent = err.message || 'Invalid or expired OTP. Please try again.';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Verify & Continue';
    }
  },

  // ─── Step 3: Password login (returning users) ───
  async submitSetup() {
    const password = document.getElementById('userPassword').value;
    const errorEl = document.getElementById('setupError');
    const btn = document.getElementById('setupBtn');

    errorEl.textContent = '';

    if (!password) {
      errorEl.textContent = 'Please enter your password';
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Logging in...';

    try {
      const result = await Auth.login(this.state.email, password);
      this.state.name = result.user.name || '';
      this.state.phone = result.user.phone || '';
      Auth._updateUI();
      this.goTo(4); // Package selection
    } catch (err) {
      errorEl.textContent = err.message || 'Invalid password';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Login & Continue';
    }
  },

  // ─── Step 4: Package Selection ───
  selectPackage(type) {
    this.state.packageType = type;
    this.state.amount = this.packages[type].amount;

    document.querySelectorAll('.package-card').forEach(card => {
      card.classList.toggle('ring-2', card.dataset.package === type);
      card.classList.toggle('ring-sunset', card.dataset.package === type);
      card.classList.toggle('bg-sunset/5', card.dataset.package === type);
    });

    document.getElementById('proceedPayBtn').disabled = false;
  },

  async proceedToPayment() {
    if (!this.state.packageType) return;

    const btn = document.getElementById('proceedPayBtn');
    btn.disabled = true;
    btn.textContent = 'Preparing Payment...';

    try {
      await RazorpayCheckout.createOrder({
        tripId: this.tripId,
        tripName: this.tripName,
        packageType: this.state.packageType,
        amount: this.state.amount,
        userName: this.state.name,
        userEmail: this.state.email,
        userPhone: this.state.phone,
      });
    } catch (err) {
      alert('Payment setup failed: ' + (err.message || 'Please try again'));
    } finally {
      btn.disabled = false;
      btn.textContent = 'Proceed to Pay';
    }
  },

  // ─── Step 6: Success ───
  showSuccess(bookingData) {
    this.goTo(6);

    document.getElementById('successBookingId').textContent = bookingData.bookingId || '-';
    document.getElementById('successTripName').textContent = this.tripName;
    document.getElementById('successPackage').textContent = this.packages[this.state.packageType].label;
    document.getElementById('successAmount').textContent = this.packages[this.state.packageType].display;
    document.getElementById('successPaymentId').textContent = bookingData.paymentId || '-';

    if (window.confetti) {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      setTimeout(() => confetti({ particleCount: 80, spread: 100, origin: { y: 0.5 } }), 500);
    }
  },

  // ─── Resend OTP ───
  async resendOtp() {
    const errorEl = document.getElementById('otpError');
    const resendBtn = document.getElementById('resendOtpBtn');
    if (resendBtn) {
      resendBtn.disabled = true;
      resendBtn.textContent = 'Sending...';
    }
    try {
      await Auth.sendOtp(this.state.email);
      errorEl.textContent = '';
      if (resendBtn) resendBtn.textContent = 'Code resent ✓';
      setTimeout(() => {
        if (resendBtn) {
          resendBtn.disabled = false;
          resendBtn.textContent = 'Resend Code';
        }
      }, 30000);
    } catch (err) {
      errorEl.textContent = err.message || 'Failed to resend. Try again.';
      if (resendBtn) {
        resendBtn.disabled = false;
        resendBtn.textContent = 'Resend Code';
      }
    }
  }
};

// ─── OTP Input Auto-focus ───
document.addEventListener('input', (e) => {
  if (e.target.classList.contains('otp-input')) {
    if (e.target.value.length === 1) {
      const next = e.target.nextElementSibling;
      if (next && next.classList.contains('otp-input')) next.focus();
    }
  }
});

document.addEventListener('keydown', (e) => {
  if (e.target.classList.contains('otp-input') && e.key === 'Backspace' && !e.target.value) {
    const prev = e.target.previousElementSibling;
    if (prev && prev.classList.contains('otp-input')) prev.focus();
  }
});

// ─── Close modal on escape ───
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') BookingModal.close();
});

// ─── Profile Modal ───
const ProfileModal = {
  async open() {
    if (!Auth.isLoggedIn()) return;

    const modal = document.getElementById('profileModal');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Show loading
    document.getElementById('profileContent').innerHTML = `
      <div class="text-center py-8">
        <div class="w-10 h-10 mx-auto mb-4 spinner-border-3 border-sunset/30 border-t-sunset rounded-full animate-spin"></div>
        <p class="font-body text-sm text-muted-brown">Loading profile...</p>
      </div>`;

    try {
      const profile = await Auth.getProfile();
      this.renderProfile(profile);
    } catch (err) {
      console.error('Profile load error:', err);
      // If profile API fails, show basic profile from local session
      const user = Auth.currentUser;
      if (user) {
        this.renderProfile({
          name: user.name || 'Traveler',
          email: user.email,
          phone: user.phone || '',
          created_at: user.created_at || new Date().toISOString(),
          bookings: []
        });
      } else {
        document.getElementById('profileContent').innerHTML = `
          <div class="text-center py-8">
            <p class="font-body text-sm text-red-500">Failed to load profile</p>
            <button onclick="Auth.signOut(); ProfileModal.close();" class="mt-4 text-sm text-sunset font-semibold hover:underline">Sign Out & Try Again</button>
          </div>`;
      }
    }
  },

  close() {
    document.getElementById('profileModal').classList.add('hidden');
    document.body.style.overflow = '';
  },

  renderProfile(profile) {
    const initials = (profile.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const bookings = profile.bookings || [];
    const memberSince = new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

    let bookingsHtml = '';
    if (bookings.length === 0) {
      bookingsHtml = `
        <div class="text-center py-6">
          <p class="font-body text-sm text-muted-brown mb-2">No trips booked yet</p>
          <button onclick="ProfileModal.close(); document.getElementById('trips').scrollIntoView({behavior:'smooth'})" class="font-body text-sm text-sunset font-semibold hover:underline">Explore Trips →</button>
        </div>`;
    } else {
      bookingsHtml = bookings.map(b => {
        const amount = b.amount_paise ? `₹${(b.amount_paise / 100).toLocaleString('en-IN')}` : '-';
        const date = new Date(b.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' });
        const statusColor = b.payment_status === 'completed' ? 'bg-forest/10 text-forest' : 'bg-amber/10 text-amber';
        return `
          <div class="bg-white rounded-xl p-4 shadow-[0_2px_12px_rgba(44,36,24,0.04)]">
            <div class="flex items-center justify-between mb-2">
              <p class="font-body font-semibold text-warm-brown text-sm">Munnar Trip</p>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColor}">${b.payment_status || 'pending'}</span>
            </div>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div><span class="text-muted-brown">Package:</span> <span class="text-warm-brown font-medium">${b.package_type === 'per_couple' ? 'Couple' : 'Solo'}</span></div>
              <div><span class="text-muted-brown">Amount:</span> <span class="text-warm-brown font-medium">${amount}</span></div>
              <div><span class="text-muted-brown">Date:</span> <span class="text-warm-brown font-medium">${date}</span></div>
              <div><span class="text-muted-brown">Payment:</span> <span class="text-warm-brown font-medium">${b.razorpay_payment_id || '-'}</span></div>
            </div>
          </div>`;
      }).join('');
    }

    document.getElementById('profileContent').innerHTML = `
      <!-- Avatar & Info -->
      <div class="text-center mb-6">
        <div class="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-sunset to-amber flex items-center justify-center">
          <span class="text-white font-display text-xl font-bold">${initials}</span>
        </div>
        <h4 class="font-display text-xl font-bold text-warm-brown">${profile.name || 'Traveler'}</h4>
        <p class="font-body text-sm text-muted-brown">${profile.email}</p>
        <p class="font-body text-xs text-sand mt-1">Member since ${memberSince}</p>
      </div>

      <!-- Contact -->
      <div class="bg-warm-beige/50 rounded-xl p-4 mb-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="font-body text-xs text-muted-brown">Phone</p>
            <p class="font-body text-sm font-medium text-warm-brown">${profile.phone || 'Not set'}</p>
          </div>
          <div>
            <p class="font-body text-xs text-muted-brown">Email</p>
            <p class="font-body text-sm font-medium text-warm-brown">${profile.email}</p>
          </div>
        </div>
      </div>

      <!-- Bookings -->
      <div class="mb-4">
        <h5 class="font-display text-lg font-bold text-warm-brown mb-3">My Trips</h5>
        <div class="space-y-3">${bookingsHtml}</div>
      </div>

      <!-- Sign Out -->
      <button onclick="Auth.signOut(); ProfileModal.close();" class="modal-btn modal-btn-secondary w-full mt-2">Sign Out</button>
    `;
  }
};

// ─── Waitlist ───
async function submitWaitlist(formEl, trip) {
  const emailInput = formEl.querySelector('input[type="email"]');
  const btn = formEl.querySelector('button[type="submit"]');
  const email = emailInput.value.trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    emailInput.classList.add('border-red-400');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Joining...';

  try {
    const res = await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, trip })
    });
    const data = await res.json();

    emailInput.value = '';
    emailInput.classList.remove('border-red-400');
    btn.textContent = '✓ Joined!';
    btn.classList.add('bg-forest');
    setTimeout(() => {
      btn.textContent = 'Join';
      btn.classList.remove('bg-forest');
      btn.disabled = false;
    }, 3000);
  } catch (err) {
    btn.textContent = 'Error';
    setTimeout(() => {
      btn.textContent = 'Join';
      btn.disabled = false;
    }, 2000);
  }
}

// ─── Login Modal (standalone, for navbar login) ───
const LoginModal = {
  _pendingName: '',
  _pendingPhone: '',

  open() {
    document.getElementById('loginModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    this._pendingName = '';
    this._pendingPhone = '';
    this.showSignupStep();
  },

  close() {
    document.getElementById('loginModal').classList.add('hidden');
    document.body.style.overflow = '';
    // Check if there was a pending itinerary download
    if (window._pendingItineraryDownload && Auth.isLoggedIn()) {
      window._pendingItineraryDownload = false;
      setTimeout(() => downloadItinerary(), 500);
    }
    if (window._pendingBaliDownload && Auth.isLoggedIn()) {
      window._pendingBaliDownload = false;
      setTimeout(() => downloadBaliItinerary(), 500);
    }
  },

  // ─── Step 1: Name + Phone + Email (new users) ───
  showSignupStep() {
    document.getElementById('loginModalContent').innerHTML = `
      <div class="text-center mb-6">
        <div class="w-14 h-14 mx-auto mb-4 rounded-2xl bg-sunset/10 flex items-center justify-center">
          <svg class="w-7 h-7 text-sunset" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
        </div>
        <h4 class="font-display text-2xl font-bold text-warm-brown mb-1">Sign Up</h4>
        <p class="font-body text-sm text-muted-brown">Create your account to get started</p>
      </div>
      <input id="loginName" type="text" class="modal-input mb-3" placeholder="Full Name" autocomplete="name">
      <input id="loginPhone" type="tel" class="modal-input mb-3" placeholder="Phone Number (10 digits)" maxlength="10" inputmode="numeric">
      <input id="loginEmail" type="email" class="modal-input mb-3" placeholder="Email Address" autocomplete="email">
      <p id="loginError" class="error-text"></p>
      <button id="loginSubmitBtn" onclick="LoginModal.submitSignup()" class="modal-btn modal-btn-primary mt-4">Continue</button>
      <p class="text-center mt-4 font-body text-sm text-muted-brown">Already have an account? <button onclick="LoginModal.showLoginStep()" class="text-sunset font-semibold hover:underline">Sign In</button></p>
    `;
  },

  async submitSignup() {
    const name = document.getElementById('loginName').value.trim();
    const phone = document.getElementById('loginPhone').value.trim();
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const errorEl = document.getElementById('loginError');
    const btn = document.getElementById('loginSubmitBtn');

    errorEl.textContent = '';
    if (!name || name.length < 2) { errorEl.textContent = 'Please enter your full name'; return; }
    if (!phone || !/^[6-9]\d{9}$/.test(phone)) { errorEl.textContent = 'Please enter a valid 10-digit phone number'; return; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { errorEl.textContent = 'Please enter a valid email address'; return; }

    btn.disabled = true;
    btn.textContent = 'Sending OTP...';

    try {
      const result = await Auth.sendOtp(email);

      if (result.has_password) {
        // Already registered — redirect to sign in
        this.showPasswordStep(email);
        return;
      }

      // Save name & phone for after OTP verification
      this._pendingName = name;
      this._pendingPhone = phone;
      this.showOtpStep(email, true);
    } catch (err) {
      errorEl.textContent = err.message || 'Failed to send OTP';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Continue';
    }
  },

  // ─── Sign In (returning users) ───
  showLoginStep() {
    document.getElementById('loginModalContent').innerHTML = `
      <div class="text-center mb-6">
        <div class="w-14 h-14 mx-auto mb-4 rounded-2xl bg-sunset/10 flex items-center justify-center">
          <svg class="w-7 h-7 text-sunset" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
        </div>
        <h4 class="font-display text-2xl font-bold text-warm-brown mb-1">Sign In</h4>
        <p class="font-body text-sm text-muted-brown">Welcome back! Enter your email</p>
      </div>
      <input id="loginEmail" type="email" class="modal-input mb-3" placeholder="Email Address" autocomplete="email">
      <p id="loginError" class="error-text"></p>
      <button id="loginSubmitBtn" onclick="LoginModal.submitLogin()" class="modal-btn modal-btn-primary mt-4">Continue</button>
      <p class="text-center mt-4 font-body text-sm text-muted-brown">New here? <button onclick="LoginModal.showSignupStep()" class="text-sunset font-semibold hover:underline">Sign Up</button></p>
    `;
  },

  async submitLogin() {
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const errorEl = document.getElementById('loginError');
    const btn = document.getElementById('loginSubmitBtn');

    errorEl.textContent = '';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { errorEl.textContent = 'Please enter a valid email'; return; }

    btn.disabled = true;
    btn.textContent = 'Checking...';

    try {
      const result = await Auth.sendOtp(email);

      if (result.has_password) {
        this.showPasswordStep(email);
      } else {
        // No account yet — redirect to sign up
        this.showSignupStep();
        setTimeout(() => {
          const errEl = document.getElementById('loginError');
          if (errEl) errEl.textContent = 'No account found. Please sign up first.';
        }, 100);
      }
    } catch (err) {
      errorEl.textContent = err.message;
    } finally {
      btn.disabled = false;
      btn.textContent = 'Continue';
    }
  },

  showPasswordStep(email) {
    document.getElementById('loginModalContent').innerHTML = `
      <div class="text-center mb-6">
        <h4 class="font-display text-2xl font-bold text-warm-brown mb-1">Welcome Back!</h4>
        <p class="font-body text-sm text-muted-brown">${email}</p>
      </div>
      <input id="loginPassword" type="password" class="modal-input mb-3" placeholder="Your password" autocomplete="current-password">
      <p id="loginError" class="error-text"></p>
      <button onclick="LoginModal.submitPassword('${email}')" class="modal-btn modal-btn-primary mt-4">Sign In</button>
      <button onclick="LoginModal.forgotPassword('${email}')" class="text-sm text-sunset hover:text-sunset/80 font-medium mt-3 block mx-auto">Forgot password? Login with OTP</button>
    `;
    setTimeout(() => document.getElementById('loginPassword').focus(), 100);
  },

  async submitPassword(email) {
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');

    if (!password) { errorEl.textContent = 'Enter your password'; return; }

    try {
      await Auth.login(email, password);
      Auth._updateUI();
      this.close();
    } catch (err) {
      errorEl.textContent = err.message || 'Invalid password';
    }
  },

  async forgotPassword(email) {
    try {
      await Auth.sendOtp(email);
      this.showOtpStep(email, false);
    } catch (err) {
      alert('Failed to send OTP: ' + err.message);
    }
  },

  showOtpStep(email, isNewUser) {
    this._otpIsNewUser = isNewUser;
    document.getElementById('loginModalContent').innerHTML = `
      <div class="text-center mb-6">
        <h4 class="font-display text-2xl font-bold text-warm-brown mb-1">Verify Email</h4>
        <p class="font-body text-sm text-muted-brown">Enter the 6-digit code sent to</p>
        <p class="font-body text-sm font-semibold text-sunset mt-1">${email}</p>
      </div>
      <div class="otp-container mb-3">
        <input class="otp-input" type="text" maxlength="1" inputmode="numeric">
        <input class="otp-input" type="text" maxlength="1" inputmode="numeric">
        <input class="otp-input" type="text" maxlength="1" inputmode="numeric">
        <input class="otp-input" type="text" maxlength="1" inputmode="numeric">
        <input class="otp-input" type="text" maxlength="1" inputmode="numeric">
        <input class="otp-input" type="text" maxlength="1" inputmode="numeric">
      </div>
      <p id="loginError" class="error-text text-center"></p>
      <button onclick="LoginModal.submitOtp('${email}')" class="modal-btn modal-btn-primary mt-4">Verify & Continue</button>
      <button onclick="LoginModal.resendOtp('${email}')" id="loginResendBtn" class="text-sm text-sunset hover:text-sunset/80 font-medium mt-3 block mx-auto">Resend Code</button>
    `;
    setTimeout(() => document.querySelector('#loginModalContent .otp-input')?.focus(), 100);
  },

  async resendOtp(email) {
    const btn = document.getElementById('loginResendBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Sending...'; }
    try {
      await Auth.sendOtp(email);
      if (btn) { btn.textContent = 'Code resent!'; }
      setTimeout(() => { if (btn) { btn.disabled = false; btn.textContent = 'Resend Code'; } }, 30000);
    } catch (err) {
      if (btn) { btn.disabled = false; btn.textContent = 'Resend Code'; }
    }
  },

  async submitOtp(email) {
    const inputs = document.querySelectorAll('#loginModalContent .otp-input');
    const otp = Array.from(inputs).map(i => i.value).join('');
    const errorEl = document.getElementById('loginError');

    if (otp.length !== 6) { errorEl.textContent = 'Enter the 6-digit code'; return; }

    try {
      const result = await Auth.verifyOtp(email, otp);

      if (this._otpIsNewUser && this._pendingName) {
        // New user — auto-register with name & phone collected earlier
        const autoPassword = 'NW_' + Math.random().toString(36).slice(2, 10) + '!';
        await Auth.register(email, autoPassword, this._pendingName, this._pendingPhone);
        Auth._updateUI();
        this.close();
      } else {
        // Existing user verified via OTP (forgot password flow)
        Auth.currentUser = { email };
        localStorage.setItem('nw_user', JSON.stringify({ email }));
        try {
          await Auth.getProfile(email);
        } catch(e) { /* profile will load from basic data */ }
        Auth._updateUI();
        this.close();
      }
    } catch (err) {
      errorEl.textContent = err.message;
    }
  }
};

// ─── Init: check session on page load ───
(async () => {
  await Auth.getSession();
})();
