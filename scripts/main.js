document.addEventListener('DOMContentLoaded', function() {
    const envelope = document.getElementById('envelope');
    const inviteContent = document.getElementById('inviteContent');
    const inviteCard = document.querySelector('.invite-card');
    const overlay = document.getElementById('overlay');
    const closeBtn = document.getElementById('closeBtn');
    const container = document.querySelector('.container');
    let envelopeOpened = false;

    // Countdown Timer
    function updateCountdown() {
        const targetDate = new Date('June 9, 2027 00:00:00').getTime();
        
        const timer = setInterval(function() {
            const now = new Date().getTime();
            const difference = targetDate - now;
            
            if (difference > 0) {
                const days = Math.floor(difference / (1000 * 60 * 60 * 24));
                const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((difference % (1000 * 60)) / 1000);
                
                document.getElementById('days').textContent = days;
                document.getElementById('hours').textContent = String(hours).padStart(2, '0');
                document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
                document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
            } else {
                clearInterval(timer);
                document.getElementById('days').textContent = '0';
                document.getElementById('hours').textContent = '00';
                document.getElementById('minutes').textContent = '00';
                document.getElementById('seconds').textContent = '00';
            }
        }, 1000);
    }
    updateCountdown();

    // Countdown for invite password send date
    function updateInviteCountdown() {
        const sendDate = new Date('July 9, 2026 00:00:00').getTime();
        const timer = setInterval(function() {
            const now = new Date().getTime();
            const diff = sendDate - now;
            if (diff > 0) {
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                document.getElementById('inviteDays').textContent = days;
                document.getElementById('inviteHours').textContent = String(hours).padStart(2, '0');
                document.getElementById('inviteMinutes').textContent = String(minutes).padStart(2, '0');
                document.getElementById('inviteSeconds').textContent = String(seconds).padStart(2, '0');
            } else {
                clearInterval(timer);
                document.getElementById('inviteDays').textContent = '0';
                document.getElementById('inviteHours').textContent = '00';
                document.getElementById('inviteMinutes').textContent = '00';
                document.getElementById('inviteSeconds').textContent = '00';
            }
        }, 1000);
    }
    updateInviteCountdown();

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