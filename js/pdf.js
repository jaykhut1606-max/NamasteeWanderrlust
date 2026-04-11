// ═══════════════════════════════════════════
// PDF Generation — Itinerary + Receipt
// ═══════════════════════════════════════════

const PDFGenerator = {

  // ─── Download Munnar Itinerary ───
  downloadItinerary() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const w = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentW = w - margin * 2;
    let y = 20;

    // Header bar
    doc.setFillColor(26, 26, 26);
    doc.rect(0, 0, w, 40, 'F');
    doc.setTextColor(245, 240, 232);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('NamasteeWanderrlust', margin, 18);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Travel the World with Your Favorite Influencer', margin, 28);
    doc.setTextColor(212, 119, 59);
    doc.text('www.namasteewanderrlust.com', margin, 35);

    y = 55;

    // Title
    doc.setTextColor(44, 36, 24);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.text('Munnar Trip Itinerary', margin, y);
    y += 10;

    doc.setFontSize(12);
    doc.setTextColor(107, 99, 86);
    doc.text('Kerala, India  |  April 29 – May 2, 2026  |  4 Days', margin, y);
    y += 4;

    // Divider
    doc.setDrawColor(212, 167, 67);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + 60, y);
    y += 12;

    // Pricing
    doc.setFillColor(237, 232, 220);
    doc.roundedRect(margin, y - 4, contentW, 22, 3, 3, 'F');
    doc.setTextColor(44, 36, 24);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Per Person: ₹30,010 (Incl. GST)', margin + 6, y + 5);
    doc.text('Per Couple: ₹40,440 (Incl. GST)', margin + 6, y + 13);
    y += 28;

    // Day-by-day
    const days = [
      {
        day: 'Day 1 — April 29',
        title: 'Arrival & Welcome',
        items: [
          'Meeting Point: Kochi Airport — our team will be waiting for you',
          'Recommended arrival: 7:00–9:30 AM (if early flights unavailable, proceed to hotel)',
          'Scenic drive from Kochi Airport to Munnar through mountain roads',
          'Check-in at Hotel C7 — luxury 3-star boutique hotel in the heart of Munnar',
          'Enjoy delicious lunch & relax at the property with mountain views',
          'Optional: Enjoy cultural events in the evening (contact us for details)'
        ]
      },
      {
        day: 'Day 2 — April 30',
        title: 'Munnar Full-Day Sightseeing Tour',
        items: [
          'Start Time: 9:00 AM from Munnar Info Meeting Point',
          'Full-day tour covering ~90 km & 11 iconic attractions',
          'Tata Tea Museum & Mattupetty Tea Factory',
          'Photo Point & Shooting Point — stunning viewpoints',
          'Echo Point — hear your voice echo across the valley',
          'Wild Elephant Spot — chance to see elephants in natural habitat',
          'Mattupetty Dam & Kundala Lake',
          'KFDC Flower Garden & Kundala Hill Farms',
          'Reach Top Station (1700–1800m altitude) — Kerala–Tamil Nadu border views',
          'Rolling tea gardens, misty hills & historic estates throughout the day'
        ]
      },
      {
        day: 'Day 3 — May 1',
        title: 'Anakulam Wild Elephant Village Tour',
        items: [
          'Jeep safari ~43 km from Munnar via Lekshmi Mountain Road',
          'Journey through rugged forest trails, rivers & tea estates',
          'Destination: Anakulam — forest-locked village in the Western Ghats',
          'Wild elephants roaming freely — view herds from ~50 meters',
          'Viripara Viewpoint — clouds, tea estates & winding roads',
          'Viripara Waterfalls — safe bathing in the forest under supervision',
          'Perumankuth Waterfalls — one of Munnar\'s grand waterfalls',
          'Tiger Cave Trek (1-hour forest walk + hanging bridge)',
          'River crossing & optional safe swimming',
          'Lunch & interaction with locals — understand forest lifestyle'
        ]
      },
      {
        day: 'Day 4 — May 2',
        title: 'Departure',
        items: [
          'Leisure morning — enjoy the mountain views one last time',
          'Group photos & farewell',
          'Check-out & departure transfer',
          'Drop at Kochi Airport / Railway Station'
        ]
      }
    ];

    days.forEach((day, index) => {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      // Day badge
      doc.setFillColor(212, 119, 59);
      doc.roundedRect(margin, y - 4, contentW, 8, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`${day.day} — ${day.title}`, margin + 4, y + 1);
      y += 10;

      doc.setTextColor(44, 36, 24);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);

      day.items.forEach(item => {
        doc.text(`•  ${item}`, margin + 4, y);
        y += 5.5;
      });

      y += 6;
    });

    // Accommodation & Meals
    if (y > 220) { doc.addPage(); y = 20; }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(42, 123, 142);
    doc.text('Accommodation & Meals', margin, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(44, 36, 24);
    const accomDetails = [
      'Hotel C7 — Luxury 3-star boutique hotel in the heart of Munnar',
      'Clean, spacious rooms with mountain views',
      '4 Breakfasts, 3 Lunches, 3 Dinners included',
      '22 sightseeing activities covered'
    ];
    accomDetails.forEach(item => {
      doc.text(`•  ${item}`, margin + 4, y);
      y += 5.5;
    });

    y += 6;

    // Inclusions
    if (y > 220) { doc.addPage(); y = 20; }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(59, 107, 58);
    doc.text('What\'s Included', margin, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(44, 36, 24);
    const inclusions = [
      'Premium accommodation at Hotel C7 (3 nights)',
      'Meals: 4 Breakfasts, 3 Lunches, 3 Dinners',
      'Kochi Airport pickup & drop-off',
      'All sightseeing & activities as per itinerary (22 activities)',
      'Full-day Munnar sightseeing tour (~90 km, 11 attractions)',
      'Anakulam Wild Elephant Village jeep safari',
      'Experienced tour manager & local guides',
      'All local transportation during the trip'
    ];
    inclusions.forEach(item => {
      doc.text(`+  ${item}`, margin + 4, y);
      y += 5.5;
    });

    y += 6;
    doc.setTextColor(184, 92, 56);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('What\'s Not Included', margin, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(44, 36, 24);
    const exclusions = [
      'Flights/trains to and from Kochi (we can assist with bookings on request)',
      'Lunch on 30th April (Day 2 — sightseeing day)',
      'Personal expenses: laundry, phone calls, room service, tips, portage',
      'Alcoholic beverages & mini bar charges',
      'Travel insurance',
      'Camera fees at attractions',
      'Any activities not mentioned in the itinerary'
    ];
    exclusions.forEach(item => {
      doc.text(`-  ${item}`, margin + 4, y);
      y += 5.5;
    });

    // Cancellation Policy
    y += 6;
    if (y > 230) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(44, 36, 24);
    doc.text('Cancellation Policy', margin, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const cancellation = [
      'Till 13 Apr 2026 — No cancellation fee',
      'Till 20 Apr 2026 — Cancellation fee: INR 10,000',
      'After 21 Apr 2026 — Non-refundable (100% charges)'
    ];
    cancellation.forEach(item => {
      doc.text(`•  ${item}`, margin + 4, y);
      y += 5.5;
    });

    // Footer
    y += 10;
    doc.setDrawColor(196, 169, 125);
    doc.line(margin, y, w - margin, y);
    y += 6;
    doc.setFontSize(8);
    doc.setTextColor(107, 99, 86);
    doc.text('NamasteeWanderrlust | Travel the World with Your Favorite Influencer', margin, y);
    doc.text('Email: namasteewanderrlust@gmail.com | Contact: 07208301453', margin, y + 4);
    doc.text('DM us on Instagram @namasteewanderrlust', margin, y + 8);

    doc.save('NamasteeWanderrlust-Munnar-Itinerary.pdf');
  },

  // ─── Download Payment Receipt ───
  downloadReceipt(bookingData) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const w = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 20;

    // Header
    doc.setFillColor(26, 26, 26);
    doc.rect(0, 0, w, 35, 'F');
    doc.setTextColor(245, 240, 232);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('NamasteeWanderrlust', margin, 16);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Booking Confirmation & Receipt', margin, 24);
    doc.setTextColor(212, 119, 59);
    doc.setFontSize(8);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}`, margin, 30);

    y = 50;

    // Success badge
    doc.setFillColor(59, 107, 58);
    doc.roundedRect(margin, y - 5, 50, 10, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('✓ PAYMENT CONFIRMED', margin + 4, y + 1);
    y += 16;

    // Booking details
    const details = [
      ['Booking ID', bookingData.bookingId],
      ['Payment ID', bookingData.paymentId],
      ['Trip', bookingData.tripName],
      ['Package', bookingData.packageLabel],
      ['Amount Paid', bookingData.amountDisplay],
      ['Traveler Name', bookingData.userName],
      ['Email', bookingData.userEmail],
      ['Phone', bookingData.userPhone],
      ['Booking Date', new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })],
    ];

    doc.setFontSize(10);
    details.forEach(([label, value]) => {
      doc.setTextColor(107, 99, 86);
      doc.setFont('helvetica', 'normal');
      doc.text(label, margin, y);
      doc.setTextColor(44, 36, 24);
      doc.setFont('helvetica', 'bold');
      doc.text(value || '-', margin + 55, y);
      y += 8;
    });

    y += 10;
    doc.setDrawColor(196, 169, 125);
    doc.line(margin, y, w - margin, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(107, 99, 86);
    doc.text('This is a computer-generated receipt and does not require a signature.', margin, y);
    doc.text('For support, DM us on Instagram @namasteewanderrlust', margin, y + 5);
    doc.text('Cancellation policy: Free cancellation up to 30 days before departure.', margin, y + 10);

    doc.save(`NamasteeWanderrlust-Receipt-${bookingData.bookingId.slice(0, 8)}.pdf`);
  }
};
