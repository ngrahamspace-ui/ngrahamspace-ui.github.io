// Rebuild the encrypted landing page after editing _preview/index.html.
// Supply the preview password on stdin; it is never written to the output.
import { readFileSync, writeFileSync } from 'node:fs';
import { randomBytes, pbkdf2Sync, createCipheriv } from 'node:crypto';

const password = readFileSync(0, 'utf8').trim();
if (!password) throw new Error('Supply the preview password on stdin.');
const salt = randomBytes(16);
const iv = randomBytes(12);
const iterations = 600000;
const key = pbkdf2Sync(password, salt, iterations, 32, 'sha256');
const cipher = createCipheriv('aes-256-gcm', key, iv);
const source = readFileSync(new URL('../_preview/index.html', import.meta.url), 'utf8')
    .replace('<head>', '<head>\n    <meta name="robots" content="noindex, nofollow, noarchive">')
    .replace('<body>', '<body>\n    <button type="button" id="lockPreview" style="position:fixed;bottom:16px;right:16px;z-index:10000;padding:10px 18px;border:1px solid #ad8b57;border-radius:4px;background:#fffdf9;color:#26372c;cursor:pointer;font:14px Arial,sans-serif">Lock preview</button>\n    <script>document.getElementById("lockPreview").addEventListener("click", () => location.reload());</script>');
const encrypted = Buffer.concat([cipher.update(source, 'utf8'), cipher.final(), cipher.getAuthTag()]);
const payload = { salt: salt.toString('base64'), iv: iv.toString('base64'), iterations, data: encrypted.toString('base64') };
const template = readFileSync(new URL('../_preview/lock.html', import.meta.url), 'utf8');
writeFileSync(new URL('../index.html', import.meta.url), template.replace('/* ENCRYPTED_PREVIEW */', JSON.stringify(payload)));
console.log('Encrypted preview generated.');
