import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const html = readFileSync('_preview/index.html', 'utf8');
const dom = new JSDOM(html, { url: 'https://nickandbelinda.com/', runScripts: 'outside-only' });
const w = dom.window;
await new Promise(resolve => w.addEventListener('load', resolve));
let requests = 0;
w.fetch = () => { requests++; throw new Error('Trial must never send requests'); };
w.eval(readFileSync('scripts/household-rsvp.js', 'utf8'));
w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
const d = w.document;
const click = id => d.getElementById(id).click();
const change = control => control.dispatchEvent(new w.Event('change', { bubbles: true }));
const cards = () => [...d.querySelectorAll('.household-guest')];
const attend = (card, accepting) => {
    const radio = [...card.querySelectorAll('input[type="radio"]')].find(control => control.value === (accepting ? 'Joyfully accept' : 'Regretfully decline'));
    radio.checked = true; change(radio);
};
const choose = (card, starterIndex = 1, mainIndex = 1) => {
    const starter = card.querySelector('[data-guest-field="starter"]');
    const main = card.querySelector('[data-guest-field="main"]');
    starter.selectedIndex = starterIndex; main.selectedIndex = mainIndex;
    change(starter); change(main);
    return [starter.value, main.value];
};
const validEmail = () => { d.getElementById('householdEmail').value = 'trial@example.invalid'; };
const reviewText = () => d.getElementById('householdReview').textContent;

assert(!d.getElementById('lookupStage').hidden);
assert.equal(d.getElementById('invitationCode'), null, 'RSVP must not require an invitation code');
d.getElementById('invitationName').value = 'Unknown';
click('findInvitation');
assert(!d.getElementById('lookupStage').hidden);
assert(d.getElementById('formStatus').textContent.includes('couldn’t match'));

// Any named household member can look up their group without a code.
for (const [name, size] of [['  aLeX   eXaMpLe  ', 2], ['Jamie Example', 2], ['Taylor Example', 4], ['Casey Example', 4], ['Rowan Example', 4], ['Ellis Example', 4]]) {
    d.getElementById('invitationName').value = name;
    d.getElementById('rsvpForm').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
    assert(!d.getElementById('partyStage').hidden);
    assert.equal(cards().length, size);
    click('changeInvitation');
}
for (const name of ['', '   ', 'Example', 'Alex', 'Alex Examples']) {
    d.getElementById('invitationName').value = name;
    click('findInvitation');
    assert(!d.getElementById('lookupStage').hidden, 'Incomplete or unmatched names must not open a household');
}

// All menu combinations in a mixed-attendance couple.
for (let starterIndex = 1; starterIndex <= 3; starterIndex++) {
    for (let mainIndex = 1; mainIndex <= 3; mainIndex++) {
        d.querySelector('[data-demo-name="Alex Example"]').click();
        assert.equal(cards().length, 2);
        const [first, second] = cards();
        assert(first.querySelector('.household-guest-meals').disabled);
        assert(d.getElementById('householdExtras').hidden);
        attend(first, true); attend(second, false);
        assert(!first.querySelector('.household-guest-meals').hidden);
        assert(second.querySelector('.household-guest-meals').disabled);
        validEmail(); first.open = false;
        click('reviewResponse');
        assert(!d.getElementById('partyStage').hidden, 'Incomplete meals must block review');
        assert(first.open, 'Validation must reveal the incomplete guest');
        const [starter, main] = choose(first, starterIndex, mainIndex);
        first.querySelector('[data-guest-field="wine"][value="Red"]').checked = true;
        first.querySelector('[data-guest-field="wine"][value="Rosé"]').checked = true;
        first.querySelector('[data-guest-field="diet"]').value = 'Dietary note for Alex';
        d.getElementById('songRequest').value = 'Our shared song';
        click('reviewResponse');
        assert(!d.getElementById('reviewStage').hidden);
        for (const value of [starter, main, 'Red, Rosé', 'Dietary note for Alex', 'Our shared song', 'trial@example.invalid', '1 attending · 1 declining']) assert(reviewText().includes(value), value);
        assert.equal(d.querySelectorAll('.guest-review').length, 2);
        click('editResponse');
        assert.equal(first.querySelector('[data-guest-field="main"]').value, main);
        click('reviewResponse'); click('finishTrial');
        assert(!d.getElementById('completeStage').hidden);
        click('restartTrial');
    }
}

// Four-person family: independent choices, two declines, and hidden data exclusion.
d.querySelector('[data-demo-name="Taylor Example"]').click();
assert.equal(cards().length, 4);
click('acceptParty');
assert(cards().every(card => !card.querySelector('.household-guest-meals').disabled));
cards().forEach((card, index) => choose(card, index % 3 + 1, (index + 1) % 3 + 1));
cards()[2].querySelector('[data-guest-field="diet"]').value = 'Do not include declined guest note';
attend(cards()[2], false); attend(cards()[3], false);
validEmail(); click('reviewResponse');
assert(reviewText().includes('2 attending · 2 declining'));
assert(!reviewText().includes('Do not include declined guest note'));
assert.equal(d.querySelectorAll('.guest-review').length, 4);
click('editResponse'); click('declineParty');
assert(d.getElementById('householdExtras').hidden && d.getElementById('householdExtras').disabled);
validEmail(); click('reviewResponse');
assert(reviewText().includes('0 attending · 4 declining'));
assert(!reviewText().includes('Starter:'));
assert(!reviewText().includes('Song suggestion:'));
assert.equal(requests, 0);
assert.equal(d.querySelectorAll('#our-story img').length, 1);
assert(html.includes('park at Eastington Park and leave your car there for the celebrations'));
console.log('PASS: code-free full-name lookup for every sample household member; case/spacing tolerance; unmatched names blocked; all 9 meal combinations; couple/family mixed attendance; required validation; guest notes; shared email/song; review/edit/reset; no real submissions.');
dom.window.close();
