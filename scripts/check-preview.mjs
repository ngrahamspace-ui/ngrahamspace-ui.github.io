import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import vm from 'node:vm';

const page = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
assert(!page.includes('id="main-content"'), 'Wedding markup must not be exposed in the locked page.');
assert(page.includes('noindex, nofollow, noarchive'));
const script = page.match(/<script>([\s\S]*?)<\/script>/)[1];
const elements = Object.fromEntries(['unlockForm', 'password', 'unlockButton', 'message'].map(id => [id, {
    value: '', disabled: false, textContent: '', attributes: {},
    addEventListener(type, callback) { this.callback = callback; },
    removeAttribute(name) { delete this.attributes[name]; },
    setAttribute(name, value) { this.attributes[name] = value; },
    select() { this.selected = true; }
}]));
let rendered = '';
const document = { getElementById: id => elements[id], open() {}, write(html) { rendered = html; }, close() {} };
vm.runInNewContext(script, { document, window: { crypto: webcrypto }, crypto: webcrypto, atob, Uint8Array, TextEncoder, TextDecoder });
elements.password.value = 'wrong-password';
await elements.unlockForm.callback({ preventDefault() {} });
assert.equal(rendered, '');
assert.equal(elements.password.attributes['aria-invalid'], 'true');
assert.equal(elements.unlockButton.disabled, false);
elements.password.value = readFileSync(0, 'utf8').trim();
await elements.unlockForm.callback({ preventDefault() {} });
assert(rendered.includes('id="main-content"'), 'Correct password must open the wedding page.');
assert(rendered.includes('id="lockPreview"'));
assert(rendered.includes('Wedding Breakfast &amp; speeches'), 'Latest edits must be included.');
assert(!rendered.includes('data-slider'), 'Preview must use static photos.');
assert(rendered.includes('scripts/main.js?v=2.8'));
assert(rendered.includes('scripts/household-rsvp.js?v=2.8'));
console.log('PASS: wrong password rejected; correct password decrypts latest content; relock control and original script preserved.');
