let portfolioData = null;

// Always start at top of page on reload
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

// Load portfolio data on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    loadPortfolioData();
});

async function loadPortfolioData() {
    const urlParams = new URLSearchParams(window.location.search);
    const isPreview = urlParams.get('preview') === 'true';
    const previewData = localStorage.getItem('portfolio_preview_data');
    
    if (isPreview && previewData) {
        try {
            portfolioData = JSON.parse(previewData);
            showPreviewBanner();
        } catch (e) {
            console.error('Failed to parse preview data', e);
        }
    }
    
    if (!portfolioData) {
        try {
            const response = await fetch('portfolio-data.json');
            portfolioData = await response.json();
        } catch (e) {
            console.error('Failed to load portfolio-data.json', e);
            // If fetching fails, we let the static HTML fallback remain
            initializeAnimationsAndMap();
            return;
        }
    }
    
    if (portfolioData) {
        renderPortfolio(portfolioData);
        initializeAnimationsAndMap();
    }
}

function showPreviewBanner() {
    const banner = document.createElement('div');
    banner.style.position = 'fixed';
    banner.style.top = '0';
    banner.style.left = '0';
    banner.style.width = '100%';
    banner.style.backgroundColor = '#ff4a5a';
    banner.style.color = '#000';
    banner.style.textAlign = 'center';
    banner.style.padding = '8px 10px';
    banner.style.fontSize = '14px';
    banner.style.fontWeight = 'bold';
    banner.style.zIndex = '999999';
    banner.style.borderBottom = '3px solid #000';
    banner.style.fontFamily = "'Space Grotesk', sans-serif";
    banner.innerHTML = `
        ⚡ PREVIEW MODE - Viewing draft details. 
        <a href="edit.html" style="color: #000; text-decoration: underline; margin-left: 15px; font-weight: 700;">Back to Editor</a> | 
        <a href="#" id="reset-preview" style="color: #000; text-decoration: underline; margin-left: 10px; font-weight: 700;">Exit Preview</a>
    `;
    document.body.prepend(banner);
    
    // Add margin to page wrapper
    const pageWrapper = document.querySelector('.page-wrapper');
    if (pageWrapper) {
        pageWrapper.style.paddingTop = '40px';
    }
    
    document.addEventListener('click', (e) => {
        if (e.target.id === 'reset-preview') {
            e.preventDefault();
            localStorage.removeItem('portfolio_preview_data');
            window.location.href = 'index.html';
        }
    });
}

