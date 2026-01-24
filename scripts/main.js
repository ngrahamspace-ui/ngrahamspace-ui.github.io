document.addEventListener('DOMContentLoaded', function() {
    const envelope = document.getElementById('envelope');
    const inviteContent = document.getElementById('inviteContent');
    const inviteCard = document.querySelector('.invite-card');
    const overlay = document.getElementById('overlay');
    const closeBtn = document.getElementById('closeBtn');
    const container = document.querySelector('.container');

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

    // Open envelope
    envelope.addEventListener('click', function(e) {
        e.stopPropagation();
        envelope.classList.add('open');
        envelope.src = 'assets/black envelope open.png';
        inviteContent.classList.add('active');
        overlay.classList.add('active');
        container.classList.add('invite-open');
        
        // Start observing invite card size changes
        resizeObserver.observe(inviteCard);
        
        // Sync width after a small delay to ensure invite is rendered
        setTimeout(syncEnvelopeWidth, 100);
    });

    // Close invite
    closeBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        envelope.classList.remove('open');
        envelope.src = 'assets/Black C5 Straight fl.png';
        envelope.style.width = '';
        inviteContent.classList.remove('active');
        overlay.classList.remove('active');
        container.classList.remove('invite-open');
        resizeObserver.unobserve(inviteCard);
    });

    // Close on overlay click
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            envelope.classList.remove('open');
            envelope.src = 'assets/Black C5 Straight fl.png';
            envelope.style.width = '';
            inviteContent.classList.remove('active');
            overlay.classList.remove('active');
            container.classList.remove('invite-open');
            resizeObserver.unobserve(inviteCard);
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && inviteContent.classList.contains('active')) {
            envelope.classList.remove('open');
            envelope.src = 'assets/Black C5 Straight fl.png';
            envelope.style.width = '';
            inviteContent.classList.remove('active');
            overlay.classList.remove('active');
            container.classList.remove('invite-open');
            resizeObserver.unobserve(inviteCard);
        }
    });

    // Sync width on window resize while invite is open (backup for older browsers without ResizeObserver)
    window.addEventListener('resize', function() {
        if (inviteContent.classList.contains('active')) {
            syncEnvelopeWidth();
        }
    });
});