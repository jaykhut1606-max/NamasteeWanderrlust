// ═══════════════════════════════════════════
// Razorpay Checkout Integration
// ═══════════════════════════════════════════

const RAZORPAY_KEY_ID = 'rzp_test_PLACEHOLDER'; // Replace with your test key

const RazorpayCheckout = {
  async createOrder(details) {
    // For now, create booking directly in Supabase (no Edge Function yet)
    // When Razorpay keys are ready, this will call the create-order Edge Function
    const bookingId = crypto.randomUUID();

    // Insert pending booking
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        id: bookingId,
        user_id: Auth.currentUser.id,
        trip_id: details.tripId,
        user_name: details.userName,
        user_email: details.userEmail,
        user_phone: details.userPhone,
        package_type: details.packageType,
        amount_paise: details.amount,
        payment_status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    // Open Razorpay checkout
    this.openCheckout({
      orderId: bookingId, // Will be razorpay_order_id when Edge Function is set up
      amount: details.amount,
      userName: details.userName,
      userEmail: details.userEmail,
      userPhone: details.userPhone,
      tripName: details.tripName,
      bookingId: bookingId,
    });
  },

  openCheckout(options) {
    if (RAZORPAY_KEY_ID === 'rzp_test_PLACEHOLDER') {
      // Simulate successful payment for development
      this.simulatePayment(options);
      return;
    }

    const rzp = new Razorpay({
      key: RAZORPAY_KEY_ID,
      amount: options.amount,
      currency: 'INR',
      name: 'NamasteeWanderrlust',
      description: `${options.tripName} - Booking`,
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
        await this.handleSuccess(response, options.bookingId);
      },
      modal: {
        ondismiss: () => {
          // Payment cancelled
        }
      }
    });
    rzp.open();
  },

  // Development mode: simulate payment
  async simulatePayment(options) {
    // Show a simulated payment confirmation
    const confirmed = confirm(
      `💳 DEVELOPMENT MODE\n\n` +
      `Trip: ${options.tripName}\n` +
      `Amount: ₹${(options.amount / 100).toLocaleString('en-IN')}\n` +
      `Name: ${options.userName}\n\n` +
      `Simulate successful payment?`
    );

    if (confirmed) {
      const fakePaymentId = 'pay_dev_' + Date.now();
      await this.handleSuccess({
        razorpay_payment_id: fakePaymentId,
        razorpay_order_id: options.orderId,
        razorpay_signature: 'dev_signature',
      }, options.bookingId);
    }
  },

  async handleSuccess(response, bookingId) {
    try {
      // Update booking with payment details
      const { error } = await supabase
        .from('bookings')
        .update({
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature,
          payment_status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      if (error) throw error;

      // Show success in modal
      BookingModal.showSuccess({
        bookingId: bookingId,
        paymentId: response.razorpay_payment_id,
      });
    } catch (err) {
      alert('Payment recorded but confirmation failed. Contact support with ID: ' + bookingId);
    }
  }
};
