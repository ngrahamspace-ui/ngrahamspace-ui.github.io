// Initialize Tick.js Flip Countdowns (must be global for Tick.js to access)
// Main countdown to wedding date
function handleMainCountdown(tick) {
    var counter = Tick.count.down("2027-06-09T00:00:00+00:00");
    
    counter.onupdate = function (value) {
        tick.value = value;
    };
    
    counter.onended = function () {
        // Handle countdown end if needed
    };
}

// Invite password countdown
function handleInviteCountdown(tick) {
    var counter = Tick.count.down("2026-07-09T00:00:00+00:00");
    
    counter.onupdate = function (value) {
        tick.value = value;
    };
    
    counter.onended = function () {
        // Handle countdown end if needed
    };
}

// Prevent browser from restoring scroll position on refresh
if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
}

document.addEventListener('DOMContentLoaded', function() {
    const envelope = document.getElementById('envelope');
    const inviteContent = document.getElementById('inviteContent');
    const inviteCard = document.querySelector('.invite-card');
    const overlay = document.getElementById('overlay');
    const closeBtn = document.getElementById('closeBtn');
    const container = document.querySelector('.container');
    let envelopeOpened = false;

    // Function to close envelope (used by scroll and other interactions)
    function closeEnvelope() {
        if (!envelopeOpened) return;
        envelope.classList.remove('open');
        changeEnvelopeImage('assets/Black C5 Straight fl.png');
        envelope.style.width = '';
        inviteContent.classList.remove('active');
        overlay.classList.remove('active');
        container.classList.remove('invite-open');
        resizeObserver.unobserve(inviteCard);
        envelopeOpened = false;
    }

    // ========== SCROLL LOCKING FUNCTIONALITY ==========
    let currentSection = 0;
    let isSnapping = false;
    const sections = document.querySelectorAll('[data-section]');
    const totalSections = sections.length;
    const snapDuration = 800; // milliseconds for smooth snap

    function snapToSection(sectionIndex) {
        if (isSnapping || sectionIndex < 0 || sectionIndex >= totalSections) return;
        
        isSnapping = true;
        currentSection = sectionIndex;
        const targetSection = sections[sectionIndex];
        const targetScroll = targetSection.offsetTop;
        const startScroll = window.scrollY;
        const distance = targetScroll - startScroll;
        const startTime = performance.now();

        function animate(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / snapDuration, 1);
            
            // Easing function for smooth animation
            const easeProgress = progress < 0.5 
                ? 2 * progress * progress 
                : -1 + (4 - 2 * progress) * progress;
            
            window.scrollTo(0, startScroll + distance * easeProgress);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                isSnapping = false;
            }
        }

        requestAnimationFrame(animate);
    }

    // Handle wheel events for scroll locking
    let wheelTimeout;
    let lastWheelDirection = 0;

    document.addEventListener('wheel', function(e) {
        if (isSnapping) {
            e.preventDefault();
            return;
        }

        clearTimeout(wheelTimeout);

        // Determine scroll direction
        const direction = e.deltaY > 0 ? 1 : -1; // 1 for down, -1 for up
        lastWheelDirection = direction;

        // Calculate which section to snap to
        if (direction > 0) {
            // Scrolling down - close envelope if open
            if (envelopeOpened) {
                closeEnvelope();
            }
            if (currentSection < totalSections - 1) {
                snapToSection(currentSection + 1);
            }
        } else {
            // Scrolling up
            if (currentSection > 0) {
                snapToSection(currentSection - 1);
            }
        }

        e.preventDefault();

        // Reset after a short delay to ensure snap completes
        wheelTimeout = setTimeout(() => {
            lastWheelDirection = 0;
        }, snapDuration);

    }, { passive: false });

    // Handle keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (isSnapping) return;

        if (e.key === 'ArrowDown' || e.key === ' ') {
            if (currentSection < totalSections - 1) {
                snapToSection(currentSection + 1);
                e.preventDefault();
            }
        } else if (e.key === 'ArrowUp') {
            if (currentSection > 0) {
                snapToSection(currentSection - 1);
                e.preventDefault();
            }
        }
    });

    // ========== END SCROLL LOCKING FUNCTIONALITY ==========

    // Scroll Down Indicator & Mobile scroll detection
    const scrollIndicator = document.getElementById('scrollIndicator');
    let hasScrolled = false;
    let lastScrollY = 0;

    window.addEventListener('scroll', function() {
        const currentScrollY = window.scrollY;
        
        // Detect scroll direction for mobile
        if (currentScrollY > lastScrollY) {
            // Scrolling down - close envelope if open
            if (envelopeOpened) {
                closeEnvelope();
            }
        }
        lastScrollY = currentScrollY;

        // Scroll indicator logic
        if (window.scrollY > 100 && !hasScrolled) {
            scrollIndicator.classList.add('hidden');
            hasScrolled = true;
        } else if (window.scrollY <= 100 && hasScrolled) {
            scrollIndicator.classList.remove('hidden');
            hasScrolled = false;
        }
    });

    function syncEnvelopeWidth() {
        if (inviteCard) {
            const inviteWidth = inviteCard.offsetWidth;
            envelope.style.width = ((inviteWidth + 40) * 1.2) + 'px';
        }
    }

    // Create a ResizeObserver to watch for invite card size changes
    const resizeObserver = new ResizeObserver(() => {
        if (inviteContent.classList.contains('active')) {
            syncEnvelopeWidth();
        }
    });

    // Helper function to change envelope image with proper browser cache handling
    function changeEnvelopeImage(imagePath) {
        // Force browser to reload image by adding cache buster
        const cacheBuster = '?t=' + new Date().getTime();
        envelope.src = imagePath + cacheBuster;
    }

    // Function to open envelope
    function openEnvelope() {
        if (envelopeOpened) return;
        envelope.classList.add('open');
        changeEnvelopeImage('assets/black envelope open.png');
        inviteContent.classList.add('active');
        overlay.classList.add('active');
        container.classList.add('invite-open');
        envelopeOpened = true;
        
        // Start observing invite card size changes
        resizeObserver.observe(inviteCard);
        
        // Sync width after a small delay to ensure invite is rendered
        setTimeout(syncEnvelopeWidth, 100);
    }

    // Open envelope on click
    envelope.addEventListener('click', function(e) {
        e.stopPropagation();
        openEnvelope();
    });

    // Close invite
    closeBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        closeEnvelope();
    });

    // Close on overlay click
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            closeEnvelope();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && inviteContent.classList.contains('active')) {
            closeEnvelope();
        }
    });

    // Sync width on window resize while invite is open (backup for older browsers without ResizeObserver)
    window.addEventListener('resize', function() {
        if (inviteContent.classList.contains('active')) {
            syncEnvelopeWidth();
        }
    });

    // Google Map is now embedded via iframe - no JavaScript initialization needed

    // RSVP Password Unlock
    const unlockBtn = document.getElementById('unlockBtn');
    const passwordInput = document.getElementById('passwordInput');
    const rsvpLocked = document.getElementById('rsvpLocked');
    const rsvpUnlocked = document.getElementById('rsvpUnlocked');

    if (unlockBtn && passwordInput) {
        unlockBtn.addEventListener('click', function() {
            const password = passwordInput.value;
            // You can change this password to whatever you want
            if (password === '090627') {
                rsvpLocked.style.display = 'none';
                rsvpUnlocked.style.display = 'flex';
            } else {
                alert('Incorrect password. Please try again.');
                passwordInput.value = '';
            }
        });

        // Allow Enter key to unlock
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                unlockBtn.click();
            }
        });
    }
});