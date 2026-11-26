document.addEventListener("DOMContentLoaded", () => {
    const body = document.body;
    const header = document.getElementById("siteHeader");
    const menuToggle = document.querySelector(".menu-toggle");
    const siteNav = document.getElementById("siteNav");
    const navLinks = Array.from(siteNav.querySelectorAll("a"));

    const closeMenu = () => {
        menuToggle.setAttribute("aria-expanded", "false");
        siteNav.classList.remove("is-open");
        header.classList.remove("menu-active");
        body.classList.remove("menu-open");
    };

    menuToggle.addEventListener("click", () => {
        const willOpen = menuToggle.getAttribute("aria-expanded") !== "true";
        menuToggle.setAttribute("aria-expanded", String(willOpen));
        siteNav.classList.toggle("is-open", willOpen);
        header.classList.toggle("menu-active", willOpen);
        body.classList.toggle("menu-open", willOpen);
    });

    navLinks.forEach((link) => link.addEventListener("click", closeMenu));

    const revealHashTarget = (hash) => {
        let id;
        try { id = decodeURIComponent(hash.slice(1)); } catch { return; }
        let target = document.getElementById(id);
        while (target) {
            if (target.tagName === "DETAILS") target.open = true;
            target = target.parentElement;
        }
    };
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener("click", () => revealHashTarget(link.getAttribute("href")));
    });
    window.addEventListener("hashchange", () => revealHashTarget(window.location.hash));
    revealHashTarget(window.location.hash);

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && siteNav.classList.contains("is-open")) {
            closeMenu();
            menuToggle.focus();
        }
    });

    const updateHeader = () => {
        header.classList.toggle("is-scrolled", window.scrollY > 30);
    };

    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });

    const sections = navLinks.map(link => document.querySelector(link.getAttribute("href"))).filter(Boolean);
    const navigationObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            navLinks.forEach((link) => {
                const matchesSection = link.getAttribute("href") === `#${entry.target.id}`;
                link.classList.toggle("is-active", matchesSection);
                if (matchesSection) link.setAttribute("aria-current", "location");
                else link.removeAttribute("aria-current");
            });
        });
    }, { rootMargin: "-35% 0px -55%", threshold: 0 });

    sections.forEach((section) => navigationObserver.observe(section));

    const revealItems = document.querySelectorAll(".reveal");
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px" });

    revealItems.forEach((item) => revealObserver.observe(item));

    const weddingDate = new Date("2027-06-09T00:00:00+01:00");
    const countdownParts = {
        days: document.getElementById("countdownDays"),
        hours: document.getElementById("countdownHours"),
        minutes: document.getElementById("countdownMinutes"),
        seconds: document.getElementById("countdownSeconds")
    };

    const pad = (value, length = 2) => String(value).padStart(length, "0");

    const updateCountdown = () => {
        const remaining = Math.max(0, weddingDate.getTime() - Date.now());
        const totalSeconds = Math.floor(remaining / 1000);
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        countdownParts.days.textContent = pad(days, 3);
        countdownParts.hours.textContent = pad(hours);
        countdownParts.minutes.textContent = pad(minutes);
        countdownParts.seconds.textContent = pad(seconds);
    };

    updateCountdown();
    window.setInterval(updateCountdown, 1000);

    const keepsakeDialog = document.getElementById("keepsakeDialog");
    const openKeepsake = document.getElementById("openKeepsake");
    const closeKeepsake = document.getElementById("closeKeepsake");
    const legacyEnvelope = document.getElementById("legacyEnvelope");
    const legacyEnvelopeImage = document.getElementById("legacyEnvelopeImage");
    const legacyEnvelopePrompt = document.getElementById("legacyEnvelopePrompt");
    const legacyInvite = document.getElementById("legacyInvite");
    let envelopeTimer;

    const resetKeepsake = () => {
        window.clearTimeout(envelopeTimer);
        legacyEnvelope.setAttribute("aria-expanded", "false");
        legacyEnvelopeImage.src = "assets/Black%20C5%20Straight%20fl.png";
        legacyEnvelopeImage.alt = "Black save-the-date envelope";
        legacyEnvelopePrompt.textContent = "Click to open";
        legacyEnvelope.hidden = false;
        legacyInvite.hidden = true;
    };

    const closeKeepsakeDialog = () => {
        keepsakeDialog.close();
        body.classList.remove("dialog-open");
        resetKeepsake();
    };

    openKeepsake.addEventListener("click", () => {
        resetKeepsake();
        keepsakeDialog.showModal();
        body.classList.add("dialog-open");
    });

    closeKeepsake.addEventListener("click", closeKeepsakeDialog);

    legacyEnvelope.addEventListener("click", () => {
        window.clearTimeout(envelopeTimer);
        legacyEnvelope.setAttribute("aria-expanded", "true");
        legacyEnvelopeImage.src = "assets/black%20envelope%20open.png";
        legacyEnvelopeImage.alt = "Opened black save-the-date envelope";
        legacyEnvelopePrompt.textContent = "Our save the date";
        envelopeTimer = window.setTimeout(() => {
            legacyEnvelope.hidden = true;
            legacyInvite.hidden = false;
        }, 280);
    });

    keepsakeDialog.addEventListener("click", (event) => {
        if (event.target === keepsakeDialog) closeKeepsakeDialog();
    });

    keepsakeDialog.addEventListener("close", () => {
        body.classList.remove("dialog-open");
        resetKeepsake();
    });
});
