// ═══════════════════════════════════════════
// Email OTP Authentication (Custom System)
// Uses local server API → Supabase RPC + Resend
// ═══════════════════════════════════════════

const Auth = {
  currentUser: null,

  // Send OTP to email via our server API
  async sendOtp(email) {
    const res = await fetch('/api/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
    return true;
  },

  // Verify OTP via our server API
  async verifyOtp(email, code) {
    const res = await fetch('/api/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Invalid or expired OTP');

    // Store user info locally (no Supabase auth session — just email verification)
    this.currentUser = { email };
    localStorage.setItem('nw_user', JSON.stringify({ email }));
    return data;
  },

  // Check for existing session from localStorage
  async getSession() {
    const stored = localStorage.getItem('nw_user');
    if (stored) {
      try {
        this.currentUser = JSON.parse(stored);
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
  },

  isLoggedIn() {
    return !!this.currentUser;
  }
};
