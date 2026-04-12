// ═══════════════════════════════════════════
// Razorpay Checkout Integration
// Server-side order creation + signature verification
// ═══════════════════════════════════════════

const RazorpayCheckout = {
  async createOrder(details) {
    // Call server to create Razorpay order + pending booking
    const res = await fetch('/api/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: details.amount,
        trip_id: details.tripId,
        trip_name: details.tripName,
        package_type: details.packageType,
        user_name: details.userName,
        user_email: details.userEmail,
        user_phone: details.userPhone,
      })
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(data.error || 'Failed to create order');
    }

    // Open Razorpay checkout with server-generated order
    this.openCheckout({
      keyId: data.key_id,
      orderId: data.order_id,
      bookingId: data.booking_id,
      amount: data.amount,
      userName: details.userName,
      userEmail: details.userEmail,
      userPhone: details.userPhone,
      tripName: details.tripName,
      packageType: details.packageType,
    });
  },

  openCheckout(options) {
    const rzp = new Razorpay({
      key: options.keyId,
      amount: options.amount,
      currency: 'INR',
      name: 'NamasteeWanderrlust',
      description: `${options.tripName} Trip Booking`,
      order_id: options.orderId,
      prefill: {
        name: options.userName,
        email: options.userEmail,
        contact: options.userPhone,
      },
      theme: {
        color: '#D4773B',
      },
      handler: async (response) => {
        await this.verifyPayment(response, options);
      },
      modal: {
        ondismiss: () => {
          // Payment cancelled — booking stays pending
          console.log('Payment cancelled by user');
        }
      }
    });
    rzp.open();
  },

  async verifyPayment(response, options) {
    try {
      // Show loading state
      const btn = document.getElementById('proceedPayBtn');
      if (btn) { btn.disabled = true; btn.textContent = 'Verifying Payment...'; }

      // Verify payment signature on server
      const res = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          booking_id: options.bookingId,
          user_name: options.userName,
          user_email: options.userEmail,
          trip_name: options.tripName,
          package_type: options.packageType,
          amount: options.amount,
        })
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Payment verification failed');
      }

      // Show success in modal
      BookingModal.showSuccess({
        bookingId: data.booking_id,
        paymentId: data.payment_id,
      });

    } catch (err) {
      alert('Payment was received but verification encountered an issue. Please contact support.\n\nPayment ID: ' + response.razorpay_payment_id);
      console.error('Payment verification error:', err);
    }
  }
};
