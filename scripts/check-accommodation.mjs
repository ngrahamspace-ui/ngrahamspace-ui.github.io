import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync('_preview/index.html', 'utf8');
for (const id of ['accommodation', 'travel', 'questions']) assert(html.includes(`id="${id}"`));
assert(!/32 guest rooms|prebooked|groomsmen|The Lazy Goose/.test(html));
assert(html.includes('Premier Inn Stroud'));
assert(!html.includes('12:45'));
assert(!html.includes('Time TBC'));
for (const time of ['12:15', '12:30', '14:00', '16:15', '18:45', '19:15', '21:00', '2027-06-10T01:00:00+01:00']) {
    assert(html.includes(`datetime="${time}"`));
}
for (const match of html.matchAll(/<img[^>]*src="([^"]+)"/g)) assert(existsSync(decodeURIComponent(match[1])), `Missing image: ${match[1]}`);
const callbacks = {};
const checkin = { value: '2027-06-09' };
const checkout = { value: '2027-06-10', setCustomValidity(message) { this.error = message; } };
const adults = { value: '2' };
const link = { dataset: { stayBooking: 'Stonehouse Court Hotel Stonehouse' }, addEventListener(name, fn) { this[name] = fn; } };
const mapButton = {
    dataset: { stayMap: 'Eastington Park, Spring Hill, Stonehouse GL10 3RY', stayName: 'Eastington Park' },
    setAttribute(name, value) { this[name] = value; },
    addEventListener(name, fn) { this[name] = fn; }
};
const elements = {
    staySearch: { addEventListener(name, fn) { callbacks[name] = fn; }, reportValidity() { return !!checkin.value && !!checkout.value && !checkout.error; } },
    stayCheckin: checkin, stayCheckout: checkout, stayAdults: adults,
    stayMap: {}, stayMapHeading: {}, stayMapStatus: {}, openStayMap: {},
    showAllStays: { addEventListener(name, fn) { this[name] = fn; } }
};
let opened;
vm.runInNewContext(readFileSync('scripts/accommodation.js', 'utf8'), {
    URL, URLSearchParams, Date,
    document: { addEventListener(name, fn) { fn(); }, getElementById: id => elements[id], querySelectorAll: selector => selector === '[data-stay-booking]' ? [link] : [mapButton] },
    window: { open(url) { opened = url; }, matchMedia() { return { matches: false }; } }
});
let url = new URL(link.href);
assert.equal(url.searchParams.get('checkin'), '2027-06-09');
assert.equal(url.searchParams.get('checkout'), '2027-06-10');
assert.equal(url.searchParams.get('ss'), 'Stonehouse Court Hotel Stonehouse');
checkin.value = '2027-06-11'; adults.value = '4'; callbacks.input();
url = new URL(link.href);
assert.equal(checkout.value, '2027-06-12');
assert.equal(url.searchParams.get('group_adults'), '4');
callbacks.submit({ preventDefault() {} });
assert.equal(new URL(opened).searchParams.get('ss'), 'Eastington, Gloucestershire');
mapButton.click();
assert.equal(new URL(elements.stayMap.src).searchParams.get('q'), mapButton.dataset.stayMap);
assert.equal(elements.stayMapHeading.textContent, 'Eastington Park');
assert.equal(mapButton['aria-pressed'], 'true');
elements.showAllStays.click();
assert.equal(mapButton['aria-pressed'], 'false');
assert.equal(new URL(elements.openStayMap.href).searchParams.get('query'), 'hotels near Eastington Park Gloucestershire');
opened = undefined; checkin.value = ''; callbacks.submit({ preventDefault() {} }); assert.equal(opened, undefined);
console.log('PASS: itinerary and sections present; images exist; date and guest changes update booking links; invalid searches blocked; map selection and reset work. No hotel search or booking was submitted.');
