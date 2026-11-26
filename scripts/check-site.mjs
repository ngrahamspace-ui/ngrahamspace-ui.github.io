import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const html = readFileSync('_preview/index.html', 'utf8');
const dom = new JSDOM(html, { url: 'https://nickandbelinda.com/', runScripts: 'outside-only' });
const w = dom.window;
await new Promise(resolve => w.addEventListener('load', resolve));
const d = w.document;
const get = id => d.getElementById(id);
const click = id => get(id).click();
const errors = [];
w.addEventListener('error', event => errors.push(event.error));
const observers = [];
w.IntersectionObserver = class {
    constructor(callback) { this.callback = callback; this.targets = []; observers.push(this); }
    observe(target) { this.targets.push(target); }
    unobserve(target) { this.targets = this.targets.filter(item => item !== target); }
};
const timers = new Map();
let timerId = 100000;
const nativeSetTimeout = w.setTimeout.bind(w);
const nativeClearTimeout = w.clearTimeout.bind(w);
w.setTimeout = (callback, delay, ...args) => {
    if (delay !== 280) return nativeSetTimeout(callback, delay, ...args);
    timers.set(++timerId, callback); return timerId;
};
w.clearTimeout = id => { if (!timers.delete(id)) nativeClearTimeout(id); };
w.setInterval = () => 0;
let mobile = false;
let reducedMotion = false;
const mediaChanges = new Map();
w.matchMedia = query => ({
    get matches() { return query.includes('reduced-motion') ? reducedMotion : mobile; },
    addEventListener(type, callback) { if (type === 'change') mediaChanges.set(query, callback); }
});
let scrolled;
w.HTMLElement.prototype.scrollIntoView = function(options) { scrolled = { target: this, options }; };
const dialog = get('keepsakeDialog');
dialog.showModal = () => { dialog.open = true; };
dialog.close = () => { dialog.open = false; dialog.dispatchEvent(new w.Event('close')); };
const opened = [];
w.open = (...args) => opened.push(args);

