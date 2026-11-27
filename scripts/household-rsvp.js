document.addEventListener("DOMContentLoaded", () => {
    // Sample invitations only. Replace this trial with private server-side lookup
    // before adding real guests; never publish a real guest list in browser code.
    const invitations = [
        { title: "Example couple", guests: ["Alex Example", "Jamie Example"] },
        { title: "Example family", guests: ["Taylor Example", "Casey Example", "Rowan Example", "Ellis Example"] }
    ];
    const normalizeName = name => name.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-GB");
    const form = document.getElementById("rsvpForm");
    const lookup = document.getElementById("lookupStage");
    const party = document.getElementById("partyStage");
    const review = document.getElementById("reviewStage");
    const complete = document.getElementById("completeStage");
    const status = document.getElementById("formStatus");
    const guests = document.getElementById("partyGuests");
    const extras = document.getElementById("householdExtras");
    const email = document.getElementById("householdEmail");
    const song = document.getElementById("songRequest");
    let invitation;
    let currentStep = 0;
    let cards = [];

    const element = (tag, className, text) => {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    };
    const announce = message => { status.textContent = message; };
    const showStep = (step, focus = true) => {
        currentStep = step;
        [lookup, party, review, complete].forEach((section, index) => {
            section.hidden = index !== step;
            if (section instanceof HTMLFieldSetElement) section.disabled = index !== step;
        });
        document.querySelectorAll(".rsvp-steps li").forEach((item, index) => {
            if (index === Math.min(step, 2)) item.setAttribute("aria-current", "step");
            else item.removeAttribute("aria-current");
        });
        announce("");
        if (focus) [lookup, party, review, complete][step].querySelector("h3").focus();
    };
    const selectedAttendance = card => card.querySelector('input[type="radio"]:checked')?.value;
    const updateCard = (card, changedControl) => {
        const attendance = selectedAttendance(card);
        const accepting = attendance === "Joyfully accept";
        const meals = card.querySelector(".household-guest-meals");
        meals.hidden = !accepting;
        meals.disabled = !accepting;
        const starter = card.querySelector('[data-guest-field="starter"]');
        const main = card.querySelector('[data-guest-field="main"]');
        [starter, main].forEach(select => {
            select.required = accepting;
            const description = card.querySelector(`[data-description="${select.dataset.guestField}"]`);
            description.textContent = select.selectedOptions[0]?.dataset.description || `Choose a ${select.dataset.guestField === "starter" ? "starter" : "main"} to see the dish details.`;
        });
        card.querySelector(".guest-response-status").textContent = accepting
            ? (starter.value && main.value ? "Attending · Menu selected" : "Attending · Choose a menu")
            : attendance ? "Declining" : "Choose attendance";
        if (changedControl?.type === "radio" && accepting) card.open = true;
        const anyAttending = cards.some(item => selectedAttendance(item) === "Joyfully accept");
        extras.hidden = !anyAttending;
        extras.disabled = !anyAttending;
    };
    const renderGuests = () => {
        guests.replaceChildren();
        cards = invitation.guests.map((name, index) => {
            const card = element("details", "household-guest");
            card.open = index === 0;
            const summary = element("summary");
            const heading = element("span");
            heading.append(element("strong", "", name), element("small", "guest-response-status", "Choose attendance"));
            summary.append(heading);
            card.append(summary);
            const body = element("div", "household-guest-body");
            const attendance = element("fieldset", "attendance-field");
            attendance.append(element("legend", "", `Will ${name} attend?`));
            const options = element("div", "attendance-options");
            ["Joyfully accept", "Regretfully decline"].forEach(value => {
                const label = element("label");
                const radio = element("input");
                radio.type = "radio";
                radio.name = `Guest ${index + 1} attendance`;
                radio.value = value;
                radio.required = true;
                const text = element("span");
                text.append(element("strong", "", value));
                label.append(radio, text);
                options.append(label);
            });
            attendance.append(options);
            const meals = element("fieldset", "household-guest-meals");
            meals.disabled = true;
            meals.hidden = true;
            meals.append(element("legend", "visually-hidden", `${name}’s meal and dietary choices`));
            meals.append(document.getElementById("guestMealTemplate").content.cloneNode(true));
            meals.querySelectorAll("[data-guest-field]").forEach((control, controlIndex) => {
                const kind = control.dataset.guestField;
                control.id = `guest-${index}-${kind}-${controlIndex}`;
                control.name = `Guest ${index + 1} ${kind}`;
                const label = meals.querySelector(`[data-label="${kind}"]`);
                if (label) label.htmlFor = control.id;
                const description = meals.querySelector(`[data-description="${kind}"]`);
                if (description) {
                    description.id = `${control.id}-description`;
                    control.setAttribute("aria-describedby", description.id);
                }
            });
            body.append(attendance, meals);
            card.append(body);
            card.addEventListener("change", event => updateCard(card, event.target));
            guests.append(card);
            return card;
        });
        cards.forEach(card => updateCard(card));
    };
    const findInvitation = () => {
        if (!form.reportValidity()) return;
        const name = normalizeName(document.getElementById("invitationName").value);
        const matches = invitations.filter(item => item.guests.some(guest => normalizeName(guest) === name));
        if (matches.length !== 1) {
            announce(matches.length > 1
                ? "We found more than one invitation for that name. Please get in touch so we can help."
                : "We couldn’t match that sample invitation. Try Alex Example or Taylor Example.");
            return;
        }
        const [match] = matches;
        invitation = match;
        email.value = "";
        song.value = "";
        document.getElementById("partyTitle").textContent = match.title;
        renderGuests();
        showStep(1);
    };
    const responses = () => cards.map((card, index) => {
        const attendance = selectedAttendance(card);
        const accepting = attendance === "Joyfully accept";
        return {
            name: invitation.guests[index], attendance,
            starter: accepting ? card.querySelector('[data-guest-field="starter"]').value : "",
            main: accepting ? card.querySelector('[data-guest-field="main"]').value : "",
            wine: accepting ? [...card.querySelectorAll('[data-guest-field="wine"]:checked')].map(control => control.value) : [],
            diet: accepting ? card.querySelector('[data-guest-field="diet"]').value.trim() : ""
        };
    });
    const reviewResponse = () => {
        if (!form.reportValidity()) return;
        const list = responses();
        const target = document.getElementById("householdReview");
        target.replaceChildren();
        const attending = list.filter(guest => guest.attendance === "Joyfully accept").length;
        target.append(element("p", "household-totals", `${attending} attending · ${list.length - attending} declining`));
        list.forEach(guest => {
            const item = element("article", "guest-review");
            item.append(element("h4", "", guest.name), element("p", "", guest.attendance));
            if (guest.attendance === "Joyfully accept") {
                item.append(element("p", "", `Starter: ${guest.starter}`), element("p", "", `Main: ${guest.main}`), element("p", "", `Wine: ${guest.wine.join(", ") || "None selected"}`));
                if (guest.diet) item.append(element("p", "", `Guest needs: ${guest.diet}`));
            }
            target.append(item);
        });
        target.append(element("p", "", `Contact email: ${email.value.trim()}`));
        if (attending && song.value.trim()) target.append(element("p", "", `Song suggestion: ${song.value.trim()}`));
        showStep(2);
    };

    form.addEventListener("invalid", event => {
        const card = event.target.closest(".household-guest");
        if (card) card.open = true;
    }, true);
    document.getElementById("findInvitation").addEventListener("click", findInvitation);
    document.querySelectorAll("[data-demo-name]").forEach(button => button.addEventListener("click", () => {
        document.getElementById("invitationName").value = button.dataset.demoName;
        findInvitation();
    }));
    const setPartyAttendance = value => cards.forEach(card => {
        [...card.querySelectorAll('input[type="radio"]')].find(radio => radio.value === value).checked = true;
        updateCard(card);
    });
    document.getElementById("acceptParty").addEventListener("click", () => setPartyAttendance("Joyfully accept"));
    document.getElementById("declineParty").addEventListener("click", () => setPartyAttendance("Regretfully decline"));
    document.getElementById("changeInvitation").addEventListener("click", () => showStep(0));
    document.getElementById("reviewResponse").addEventListener("click", reviewResponse);
    document.getElementById("editResponse").addEventListener("click", () => showStep(1));
    document.getElementById("restartTrial").addEventListener("click", () => {
        form.reset();
        invitation = undefined;
        cards = [];
        guests.replaceChildren();
        document.getElementById("householdReview").replaceChildren();
        showStep(0);
    });
    form.addEventListener("submit", event => {
        event.preventDefault();
        if (currentStep === 0) findInvitation();
        else if (currentStep === 1) reviewResponse();
        else if (currentStep === 2) showStep(3);
    });
    showStep(0, false);
});
