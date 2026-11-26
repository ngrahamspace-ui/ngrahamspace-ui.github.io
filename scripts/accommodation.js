document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("staySearch");
    const checkin = document.getElementById("stayCheckin");
    const checkout = document.getElementById("stayCheckout");
    const adults = document.getElementById("stayAdults");
    const bookingLinks = document.querySelectorAll("[data-stay-booking]");
    const map = document.getElementById("stayMap");
    const mapHeading = document.getElementById("stayMapHeading");
    const mapStatus = document.getElementById("stayMapStatus");
    const openMap = document.getElementById("openStayMap");
    const mapButtons = document.querySelectorAll("[data-stay-map]");
    const allStays = "hotels near Eastington Park Gloucestershire";

    const bookingURL = place => {
        const url = new URL("https://www.booking.com/searchresults.html");
        url.search = new URLSearchParams({
            ss: place, checkin: checkin.value, checkout: checkout.value,
            group_adults: adults.value, group_children: "0", no_rooms: "1"
        });
        return url.href;
    };

    const updateDates = () => {
        if (checkin.value) {
            const nextDay = new Date(`${checkin.value}T00:00:00Z`);
            nextDay.setUTCDate(nextDay.getUTCDate() + 1);
            const minimumCheckout = nextDay.toISOString().slice(0, 10);
            checkout.min = minimumCheckout;
            if (checkout.value && checkout.value < minimumCheckout) checkout.value = minimumCheckout;
        }
        checkout.setCustomValidity(checkout.value && checkin.value && checkout.value <= checkin.value
            ? "Please choose a check-out date after your check-in date." : "");
        bookingLinks.forEach(link => { link.href = bookingURL(link.dataset.stayBooking); });
    };
    form.addEventListener("input", updateDates);
    form.addEventListener("change", updateDates);
    updateDates();

    form.addEventListener("submit", event => {
        event.preventDefault();
        updateDates();
        if (!form.reportValidity()) return;
        window.open(bookingURL("Eastington, Gloucestershire"), "_blank", "noopener,noreferrer");
    });
    bookingLinks.forEach(link => link.addEventListener("click", event => {
        updateDates();
        if (!form.reportValidity()) event.preventDefault();
    }));

    const showMap = (query, name) => {
        const url = new URL("https://www.google.com/maps");
        url.search = new URLSearchParams({ q: query, z: query === allStays ? "12" : "15", output: "embed" });
        map.src = url.href;
        map.title = `Interactive map: ${name}`;
        mapHeading.textContent = name;
        mapStatus.textContent = query === allStays ? "Explore the map or choose a place from the list." : `Showing ${name} on the map.`;
        const fullMap = new URL("https://www.google.com/maps/search/");
        fullMap.search = new URLSearchParams({ api: "1", query });
        openMap.href = fullMap.href;
        mapButtons.forEach(button => button.setAttribute("aria-pressed", String(button.dataset.stayMap === query)));
    };
    mapButtons.forEach(button => {
        button.setAttribute("aria-pressed", "false");
        button.addEventListener("click", () => {
            showMap(button.dataset.stayMap, button.dataset.stayName);
            if (window.matchMedia("(max-width: 900px)").matches) {
                mapHeading.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
            }
        });
    });
    document.getElementById("showAllStays").addEventListener("click", () => showMap(allStays, "Eastington & nearby stays"));
});
