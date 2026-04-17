/* ═══════════════════════════════════════════════════════════════════════════
 * NamasteeWanderrlust — Cinematic GSAP Motion System  (v3)
 * ───────────────────────────────────────────────────────────────────────────
 * Philosophy:
 *   · Every animation earns its place. No decoration for decoration's sake.
 *   · Transforms + opacity only on the hot paths. Zero layout thrashing. 60fps target.
 *   · Choreographed, not chaotic. Each section has a beat structure.
 *   · Respects prefers-reduced-motion. Always.
 *
 * v3 changes (performance + calm):
 *   · REMOVED flight-path SVG trail (was repainting a large SVG per frame)
 *   · REMOVED custom cursor (mix-blend-mode: multiply forces whole-page repaints)
 *   · REMOVED hero carousel scale tween (GPU cost on a large <video>/image)
 *   · ADDED ambient cloud layer — three soft blobs drift on a single tween each
 *   · Plane still follows a gentle sine path and banks into turns, but the
 *     path element is in-memory only (no rendering). Cheapest possible.
 *   · Influencer + reel marquees use an injected CSS rule so the nested track
 *     does not break the original card widths.
 * ═════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // Fail gracefully if GSAP didn't load
  if (typeof gsap === 'undefined') {
    console.warn('[animations] GSAP not loaded — skipping cinematic motion.');
    return;
  }

  // Suppress known-harmless GSAP warning: "scale not eligible for reset".
  // Fires when a scale fromTo/to collides with a paused quickTo that owns
  // scale (e.g. hero-stagger-5 + button hover quickTo). No user impact.
  // See: https://gsap.com/community/forums/topic/39204-not-eligible-for-reset/
  const __origWarn = console.warn;
  console.warn = function () {
    if (arguments.length && typeof arguments[0] === 'string' &&
        arguments[0].indexOf('not eligible for reset') !== -1) return;
    return __origWarn.apply(console, arguments);
  };

  /* ─────────────────────────────────────────────────────────────────────────
   * 1. REGISTER PLUGINS + CUSTOM EASES + DEFAULTS
   * ───────────────────────────────────────────────────────────────────────── */
  if (typeof ScrollTrigger !== 'undefined') gsap.registerPlugin(ScrollTrigger);
  if (typeof CustomEase !== 'undefined') {
    CustomEase.create('brand-out', '0.16, 1, 0.3, 1');        // Apple-style expressive out
    CustomEase.create('brand-pop', 'M0,0 C0.2,0 0.1,1.15 1,1'); // Soft overshoot
    CustomEase.create('brand-scrub', '0.25, 0.1, 0.25, 1');
  }

  gsap.defaults({
    duration: 0.9,
    ease: typeof CustomEase !== 'undefined' ? 'brand-out' : 'power3.out'
    // overwrite intentionally unset — applied per-tween where needed to avoid
    // "scale not eligible for reset" warnings when quickTo tweens overlap reveals.
  });

  /* ─────────────────────────────────────────────────────────────────────────
   * 2. HELPERS — text splitter + price parser
   * ───────────────────────────────────────────────────────────────────────── */
  // Split element's text into per-character spans wrapped in overflow:hidden parents.
  // Returns the array of inner .split-char spans that GSAP will animate.
  function splitToChars(el) {
    if (!el) return [];
    // Preserve original aria label + style
    const text = el.textContent;
    const color = getComputedStyle(el).color;
    el.setAttribute('aria-label', text);
    el.textContent = '';
    const chars = [];
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const wrap = document.createElement('span');
      wrap.style.cssText = 'display:inline-block;overflow:hidden;vertical-align:bottom;line-height:1;';
      wrap.setAttribute('aria-hidden', 'true');
      const inner = document.createElement('span');
      inner.className = 'split-char';
      inner.style.cssText = 'display:inline-block;will-change:transform;color:' + color + ';';
      inner.textContent = ch === ' ' ? '\u00A0' : ch;
      wrap.appendChild(inner);
      el.appendChild(wrap);
      chars.push(inner);
    }
    return chars;
  }

  // Parse "₹30,010" → 30010 ; returns { prefix, number, suffix } so we can rebuild
  function parsePrice(str) {
    const match = str.match(/^(\D*)([\d,]+)(.*)$/);
    if (!match) return null;
    return {
      prefix: match[1],
      number: parseInt(match[2].replace(/,/g, ''), 10),
      suffix: match[3]
    };
  }

  /* ─────────────────────────────────────────────────────────────────────────
   * 3. NEUTRALIZE LEGACY CSS REVEAL + HERO STAGGER SYSTEM
   * ───────────────────────────────────────────────────────────────────────── */
  const legacyRevealSelector = '.fade-up, .fade-left, .fade-right, .fade-scale, .founder-reveal';
  const legacyRevealEls = document.querySelectorAll(legacyRevealSelector);
  legacyRevealEls.forEach((el) => el.classList.add('visible'));

  const heroStaggerEls = document.querySelectorAll('.hero-stagger');
  heroStaggerEls.forEach((el) => {
    el.style.animation = 'none';
    el.style.opacity = '0';
  });

  // Kill CSS transitions so GSAP owns motion 100%
  const killTransitionStyle = document.createElement('style');
  killTransitionStyle.setAttribute('data-gsap-override', 'true');
  killTransitionStyle.textContent = `
    .fade-up, .fade-left, .fade-right, .fade-scale, .founder-reveal,
    .hero-stagger {
      transition: none !important;
      animation: none !important;
    }
  `;
  document.head.appendChild(killTransitionStyle);

  /* ─────────────────────────────────────────────────────────────────────────
   * 4. MATCH MEDIA — responsive + accessibility variants
   * ───────────────────────────────────────────────────────────────────────── */
  const mm = gsap.matchMedia();

  mm.add(
    {
      isDesktop: '(min-width: 900px) and (prefers-reduced-motion: no-preference)',
      isMobile: '(max-width: 899px) and (prefers-reduced-motion: no-preference)',
      reduceMotion: '(prefers-reduced-motion: reduce)'
    },
    (context) => {
      const { isDesktop, isMobile, reduceMotion } = context.conditions;

      /* ═══ REDUCED MOTION: show everything statically ═══ */
      if (reduceMotion) {
        gsap.set([...heroStaggerEls, ...legacyRevealEls], {
          autoAlpha: 1,
          clearProps: 'transform'
        });
        return () => {};
      }

      /* ─────────────────────────────────────────────────────────────────────
       * 4a. HERO LOAD SEQUENCE — with split-text H1 char reveal
       * ─────────────────────────────────────────────────────────────────── */
      // Split the two colored spans inside H1 into characters
      const h1Spans = document.querySelectorAll('.hero-stagger-2 > span');
      let allChars = [];
      h1Spans.forEach((span) => {
        const chars = splitToChars(span);
        allChars = allChars.concat(chars);
      });

      // Pre-hide hero stagger children (but not H1 — it's the wrapper of chars)
      gsap.set(heroStaggerEls, { autoAlpha: 0, y: isDesktop ? 34 : 22 });
      // H1 container itself should stay visible so chars inside can tween
      gsap.set('.hero-stagger-2', { autoAlpha: 1, y: 0 });
      // Hide each char below its mask line, with a micro rotation
      gsap.set(allChars, { yPercent: 120, rotationZ: 6 });

      const heroTl = gsap.timeline({
        defaults: { ease: 'brand-out', duration: 1.0 },
        delay: 0.15
      });

      // Beat 1: Logo badge
      heroTl.to('.hero-stagger-1', { autoAlpha: 1, y: 0, duration: 0.8 }, 0);

      // Beat 2: H1 characters mask-reveal from below, with expressive rotation fall
      heroTl.to(
        allChars,
        {
          yPercent: 0,
          rotationZ: 0,
          duration: 1.1,
          stagger: 0.025,
          ease: 'expo.out'
        },
        0.2
      );

      // Beat 3: Amber divider chip scaleX-in
      heroTl.fromTo(
        '.hero-stagger-3',
        { autoAlpha: 0, y: 16, scaleX: 0.4, transformOrigin: 'center center' },
        { autoAlpha: 1, y: 0, scaleX: 1, duration: 0.9 },
        0.55
      );

      // Beat 4: Subtitle
      heroTl.to('.hero-stagger-4', { autoAlpha: 1, y: 0, duration: 0.85 }, 0.7);

      // Beat 5: CTA pair
      heroTl.fromTo(
        '.hero-stagger-5',
        { autoAlpha: 0, y: 18, scale: 0.96 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.8 },
        0.85
      );

      // Beat 6: Trust line whisper
      heroTl.to('.hero-stagger-6', { autoAlpha: 1, y: 0, duration: 0.7 }, 1.05);

      /* ─────────────────────────────────────────────────────────────────────
       * 4b. HERO BACKGROUND — cinematic filter bloom on first paint
       * ─────────────────────────────────────────────────────────────────── */
      const heroCarousel = document.getElementById('heroCarousel');
      if (heroCarousel) {
        gsap.fromTo(
          heroCarousel,
          { filter: 'brightness(0.72) saturate(0.85)' },
          {
            filter: 'brightness(1) saturate(1)',
            duration: 1.8,
            ease: 'power2.out',
            immediateRender: true
          }
        );
      }

      /* ─────────────────────────────────────────────────────────────────────
       * 4c. HERO SCROLL PARALLAX — text drifts up faster, bg zooms slightly
       *     Gives depth when leaving the hero. Desktop only (mobile = distracting).
       * ─────────────────────────────────────────────────────────────────── */
      const heroSection = document.querySelector('section.relative.h-screen, .hero-slide')
        ? document.querySelector('section.relative.h-screen') ||
          document.querySelector('.hero-slide').closest('section')
        : null;

      if (heroSection && isDesktop) {
        const heroContent = heroSection.querySelector(
          '.absolute.inset-0.z-10, .relative.z-20, .flex.flex-col.items-center.justify-center'
        );
        // Parallax: content rises ~80px, fades out — text only, not the heavy image.
        if (heroContent) {
          gsap.to(heroContent, {
            y: -80,
            autoAlpha: 0.55,
            ease: 'none',
            scrollTrigger: {
              trigger: heroSection,
              start: 'top top',
              end: 'bottom top',
              scrub: 0.5
            }
          });
        }
        // NOTE: heroCarousel scale tween removed in v3 — the GPU cost of scaling
        // a full-viewport <video>/<img> on every scroll tick was a key source of jank.
      }

      /* ─────────────────────────────────────────────────────────────────────
       * 4d. SECTION HEADER REVEAL PATTERN (unchanged from v1)
       * ─────────────────────────────────────────────────────────────────── */
      const sectionHeaders = gsap.utils.toArray(
        'section > div > .text-center.mb-16, section > div > .text-center.mb-12'
      );
      sectionHeaders.forEach((header) => {
        const eyebrow = header.querySelector('span.font-body, .font-body.uppercase');
        const heading = header.querySelector('h2');
        const sub = header.querySelector('p');
        const divider = header.querySelector('div.flex.items-center');

        const targets = [eyebrow, heading, divider, sub].filter(Boolean);
        if (!targets.length) return;

        header.dataset.gsapHandled = '1';
        gsap.set(header, { autoAlpha: 1, y: 0 });
        gsap.set(targets, { autoAlpha: 0, y: 30 });

        ScrollTrigger.create({
          trigger: header,
          start: 'top 82%',
          once: true,
          onEnter: () => {
            gsap.to(targets, {
              autoAlpha: 1,
              y: 0,
              duration: 0.95,
              stagger: 0.1,
              ease: 'brand-out'
            });
          }
        });
      });

      /* ─────────────────────────────────────────────────────────────────────
       * 4e. TRIP CARDS — clip-path reveal + 3D tilt + price count-up
       * ─────────────────────────────────────────────────────────────────── */
      const tripCards = gsap.utils.toArray('.trip-card');
      if (tripCards.length) {
        // Reveal tweens intentionally do NOT touch scale — scale is owned by the
        // per-card quickTo tilt system. Animating scale here triggered a noisy
        // "scale not eligible for reset" warning from GSAP's overwrite resolver.
        gsap.set(tripCards, {
          autoAlpha: 0,
          y: 60,
          clipPath: 'inset(0% 0% 100% 0%)' // hidden from bottom
        });

        ScrollTrigger.batch(tripCards, {
          start: 'top 88%',
          once: true,
          onEnter: (batch) => {
            gsap.to(batch, {
              autoAlpha: 1,
              y: 0,
              clipPath: 'inset(0% 0% 0% 0%)', // wipes up from bottom
              duration: 1.1,
              stagger: 0.14,
              ease: 'brand-out'
            });
          }
        });

        // Per-card: 3D tilt hover (desktop) + price count-up (all)
        tripCards.forEach((card) => {
          // --- Price count-up on scroll-in ---
          const priceEls = card.querySelectorAll(
            '.font-display.font-bold.text-amber, .font-display.font-bold.text-warm-brown, .font-display.font-bold.text-sunset'
          );
          priceEls.forEach((priceEl) => {
            // Only count-up if it looks like a monetary value (starts with ₹)
            const text = priceEl.textContent.trim();
            if (!text.startsWith('₹')) return;
            const parsed = parsePrice(text);
            if (!parsed || parsed.number < 100) return; // skip tiny numbers

            const counter = { val: 0 };
            const suffix = parsed.suffix; // may be empty
            priceEl.textContent = parsed.prefix + '0' + suffix;

            ScrollTrigger.create({
              trigger: priceEl,
              start: 'top 85%',
              once: true,
              onEnter: () => {
                gsap.to(counter, {
                  val: parsed.number,
                  duration: 1.6,
                  ease: 'power2.out',
                  onUpdate: () => {
                    const formatted = Math.round(counter.val).toLocaleString('en-IN');
                    priceEl.textContent = parsed.prefix + formatted + suffix;
                  }
                });
              }
            });
          });

          // --- 3D tilt hover (desktop only) ---
          // Perf: will-change is toggled on mouseenter/mouseleave so the browser
          // only promotes layers while the user is actually hovering.
          if (isDesktop) {
            const img = card.querySelector('.trip-img');
            card.style.transformStyle = 'preserve-3d';
            card.style.perspective = '1000px';

            const rotXTo = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power3' });
            const rotYTo = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power3' });
            const imgXTo = img ? gsap.quickTo(img, 'x', { duration: 0.7, ease: 'power3' }) : null;
            const imgYTo = img ? gsap.quickTo(img, 'y', { duration: 0.7, ease: 'power3' }) : null;
            const scaleTo = gsap.quickTo(card, 'scale', { duration: 0.5, ease: 'power3' });

            const maxTilt = 5;
            const maxImgShift = 8;

            card.addEventListener('mousemove', (e) => {
              const rect = card.getBoundingClientRect();
              const px = (e.clientX - rect.left) / rect.width;
              const py = (e.clientY - rect.top) / rect.height;
              rotYTo((px - 0.5) * 2 * maxTilt);
              rotXTo((0.5 - py) * 2 * maxTilt);
              if (imgXTo) imgXTo((px - 0.5) * 2 * maxImgShift);
              if (imgYTo) imgYTo((py - 0.5) * 2 * maxImgShift);
            });
            card.addEventListener('mouseenter', () => {
              if (img) img.style.willChange = 'transform';
              card.style.willChange = 'transform';
              scaleTo(1.015);
            });
            card.addEventListener('mouseleave', () => {
              rotXTo(0);
              rotYTo(0);
              scaleTo(1);
              if (imgXTo) imgXTo(0);
              if (imgYTo) imgYTo(0);
              // Clear will-change after animation completes (~0.7s)
              setTimeout(() => {
                if (img) img.style.willChange = 'auto';
                card.style.willChange = 'auto';
              }, 750);
            });
          }
        });
      }

      /* ─────────────────────────────────────────────────────────────────────
       * 4f. DESTINATION MARQUEE — infinite typographic ticker
       * ─────────────────────────────────────────────────────────────────── */
      const destMarqueeTrack = document.querySelector('.destination-marquee .marquee-track');
      if (destMarqueeTrack && !destMarqueeTrack.dataset.gsapMarqueeReady) {
        // Idempotency guard: mark so this block never runs twice (matchMedia re-eval safety)
        destMarqueeTrack.dataset.gsapMarqueeReady = '1';
        // Duplicate children once for seamless loop
        const originalItems = Array.from(destMarqueeTrack.children);
        originalItems.forEach((item) => {
          const clone = item.cloneNode(true);
          clone.setAttribute('aria-hidden', 'true');
          destMarqueeTrack.appendChild(clone);
        });

        // xPercent -50 loops perfectly because we duplicated exactly once
        const destTween = gsap.to(destMarqueeTrack, {
          xPercent: -50,
          duration: 40,
          ease: 'none',
          repeat: -1
        });

        // Subtle pause on hover for readability
        const destSection = destMarqueeTrack.closest('.destination-marquee');
        if (destSection && isDesktop) {
          destSection.addEventListener('mouseenter', () =>
            gsap.to(destTween, { timeScale: 0.2, duration: 0.5, overwrite: true })
          );
          destSection.addEventListener('mouseleave', () =>
            gsap.to(destTween, { timeScale: 1, duration: 0.5, overwrite: true })
          );
        }
      }

      /* ─────────────────────────────────────────────────────────────────────
       * 4g. HOW IT WORKS — dashed connector line scrubs + step pops
       * ─────────────────────────────────────────────────────────────────── */
      const aboutSection = document.getElementById('about');
      if (aboutSection) {
        const connector = aboutSection.querySelector('div.hidden.md\\:block.absolute');
        const stepNumbers = aboutSection.querySelectorAll('.step-number');
        const stepIconCards = aboutSection.querySelectorAll('.w-20.h-20.mx-auto');

        if (connector && isDesktop) {
          gsap.set(connector, { scaleX: 0, transformOrigin: 'left center' });
          gsap.to(connector, {
            scaleX: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: aboutSection,
              start: 'top 70%',
              end: 'center 50%',
              scrub: 1
            }
          });
        }

        if (stepNumbers.length) {
          gsap.set(stepNumbers, { autoAlpha: 0, scale: 0.4 });
          ScrollTrigger.create({
            trigger: aboutSection,
            start: 'top 75%',
            once: true,
            onEnter: () => {
              gsap.to(stepNumbers, {
                autoAlpha: 1,
                scale: 1,
                duration: 0.7,
                stagger: 0.12,
                ease: 'back.out(1.8)'
              });
            }
          });
        }

        if (stepIconCards.length) {
          gsap.set(stepIconCards, { autoAlpha: 0, y: 24 });
          ScrollTrigger.create({
            trigger: aboutSection,
            start: 'top 75%',
            once: true,
            onEnter: () => {
              gsap.to(stepIconCards, {
                autoAlpha: 1,
                y: 0,
                duration: 0.85,
                stagger: 0.12,
                delay: 0.15,
                ease: 'brand-out'
              });
            }
          });
        }
      }

      /* ─────────────────────────────────────────────────────────────────────
       * 4h. INFLUENCERS — hands-off (matches live server 1:1)
       *     The page's own inline IIFE (index.html) clones the 5 cards into 10
       *     for an infinite horizontal auto-scroll carousel. Any gsap.set() on
       *     the originals here gets copied onto the clones (cloneNode preserves
       *     inline styles), leaving the clones permanently hidden and breaking
       *     the layout. Solution: don't touch these cards. The legacy
       *     `.visible` class added in Section 3 already keeps them on-screen.
       * ─────────────────────────────────────────────────────────────────── */

      /* ─────────────────────────────────────────────────────────────────────
       * 4i. FOUNDERS — split reveal
       * ─────────────────────────────────────────────────────────────────── */
      const founderReveals = gsap.utils.toArray('.founder-reveal');
      founderReveals.forEach((el, i) => {
        const fromX = i % 2 === 0 ? -40 : 40;
        gsap.set(el, { autoAlpha: 0, x: fromX, y: 30 });
        ScrollTrigger.create({
          trigger: el,
          start: 'top 82%',
          once: true,
          onEnter: () => {
            gsap.to(el, {
              autoAlpha: 1,
              x: 0,
              y: 0,
              duration: 1.1,
              ease: 'brand-out'
            });
          }
        });
      });

      /* ─────────────────────────────────────────────────────────────────────
       * 4j. REEL CARDS — INFINITE MARQUEE (same pattern as influencers)
       *     Keeps card size identical to the original, removes hover-scale
       *     that caused visual size drift, auto-scrolls continuously.
       * ─────────────────────────────────────────────────────────────────── */
      const firstReel = document.querySelector('.reel-card');
      const reelContainer = firstReel ? firstReel.parentElement : null;
      if (reelContainer && !reelContainer.dataset.gsapMarqueeReady) {
        // Idempotency guard: prevent double-wrap if matchMedia re-evaluates
        reelContainer.dataset.gsapMarqueeReady = '1';
        const originalReels = Array.from(reelContainer.children);
        if (originalReels.length >= 2) {
          // Wrap cards in an inner track (preserves each card's original w-[280px]/w-[320px])
          const track = document.createElement('div');
          track.className = 'reel-marquee-track flex gap-5';
          track.style.cssText = 'width: max-content; will-change: transform;';
          originalReels.forEach((c) => track.appendChild(c));

          // Reset container to a masked viewport
          reelContainer.classList.remove(
            'overflow-x-auto',
            'snap-x',
            'snap-mandatory',
            '-mx-6',
            'px-6',
            'pb-6',
            'flex',
            'gap-5'
          );
          reelContainer.style.cssText +=
            ';overflow:hidden;padding:0 0 1.5rem 0;margin:0;position:relative;width:100%;';
          reelContainer.appendChild(track);

          // Duplicate once for seamless loop — preserve onclick on clones so any visible card plays
          Array.from(track.children).forEach((c) => {
            const clone = c.cloneNode(true);
            clone.setAttribute('aria-hidden', 'true');
            track.appendChild(clone);
          });

          // Re-bind click on cloned reels (cloneNode with "true" keeps inline onclick handlers,
          // but attaching again is harmless and ensures playReel() is reachable).
          track.querySelectorAll('.reel-card[data-reel-url]').forEach((card) => {
            card.addEventListener('click', () => {
              if (typeof window.playReel === 'function') window.playReel(card);
            });
          });

          const allReels = track.querySelectorAll('.reel-card');
          gsap.set(allReels, { autoAlpha: 0, y: 40 }); // NO scale — that caused the irregular-size flash

          ScrollTrigger.create({
            trigger: reelContainer,
            start: 'top 85%',
            once: true,
            onEnter: () => {
              gsap.to(allReels, {
                autoAlpha: 1,
                y: 0,
                duration: 0.9,
                stagger: 0.06,
                ease: 'brand-out',
                onComplete: () => {
                  const reelMarquee = gsap.to(track, {
                    xPercent: -50,
                    duration: originalReels.length * 6, // ~6s per card
                    ease: 'none',
                    repeat: -1
                  });
                  if (isDesktop) {
                    reelContainer.addEventListener('mouseenter', () =>
                      gsap.to(reelMarquee, { timeScale: 0, duration: 0.4, overwrite: true })
                    );
                    reelContainer.addEventListener('mouseleave', () =>
                      gsap.to(reelMarquee, { timeScale: 1, duration: 0.4, overwrite: true })
                    );
                  }
                }
              });
            }
          });

          // Soft gradient edge fades (section bg is warm-beige)
          const reelFadeL = document.createElement('div');
          reelFadeL.style.cssText =
            'position:absolute;top:0;bottom:0;left:0;width:60px;background:linear-gradient(to right, #E8DDC9, transparent);pointer-events:none;z-index:2;';
          const reelFadeR = document.createElement('div');
          reelFadeR.style.cssText =
            'position:absolute;top:0;bottom:0;right:0;width:60px;background:linear-gradient(to left, #E8DDC9, transparent);pointer-events:none;z-index:2;';
          reelContainer.appendChild(reelFadeL);
          reelContainer.appendChild(reelFadeR);
        }
      }

      /* ─────────────────────────────────────────────────────────────────────
       * 4k. REMAINING .fade-up ELEMENTS — generic batch reveal
       * ─────────────────────────────────────────────────────────────────── */
      const remainingReveals = gsap.utils.toArray(legacyRevealSelector).filter((el) => {
        return (
          !el.classList.contains('trip-card') &&
          !el.classList.contains('influencer-card') &&
          !el.classList.contains('founder-reveal') &&
          !el.classList.contains('reel-card') &&
          !el.dataset.gsapHandled &&
          !el.closest('#about .text-center.relative')
        );
      });

      if (remainingReveals.length) {
        gsap.set(remainingReveals, { autoAlpha: 0, y: 34 });
        ScrollTrigger.batch(remainingReveals, {
          start: 'top 90%',
          once: true,
          onEnter: (batch) => {
            gsap.to(batch, {
              autoAlpha: 1,
              y: 0,
              duration: 0.85,
              stagger: 0.08,
              ease: 'brand-out'
            });
          }
        });
      }

      /* ─────────────────────────────────────────────────────────────────────
       * 4l. NAV LOGO + MAGNETIC CTAs (desktop)
       * ─────────────────────────────────────────────────────────────────── */
      const logo = document.querySelector('.navbar .nav-logo');
      if (logo && isDesktop) {
        const container = logo.closest('a') || logo;
        const rotTo = gsap.quickTo(logo, 'rotation', { duration: 0.5, ease: 'power3' });
        const scaleTo = gsap.quickTo(logo, 'scale', { duration: 0.5, ease: 'power3' });
        container.addEventListener('mouseenter', () => {
          rotTo(-6);
          scaleTo(1.06);
        });
        container.addEventListener('mouseleave', () => {
          rotTo(0);
          scaleTo(1);
        });
      }

      if (isDesktop) {
        const magneticBtns = gsap.utils.toArray('.btn-primary');
        magneticBtns.forEach((btn) => {
          if (btn.closest('.trip-card') || btn.closest('#mobileMenu')) return;
          const xTo = gsap.quickTo(btn, 'x', { duration: 0.6, ease: 'power3' });
          const yTo = gsap.quickTo(btn, 'y', { duration: 0.6, ease: 'power3' });
          const strength = 0.25;
          btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const relX = e.clientX - (rect.left + rect.width / 2);
            const relY = e.clientY - (rect.top + rect.height / 2);
            xTo(relX * strength);
            yTo(relY * strength);
          });
          btn.addEventListener('mouseleave', () => {
            xTo(0);
            yTo(0);
          });
        });
      }

      /* ─────────────────────────────────────────────────────────────────────
       * 4n. COMMERCIAL AIRLINER — silent flight, no visible trail (desktop only)
       *     Plane follows a gentle sine path across the viewport, banks into the
       *     turns, and pulses subtly. The path element is in-memory only — never
       *     attached to the DOM — so there is zero SVG repaint cost. The only
       *     per-frame work is one getPointAtLength() call + one gsap.set().
       * ─────────────────────────────────────────────────────────────────── */
      if (isDesktop) {
        const plane = document.getElementById('paperPlane');
        if (plane) {
          document.body.classList.add('plane-active');

          // In-memory <path> element — used only for math, never rendered.
          const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          let totalLen = 0;

          function buildPath() {
            const w = window.innerWidth;
            const h = window.innerHeight;
            const centerY = h * 0.36;
            const amp = Math.min(h * 0.2, 160); // gentler than v2
            const waves = 2; // two graceful oscillations top-to-bottom of page
            const segments = 160;

            let d = `M ${-w * 0.1} ${centerY}`;
            for (let i = 1; i <= segments; i++) {
              const t = i / segments;
              const x = -w * 0.1 + t * w * 1.2; // enter from well off-left, exit past right
              const y = centerY + Math.sin(t * Math.PI * waves) * amp;
              d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
            }
            pathEl.setAttribute('d', d);
            totalLen = pathEl.getTotalLength();
          }

          buildPath();

          let resizeDebounce;
          window.addEventListener('resize', () => {
            clearTimeout(resizeDebounce);
            resizeDebounce = setTimeout(() => {
              buildPath();
              if (window.__planeProgress !== undefined) placePlane(window.__planeProgress);
            }, 150);
          });

          // Position plane at a given progress (0..1). No trail rendering.
          function placePlane(p) {
            window.__planeProgress = p;
            const dist = totalLen * p;
            const pt = pathEl.getPointAtLength(dist);
            const ahead = pathEl.getPointAtLength(Math.min(totalLen, dist + 2));
            const angleDeg = Math.atan2(ahead.y - pt.y, ahead.x - pt.x) * (180 / Math.PI);
            // Top-down airliner SVG has nose pointing up (rotation 0), so add
            // +90 to align with the path tangent direction of travel.
            const rotation = angleDeg + 90;

            // Subtle scale pulse for "coming closer / further" depth illusion.
            const scale = 1 + Math.sin(p * Math.PI * 4) * 0.06;

            gsap.set(plane, {
              x: pt.x - 18, // plane SVG is 36×36 → offset by half for centering
              y: pt.y - 18,
              rotation,
              scale
            });
          }

          placePlane(0);

          // Scrub plane position to page scroll.
          gsap.to(
            {},
            {
              ease: 'none',
              scrollTrigger: {
                trigger: document.body,
                start: 'top top',
                end: 'bottom bottom',
                scrub: 0.6,
                onUpdate: (self) => placePlane(self.progress)
              }
            }
          );
        }
      }

      /* ─────────────────────────────────────────────────────────────────────
       * 4o. SCROLL PROGRESS BAR — smooth GSAP-driven
       * ─────────────────────────────────────────────────────────────────── */
      const progressBar = document.getElementById('scrollProgress');
      if (progressBar) {
        gsap.to(progressBar, {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: document.body,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.3
          }
        });
      }

      // Cleanup: matchMedia auto-reverts all tweens/ScrollTriggers in this scope
      return () => {
        document.body.classList.remove('plane-active');
      };
    }
  );

  /* ─────────────────────────────────────────────────────────────────────────
   * 5. REFRESH ON FULL LOAD — images/fonts can shift layout
   * ───────────────────────────────────────────────────────────────────────── */
  if (typeof ScrollTrigger !== 'undefined') {
    window.addEventListener('load', () => {
      ScrollTrigger.refresh();
    });
  }
})();
