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

    const sections = Array.from(document.querySelectorAll("main section[id]"));
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

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const storySliders = document.querySelectorAll("[data-slider]");

    storySliders.forEach((slider) => {
        const slides = JSON.parse(slider.dataset.slides);
        const label = slider.dataset.sliderLabel;
        const image = slider.querySelector(".story-slider__image");
        const previousButton = slider.querySelector(".story-slider__button--previous");
        const nextButton = slider.querySelector(".story-slider__button--next");
        const dotsContainer = slider.querySelector(".story-slider__dots");
        const counter = slider.querySelector(".story-slider__counter");
        let currentIndex = 0;
        let changeTimer;
        let autoplayTimer;
        let touchStartX = null;
        let isChanging = false;
        let isInView = false;

        const dots = slides.map((slide, index) => {
            const dot = document.createElement("button");
            dot.className = "story-slider__dot";
            dot.type = "button";
            dot.setAttribute("aria-label", `Show ${label} photo ${index + 1} of ${slides.length}`);
            dot.addEventListener("click", () => showSlide(index));
            dotsContainer.appendChild(dot);
            return dot;
        });

        const updateDetails = () => {
            slider.dataset.currentSlide = String(currentIndex + 1);
            counter.textContent = `${currentIndex + 1} / ${slides.length}`;
            dots.forEach((dot, index) => {
                const isActive = index === currentIndex;
                dot.classList.toggle("is-active", isActive);
                dot.setAttribute("aria-pressed", String(isActive));
            });
        };

        const stopAutoplay = () => window.clearTimeout(autoplayTimer);

        const startAutoplay = () => {
            stopAutoplay();
            if (reduceMotion || document.hidden || !isInView || slider.matches(":hover") || slider.contains(document.activeElement)) return;
            autoplayTimer = window.setTimeout(() => showSlide(currentIndex + 1), 5500);
        };

        const swapImage = (nextIndex) => {
            image.classList.add("is-changing");
            changeTimer = window.setTimeout(() => {
                currentIndex = nextIndex;
                image.src = slides[currentIndex];
                image.alt = `${label}, photo ${currentIndex + 1} of ${slides.length}`;
                updateDetails();
                window.requestAnimationFrame(() => image.classList.remove("is-changing"));
                isChanging = false;
                startAutoplay();
            }, reduceMotion ? 0 : 180);
        };

        function showSlide(requestedIndex) {
            if (isChanging) return;
            const nextIndex = (requestedIndex + slides.length) % slides.length;
            if (nextIndex === currentIndex) {
                startAutoplay();
                return;
            }

            stopAutoplay();
            isChanging = true;
            const preloader = new Image();
            preloader.onload = () => swapImage(nextIndex);
            preloader.onerror = () => {
                isChanging = false;
                startAutoplay();
            };
            preloader.src = slides[nextIndex];
        }

        previousButton.addEventListener("click", () => showSlide(currentIndex - 1));
        nextButton.addEventListener("click", () => showSlide(currentIndex + 1));
        slider.addEventListener("mouseenter", stopAutoplay);
        slider.addEventListener("mouseleave", startAutoplay);
        slider.addEventListener("focusin", stopAutoplay);
        slider.addEventListener("focusout", () => window.setTimeout(startAutoplay, 0));
        slider.addEventListener("pointerdown", (event) => {
            if (event.pointerType === "touch") touchStartX = event.clientX;
        });
        slider.addEventListener("pointerup", (event) => {
            if (touchStartX === null) return;
            const distance = event.clientX - touchStartX;
            touchStartX = null;
            if (Math.abs(distance) < 45) return;
            showSlide(currentIndex + (distance < 0 ? 1 : -1));
        });
        document.addEventListener("visibilitychange", startAutoplay);

        const autoplayObserver = new IntersectionObserver((entries) => {
            isInView = entries[0].isIntersecting;
            if (isInView) startAutoplay();
            else stopAutoplay();
        }, { threshold: 0.35 });
        autoplayObserver.observe(slider);

        updateDetails();
    });

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

    const rsvpForm = document.getElementById("rsvpForm");
    const formStatus = document.getElementById("formStatus");
    const submitButton = rsvpForm.querySelector("button[type='submit']");
    const submitButtonLabel = submitButton.querySelector("span");

    rsvpForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!rsvpForm.reportValidity()) return;

        submitButton.disabled = true;
        submitButtonLabel.textContent = "Sending response";
        formStatus.textContent = "";
        formStatus.classList.remove("is-error");

        try {
            const response = await fetch(rsvpForm.action, {
                method: "POST",
                headers: { Accept: "application/json" },
                body: new FormData(rsvpForm)
            });

            const result = await response.json().catch(() => ({}));
            if (!response.ok || result.success === "false") {
                throw new Error("The response could not be sent.");
            }

            rsvpForm.reset();
            formStatus.textContent = "Thank you. Your response has been sent to Nick and Belinda.";
        } catch (error) {
            formStatus.classList.add("is-error");
            formStatus.innerHTML = "We couldn’t send your response. Please try again or email <a href=\"mailto:n.graham.space@gmail.com?subject=Wedding%20RSVP\">Nick and Belinda</a>.";
        } finally {
            submitButton.disabled = false;
            submitButtonLabel.textContent = "Send response";
        }
    });

    const keepsakeDialog = document.getElementById("keepsakeDialog");
    const openKeepsake = document.getElementById("openKeepsake");
    const closeKeepsake = document.getElementById("closeKeepsake");
    const legacyEnvelope = document.getElementById("legacyEnvelope");
    const legacyEnvelopeImage = document.getElementById("legacyEnvelopeImage");
    const legacyEnvelopePrompt = document.getElementById("legacyEnvelopePrompt");
    const legacyInvite = document.getElementById("legacyInvite");

    const resetKeepsake = () => {
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
        legacyEnvelope.setAttribute("aria-expanded", "true");
        legacyEnvelopeImage.src = "assets/black%20envelope%20open.png";
        legacyEnvelopeImage.alt = "Opened black save-the-date envelope";
        legacyEnvelopePrompt.textContent = "Our save the date";
        window.setTimeout(() => {
            legacyEnvelope.hidden = true;
            legacyInvite.hidden = false;
        }, 280);
    });

    keepsakeDialog.addEventListener("click", (event) => {
        if (event.target === keepsakeDialog) closeKeepsakeDialog();
    });

    keepsakeDialog.addEventListener("close", () => {
        body.classList.remove("dialog-open");
    });
});
