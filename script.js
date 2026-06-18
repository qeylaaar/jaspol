const revealElements = document.querySelectorAll('.reveal');
const counters = document.querySelectorAll('[data-count]');
const yearElement = document.getElementById('year');
const scrollTopButton = document.getElementById('scrollTop');

yearElement.textContent = new Date().getFullYear();

const animateCounter = (element) => {
  const target = Number(element.dataset.count || 0);
  const duration = 1200;
  const startTime = performance.now();

  const tick = (now) => {
    const progress = Math.min((now - startTime) / duration, 1);
    element.textContent = Math.floor(progress * target).toString();

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      element.textContent = target.toString();
    }
  };

  requestAnimationFrame(tick);
};

const observer = new IntersectionObserver((entries, obs) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      obs.unobserve(entry.target);
    }
  });
}, { threshold: 0.18 });

revealElements.forEach((element) => observer.observe(element));

const counterObserver = new IntersectionObserver((entries, obs) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      obs.unobserve(entry.target);
    }
  });
}, { threshold: 0.6 });

counters.forEach((element) => counterObserver.observe(element));

/* =============================================
   SMOOTH SCROLL UTILITY
   ============================================= */
const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

function smoothScrollTo(targetY, duration = 700) {
  const startY = window.scrollY;
  const distance = targetY - startY;
  const startTime = performance.now();

  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeInOutCubic(progress);
    window.scrollTo(0, startY + distance * eased);
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

function getScrollTarget(href) {
  if (!href || href === '#') return 0;
  const el = document.querySelector(href);
  if (!el) return 0;
  // offset for sticky topbar (~90px)
  return Math.max(0, el.getBoundingClientRect().top + window.scrollY - 90);
}

// Intercept all internal anchor links for smooth scroll
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href');
    if (!href || href === '#') return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    smoothScrollTo(getScrollTarget(href));
  });
});

// CTA "Kembali ke atas" button
scrollTopButton.addEventListener('click', () => smoothScrollTo(0));

/* =============================================
   FLOATING BACK-TO-TOP FAB
   ============================================= */
const fabTop = document.getElementById('fabTop');

function updateFab() {
  if (window.scrollY > 320) {
    fabTop.classList.add('visible');
  } else {
    fabTop.classList.remove('visible');
  }
}

window.addEventListener('scroll', updateFab, { passive: true });
updateFab(); // run on load

fabTop.addEventListener('click', () => smoothScrollTo(0));


/* =============================================
   TESTIMONI – JSONBin.io Cloud Storage + Carousel 3×2
   ============================================= */