// All static link targets, assets, control labels and external link protections.
const ids = [...d.querySelectorAll('[id]')].map(element => element.id);
assert.equal(new Set(ids).size, ids.length, 'Duplicate IDs break links and labels');
for (const link of d.querySelectorAll('a')) {
    const href = link.getAttribute('href');
    assert(href && href !== '#', 'Empty or placeholder link');
    assert((link.getAttribute('aria-label') || link.textContent).trim(), 'Link needs an accessible name');
    if (href.startsWith('#')) assert(get(decodeURIComponent(href.slice(1))), `Missing target: ${href}`);
    else assert(/^(https:|mailto:|tel:)/.test(href), `Unexpected link protocol: ${href}`);
    if (link.target === '_blank') assert(link.relList.contains('noopener'), 'New tabs need noopener');
}
for (const button of d.querySelectorAll('button')) assert((button.getAttribute('aria-label') || button.textContent).trim(), 'Button needs a name');
for (const control of d.querySelectorAll('input, select, textarea')) assert(control.labels.length || control.getAttribute('aria-label'), `Unlabelled control: ${control.id}`);
for (const element of d.querySelectorAll('[aria-controls], [aria-labelledby], [aria-describedby]')) {
    for (const attribute of ['aria-controls', 'aria-labelledby', 'aria-describedby']) {
        for (const id of (element.getAttribute(attribute) || '').split(/\s+/).filter(Boolean)) assert(get(id), `Missing ARIA target: ${id}`);
    }
}
for (const element of d.querySelectorAll('img[src], script[src], link[rel="stylesheet"][href]')) {
    const path = element.getAttribute('src') || element.getAttribute('href');
    if (!path.startsWith('https:')) assert(existsSync(decodeURIComponent(path.split('?')[0])), `Missing asset: ${path}`);
}
const css = readFileSync('styles/style.css', 'utf8');
// Check the complete responsive cascade: a late desktop rule previously shrank
// mobile labels, while the fixed panel could collapse inside the filtered header.
// jsdom has no viewport layout or CSS-variable resolution, so select media rules
// and resolve the palette explicitly; these checks do not claim rendered QA.
const palette = Object.fromEntries([...css.matchAll(/--([a-z-]+):\s*(#[0-9a-f]+);/g)].map(match => [match[1], match[2]]));
const cssParser = new JSDOM('<style></style>');
cssParser.window.document.querySelector('style').textContent = css.replace(/var\(--([a-z-]+)\)/g, (match, name) => palette[name] || match);
const rulesForWidth = (rules, width) => [...rules].map(rule => {
    if (!rule.conditionText) return rule.cssText;
    const sizes = [...rule.conditionText.matchAll(/(max|min)-width:\s*(\d+)px/g)];
    if (!sizes.length || !sizes.every(([, type, size]) => type === 'max' ? width <= +size : width >= +size)) return '';
    return rulesForWidth(rule.cssRules, width);
}).join('\n');
for (const width of [320, 375, 390, 768, 844, 920, 921]) {
    const sample = new JSDOM(html);
    const document = sample.window.document;
    const style = document.createElement('style');
    style.textContent = rulesForWidth(cssParser.window.document.styleSheets[0].cssRules, width);
    document.head.append(style);
    const nav = document.getElementById('siteNav');
    const header = document.getElementById('siteHeader');
    nav.classList.add('is-open'); header.classList.add('menu-active');
    const navStyle = sample.window.getComputedStyle(nav);
    if (width <= 920) {
        assert.equal(navStyle.position, 'absolute', 'Dropdown must stay below the header rather than fill its containing block');
        assert.equal(navStyle.inset, '100% 0 auto');
        assert(navStyle.maxHeight.includes('dvh'), 'Short and landscape screens need a viewport height bound');
        assert.equal(navStyle.overflowY, 'auto', 'Every tab must remain reachable by scrolling');
        assert.equal(navStyle.justifyContent, 'flex-start', 'Overflow must not push the first tabs above the viewport');
        assert.equal(navStyle.opacity, '1');
        assert.equal(navStyle.backgroundColor, 'rgb(255, 253, 249)', 'Open panel must be opaque');
        assert.equal(sample.window.getComputedStyle(header).backgroundColor, navStyle.backgroundColor, 'Open header must also be opaque');
        const font = parseFloat(navStyle.fontSize) * (navStyle.fontSize.endsWith('rem') ? 16 : 1);
        assert(font >= 18, 'Late desktop styles must not shrink mobile labels');
        for (const link of nav.querySelectorAll('a')) {
            const linkStyle = sample.window.getComputedStyle(link);
            assert(parseFloat(linkStyle.minHeight) >= 44, 'Links need a comfortable tap target');
            assert.equal(linkStyle.flexShrink, '0', 'Short screens must scroll rather than squeeze targets');
        }
    } else {
        assert.equal(navStyle.position, 'static');
        assert.equal(navStyle.overflowY, 'visible');
    }
    sample.window.close();
}
cssParser.window.close();
for (const [, rawPath] of css.matchAll(/url\(["']?([^)'"\s]+)["']?\)/g)) {
    if (!/^(data:|https:)/.test(rawPath)) assert(existsSync(new URL(decodeURIComponent(rawPath), new URL('../styles/style.css', import.meta.url))), `Missing CSS asset: ${rawPath}`);
}
assert(!/nationalrail\.co\.uk|National Rail/.test(html));
assert(d.querySelector('a[href="https://www.thetrainline.com/stations/stonehouse"]'));
for (const href of ['mailto:n.graham.space@gmail.com', 'mailto:belindalake63@gmail.com', 'tel:+447542551093', 'tel:+447552422699', 'tel:+441453767777', 'tel:+441453750211']) assert(d.querySelector(`a[href="${href}"]`));

w.eval(readFileSync('scripts/main.js', 'utf8'));
w.eval(readFileSync('scripts/accommodation.js', 'utf8'));
d.dispatchEvent(new w.Event('DOMContentLoaded'));

// Mobile menu: each destination, Escape, repeated opens, active section and header.
for (const link of d.querySelectorAll('#siteNav a')) {
    d.querySelector('.menu-toggle').click();
    assert.equal(d.querySelector('.menu-toggle').getAttribute('aria-expanded'), 'true');
    assert(d.body.classList.contains('menu-open'));
    link.click();
    assert.equal(d.querySelector('.menu-toggle').getAttribute('aria-expanded'), 'false');
    assert(!get('siteNav').classList.contains('is-open'));
    const target = d.querySelector(link.getAttribute('href'));
    observers[0].callback([{ target, isIntersecting: true }]);
    assert.equal(d.querySelectorAll('#siteNav [aria-current="location"]').length, 1);
    assert.equal(link.getAttribute('aria-current'), 'location');
}
assert.equal(observers[0].targets.length, d.querySelectorAll('#siteNav a').length);
d.querySelector('.menu-toggle').click();
d.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape' }));
assert.equal(d.activeElement, d.querySelector('.menu-toggle'));
assert(!d.body.classList.contains('menu-open'));

// Dropdown keyboard/touch dismissal, focus, scroll reset and rotation to desktop.
const toggle = d.querySelector('.menu-toggle');
const menuLinks = [...get('siteNav').querySelectorAll('a')];
const assertClosed = () => {
    assert.equal(toggle.getAttribute('aria-expanded'), 'false');
    assert.equal(toggle.getAttribute('aria-label'), 'Open menu');
    assert.equal(toggle.querySelector('span').textContent, 'Menu');
    assert(!d.body.classList.contains('menu-open'));
};
toggle.click();
assert.equal(d.activeElement, menuLinks[0]);
assert.equal(toggle.getAttribute('aria-label'), 'Close menu');
for (const [key, target] of [['End', menuLinks.at(-1)], ['ArrowDown', menuLinks[0]], ['ArrowUp', menuLinks.at(-1)], ['Home', menuLinks[0]]]) {
    d.activeElement.dispatchEvent(new w.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    assert.equal(d.activeElement, target, key);
}
get('siteNav').scrollTop = 200;
toggle.click(); assertClosed();
toggle.click(); assert.equal(get('siteNav').scrollTop, 0);
get('hero-title').click(); assertClosed();
toggle.click(); get('openKeepsake').focus(); assertClosed();
toggle.click(); d.querySelector('.monogram').click(); assertClosed();
toggle.click(); mediaChanges.get('(max-width: 920px)')({ matches: false }); assertClosed();

Object.defineProperty(w, 'scrollY', { value: 80, configurable: true });
w.dispatchEvent(new w.Event('scroll'));
assert(get('siteHeader').classList.contains('is-scrolled'));
const reveals = [...observers[1].targets];
observers[1].callback(reveals.map(target => ({ target, isIntersecting: true })), observers[1]);
assert(reveals.every(target => target.classList.contains('is-visible')));

// Native FAQ/taxi toggles and links to otherwise collapsed answers.
for (const details of d.querySelectorAll('#questions details, #taxi-options')) {
    details.open = false;
    details.querySelector('summary').click(); assert(details.open);
    details.querySelector('summary').click(); assert(!details.open);
}
for (const id of ['faq-parking', 'taxi-options']) {
    get(id).open = false;
    d.querySelector(`a[href="#${id}"]`).click();
    assert(get(id).open, `Cross-link must expand ${id}`);
    get(id).open = false;
    w.location.hash = `#${id}`;
    w.dispatchEvent(new w.Event('hashchange'));
    assert(get(id).open, `Hash navigation must expand ${id}`);
}

// Map selection/reset on desktop and mobile, including reduced motion.
for (const smallScreen of [false, true]) {
    mobile = smallScreen;
    for (const button of d.querySelectorAll('[data-stay-map]')) {
        scrolled = undefined;
        reducedMotion = button === d.querySelector('[data-stay-map]');
        button.click();
        assert.equal(new URL(get('stayMap').src).searchParams.get('q'), button.dataset.stayMap);
        assert.equal(new URL(get('openStayMap').href).searchParams.get('query'), button.dataset.stayMap);
        assert.equal(d.querySelectorAll('[data-stay-map][aria-pressed="true"]').length, 1);
        assert.equal(get('stayMapHeading').textContent, button.dataset.stayName);
        if (mobile) assert.equal(scrolled.options.behavior, reducedMotion ? 'auto' : 'smooth');
        else assert.equal(scrolled, undefined);
    }
    click('showAllStays');
    assert.equal(d.querySelectorAll('[data-stay-map][aria-pressed="true"]').length, 0);
    assert.equal(new URL(get('openStayMap').href).searchParams.get('query'), 'hotels near Eastington Park Gloucestershire');
}

// Real date inputs and browser validity; intercept external navigation entirely.
const stayForm = get('staySearch');
const input = element => element.dispatchEvent(new w.Event('input', { bubbles: true }));
const submit = () => stayForm.dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
for (const [checkin, minimum] of [['2027-12-31', '2028-01-01'], ['2028-02-28', '2028-02-29'], ['2028-02-29', '2028-03-01']]) {
    get('stayCheckin').value = checkin; get('stayCheckout').value = checkin; input(get('stayCheckin'));
    assert.equal(get('stayCheckout').value, minimum);
    for (const adults of ['1', '2', '3', '4']) {
        get('stayAdults').value = adults; input(get('stayAdults'));
        for (const link of d.querySelectorAll('[data-stay-booking]')) {
            const url = new URL(link.href);
            assert.equal(url.searchParams.get('ss'), link.dataset.stayBooking);
            assert.equal(url.searchParams.get('checkin'), checkin);
            assert.equal(url.searchParams.get('checkout'), minimum);
            assert.equal(url.searchParams.get('group_adults'), adults);
        }
        const count = opened.length; submit(); assert.equal(opened.length, count + 1);
        assert.equal(opened.at(-1)[2], 'noopener,noreferrer');
    }
}
get('stayCheckin').value = ''; input(get('stayCheckin'));
const count = opened.length; submit(); assert.equal(opened.length, count);
for (const link of d.querySelectorAll('[data-stay-booking]')) {
    const event = new w.MouseEvent('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(event); assert(event.defaultPrevented, 'Invalid dates must block hotel links');
}

// Keepsake open/reveal/close/backdrop/native Escape-close and rapid clicking.
for (let repeat = 0; repeat < 3; repeat++) {
    click('openKeepsake'); assert(dialog.open); assert(d.body.classList.contains('dialog-open'));
    click('legacyEnvelope'); click('legacyEnvelope');
    assert.equal(timers.size, 1, 'Repeated clicks must leave one animation');
    if (repeat === 0) {
        click('closeKeepsake'); assert.equal(timers.size, 0, 'Closing cancels animation');
    } else {
        for (const [id, callback] of timers) { timers.delete(id); callback(); }
        assert(!get('legacyInvite').hidden); assert(get('legacyEnvelope').hidden);
        if (repeat === 1) dialog.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
        else dialog.close();
    }
    assert(!dialog.open); assert(!d.body.classList.contains('dialog-open'));
    assert(get('legacyInvite').hidden); assert(!get('legacyEnvelope').hidden);
    assert.equal(get('legacyEnvelope').getAttribute('aria-expanded'), 'false');
}
assert.equal(errors.length, 0, errors.map(String).join('\n'));
console.log(`PASS: ${d.querySelectorAll('a').length} links, ${d.querySelectorAll('button').length} static buttons, asset/ARIA targets; opaque scrollable menu cascade at 7 widths, keyboard/dismissal/resize; FAQ/taxi disclosures, maps, date/adult combinations, invalid searches, keepsake and animation cancellation. External navigation intercepted.`);
w.close();
