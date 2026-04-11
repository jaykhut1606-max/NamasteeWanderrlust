// ═══════════════════════════════════════════
// PDF Generation — Itinerary + Receipt
// ═══════════════════════════════════════════

const PDFGenerator = {

  // ─── Helper: add page header ───
  _addHeader(doc, w, margin) {
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
  },

  // ─── Helper: add page footer ───
  _addFooter(doc, w, margin, pageNum) {
    const h = doc.internal.pageSize.getHeight();
    doc.setDrawColor(196, 169, 125);
    doc.line(margin, h - 18, w - margin, h - 18);
    doc.setFontSize(7);
    doc.setTextColor(107, 99, 86);
    doc.text('NamasteeWanderrlust | namasteewanderrlust@gmail.com | 07208301453', margin, h - 12);
    doc.text(`Page ${pageNum}`, w - margin - 12, h - 12);
  },

  // ─── Helper: new page with header ───
  _newPage(doc, w, margin, pageCount) {
    doc.addPage();
    pageCount.value++;
    this._addHeader(doc, w, margin);
    return 55;
  },

  // ─── Helper: check page break ───
  _checkPageBreak(doc, y, needed, w, margin, pageCount) {
    if (y + needed > doc.internal.pageSize.getHeight() - 25) {
      this._addFooter(doc, w, margin, pageCount.value);
      y = this._newPage(doc, w, margin, pageCount);
    }
    return y;
  },

  // ─── Download Munnar Itinerary ───
  downloadItinerary() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const w = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentW = w - margin * 2;
    const pageCount = { value: 1 };
    let y = 20;

    // ═══ PAGE 1: Cover Page ═══
    this._addHeader(doc, w, margin);
    y = 55;

    // Title
    doc.setTextColor(44, 36, 24);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.text('MUNNAR', margin, y);
    y += 10;
    doc.setFontSize(14);
    doc.setTextColor(107, 99, 86);
    doc.text('Escape this summer and plan your long weekend with us', margin, y);
    y += 10;
    doc.setFontSize(16);
    doc.setTextColor(212, 119, 59);
    doc.text('29th April – 02nd May 2026', margin, y);
    y += 4;

    // Divider
    doc.setDrawColor(212, 167, 67);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + 60, y);
    y += 14;

    // 3 Highlights boxes
    const boxW = (contentW - 10) / 3;
    const boxes = [
      { num: '1', title: 'HOTEL C7', desc: 'Luxury 3-star boutique hotel' },
      { num: '2', title: 'MEALS', desc: '4 Breakfast · 3 Lunch · 3 Dinner' },
      { num: '3', title: 'SIGHTSEEING', desc: '22 Activities' },
    ];
    boxes.forEach((box, i) => {
      const bx = margin + i * (boxW + 5);
      doc.setFillColor(237, 232, 220);
      doc.roundedRect(bx, y, boxW, 28, 3, 3, 'F');
      doc.setTextColor(212, 119, 59);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text(box.num, bx + 4, y + 10);
      doc.setTextColor(44, 36, 24);
      doc.setFontSize(10);
      doc.text(box.title, bx + 14, y + 10);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(107, 99, 86);
      doc.text(box.desc, bx + 4, y + 20);
    });
    y += 38;

    // Hotel description
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(42, 123, 142);
    doc.text('Hotel C7', margin, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(44, 36, 24);
    const hotelLines = doc.splitTextToSize('Hotel C7, a luxury 3-star boutique hotel right at the heart of Munnar. Clean spacious rooms with mountain views. Your home base for an unforgettable Munnar experience.', contentW);
    doc.text(hotelLines, margin, y);
    y += hotelLines.length * 5 + 6;

    // Meals summary
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(42, 123, 142);
    doc.text('Meals Included', margin, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(44, 36, 24);
    ['4 Breakfasts', '3 Lunches', '3 Dinners'].forEach(item => {
      doc.text(`■  ${item}`, margin + 4, y);
      y += 5.5;
    });
    y += 6;

    // Pricing box
    doc.setFillColor(237, 232, 220);
    doc.roundedRect(margin, y - 4, contentW, 30, 3, 3, 'F');
    doc.setTextColor(44, 36, 24);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('EXCLUSIVE EARLY BIRD PRICING', margin + 6, y + 4);
    doc.setFontSize(10);
    doc.setTextColor(212, 119, 59);
    doc.text('₹30,010/- Per Person', margin + 6, y + 12);
    doc.setTextColor(107, 99, 86);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Experience paradise as a solo adventurer. (GST Included)', margin + 6, y + 17);
    doc.setTextColor(212, 119, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('₹40,440/- Per Couple', margin + 6, y + 23);
    doc.setTextColor(107, 99, 86);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Indulge in a romantic getaway with shared memories. (GST Included)', margin + 6, y + 28);

    this._addFooter(doc, w, margin, pageCount.value);

    // ═══ PAGE 2: Day 1 ═══
    y = this._newPage(doc, w, margin, pageCount);

    // Day-by-day itinerary
    const days = [
      {
        day: 'Day 1 — April 29',
        title: 'Arrival & Welcome',
        sections: [
          {
            subtitle: 'Meeting Point',
            items: ['We will begin our journey with you from Kochi Airport. Our team will be waiting for you.']
          },
          {
            subtitle: 'Transit',
            items: ['Beautiful scenic ride from Kochi Airport to our hotel through mountain roads.']
          },
          {
            subtitle: 'Hotel Check-In',
            items: ['Check-in at Hotel C7, enjoy delicious lunch and relax at the property with mountain views.']
          },
          {
            subtitle: 'Munnar Free Day',
            items: ['You can enjoy the cultural events in the evening which is optional. For more info you can contact us.']
          },
          {
            subtitle: 'Arrival Guidelines',
            items: ['We recommend arriving at Kochi Airport between 7:00–9:30 AM. If early flights aren\'t available, proceed directly to the hotel — our tour manager will stay in touch.']
          }
        ]
      },
      {
        day: 'Day 2 — April 30',
        title: 'Munnar Full-Day Sightseeing Tour',
        sections: [
          {
            subtitle: 'Tour Overview',
            items: [
              'Start Time: 9:00 AM (Munnar Info Meeting Point)',
              'Duration: Full Day (~90 km travel)',
              'Covers: 11 iconic attractions in one day'
            ]
          },
          {
            subtitle: 'Tour Highlights',
            items: [
              'Explore rolling tea gardens & misty hills',
              'Visit historic estates & scenic viewpoints',
              'Reach Top Station (1700–1800m altitude)',
              'Experience Kerala–Tamil Nadu border views'
            ]
          },
          {
            subtitle: 'Key Attractions',
            items: [
              'Tata Tea Museum',
              'Mattupetty Tea Factory',
              'Photo Point & Shooting Point — stunning viewpoints',
              'Echo Point — hear your voice echo across the valley',
              'Wild Elephant Spot — chance to see elephants in natural habitat',
              'Mattupetty Dam & Kundala Lake',
              'KFDC Flower Garden & Kundala Hill Farms',
              'Top Station (1700–1800m altitude) — Kerala–Tamil Nadu border views'
            ]
          },
          {
            subtitle: 'Why It\'s Special',
            items: [
              'Perfect mix of nature, history & scenic beauty',
              'Covers major Munnar attractions in a single day'
            ]
          }
        ]
      }
    ];

    days.forEach((day) => {
      y = this._checkPageBreak(doc, y, 20, w, margin, pageCount);

      // Day badge
      doc.setFillColor(212, 119, 59);
      doc.roundedRect(margin, y - 4, contentW, 9, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`${day.day} — ${day.title}`, margin + 4, y + 2);
      y += 12;

      day.sections.forEach(section => {
        y = this._checkPageBreak(doc, y, 15, w, margin, pageCount);

        doc.setTextColor(42, 123, 142);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(section.subtitle, margin + 2, y);
        y += 6;

        doc.setTextColor(44, 36, 24);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);

        section.items.forEach(item => {
          y = this._checkPageBreak(doc, y, 8, w, margin, pageCount);
          const lines = doc.splitTextToSize(`•  ${item}`, contentW - 8);
          doc.text(lines, margin + 4, y);
          y += lines.length * 4.5 + 1.5;
        });

        y += 4;
      });
      y += 6;
    });

    // ═══ Day 3: Anakulam ═══
    this._addFooter(doc, w, margin, pageCount.value);
    y = this._newPage(doc, w, margin, pageCount);

    // Day 3 badge
    doc.setFillColor(212, 119, 59);
    doc.roundedRect(margin, y - 4, contentW, 9, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Day 3 — May 1 — Anakulam Wild Elephant Village Tour', margin + 4, y + 2);
    y += 14;

    const day3Sections = [
      {
        subtitle: 'Tour Overview',
        items: [
          'Drive ~43 km from Munnar via Lekshmi Mountain Road in a jeep',
          'Journey through rugged forest trails, rivers & tea estates',
          'Destination: Anakulam — a forest-locked village surrounded by the Western Ghats'
        ]
      },
      {
        subtitle: 'What Makes It Unique',
        items: [
          'Wild elephants roam freely in human-inhabited areas',
          'View herds (calves, tuskers) from ~50 meters distance',
          'A rare blend of wildlife, nature & village life'
        ]
      },
      {
        subtitle: 'Natural Highlights',
        items: [
          'Located between tributaries of Periyar: Idacholayaar & Nallatanniyaar',
          'Amphitheatre-like valley with lush greenery',
          'Ideal for nature lovers, photographers & explorers'
        ]
      },
      {
        subtitle: 'Key Experiences',
        items: [
          'Viripara Viewpoint — clouds, tea estates & winding roads',
          'Viripara Waterfalls — safe bathing in the forest under supervision',
          'Perumankuth Waterfalls — one of Munnar\'s grand waterfalls',
          'Tiger Cave Trek (1-hour forest walk + hanging bridge)',
          'River crossing & optional safe swimming',
          'Jeep safari through off-road terrain',
          'Lunch & interaction with locals — understand forest lifestyle'
        ]
      }
    ];

    day3Sections.forEach(section => {
      y = this._checkPageBreak(doc, y, 15, w, margin, pageCount);

      doc.setTextColor(42, 123, 142);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(section.subtitle, margin + 2, y);
      y += 6;

      doc.setTextColor(44, 36, 24);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);

      section.items.forEach(item => {
        y = this._checkPageBreak(doc, y, 8, w, margin, pageCount);
        const lines = doc.splitTextToSize(`•  ${item}`, contentW - 8);
        doc.text(lines, margin + 4, y);
        y += lines.length * 4.5 + 1.5;
      });
      y += 4;
    });

    // Day 4
    y += 6;
    y = this._checkPageBreak(doc, y, 40, w, margin, pageCount);

    doc.setFillColor(212, 119, 59);
    doc.roundedRect(margin, y - 4, contentW, 9, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Day 4 — May 2 — Departure', margin + 4, y + 2);
    y += 14;

    doc.setTextColor(44, 36, 24);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    ['Leisure morning — enjoy the mountain views one last time', 'Group photos & farewell', 'Check-out & departure transfer', 'Drop at Kochi Airport / Railway Station'].forEach(item => {
      doc.text(`•  ${item}`, margin + 4, y);
      y += 5.5;
    });

    // ═══ Exclusions & Cancellation ═══
    this._addFooter(doc, w, margin, pageCount.value);
    y = this._newPage(doc, w, margin, pageCount);

    // Exclusions
    doc.setTextColor(184, 92, 56);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Exclusions', margin, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(44, 36, 24);
    const exclusions = [
      'Price does not include Lunch on 30th April (Day 2 — sightseeing day)',
      'Flights/trains to and from Kochi (we can assist with bookings on request)',
      'Personal expenses: laundry, telephone calls, room service, tips, portage',
      'Alcoholic beverages & mini bar charges',
      'Travel insurance',
      'Camera fees at attractions',
      'Any other items not mentioned under Inclusions'
    ];
    exclusions.forEach(item => {
      doc.text(`-  ${item}`, margin + 4, y);
      y += 5.5;
    });
    y += 8;

    // Cancellation Policy
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(44, 36, 24);
    doc.text('Package Cancellation Policy', margin, y);
    y += 8;

    // Cancellation boxes
    const cancBoxW = (contentW - 10) / 3;
    const cancItems = [
      { period: 'Till 13 Apr 2026', fee: 'No Cancellation Fee', feeVal: '₹0', color: [59, 107, 58] },
      { period: 'Till 20 Apr 2026', fee: 'Cancellation Fee', feeVal: '₹10,000', color: [212, 167, 67] },
      { period: 'After 21 Apr 2026', fee: 'Non-Refundable', feeVal: '100% charges', color: [184, 92, 56] },
    ];
    cancItems.forEach((item, i) => {
      const bx = margin + i * (cancBoxW + 5);
      doc.setFillColor(...item.color);
      doc.roundedRect(bx, y, cancBoxW, 22, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(item.period, bx + 4, y + 7);
      doc.setFontSize(9);
      doc.text(item.feeVal, bx + 4, y + 14);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text(item.fee, bx + 4, y + 19);
    });
    y += 34;

    // ═══ Terms and Conditions ═══
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(44, 36, 24);
    doc.text('Terms and Conditions', margin, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(68, 60, 48);

    const terms = [
      'Standard check-in time at the hotel is normally 2:00 pm and check-out is 11:00 am. An early check-in, or a late check-out is solely based on the discretion of the hotel.',
      'Double or Twin bed type provided during check-in is at the final discretion of hotel.',
      'The itinerary is fixed and cannot be modified. Transportation shall be provided as per the itinerary and will not be at disposal. For any paid activity which is non-operational due to any unforeseen reason, we will process refund & same should reach the guest within 30 days of processing the refund.',
      'For any activity which is complimentary and not charged to Namastee Wanderrlust & guest, no refund will be processed.',
      'AC will not be functional anywhere in cool or hilly areas.',
      'In case of unavailability in the listed hotels, arrangement for an alternate accommodation will be made in a hotel of similar standard.',
      'If your flights involve a combination of different airlines, you may have to collect your luggage on arrival at the connecting hub and register it again while checking in for the onward journey to your destination.',
      'Booking rates are subject to change without prior notice.',
      'Airline seats and hotel rooms are subject to availability at the time of booking.',
      'Pricing of the booking is based on the age of the passengers. Please make sure you enter the correct age of passengers at the time of booking. Passengers furnishing incorrect age details may incur penalty at the time of travelling.',
      'In case your package needs to be cancelled due to any natural calamity, weather conditions etc. Namastee Wanderrlust shall strive to give you the maximum possible refund subject to the agreement made with our trade partners/vendors.',
      'Certain hotels may ask for a security deposit during check-in, which is refundable at check-out subject to the hotel\'s policy.',
      'Namastee Wanderrlust reserves the right to modify the itinerary at any point, due to reasons including but not limited to: Force Majeure events, strikes, fairs, festivals, weather conditions, traffic problems, overbooking of hotels/flights, cancellation/re-routing of flights, closure of/entry restrictions at a place of visit, etc. While we will do our best to make suitable alternate arrangements, we would not be held liable for any refunds/compensation claims arising out of this.',
      'Due to its climatic conditions, Munnar in Kerala does not have AC rooms.',
      'Most of the Hotels in Munnar are located far away from the city centre and local market.',
      'The booking price does not include: Expenses of personal nature, such as laundry, telephone calls, room service, alcoholic beverages, mini bar charges, tips, portage, camera fees etc.',
      'Any other items not mentioned under Inclusions are not included in the cost of the booking.',
      'Cost of deviation and cost of extension of the validity on your ticket is not included.',
      'For queries regarding cancellations and refunds, please refer to our Cancellation Policy.',
      'Disputes, if any, shall be subject to the exclusive jurisdiction of the courts in New Delhi.'
    ];

    terms.forEach((term, i) => {
      y = this._checkPageBreak(doc, y, 12, w, margin, pageCount);
      const lines = doc.splitTextToSize(`${i + 1}. ${term}`, contentW - 6);
      doc.text(lines, margin + 2, y);
      y += lines.length * 3.8 + 2;
    });

    // ═══ Final Footer: Contact ═══
    y += 6;
    y = this._checkPageBreak(doc, y, 30, w, margin, pageCount);

    doc.setDrawColor(212, 167, 67);
    doc.setLineWidth(0.5);
    doc.line(margin, y, w - margin, y);
    y += 8;

    doc.setFillColor(26, 26, 26);
    doc.roundedRect(margin, y - 3, contentW, 25, 3, 3, 'F');
    doc.setTextColor(245, 240, 232);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('NamasteeWanderrlust', margin + 6, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(212, 119, 59);
    doc.text('Email: namasteewanderrlust@gmail.com  |  Contact: 07208301453', margin + 6, y + 12);
    doc.text('DM us on Instagram @namasteewanderrlust', margin + 6, y + 17);

    // Add footers to all pages
    this._addFooter(doc, w, margin, pageCount.value);

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
    doc.text('PAYMENT CONFIRMED', margin + 4, y + 1);
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
