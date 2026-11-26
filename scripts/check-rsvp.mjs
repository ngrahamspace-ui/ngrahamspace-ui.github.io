import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync('_preview/index.html', 'utf8');
const main = readFileSync('scripts/main.js', 'utf8');
const code = main.slice(main.indexOf('    const rsvpForm ='), main.indexOf('    const keepsakeDialog ='));
for (const field of ['Starter', 'Main']) {
    assert.equal([...html.matchAll(new RegExp(`name="${field}"`, 'g'))].length, 3);
}
assert(!html.includes('name="Dessert"'));
assert(!html.includes('Cheese soufflé'));
const callbacks = {};
let attendance;
let payload;
let valid = true;
const meal = { hidden: true, disabled: true };
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
        this.set('Song request', 'Dancing Queen — ABBA');
    }
}
vm.runInNewContext(code, {
    document: { getElementById: id => ({ rsvpForm: form, formStatus: status, mealPreferences: meal })[id] },
    FormData: RSVPData,
    fetch: async (url, options) => { payload = options.body; return { ok: true, json: async () => ({ success: 'true' }) }; }
});
assert(meal.disabled && meal.hidden);
attendance = 'Joyfully accept'; callbacks.change();
assert(!meal.disabled && !meal.hidden);
valid = false; await callbacks.submit({ preventDefault() {} }); assert.equal(payload, undefined);
valid = true; await callbacks.submit({ preventDefault() {} });
assert.equal(payload.get('Wine preference'), 'Red, Rosé');
assert.equal(payload.get('Starter'), 'Warm Asian duck salad');
assert.equal(payload.get('Main'), '10-hour slow-braised shin of beef');
assert.equal(payload.get('Song request'), 'Dancing Queen — ABBA');
assert(meal.disabled && meal.hidden, 'Successful submission must reset meal controls.');
attendance = 'Regretfully decline'; callbacks.change();
await callbacks.submit({ preventDefault() {} });
assert(!payload.has('Starter') && !payload.has('Main') && !payload.has('Wine preference'));
console.log('PASS: three choices per course; attendance toggles meals; validation blocks incomplete responses; multiple wines and song survive submission; declining omits meal choices. No RSVP was sent.');
