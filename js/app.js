document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('data/config.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const config = await response.json();

        // 1. Dynamic CSS Variables & Page Content Injection
        applyThemeConfig(config.theme);
        populatePageContent(config);

        // 2. Initialize Features
        initArtistStatementToggle();
        initGalleryCarousel(config.gallery);

        // 3. Trigger Smooth Fade In
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
    // Branding
    if (config.branding) {
        if (config.branding.siteTitle) document.title = config.branding.siteTitle;
        if (config.branding.tagline) document.getElementById('siteTagline').textContent = config.branding.tagline;
        if (config.branding.launchText) document.getElementById('siteLaunchText').textContent = config.branding.launchText;
        if (config.branding.logoSrc) {
            const logoEl = document.getElementById('siteLogo');
            logoEl.src = config.branding.logoSrc;
            logoEl.alt = config.branding.logoAlt || 'Logo';
        }
    }

    // Artist Statement
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

    // Footer
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
   2. Artist Statement Toggle
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
    });
}

/* ==========================================================================
   3. Carousel Renderer & Interactive Controls
   ========================================================================== */
function initGalleryCarousel(artworks) {
    const track = document.getElementById('carouselTrack');
    const prevBtn = document.getElementById('carouselPrev');
    const nextBtn = document.getElementById('carouselNext');
    const dotsContainer = document.getElementById('carouselDots');
    const captionContainer = document.getElementById('carouselCaption');

    if (!track || !artworks || artworks.length === 0) return;

    let currentIndex = 0;

    // Render Carousel Slides
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

    function updateCarousel(index) {
        currentIndex = index;
        slides[currentIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });

        slides.forEach((s, i) => s.classList.toggle('active', i === currentIndex));
        dots.forEach((d, i) => d.classList.toggle('active', i === currentIndex));

        if (captionContainer) {
            captionContainer.textContent = artworks[currentIndex].title;
        }
    }

    // Next / Prev Button Click Handling
    prevBtn.addEventListener('click', () => {
        const nextIdx = currentIndex === 0 ? artworks.length - 1 : currentIndex - 1;
        updateCarousel(nextIdx);
    });

    nextBtn.addEventListener('click', () => {
        const nextIdx = currentIndex === artworks.length - 1 ? 0 : currentIndex + 1;
        updateCarousel(nextIdx);
    });

    // Dot Click Navigation
    dotsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('dot')) {
            const targetIdx = parseInt(e.target.dataset.index, 10);
            updateCarousel(targetIdx);
        }
    });

    // Direct Slide Click Navigation
    slides.forEach(slide => {
        slide.addEventListener('click', () => {
            const targetIdx = parseInt(slide.dataset.index, 10);
            updateCarousel(targetIdx);
        });
    });

    // Scroll Observer for Touch Swiping Synchronization
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
                if (captionContainer) {
                    captionContainer.textContent = artworks[currentIndex].title;
                }
            }
        }, 50);
    });

    // Initial Caption Injection
    if (captionContainer) {
        captionContainer.textContent = artworks[0].title;
    }
}