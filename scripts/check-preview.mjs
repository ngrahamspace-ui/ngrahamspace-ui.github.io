import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { JSDOM } from 'jsdom';

const page = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const password = readFileSync(0, 'utf8').trim();
assert(password, 'Supply the preview password on stdin.');
assert(!page.includes('id="main-content"'), 'Wedding markup must stay encrypted.');
assert(page.includes('noindex, nofollow, noarchive'));
assert(!page.includes('Under maintenance'));
const script = page.match(/<script>([\s\S]*?)<\/script>/)[1];
const waitFor = async condition => {
    for (let attempt = 0; attempt < 250; attempt++) {
        if (condition()) return;
        await new Promise(resolve => setTimeout(resolve, 20));
    }
    assert.fail('Unlock did not finish within five seconds');
};
const screen = async (reduced = false, crypto = webcrypto) => {
    const dom = new JSDOM(page, { url: 'https://nickandbelinda.com/', runScripts: 'outside-only' });
    const w = dom.window;
    await new Promise(resolve => w.addEventListener('load', resolve));
    Object.defineProperty(w, 'crypto', { value: crypto });
    w.TextEncoder = TextEncoder; w.TextDecoder = TextDecoder;
    w.matchMedia = () => ({ matches: reduced });
    const rendered = [];
    const delays = [];
    const nativeTimeout = w.setTimeout.bind(w);
    w.setTimeout = (callback, delay) => { delays.push(delay); return nativeTimeout(callback, 0); };
    w.document.open = () => {};
    w.document.write = html => rendered.push(html);
    w.document.close = () => {};
    w.eval(script);
    const get = id => w.document.getElementById(id);
    const submit = () => get('unlockForm').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
    return { dom, w, get, submit, rendered, delays };
};

const normal = await screen();
const { get, submit, rendered, delays } = normal;
assert.equal(get('password').type, 'password');
assert(get('password').labels.length);
assert.equal(get('unlockForm').method, 'post', 'Fallback must not put the password in a URL');
for (const id of get('password').getAttribute('aria-describedby').split(' ')) assert(get(id));
assert.equal(normal.w.document.querySelectorAll('.invitation-wing[aria-hidden="true"]').length, 2);
get('showPassword').click();
assert.equal(get('password').type, 'text');
assert.equal(get('showPassword').getAttribute('aria-label'), 'Hide password');
assert.equal(get('showPassword').getAttribute('aria-pressed'), 'true');
get('showPassword').click();
assert.equal(get('password').type, 'password');

get('password').value = 'wrong-password';
submit(); submit();
assert(get('unlockButton').disabled);
assert(get('showPassword').disabled);
assert(get('password').readOnly);
assert.equal(get('unlockForm').getAttribute('aria-busy'), 'true');
await waitFor(() => !get('unlockButton').disabled);
assert.equal(rendered.length, 0);
assert.equal(delays.length, 0, 'Wrong passwords must not unfold the invitation');
assert.equal(get('password').getAttribute('aria-invalid'), 'true');
assert(!get('password').readOnly);
assert(!get('showPassword').disabled);
assert.equal(normal.w.document.activeElement, get('password'));
assert(get('invitation').classList.contains('is-mistaken'));

get('password').value = '  ' + password + '  ';
get('password').dispatchEvent(new normal.w.Event('input'));
assert(!get('password').hasAttribute('aria-invalid'));
assert(!get('invitation').classList.contains('is-mistaken'));
assert.equal(get('message').textContent, '');
submit(); submit();
await waitFor(() => rendered.length === 1);
assert(normal.w.document.body.classList.contains('is-opening'));
assert.deepEqual(delays, [1100], 'Successful entry should have one brief reveal');
assert(rendered[0].includes('id="main-content"'));
assert(rendered[0].includes('id="lockPreview"'));
assert(rendered[0].includes('location.reload()'));
assert(rendered[0].includes('Wedding Breakfast &amp; speeches'));
assert(!rendered[0].includes('data-slider'));
assert(!rendered[0].includes('id="invitationCode"'));
assert(rendered[0].includes('scripts/main.js?v=2.13'));
assert(rendered[0].includes('scripts/household-rsvp.js?v=2.14'));
normal.dom.window.close();

const reduced = await screen(true);
reduced.get('password').value = 'wrong-password';
reduced.submit();
await waitFor(() => !reduced.get('unlockButton').disabled);
assert(!reduced.get('invitation').classList.contains('is-mistaken'));
reduced.get('password').value = password;
reduced.submit();
await waitFor(() => reduced.rendered.length === 1);
assert.equal(reduced.delays.length, 0, 'Reduced motion should open immediately');
assert(!reduced.w.document.body.classList.contains('is-opening'));
reduced.dom.window.close();

const unsupported = await screen(false, {});
unsupported.get('password').value = password;
unsupported.submit();
assert(unsupported.get('message').textContent.includes('HTTPS'));
assert.equal(unsupported.rendered.length, 0);
assert(!unsupported.get('unlockButton').disabled);
assert(!unsupported.get('password').readOnly);
unsupported.dom.window.close();
console.log('PASS: invitation controls and labels; password visibility; wrong-password recovery; double-submit prevention; successful decryption with one reveal; reduced-motion immediate entry; unsupported-browser message; latest code-free RSVP and relock control preserved.');
