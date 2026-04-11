// ═══════════════════════════════════════════
// Authentication System
// OTP for first-time → set password → welcome email
// Returning users → email + password login
// ═══════════════════════════════════════════

const Auth = {
  currentUser: null,

  // Send OTP to email
  async sendOtp(email) {
    const res = await fetch('/api/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
    return data; // { success, user_exists, has_password }
  },

  // Verify OTP
  async verifyOtp(email, code) {
    const res = await fetch('/api/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Invalid or expired OTP');
    return data; // { success, verified, user_exists, has_password }
  },

  // Register new user (after OTP) — sets password, sends welcome email
  async register(email, password, name, phone) {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, phone })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    this.currentUser = data.user;
    localStorage.setItem('nw_user', JSON.stringify(data.user));
    return data;
  },

  // Login with email + password
  async login(email, password) {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Invalid email or password');
    this.currentUser = data.user;
    localStorage.setItem('nw_user', JSON.stringify(data.user));
    return data;
  },

  // Get profile with bookings
  async getProfile(email) {
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email || this.currentUser?.email })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load profile');
    return data.profile;
  },

  // Check for existing session from localStorage
  async getSession() {
    const stored = localStorage.getItem('nw_user');
    if (stored) {
      try {
        this.currentUser = JSON.parse(stored);
        this._updateUI();
      } catch {
        this.currentUser = null;
      }
    }
    return this.currentUser;
  },

  // Sign out
  async signOut() {
    this.currentUser = null;
    localStorage.removeItem('nw_user');
    this._updateUI();
  },

  isLoggedIn() {
    return !!this.currentUser;
  },

  // Update navbar UI based on login state
  _updateUI() {
    const loginBtn = document.getElementById('navLoginBtn');
    const loginBtnMobile = document.getElementById('navLoginBtnMobile');
    const profileBtn = document.getElementById('navProfileBtn');
    const profileBtnMobile = document.getElementById('navProfileBtnMobile');

    if (this.isLoggedIn()) {
      if (loginBtn) loginBtn.classList.add('hidden');
      if (loginBtnMobile) loginBtnMobile.classList.add('hidden');
      if (profileBtn) {
        profileBtn.classList.remove('hidden');
        const nameEl = profileBtn.querySelector('.profile-name');
        if (nameEl) nameEl.textContent = this.currentUser.name?.split(' ')[0] || 'Profile';
      }
      if (profileBtnMobile) {
        profileBtnMobile.classList.remove('hidden');
        const nameEl = profileBtnMobile.querySelector('.profile-name');
        if (nameEl) nameEl.textContent = this.currentUser.name?.split(' ')[0] || 'Profile';
      }
    } else {
      if (loginBtn) loginBtn.classList.remove('hidden');
      if (loginBtnMobile) loginBtnMobile.classList.remove('hidden');
      if (profileBtn) profileBtn.classList.add('hidden');
      if (profileBtnMobile) profileBtnMobile.classList.add('hidden');
    }
  }
};
