import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync('_preview/index.html', 'utf8');
const main = readFileSync('scripts/main.js', 'utf8');
const code = main.slice(main.indexOf('    const rsvpForm ='), main.indexOf('    const keepsakeDialog ='));
for (const field of ['Starter', 'Main']) {
    const select = html.match(new RegExp(`<select[^>]*name="${field}"[^>]*>([\\s\\S]*?)</select>`))[1];
    assert.equal([...select.matchAll(/<option value="[^"]+"/g)].length, 3);
}
assert(!html.includes('name="Dessert"'));
assert(!html.includes('Cheese soufflé'));
const callbacks = {};
let attendance;
let payload;
let valid = true;
const meal = { hidden: true, disabled: true };
const attendanceDetails = { hidden: true, disabled: true };
const picker = { open: false, hidden: false };
const starter = { value: '', selectedOptions: [{ dataset: {} }] };
const mainChoice = { value: '', selectedOptions: [{ dataset: {} }] };
const descriptions = { starterDescription: {}, mainDescription: {}, mealSummary: {} };
const label = { textContent: '' };
const button = { querySelector: () => label };
const status = { classList: { remove() {}, add() {} } };
const form = {
    action: 'https://example.invalid/rsvp',
    querySelector(selector) { return selector.startsWith('button') ? button : attendance && { value: attendance }; },
    addEventListener(name, fn) { callbacks[name] = fn; },
    reportValidity() { return valid; },
    reset() { attendance = undefined; }
};
class RSVPData extends FormData {
    constructor() {
        super();
        this.set('Attendance', attendance);
        if (!meal.disabled) {
            this.set('Starter', 'Warm Asian duck salad');
            this.set('Main', '10-hour slow-braised shin of beef');
            this.append('Wine preference', 'Red');
            this.append('Wine preference', 'Rosé');
        }
        if (!attendanceDetails.disabled) {
            this.set('Song request', 'Dancing Queen — ABBA');
            this.set('Note', 'Dietary test note');
        }
    }
}
vm.runInNewContext(code, {
    document: { getElementById: id => ({ rsvpForm: form, formStatus: status, mealPreferences: meal, attendanceDetails, mealPicker: picker, starterChoice: starter, mainChoice, ...descriptions })[id] },
    FormData: RSVPData,
    fetch: async (url, options) => { payload = options.body; return { ok: true, json: async () => ({ success: 'true' }) }; }
});
assert(!meal.disabled && !picker.hidden, 'Menu should be discoverable before accepting.');
assert(attendanceDetails.hidden && attendanceDetails.disabled);
attendance = 'Joyfully accept'; callbacks.change();
assert(!meal.disabled && !picker.hidden && starter.required && mainChoice.required);
assert(!attendanceDetails.hidden && !attendanceDetails.disabled);
valid = false; await callbacks.submit({ preventDefault() {} }); assert.equal(payload, undefined);
valid = true; await callbacks.submit({ preventDefault() {} });
assert.equal(payload.get('Wine preference'), 'Red, Rosé');
assert.equal(payload.get('Starter'), 'Warm Asian duck salad');
assert.equal(payload.get('Main'), '10-hour slow-braised shin of beef');
assert.equal(payload.get('Song request'), 'Dancing Queen — ABBA');
assert.equal(payload.get('Note'), 'Dietary test note');
assert(!meal.disabled && !picker.open && !starter.required, 'Successful submission must reset meal controls.');
assert(attendanceDetails.hidden && attendanceDetails.disabled);
attendance = 'Regretfully decline'; callbacks.change();
await callbacks.submit({ preventDefault() {} });
assert(!payload.has('Starter') && !payload.has('Main') && !payload.has('Wine preference'));
assert(!payload.has('Song request') && !payload.has('Note'));
console.log('PASS: three choices per course; attendance toggles meals; validation blocks incomplete responses; multiple wines and song survive submission; declining omits meal choices. No RSVP was sent.');