function renderPortfolio(data) {
    // 1. Update Head title and standard meta tags
    document.title = `${data.personal.name} | ${data.personal.role}`;
    
    const updateMeta = (key, val, attr = 'name') => {
        const el = document.querySelector(`meta[${attr}="${key}"]`);
        if (el) el.setAttribute('content', val);
    };
    
    updateMeta('title', `${data.personal.name} | ${data.personal.role}`);
    updateMeta('description', data.personal.bio);
    updateMeta('keywords', `${data.personal.name}, ${data.personal.role}, portfolio`);
    updateMeta('author', data.personal.name);
    updateMeta('og:title', `${data.personal.name} | ${data.personal.role}`, 'property');
    updateMeta('og:description', data.personal.bio, 'property');
    updateMeta('twitter:title', `${data.personal.name} | ${data.personal.role}`);
    updateMeta('twitter:description', data.personal.bio);

    // Update JSON-LD
    const ldJsonEl = document.querySelector('script[type="application/ld+json"]');
    if (ldJsonEl) {
        const schema = {
            "@context": "https://schema.org",
            "@type": "Person",
            "name": data.personal.name,
            "url": window.location.origin,
            "jobTitle": data.personal.role,
            "address": {
                "@type": "PostalAddress",
                "addressLocality": data.personal.location
            },
            "knowsAbout": Object.keys(data.skills),
            "sameAs": Object.values(data.personal.social)
        };
        ldJsonEl.textContent = JSON.stringify(schema, null, 2);
    }

    // 2. Brand logo/text in navbar & loader
    const brandText = (data.header && data.header.brandText) || data.personal.name.split(' ').map(n => n[0]).join('');
    document.querySelectorAll('.nav-brand').forEach(el => el.textContent = brandText);
    const loaderWrapper = document.querySelector('.loader-wrapper');
    if (loaderWrapper) {
        loaderWrapper.innerHTML = brandText.split('').map(char => `<div class="loader-letter">${char}</div>`).join('');
    }

    // 2.5 Navbar CTA
    const ctaText = (data.header && data.header.ctaText) || "Get in Touch!";
    const ctaLink = (data.header && data.header.ctaLink) || "#contact";
    document.querySelectorAll('.nav-cta').forEach(el => {
        el.textContent = ctaText;
        el.href = ctaLink;
    });

    // 2.6 Custom navigation links
    const customNavContainer = document.getElementById('custom-nav-links');
    if (customNavContainer) {
        customNavContainer.innerHTML = '';
        const customLinks = (data.header && data.header.links) || [];
        customLinks.forEach(link => {
            let imgHtml = '';
            if (link.icon) {
                imgHtml = `<img src="${link.icon}" alt="${link.text}" class="lazyfire-logo" width="28" height="28">`;
            }
            customNavContainer.innerHTML += `
                <a href="${link.link}" target="_blank" class="nav-lazyfire" title="${link.text}">
                    ${imgHtml}
                    <span class="nav-lazyfire-text">${link.text}</span>
                </a>
            `;
        });
    }

    // 3. Hero section
    const nameEl = document.querySelector('.hero-name');
    if (nameEl) nameEl.textContent = `I'm ${data.personal.name}.`;
    
    const descEl = document.querySelector('.hero-description');
    if (descEl) descEl.textContent = data.personal.bio;
    
    const heroGreeting = document.getElementById('hero-greeting');
    if (heroGreeting) heroGreeting.textContent = data.personal.greetings;

    // Social buttons
    const socialContainer = document.querySelector('.hero-social');
    if (socialContainer) {
        socialContainer.innerHTML = '';
        if (data.personal.social.github) {
            socialContainer.innerHTML += `<a href="${data.personal.social.github}" target="_blank" class="social-btn"><i class="fab fa-github"></i></a>`;
        }
        if (data.personal.social.linkedin) {
            socialContainer.innerHTML += `<a href="${data.personal.social.linkedin}" target="_blank" class="social-btn"><i class="fab fa-linkedin"></i></a>`;
        }
        if (data.personal.social.wordpress) {
            socialContainer.innerHTML += `<a href="${data.personal.social.wordpress}" target="_blank" class="social-btn"><i class="fab fa-wordpress"></i></a>`;
        }
    }

    // Coffee link
    const coffeeLink = document.querySelector('.btn-coffee');
    if (coffeeLink) coffeeLink.href = data.personal.coffeeLink || '#';

    // Avatar image
    const avatarEl = document.querySelector('.hero-photo');
    if (avatarEl) {
        avatarEl.src = data.personal.avatar;
        avatarEl.alt = data.personal.name;
    }
    
    // Label sticker
    const decoLabel = document.querySelector('.deco-label');
    if (decoLabel) decoLabel.textContent = data.personal.label;

    // Hero badges
    const badgesContainer = document.querySelector('.tech-badges');
    if (badgesContainer && data.personal.badges) {
        badgesContainer.innerHTML = data.personal.badges.map(badge => 
            `<span class="tech-badge"><i class="${badge.icon}"></i> ${badge.name}</span>`
        ).join('');
    }

    // 4. About section
    const aboutContainer = document.querySelector('#about .card');
    if (aboutContainer && data.about) {
        aboutContainer.innerHTML = data.about.map(paragraph => `<p class="text">${paragraph}</p>`).join('');
    }

    // 5. Journey timeline items
    const timelineList = document.querySelector('.timeline-list');
    if (timelineList && data.journey) {
        timelineList.innerHTML = data.journey.map(j => `
            <div class="timeline-item-flat" id="${j.id}" data-country="${j.country}">
                <div class="timeline-dot"></div>
                <div class="timeline-content-flat">
                    <h4 class="timeline-title">${j.role} @ ${j.company}</h4>
                    <p class="timeline-date">${j.period}</p>
                    <p class="timeline-description">${j.description}</p>
                    <p class="timeline-location"><i class="fas fa-map-marker-alt"></i> ${j.location}</p>
                </div>
            </div>
        `).join('');
    }

    // 6. Skills grid
    const skillsGrid = document.querySelector('.skills-grid-modern');
    if (skillsGrid && data.skills) {
        skillsGrid.innerHTML = Object.entries(data.skills).map(([category, info]) => {
            const isHighlight = category === 'Architecture' || category === 'Methodologies' || info.highlight;
            return `
                <div class="skill-box ${isHighlight ? 'highlight-box' : ''}">
                    <div class="skill-box-header">
                        <i class="${info.icon} skill-icon-large"></i>
                        <h3 class="skill-box-title">${category}</h3>
                    </div>
                    <div class="tech-tags">
                        ${info.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }

    // 7. Projects
    const projectsGrid = document.querySelector('.creator-projects-grid');
    if (projectsGrid && data.projects) {
        projectsGrid.innerHTML = data.projects.map(project => {
            let logoHtml = '';
            if (project.logoImg) {
                logoHtml = `<img src="${project.logoImg}" alt="${project.name}" class="creator-logo" width="80" height="80">`;
            } else {
                logoHtml = `<span class="creator-name" style="font-size: 2.5rem;">${project.logoText || project.name}</span>`;
            }
            const nameHtml = project.logoImg ? `<span class="creator-name">${project.name}</span>` : '';
            return `
                <div class="creator-item">
                    <a href="${project.demoUrl}" target="_blank" class="creator-project">
                        ${logoHtml}
                        ${nameHtml}
                    </a>
                    <p class="creator-tagline">${project.tagline}</p>
                    <a href="${project.repoUrl}" target="_blank" class="creator-github"><i class="fab fa-github"></i> Check it out</a>
                </div>
            `;
        }).join('');
    }

    // 8. Education
    const eduColumn = document.querySelector('.education-column');
    if (eduColumn && data.education) {
        eduColumn.innerHTML = `<h2 class="section-title">EDUCATION</h2>` + data.education.map(e => `
            <div class="card education-card">
                <div class="education-header">
                    <div>
                        <h3 class="education-title">${e.degree}</h3>
                        <p class="education-school">${e.school}</p>
                    </div>
                    <span class="badge">${e.period}</span>
                </div>
                <p class="education-location"><i class="fas fa-map-marker-alt"></i> ${e.location}</p>
            </div>
        `).join('');
    }

    // 9. Languages
    const languagesCard = document.querySelector('.languages-card');
    if (languagesCard && data.languages) {
        languagesCard.innerHTML = data.languages.map(l => {
            let starsHtml = '';
            for (let i = 1; i <= 3; i++) {
                starsHtml += `<span class="star ${i <= l.stars ? 'filled' : ''}"></span>`;
            }
            return `
                <div class="language-item">
                    <span class="language-name-inline">${l.name}</span>
                    <div class="language-stars">
                        ${starsHtml}
                    </div>
                </div>
            `;
        }).join('');
    }

    // 10. Contact Section Link Cards
    const contactGrid = document.querySelector('.contact-grid');
    if (contactGrid) {
        contactGrid.innerHTML = '';
        if (data.personal.social.linkedin) {
            contactGrid.innerHTML += `
                <a href="${data.personal.social.linkedin}" target="_blank" class="contact-card">
                    <i class="fab fa-linkedin"></i>
                    <span>LinkedIn</span>
                </a>`;
        }
        if (data.personal.social.github) {
            contactGrid.innerHTML += `
                <a href="${data.personal.social.github}" target="_blank" class="contact-card">
                    <i class="fab fa-github"></i>
                    <span>GitHub</span>
                </a>`;
        }
        if (data.personal.social.wordpress) {
            contactGrid.innerHTML += `
                <a href="${data.personal.social.wordpress}" target="_blank" class="contact-card">
                    <i class="fab fa-wordpress"></i>
                    <span>WordPress</span>
                </a>`;
        }
    }

    // 11. Footer details
    const footerName = document.querySelector('.footer-brand-compact strong');
    if (footerName) footerName.textContent = data.personal.name.toUpperCase();
    
    const footerRole = document.querySelector('.footer-brand-compact span');
    if (footerRole) footerRole.textContent = data.personal.role;
    
    const footerCopyright = document.querySelector('.footer-bottom-compact span');
    if (footerCopyright) footerCopyright.textContent = `© ${new Date().getFullYear()} ${data.personal.name}`;

    const footerSocial = document.querySelector('.footer-social-compact');
    if (footerSocial) {
        footerSocial.innerHTML = '';
        if (data.personal.social.github) {
            footerSocial.innerHTML += `<a href="${data.personal.social.github}" target="_blank" title="GitHub"><i class="fab fa-github"></i></a>`;
        }
        if (data.personal.social.linkedin) {
            footerSocial.innerHTML += `<a href="${data.personal.social.linkedin}" target="_blank" title="LinkedIn"><i class="fab fa-linkedin"></i></a>`;
        }
        if (data.personal.social.wordpress) {
            footerSocial.innerHTML += `<a href="${data.personal.social.wordpress}" target="_blank" title="WordPress"><i class="fab fa-wordpress"></i></a>`;
        }
        if (data.personal.email) {
            footerSocial.innerHTML += `<a href="mailto:${data.personal.email}" title="Email"><i class="fas fa-envelope"></i></a>`;
        }
    }

    // Dynamic Sticky Ribbon
    const ribbonContainer = document.getElementById('sticky-ribbon');
    if (ribbonContainer) {
        const ribbon = (data.personal && data.personal.stickyRibbon) || {};
        if (ribbon.enabled) {
            ribbonContainer.style.display = 'block';
            const linkEl = document.getElementById('sticky-ribbon-link');
            const iconEl = document.getElementById('sticky-ribbon-icon');
            const textEl = document.getElementById('sticky-ribbon-text');
            
            if (linkEl) {
                linkEl.href = ribbon.url || '#';
                linkEl.style.backgroundColor = ribbon.color || '#ffd93d';
                
                // Add micro-animation events
                linkEl.addEventListener('mouseenter', () => {
                    linkEl.style.transform = 'translateX(-4px)';
                });
                linkEl.addEventListener('mouseleave', () => {
                    linkEl.style.transform = 'translateX(0)';
                });
            }
            if (iconEl) {
                iconEl.className = ribbon.icon || 'fas fa-trophy';
            }
            if (textEl) {
                textEl.textContent = ribbon.text || 'Badge';
            }
        } else {
            ribbonContainer.style.display = 'none';
        }
    }
}

function initializeAnimationsAndMap() {
    // Hide loading screen
    const loader = document.querySelector('.loader-overlay');
    if (loader) {
        setTimeout(() => {
            loader.classList.add('hidden');
        }, 1200);
    }

    // Hero Photo Tilt on Scroll
    let photoTilted = false;
    const heroPhoto = document.querySelector('.hero-photo');

    if (heroPhoto) {
        window.addEventListener('scroll', () => {
            if (!photoTilted && window.scrollY > 5) {
                heroPhoto.classList.add('tilted');
                photoTilted = true;
            }
        });

        heroPhoto.addEventListener('mouseenter', () => {
            heroPhoto.classList.remove('tilted');
        });

        heroPhoto.addEventListener('mouseleave', () => {
            if (photoTilted) {
                heroPhoto.classList.add('tilted');
            }
        });
    }

    // Falling SVG - Only terminal (top-right)
    let terminalFallen = false;
    const decoTerminal = document.querySelector('.deco-terminal');
    const heroContent = document.querySelector('.hero-content');

    function calculateFallDistance() {
        if (!decoTerminal || !heroContent) return;
        const heroContentRect = heroContent.getBoundingClientRect();
        const heroContentBottom = heroContentRect.bottom;
        const terminalRect = decoTerminal.getBoundingClientRect();
        const terminalFall = Math.max(0, heroContentBottom - terminalRect.bottom - 50);
        decoTerminal.style.setProperty('--fall-distance', `${terminalFall}px`);
    }

    if (decoTerminal && heroContent) {
        calculateFallDistance();
        window.addEventListener('resize', calculateFallDistance);

        window.addEventListener('scroll', () => {
            if (!terminalFallen && window.scrollY > 5) {
                decoTerminal.classList.add('falling');
                terminalFallen = true;
            }
        });
    }

    // Paper Tear Gap Parallax Effect
    const pageGap = document.querySelector('.page-gap');
    const paperTearBottom = document.querySelector('.paper-tear-bottom');
    const paperTearBottomBgGray = document.querySelector('.paper-tear-bottom svg path[fill="#d0d0d0"]');
    const paperTearBottomBgWhite = document.querySelector('.paper-tear-bottom svg path[fill="#ffffff"]');
    const tearTapeSticker = document.querySelector('.tear-tape-sticker');
    const minGapHeight = -30;

    function updateTapePosition() {
        if (paperTearBottom && tearTapeSticker) {
            const rect = paperTearBottom.getBoundingClientRect();
            tearTapeSticker.style.setProperty('--tape-position', `${rect.top}px`);
        }
    }

    function updateGapParallax() {
        if (!pageGap || !paperTearBottom) return;

        const isMobile = window.innerWidth <= 768;
        if (isMobile) return;

        const scrollY = window.scrollY;
        const initialGapHeight = 300;
        const scrollStart = 100;
        const scrollRange = 200;
        const stickerDelay = 30;
        const stickerStart = scrollStart + scrollRange + stickerDelay;
        const stickerRange = 60;

        updateTapePosition();

        if (scrollY <= scrollStart) {
            pageGap.style.setProperty('height', initialGapHeight + 'px', 'important');
            paperTearBottom.style.setProperty('margin-top', '0px', 'important');
            if (paperTearBottomBgGray) paperTearBottomBgGray.style.opacity = '1';
            if (tearTapeSticker) {
                tearTapeSticker.style.transform = 'rotate(-8deg) translateY(-40px) translateZ(30px) rotateX(35deg)';
                tearTapeSticker.style.opacity = '0';
            }
        } else if (scrollY >= scrollStart && scrollY <= scrollStart + scrollRange) {
            const progress = (scrollY - scrollStart) / scrollRange;
            const currentHeight = initialGapHeight - (initialGapHeight - minGapHeight) * progress;

            if (currentHeight >= 0) {
                pageGap.style.setProperty('height', currentHeight + 'px', 'important');
                paperTearBottom.style.setProperty('margin-top', '0px', 'important');
                if (paperTearBottomBgGray) paperTearBottomBgGray.style.opacity = '1';
                if (tearTapeSticker) {
                    tearTapeSticker.style.transform = 'rotate(-8deg) translateY(-100px) translateZ(50px) rotateX(45deg)';
                    tearTapeSticker.style.opacity = '0';
                }
            } else {
                pageGap.style.setProperty('height', '0px', 'important');
                paperTearBottom.style.setProperty('margin-top', currentHeight + 'px', 'important');

                const negativePart = Math.abs(minGapHeight);
                const negativeProgress = Math.abs(currentHeight) / negativePart;
                const opacity = 1 - negativeProgress;

                if (paperTearBottomBgGray) paperTearBottomBgGray.style.opacity = opacity;
                if (tearTapeSticker) {
                    tearTapeSticker.style.transform = 'rotate(-8deg) translateY(-100px) translateZ(50px) rotateX(45deg)';
                    tearTapeSticker.style.opacity = '0';
                }
            }
        } else if (scrollY > stickerStart && scrollY < stickerStart + stickerRange) {
            pageGap.style.setProperty('height', '0px', 'important');
            paperTearBottom.style.setProperty('margin-top', minGapHeight + 'px', 'important');
            if (paperTearBottomBgGray) paperTearBottomBgGray.style.opacity = '0';

            if (tearTapeSticker) {
                const stickerProgress = (scrollY - stickerStart) / stickerRange;
                const translateY = -40 + (40 * stickerProgress);
                const translateZ = 30 - (30 * stickerProgress);
                const rotateX = 35 - (35 * stickerProgress);
                const opacityVal = Math.min(1, Math.max(0, (stickerProgress - 0.35) * 1.54));

                tearTapeSticker.style.transform = `rotate(-8deg) translateY(${translateY}px) translateZ(${translateZ}px) rotateX(${rotateX}deg)`;
                tearTapeSticker.style.opacity = opacityVal;
            }
        } else if (scrollY >= stickerStart + stickerRange) {
            pageGap.style.setProperty('height', '0px', 'important');
            paperTearBottom.style.setProperty('margin-top', minGapHeight + 'px', 'important');
            if (paperTearBottomBgGray) paperTearBottomBgGray.style.opacity = '0';
            if (tearTapeSticker) {
                tearTapeSticker.style.transform = 'rotate(-8deg) translateY(0px) translateZ(0px) rotateX(0deg)';
                tearTapeSticker.style.opacity = '1';
            }
        } else {
            pageGap.style.setProperty('height', '0px', 'important');
            paperTearBottom.style.setProperty('margin-top', minGapHeight + 'px', 'important');
            if (paperTearBottomBgGray) paperTearBottomBgGray.style.opacity = '0';
            if (tearTapeSticker) {
                tearTapeSticker.style.transform = 'rotate(-8deg) translateY(-40px) translateZ(30px) rotateX(35deg)';
                tearTapeSticker.style.opacity = '0';
            }
        }
    }

    window.addEventListener('scroll', updateGapParallax);
    window.addEventListener('resize', updateGapParallax);
    requestAnimationFrame(updateGapParallax);

    // Highlight Parallax Effect
    const highlights = document.querySelectorAll('.highlight');
    const highlightData = new Map();

    highlights.forEach((highlight, index) => {
        const direction = index % 2 === 0 ? 'left' : 'right';
        highlight.setAttribute('data-direction', direction);
        highlightData.set(highlight, {
            hasStarted: false,
            startScroll: 0,
            duration: 100,
            direction: direction
        });
    });

    function updateHighlights() {
        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;

        highlights.forEach(highlight => {
            const rect = highlight.getBoundingClientRect();
            const elementTop = rect.top + scrollY;
            const data = highlightData.get(highlight);
            if (!data) return;

            const triggerPoint = scrollY + windowHeight * 0.8;

            if (!data.hasStarted && triggerPoint >= elementTop) {
                data.hasStarted = true;
                data.startScroll = scrollY;
            }

            if (data.hasStarted) {
                const progress = Math.min(1, Math.max(0, (scrollY - data.startScroll) / data.duration));
                highlight.style.setProperty('--highlight-progress', `${progress * 100}%`);
            }

            if (data.hasStarted && scrollY < data.startScroll - 50) {
                data.hasStarted = false;
                highlight.style.setProperty('--highlight-progress', '0%');
            }
        });
    }

    window.addEventListener('scroll', updateHighlights);
    requestAnimationFrame(updateHighlights);

    // Language Stars Parallax Effect
    const languageItems = document.querySelectorAll('.language-item');
    const languageStarsData = new Map();

    languageItems.forEach(item => {
        const stars = item.querySelectorAll('.language-stars .star');
        languageStarsData.set(item, {
            hasStarted: false,
            startScroll: 0,
            stars: stars,
            starDelay: 50
        });
    });

    function updateLanguageStars() {
        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;

        languageItems.forEach(item => {
            const rect = item.getBoundingClientRect();
            const elementTop = rect.top + scrollY;
            const data = languageStarsData.get(item);
            if (!data) return;

            const triggerPoint = scrollY + windowHeight * 0.8;

            if (!data.hasStarted && triggerPoint >= elementTop) {
                data.hasStarted = true;
                data.startScroll = scrollY;
            }

            if (data.hasStarted) {
                const scrollProgress = scrollY - data.startScroll;
                data.stars.forEach((star, index) => {
                    const starTrigger = index * data.starDelay;
                    if (scrollProgress >= starTrigger) {
                        star.classList.add('visible');
                    }
                });
            }
        });
    }

    window.addEventListener('scroll', updateLanguageStars);
    requestAnimationFrame(updateLanguageStars);

    // Journey Timeline Book Page Effect
    const journeyTimeline = document.querySelector('.journey-timeline');
    const journeyTimelineBack = document.querySelector('.journey-timeline-back');
    const journeyTimelineData = {
        hasStarted: false,
        startScroll: 0,
        pageRange: 200
    };

    function updateJourneyTimeline() {
        if (!journeyTimeline || !journeyTimelineBack) return;
        if (window.innerWidth < 769) return;

        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;
        const rect = journeyTimeline.getBoundingClientRect();
        const elementTop = rect.top + scrollY;

        const triggerPoint = scrollY + windowHeight * 0.5;

        if (!journeyTimelineData.hasStarted && triggerPoint >= elementTop) {
            journeyTimelineData.hasStarted = true;
            journeyTimelineData.startScroll = scrollY;
        }

        if (journeyTimelineData.hasStarted) {
            const progress = Math.min(1, Math.max(0, (scrollY - journeyTimelineData.startScroll) / journeyTimelineData.pageRange));
            const rotateY = 180 - (180 * progress);

            journeyTimeline.style.transform = `rotateY(${rotateY}deg)`;
            journeyTimelineBack.style.transform = `rotateY(${rotateY}deg)`;

            if (rotateY > 95) {
                journeyTimeline.style.zIndex = '1';
                journeyTimelineBack.style.zIndex = '100';
            } else {
                journeyTimeline.style.zIndex = '100';
                journeyTimelineBack.style.zIndex = '1';
            }

            if (progress >= 1) {
                journeyTimeline.style.overflowY = 'auto';
            } else {
                journeyTimeline.style.overflowY = 'hidden';
            }
        } else {
            journeyTimeline.style.transform = 'rotateY(180deg)';
            journeyTimelineBack.style.transform = 'rotateY(180deg)';
            journeyTimeline.style.zIndex = '1';
            journeyTimelineBack.style.zIndex = '100';
            journeyTimeline.style.overflowY = 'hidden';
        }
    }

    window.addEventListener('scroll', updateJourneyTimeline);
    requestAnimationFrame(updateJourneyTimeline);

    // Theme Toggle
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        const currentTheme = localStorage.getItem('theme') || 'light';
        body.setAttribute('data-theme', currentTheme);
        updateIcon(currentTheme);

        themeToggle.addEventListener('click', () => {
            const theme = body.getAttribute('data-theme');
            const newTheme = theme === 'light' ? 'dark' : 'light';

            body.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateIcon(newTheme);
        });

        function updateIcon(theme) {
            if (!icon) return;
            if (theme === 'dark') {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            } else {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            }
        }
    }

    // Smooth Scroll for Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            if (targetId === '#') return;
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // Smart Navbar Scroll
    const navbar = document.querySelector('.navbar');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        if (!navbar) return;
        const currentScroll = window.pageYOffset;

        if (currentScroll > lastScroll && currentScroll > 100) {
            navbar.classList.add('navbar-hidden');
        } else if (currentScroll < lastScroll) {
            navbar.classList.remove('navbar-hidden');
        }

        // Active link highlighting
        const sections = document.querySelectorAll('section[id]');
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (currentScroll >= sectionTop && currentScroll < sectionTop + sectionHeight) {
                document.querySelectorAll('.nav-link').forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });

        lastScroll = currentScroll;
    });

    // Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.section, .timeline-item, .skill-box').forEach(el => {
        observer.observe(el);
    });

    // Matrix Typing Effect for Hero Greeting
    const greetingElement = document.getElementById('hero-greeting');
    if (greetingElement && portfolioData) {
        const finalText = portfolioData.personal.greetings || 'Hi there! 👋';
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';

        function matrixTypingEffect() {
            let iterations = 0;
            const interval = setInterval(() => {
                greetingElement.textContent = finalText
                    .split('')
                    .map((char, index) => {
                        if (index < iterations) {
                            return finalText[index];
                        }
                        if (char === ' ' || char === '👋') {
                            return char;
                        }
                        return chars[Math.floor(Math.random() * chars.length)];
                    })
                    .join('');

                if (iterations >= finalText.length) {
                    clearInterval(interval);
                }

                iterations += 1/3;
            }, 50);
        }

        setTimeout(matrixTypingEffect, 500);
    }

    // Leaflet map setup
    const mapEl = document.getElementById('journey-map');
    if (mapEl && portfolioData && portfolioData.journey) {
        // Build locations from journey list
        const countryMap = {};
        portfolioData.journey.forEach(job => {
            if (!job.coordinates || job.coordinates.length !== 2) return;
            const country = job.country;
            if (!countryMap[country]) {
                countryMap[country] = {
                    coords: job.coordinates,
                    country: country,
                    companies: []
                };
            }
            countryMap[country].companies.push({
                city: job.location.split(',')[0].trim(),
                company: job.company,
                period: job.period,
                role: job.role
            });
        });
        const locations = Object.values(countryMap);

        if (locations.length > 0) {
            // Leaflet Journey Map
            const mapSettings = (portfolioData && portfolioData.personal && portfolioData.personal.mapSettings) || {};
            const initialView = {
                center: mapSettings.center || [48.5, 10],
                zoom: mapSettings.zoom !== undefined ? mapSettings.zoom : 4
            };

            // Check if map is already initialized (Leaflet stores instances on DOM)
            if (window.leafletMapInstance) {
                window.leafletMapInstance.remove();
            }

            const map = L.map('journey-map', {
                center: initialView.center,
                zoom: initialView.zoom,
                scrollWheelZoom: false,
                zoomControl: true
            });
            window.leafletMapInstance = map;

            L.tileLayer('https://watercolormaps.collection.cooperhewitt.org/tile/watercolor/{z}/{x}/{y}.jpg', {
                attribution: '© Stamen Design, © OpenStreetMap contributors',
                maxZoom: 16
            }).addTo(map);

            // Custom home control
            L.Control.Home = L.Control.extend({
                onAdd: function(map) {
                    const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-home');
                    const link = L.DomUtil.create('a', '', container);
                    link.href = '#';
                    link.title = 'Reset map view';
                    link.innerHTML = '<i class="fas fa-home"></i>';

                    L.DomEvent.on(link, 'click', function(e) {
                        e.preventDefault();
                        map.setView(initialView.center, initialView.zoom);
                    });

                    return container;
                }
            });

            new L.Control.Home({ position: 'topright' }).addTo(map);

            const markers = {};

            locations.forEach(location => {
                // Determine if this is current country
                const isCurrent = location.country === (portfolioData.personal.location.includes(location.country) ? location.country : locations[0].country);
                const markerIcon = L.divIcon({
                    className: isCurrent ? 'neo-marker neo-marker-current' : 'neo-marker',
                    html: `
                        <div class="neo-marker-label ${isCurrent ? 'neo-marker-label-current' : ''}">${location.country}</div>
                        <div class="neo-marker-pin ${isCurrent ? 'neo-marker-pin-current' : ''}"></div>
                    `,
                    iconSize: isCurrent ? [35, 35] : [30, 30],
                    iconAnchor: isCurrent ? [17.5, 50] : [15, 45],
                    popupAnchor: [0, isCurrent ? -50 : -45]
                });

                let popupContent = `<div class="map-popup"><div class="map-popup-country">${location.country}</div>`;
                location.companies.forEach((company, idx) => {
                    if (idx > 0) popupContent += `<div class="map-popup-divider"></div>`;
                    popupContent += `
                        <div class="map-popup-company">
                            <strong>${company.company}</strong>
                            <span>${company.role}</span>
                            <small>${company.city}</small>
                            <small>${company.period}</small>
                        </div>
                    `;
                });
                popupContent += `</div>`;

                const marker = L.marker(location.coords, { icon: markerIcon }).addTo(map);
                marker.bindPopup(popupContent);
                markers[location.country] = marker;
            });

            // Add timeline click handlers to markers
            document.querySelectorAll('.timeline-item-flat').forEach(item => {
                item.addEventListener('click', () => {
                    const country = item.getAttribute('data-country');
                    const marker = markers[country];
                    if (marker) {
                        map.setView(marker.getLatLng(), 6, {
                            animate: true,
                            duration: 1
                        });
                        setTimeout(() => {
                            marker.openPopup();
                        }, 500);
                    }
                });
            });
        }
    }

    // Progress Bar Functionality
    const progressBarFill = document.querySelector('.progress-bar-fill');
    const checkpoints = document.querySelectorAll('.checkpoint');

    if (progressBarFill && checkpoints.length > 0) {
        function updateProgressBar() {
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight - windowHeight;
            const scrolled = window.scrollY;
            const progress = (scrolled / documentHeight) * 100;

            progressBarFill.style.width = progress + '%';

            const sections = ['hero', 'about', 'experience', 'skills', 'contact'];
            let activeIndex = 0;

            sections.forEach((sectionId, index) => {
                const section = document.getElementById(sectionId);
                if (section) {
                    const rect = section.getBoundingClientRect();
                    if (rect.top <= windowHeight / 2 && rect.bottom >= windowHeight / 2) {
                        activeIndex = index;
                    }
                }
            });

            checkpoints.forEach((checkpoint, index) => {
                if (index <= activeIndex) {
                    checkpoint.classList.add('active');
                } else {
                    checkpoint.classList.remove('active');
                }
            });
        }

        checkpoints.forEach(checkpoint => {
            checkpoint.addEventListener('click', () => {
                const sectionId = checkpoint.getAttribute('data-section');
                const section = document.getElementById(sectionId);
                if (section) {
                    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });

        window.addEventListener('scroll', updateProgressBar);
        window.addEventListener('resize', updateProgressBar);
        updateProgressBar();
    }
}