(function () {
  /* -------- JSONBin.io config -------- */
  const BIN_ID     = '6a340428da38895dfed7ba9e';
  const ACCESS_KEY = '$2a$10$4C1pRXTNtgyhoQEVgOLofOq6QjG0ExvBG9M31G/KGIQTMf26Ly.gq';
  const BIN_URL    = `https://api.jsonbin.io/v3/b/${BIN_ID}`;
  // JSONBin: X-Master-Key diperlukan untuk operasi tulis (PUT)
  const HEADERS    = {
    'Content-Type': 'application/json',
    'X-Master-Key': ACCESS_KEY,
  };

  const PER_PAGE = 6; // 3 kolom × 2 baris
  const $        = (id) => document.getElementById(id);

  /* -------- helpers -------- */
  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function starsHtml(n) { return '★'.repeat(n) + '☆'.repeat(5 - n); }
  function avatarLetter(name) { return name.trim().charAt(0).toUpperCase() || '?'; }
  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function buildCard(t, idx) {
    const card = document.createElement('article');
    card.className = 'testi-card';
    card.style.animationDelay = `${(idx % PER_PAGE) * 55}ms`;
    card.innerHTML = `
      <div class="testi-card-header">
        <div class="testi-avatar" aria-hidden="true">${avatarLetter(t.name)}</div>
        <div class="testi-meta">
          <strong>${escHtml(t.name)}</strong>
          <small>${escHtml(t.role || 'Pelanggan JASPOL')}</small>
        </div>
        <div class="testi-stars" aria-label="${t.rating} bintang">${starsHtml(t.rating)}</div>
      </div>
      <span class="testi-service-badge">${escHtml(t.service)}</span>
      <p class="testi-message">${escHtml(t.message)}</p>
      <span class="testi-date">${formatDate(t.date)}</span>
    `;
    return card;
  }

  /* -------- state -------- */
  let testimonials = [];
  let currentPage  = 0;
  function totalPages() { return Math.max(1, Math.ceil(testimonials.length / PER_PAGE)); }

  /* -------- JSONBin API -------- */
  async function fetchTestimonials() {
    // Bin public: baca tanpa auth header
    const res  = await fetch(`${BIN_URL}/latest`);
    const json = await res.json();
    return json.record?.testimonials || [];
  }

  async function saveTestimonials(data) {
    await fetch(BIN_URL, {
      method: 'PUT',
      headers: HEADERS,
      body: JSON.stringify({ testimonials: data }),
    });
  }

  /* -------- render -------- */
  function setLoading(on) {
    const grid  = $('testiGrid');
    const empty = $('testiEmpty');
    const wrap  = $('testiCarouselWrap');
    if (on) {
      grid.innerHTML = '<p class="testi-loading">⏳ Memuat testimoni...</p>';
      empty.style.display = 'none';
      wrap.style.display  = 'flex';
    }
  }

  function render() {
    const grid = $('testiGrid');
    const nav  = $('testiNav');
    const empty = $('testiEmpty');
    const wrap  = $('testiCarouselWrap');

    grid.innerHTML = '';
    nav.innerHTML  = '';

    if (testimonials.length === 0) {
      empty.style.display = 'flex';
      wrap.style.display  = 'none';
      return;
    }

    empty.style.display = 'none';
    wrap.style.display  = 'flex';

    currentPage = Math.min(currentPage, totalPages() - 1);
    const slice = testimonials.slice(currentPage * PER_PAGE, currentPage * PER_PAGE + PER_PAGE);
    slice.forEach((t, idx) => grid.appendChild(buildCard(t, idx)));

    for (let i = 0; i < totalPages(); i++) {
      const dot = document.createElement('button');
      dot.className = 'testi-dot' + (i === currentPage ? ' active' : '');
      dot.setAttribute('aria-label', `Halaman ${i + 1}`);
      dot.addEventListener('click', () => { currentPage = i; render(); });
      nav.appendChild(dot);
    }
  }

  /* -------- star picker -------- */
  let selectedRating = 5;
  const stars       = document.querySelectorAll('.star');
  const ratingInput = $('testiRating');

  function updateStars(val) {
    selectedRating    = val;
    ratingInput.value = val;
    stars.forEach((s) => s.classList.toggle('active', Number(s.dataset.star) <= val));
  }
  updateStars(5);

  stars.forEach((star) => {
    star.addEventListener('click', () => updateStars(Number(star.dataset.star)));
    star.addEventListener('mouseenter', () =>
      stars.forEach((s) => s.classList.toggle('active', Number(s.dataset.star) <= Number(star.dataset.star)))
    );
  });
  $('starPicker').addEventListener('mouseleave', () => updateStars(selectedRating));

  /* -------- char counter -------- */
  const msgArea  = $('testiMsg');
  const charCount = $('charCount');
  msgArea.addEventListener('input', () => { charCount.textContent = msgArea.value.length; });

  /* -------- submit -------- */
  $('testiForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const nameEl = $('testiName');
    const msgEl  = $('testiMsg');
    const btn    = $('testiSubmit');
    let valid    = true;

    [nameEl, msgEl].forEach((el) => el.classList.remove('error'));
    if (!nameEl.value.trim()) { nameEl.classList.add('error'); valid = false; }
    if (!msgEl.value.trim())  { msgEl.classList.add('error');  valid = false; }
    if (!valid) return;

    const entry = {
      name:    nameEl.value.trim(),
      role:    $('testiRole').value.trim(),
      service: $('testiService').value,
      rating:  selectedRating,
      message: msgEl.value.trim(),
      date:    new Date().toISOString(),
    };

    // Optimistic UI – tampil dulu
    testimonials.unshift(entry);
    currentPage = 0;
    render();
    e.target.reset();
    charCount.textContent = '0';
    updateStars(5);

    // Disable tombol selama simpan
    btn.disabled    = true;
    btn.textContent = 'Menyimpan...';

    try {
      await saveTestimonials(testimonials);
      const feedback = document.createElement('span');
      feedback.className   = 'testi-success';
      feedback.textContent = '✓ Testimoni berhasil ditambahkan!';
      btn.insertAdjacentElement('afterend', feedback);
      setTimeout(() => feedback.remove(), 3500);
    } catch {
      // Rollback jika gagal
      testimonials.shift();
      render();
      const feedback = document.createElement('span');
      feedback.className   = 'testi-success';
      feedback.style.color = '#dc2626';
      feedback.textContent = '✗ Gagal menyimpan. Coba lagi.';
      btn.insertAdjacentElement('afterend', feedback);
      setTimeout(() => feedback.remove(), 4000);
    } finally {
      btn.disabled    = false;
      btn.textContent = 'Kirim Testimoni';
    }
  });

  /* -------- init: load dari cloud -------- */
  setLoading(true);
  fetchTestimonials()
    .then((data) => {
      testimonials = data;
      render();
    })
    .catch(() => {
      // fallback: tampilkan empty state jika gagal fetch
      testimonials = [];
      render();
    });
})();