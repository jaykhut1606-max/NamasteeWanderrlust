// ═══════════════════════════════════════════
// Booking Modal — State Machine
// ═══════════════════════════════════════════

const BookingModal = {
  currentStep: 1,
  tripId: null,
  tripName: null,
  state: {
    email: '',
    otp: '',
    name: '',
    phone: '',
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
    this.state = { email: '', otp: '', name: '', phone: '', packageType: null, amount: 0 };

    // Check if already logged in
    if (Auth.isLoggedIn()) {
      this.state.email = Auth.currentUser.email;
      this.currentStep = 3; // Skip to name/phone
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

    // When entering OTP step, show email and clear inputs
    if (step === 2) {
      const emailDisplay = document.getElementById('otpEmailDisplay');
      if (emailDisplay) emailDisplay.textContent = this.state.email;
      // Clear OTP inputs and focus first
      const inputs = document.querySelectorAll('.otp-input');
      inputs.forEach(i => i.value = '');
      setTimeout(() => { if (inputs[0]) inputs[0].focus(); }, 100);
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

    // Update trip name in modal header
    const headerEl = document.getElementById('bookingTripName');
    if (headerEl) headerEl.textContent = this.tripName || 'Book Your Trip';
  },

  // ─── Step 1: Email Input ───
  async submitEmail() {
    const emailInput = document.getElementById('authEmail');
    const email = emailInput.value.trim();
    const errorEl = document.getElementById('emailError');
    const btn = document.getElementById('sendOtpBtn');

    errorEl.textContent = '';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errorEl.textContent = 'Please enter a valid email address';
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Sending OTP...';

    try {
      await Auth.sendOtp(email);
      this.state.email = email;
      this.goTo(2);
    } catch (err) {
      errorEl.textContent = err.message || 'Failed to send OTP. Try again.';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Send OTP';
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
      this.goTo(3);
    } catch (err) {
      errorEl.textContent = err.message || 'Invalid or expired OTP. Please try again.';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Verify & Continue';
    }
  },

  // ─── Step 3: Name & Phone ───
  submitDetails() {
    const name = document.getElementById('userName').value.trim();
    const phone = document.getElementById('userPhone').value.trim();
    const errorEl = document.getElementById('detailsError');

    errorEl.textContent = '';
    if (!name || name.length < 2) {
      errorEl.textContent = 'Please enter your full name';
      return;
    }
    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      errorEl.textContent = 'Please enter a valid 10-digit Indian phone number';
      return;
    }

    this.state.name = name;
    this.state.phone = phone;
    this.goTo(4);
  },

  // ─── Step 4: Package Selection ───
  selectPackage(type) {
    this.state.packageType = type;
    this.state.amount = this.packages[type].amount;

    // Highlight selected card
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

    // Confetti
    if (window.confetti) {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      setTimeout(() => confetti({ particleCount: 80, spread: 100, origin: { y: 0.5 } }), 500);
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

// ─── Resend OTP handler ───
BookingModal.resendOtp = async function() {
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
    }, 30000); // 30 second cooldown
  } catch (err) {
    errorEl.textContent = err.message || 'Failed to resend. Try again.';
    if (resendBtn) {
      resendBtn.disabled = false;
      resendBtn.textContent = 'Resend Code';
    }
  }
};

// ─── Init: check session on page load ───
(async () => {
  await Auth.getSession();
})();
