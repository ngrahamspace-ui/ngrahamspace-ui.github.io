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

document.addEventListener('DOMContentLoaded', function() {
    const envelope = document.getElementById('envelope');
    const inviteContent = document.getElementById('inviteContent');
    const inviteCard = document.querySelector('.invite-card');
    const overlay = document.getElementById('overlay');
    const closeBtn = document.getElementById('closeBtn');
    const container = document.querySelector('.container');
    let envelopeOpened = false;

    // Scroll Down Indicator
    const scrollIndicator = document.getElementById('scrollIndicator');
    let hasScrolled = false;

    window.addEventListener('scroll', function() {
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

    // Function to open envelope
    function openEnvelope() {
        if (envelopeOpened) return;
        envelope.classList.add('open');
        envelope.src = 'assets/black envelope open.png';
        inviteContent.classList.add('active');
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
        envelope.classList.remove('open');
        envelope.src = 'assets/Black C5 Straight fl.png';
        envelope.style.width = '';
        inviteContent.classList.remove('active');
        container.classList.remove('invite-open');
        resizeObserver.unobserve(inviteCard);
        envelopeOpened = false;
    });

    // Close on overlay click
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            envelope.classList.remove('open');
            envelope.src = 'assets/Black C5 Straight fl.png';
            envelope.style.width = '';
            inviteContent.classList.remove('active');
            container.classList.remove('invite-open');
            resizeObserver.unobserve(inviteCard);
            envelopeOpened = false;
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && inviteContent.classList.contains('active')) {
            envelope.classList.remove('open');
            envelope.src = 'assets/Black C5 Straight fl.png';
            envelope.style.width = '';
            inviteContent.classList.remove('active');
            container.classList.remove('invite-open');
            resizeObserver.unobserve(inviteCard);
            envelopeOpened = false;
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