document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('data/config.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const config = await response.json();

        // 1. Dynamic CSS Variables & Page Content Injection
        applyThemeConfig(config.theme);
        populatePageContent(config);

        // 2. Expand Top Divider Line Smoothly on Load
        setTimeout(() => {
            const topDivider = document.getElementById('topDividerLine');
            if (topDivider) topDivider.classList.add('expanded');
        }, 100);

        // 3. Initialize Features
        initArtistStatementToggle();
        initNativeCenteredCarousel(config.gallery);

        // 4. Option A: Intersection Observer for Statement Cue
        initStatementCueObserver();

        // 5. Trigger Page Fade In
        document.body.classList.remove('loading');

    } catch (error) {
        console.error('Error loading site configuration:', error);
        document.body.classList.remove('loading');
    }
});

/* ==========================================================================
   1. Dynamic CSS Variables & Content Population
   ========================================================================== */
function applyThemeConfig(theme) {
    if (!theme) return;
    const root = document.documentElement;
    if (theme.deepSea) root.style.setProperty('--deep-sea', theme.deepSea);
    if (theme.oceanTeal) root.style.setProperty('--ocean-teal', theme.oceanTeal);
    if (theme.seaFoam) root.style.setProperty('--sea-foam', theme.seaFoam);
    if (theme.sandLight) root.style.setProperty('--sand-light', theme.sandLight);
    if (theme.sandAccent) root.style.setProperty('--sand-accent', theme.sandAccent);
    if (theme.textDark) root.style.setProperty('--text-dark', theme.textDark);
    if (theme.textMuted) root.style.setProperty('--text-muted', theme.textMuted);
}

function populatePageContent(config) {
    if (config.branding) {
        if (config.branding.siteTitle) {
            document.title = config.branding.siteTitle;
            const titleEl = document.getElementById('siteTitle');
            if (titleEl) titleEl.textContent = config.branding.siteTitle;
        }
        if (config.branding.tagline) {
            const taglineEl = document.getElementById('siteTagline');
            if (taglineEl) taglineEl.innerHTML = config.branding.tagline;
        }
        if (config.branding.logoSrc) {
            const logoEl = document.getElementById('siteLogo');
            if (logoEl) {
                logoEl.src = config.branding.logoSrc;
                logoEl.alt = config.branding.logoAlt || 'Logo';
            }
        }
    }

    if (config.artistStatement) {
        if (config.artistStatement.buttonLabel) {
            document.getElementById('statementBtnLabel').textContent = config.artistStatement.buttonLabel;
        }
        if (Array.isArray(config.artistStatement.paragraphs)) {
            const statementSection = document.getElementById('artistStatement');
            statementSection.innerHTML = config.artistStatement.paragraphs
                .map(p => `<p>${p}</p>`)
                .join('');
        }
    }

    if (config.footer) {
        if (config.footer.copyrightText) document.getElementById('copyrightText').textContent = config.footer.copyrightText;
        if (config.footer.creditLabel) {
            const creditLink = document.getElementById('nimaiSMLink');
            creditLink.textContent = config.footer.creditLabel;
            creditLink.href = config.footer.creditUrl || '#';
        }
    }
}

/* ==========================================================================
   2. Artist Statement Toggle & Intersection Cue
   ========================================================================== */
function initArtistStatementToggle() {
    const toggleBtn = document.getElementById('toggleStatementBtn');
    const statementSection = document.getElementById('artistStatement');
    const dividerLine = document.getElementById('dividerLine');

    if (!toggleBtn || !statementSection || !dividerLine) return;

    toggleBtn.addEventListener('click', () => {
        const isExpanded = statementSection.classList.toggle('show');
        toggleBtn.classList.toggle('active', isExpanded);
        dividerLine.classList.toggle('expanded', isExpanded);
        toggleBtn.setAttribute('aria-expanded', isExpanded);
        toggleBtn.classList.remove('pulse-cue');
    });
}

