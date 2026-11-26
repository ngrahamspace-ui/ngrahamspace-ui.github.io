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
    const mealPreferences = document.getElementById("mealPreferences");
    const attendanceDetails = document.getElementById("attendanceDetails");
    const mealPicker = document.getElementById("mealPicker");
    const starter = document.getElementById("starterChoice");
    const main = document.getElementById("mainChoice");
    const updateMealPreferences = (event) => {
        const attendance = rsvpForm.querySelector('input[name="Attendance"]:checked')?.value;
        const attending = attendance === "Joyfully accept";
        attendanceDetails.hidden = !attending;
        attendanceDetails.disabled = !attending;
        mealPicker.hidden = attendance === "Regretfully decline";
        mealPreferences.disabled = attendance === "Regretfully decline";
        starter.required = attending;
        main.required = attending;
        if (event?.target.name === "Attendance" && attending) mealPicker.open = true;
        document.getElementById("starterDescription").textContent = starter.selectedOptions[0]?.dataset.description || "Three starters to choose from.";
        document.getElementById("mainDescription").textContent = main.selectedOptions[0]?.dataset.description || "Three mains to choose from.";
        document.getElementById("mealSummary").textContent = starter.value && main.value
            ? `${starter.value} · ${main.value}`
            : "One starter · One main · A trio of desserts";
    };
    rsvpForm.addEventListener("change", updateMealPreferences);
    rsvpForm.addEventListener("invalid", (event) => {
        if (event.target === starter || event.target === main) mealPicker.open = true;
    }, true);
    updateMealPreferences();

    rsvpForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!rsvpForm.reportValidity()) return;

        submitButton.disabled = true;
        submitButtonLabel.textContent = "Sending response";
        formStatus.textContent = "";
        formStatus.classList.remove("is-error");

        try {
            const formData = new FormData(rsvpForm);
            const wines = formData.getAll("Wine preference");
            if (!mealPreferences.disabled) {
                formData.set("Wine preference", wines.length ? wines.join(", ") : "No wine preference selected");
            }
            const response = await fetch(rsvpForm.action, {
                method: "POST",
                headers: { Accept: "application/json" },
                body: formData
            });

            const result = await response.json().catch(() => ({}));
            if (!response.ok || result.success === "false") {
                throw new Error("The response could not be sent.");
            }

            rsvpForm.reset();
            mealPicker.open = false;
            updateMealPreferences();
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