function initStatementCueObserver() {
    const toggleBtn = document.getElementById('toggleStatementBtn');
    if (!toggleBtn || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !toggleBtn.classList.contains('active')) {
                toggleBtn.classList.add('pulse-cue');
            }
        });
    }, { threshold: 0.8 });

    observer.observe(toggleBtn);
}

/* ==========================================================================
   3. Native CSS Snap-Centered Gallery Carousel Engine
   ========================================================================== */
function initNativeCenteredCarousel(artworks) {
    const track = document.getElementById('carouselTrack');
    const prevBtn = document.getElementById('carouselPrev');
    const nextBtn = document.getElementById('carouselNext');
    const dotsContainer = document.getElementById('carouselDots');

    const titleEl = document.getElementById('artTitle');
    const scienceEl = document.getElementById('artScience');

    if (!track || !artworks || artworks.length === 0) return;

    const total = artworks.length;
    let currentIndex = 0;

    // Render Track HTML
    track.innerHTML = artworks.map((art, idx) => `
        <div class="carousel-slide ${idx === 0 ? 'active' : ''}" data-index="${idx}">
            <img src="${art.image}" alt="${art.alt}">
        </div>
    `).join('');

    // Render Pagination Dots
    dotsContainer.innerHTML = artworks.map((_, idx) => `
        <span class="dot ${idx === 0 ? 'active' : ''}" data-index="${idx}"></span>
    `).join('');

    const slides = track.querySelectorAll('.carousel-slide');
    const dots = dotsContainer.querySelectorAll('.dot');

    function updatePlacard(index) {
        const art = artworks[index];
        if (titleEl) titleEl.textContent = art.title || '';
        if (scienceEl) scienceEl.textContent = art.science || '';
    }

    function setActiveIndex(index) {
        currentIndex = index;

        // Native Smooth Scroll to Center Slide
        slides[currentIndex].scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
        });

        // Update CSS Visual Classes
        slides.forEach((s, i) => s.classList.toggle('active', i === currentIndex));
        dots.forEach((d, i) => d.classList.toggle('active', i === currentIndex));

        // Update Bounded Arrow States
        if (prevBtn) prevBtn.classList.toggle('disabled', currentIndex === 0);
        if (nextBtn) nextBtn.classList.toggle('disabled', currentIndex === total - 1);

        updatePlacard(currentIndex);
    }

    // Navigation Controls
    if (prevBtn) prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) setActiveIndex(currentIndex - 1);
    });

    if (nextBtn) nextBtn.addEventListener('click', () => {
        if (currentIndex < total - 1) setActiveIndex(currentIndex + 1);
    });

    dotsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('dot')) {
            const targetIdx = parseInt(e.target.dataset.index, 10);
            setActiveIndex(targetIdx);
        }
    });

    slides.forEach(slide => {
        slide.addEventListener('click', () => {
            const targetIdx = parseInt(slide.dataset.index, 10);
            setActiveIndex(targetIdx);
        });
    });

    // Scroll Observer for Native Touch Swiping Synchronization
    let isScrolling;
    track.addEventListener('scroll', () => {
        window.clearTimeout(isScrolling);
        isScrolling = setTimeout(() => {
            const trackCenter = track.getBoundingClientRect().left + track.offsetWidth / 2;
            let closestIdx = 0;
            let minDistance = Infinity;

            slides.forEach((slide, idx) => {
                const box = slide.getBoundingClientRect();
                const slideCenter = box.left + box.width / 2;
                const distance = Math.abs(trackCenter - slideCenter);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestIdx = idx;
                }
            });

            if (currentIndex !== closestIdx) {
                currentIndex = closestIdx;

                slides.forEach((s, i) => s.classList.toggle('active', i === currentIndex));
                dots.forEach((d, i) => d.classList.toggle('active', i === currentIndex));

                if (prevBtn) prevBtn.classList.toggle('disabled', currentIndex === 0);
                if (nextBtn) nextBtn.classList.toggle('disabled', currentIndex === total - 1);

                updatePlacard(currentIndex);
            }
        }, 50);
    });

    // Initial State Setup
    if (prevBtn) prevBtn.classList.add('disabled');
    updatePlacard(0);
}