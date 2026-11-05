import { site } from '../data/site.js';
import { esc } from '../lib/util.js';
import { layout } from '../templates/layout.js';
import { breadcrumbs, breadcrumbSchema, faqBlock, faqSchema, shareBar, pageHead } from '../templates/components.js';
import { CHEAT_SHEET } from '../assets/js/lib/romanized.js';
import { exampleSvg } from '../lib/photo-figure.js';
import { BS_MONTHS_EN, BS_MONTHS_NE, BS_MIN_YEAR, BS_MAX_YEAR, BS_PROVISIONAL_FROM, AD_MONTHS_EN, WEEKDAYS_EN, bsToAd, daysInBsMonth, toNepaliDigits } from '../assets/js/lib/bs-date.js';

export const TOOLS = [
  {
    slug: 'english-to-nepali',
    name: 'Nepali Typing: English to Nepali',
    short: 'Type Nepali with English letters',
    blurb: 'Type “mero naam” and get “मेरो नाम”. Romanized Nepali to Unicode, live, with smart spelling for common words.',
    sample: ['namaste', 'नमस्ते'],
  },
  {
    slug: 'preeti-to-unicode',
    name: 'Preeti to Unicode Converter',
    short: 'Preeti ↔ Unicode, both ways',
    blurb: 'Convert old Preeti text to Nepali Unicode, or Unicode back to Preeti for a Preeti document. Also Romanized to Preeti. Live, free, in your browser.',
    sample: ['g]kfn', 'नेपाल'],
  },
  {
    slug: 'nepali-keyboard',
    name: 'Nepali Keyboard',
    short: 'On-screen Nepali keyboard, Preeti or Romanized',
    blurb: 'Type Nepali Unicode with your keyboard using the familiar Preeti layout or Romanized keys, or tap the on-screen keys on your phone.',
    sample: ['g]kfn', 'नेपाल'],
  },
  {
    slug: 'nepali-date-converter',
    name: 'Nepali Date Converter',
    short: 'BS ↔ AD, with a Nepali calendar',
    blurb: 'Convert Bikram Sambat (BS) to AD and back, see today’s Nepali date, and browse any month of the Nepali calendar.',
    sample: ['2083/07/15', '1 Nov 2026'],
  },
  {
    slug: 'age-calculator',
    name: 'Age Calculator',
    short: 'Exact age in years, months and days',
    blurb: 'Your exact age, total days lived and next birthday, for anyone, anywhere. Enter your birth date in AD or Nepali BS.',
    sample: ['1 Jan 2000', '26 y 10 m'],
  },
  {
    slug: 'dv-photo-tool',
    name: 'DV Lottery Photo Tool',
    short: 'Check and crop DV and passport size photos',
    blurb: 'Check your DV (EDV) photo, then crop it to 600×600 pixels under 240 kB. Also Nepal passport size 35×45 mm, 2×2 inch and custom sizes, with a 4×6 print sheet.',
    sample: ['4032×3024', '600×600'],
    latin: true,
  },
];

const toolPath = (slug) => `/tools/${slug}/`;
const toolBySlug = (slug) => TOOLS.find((t) => t.slug === slug);

function related(current) {
  return `<section class="related-tools" aria-labelledby="rt-h">
  <h2 id="rt-h">More free tools</h2>
  <div class="tool-mini-grid">${TOOLS.filter((t) => t.slug !== current)
    .map((t) => `<a class="tool-mini" href="${toolPath(t.slug)}"><b>${esc(t.name)}</b><span>${esc(t.short)}</span></a>`)
    .join('')}</div>
</section>`;
}

function toolPage({ t, h1, title, description, lead, toolHtml, explainer, faqs, script }) {
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Tools', path: '/tools/' },
    { name: t.name, path: toolPath(t.slug) },
  ];
  const body = `${pageHead({ crumbs, eyebrow: 'Free tool · runs on your device', title: esc(h1 || t.name), lead })}
<section class="wrap tool-wrap">${toolHtml}</section>
<section class="wrap-narrow prose tool-explainer">${explainer}</section>
<section class="wrap-narrow">${faqBlock(faqs)}${shareBar(`${site.url}${toolPath(t.slug)}`, t.name)}${related(t.slug)}</section>`;
  return (version) =>
    layout({
      title,
      ogTitle: t.name,
      description,
      path: toolPath(t.slug),
      image: `/images/og/tool-${t.slug}.jpg`,
      body,
      version,
      section: '/tools/',
      scripts: [script],
      // No WebApplication schema: Google requires real ratings or reviews for it, and we don't have any yet.
      schema: [faqSchema(faqs), breadcrumbSchema(crumbs)],
    });
}

// ---------------------------------------------------------------------------

const cheatTable = (rows) =>
  `<table class="cheat"><tbody>${rows.map(([a, b]) => `<tr><td><kbd>${esc(a)}</kbd></td><td lang="ne">${esc(b)}</td></tr>`).join('')}</tbody></table>`;

export function renderRomanized(version) {
  const t = toolBySlug('english-to-nepali');
  const toolHtml = `<div class="tool" id="rz-tool">
  <div class="tool-options" role="group" aria-label="Options">
    <label class="switch"><input type="checkbox" id="rz-smart" checked><span>Smart spelling</span></label>
    <label class="switch"><input type="checkbox" id="rz-digits" checked><span>Nepali digits (१२३)</span></label>
    <label class="switch"><input type="checkbox" id="rz-danda" checked><span>Full stop → ।</span></label>
  </div>
  <div class="panes">
    <div class="pane">
      <label for="rz-in" class="pane-label">Type in English letters</label>
      <textarea id="rz-in" spellcheck="false" autocapitalize="off" autocomplete="off" placeholder="Try: mero naam Hari ho. ma nepalma baschhu." rows="8"></textarea>
      <div class="pane-foot"><span id="rz-count">0 words</span><button type="button" class="btn-ghost" id="rz-clear">Clear</button></div>
    </div>
    <div class="pane pane-out">
      <label for="rz-out" class="pane-label">नेपाली (Unicode)</label>
      <textarea id="rz-out" lang="ne" readonly rows="8" placeholder="नेपाली यहाँ देखिन्छ"></textarea>
      <div class="pane-foot"><button type="button" class="btn" id="rz-copy">Copy Nepali</button><button type="button" class="btn-ghost" id="rz-download">Download .txt</button></div>
    </div>
  </div>
  <div class="examples" aria-label="Examples"><span>Try:</span>
    ${['namaste', 'mero desh nepal ho.', 'tapaai*lai dashain ko shubhakaamanaa!', 'kasto xa?', 'bidyaarthI', '{Facebook} maa share garnus\\'].map((e) => `<button type="button" class="ex" data-ex="${esc(e)}">${esc(e)}</button>`).join('')}
  </div>
  <details class="cheatsheet" open>
    <summary>Typing cheat sheet</summary>
    <div class="cheat-grid">
      <div><h3>Vowels</h3>${cheatTable(CHEAT_SHEET.vowels)}</div>
      <div><h3>Consonants</h3>${cheatTable(CHEAT_SHEET.consonants)}</div>
      <div><h3>Signs</h3>${cheatTable(CHEAT_SHEET.signs)}</div>
    </div>
  </details>
</div>`;

  const explainer = `<h2>How to type Nepali with English letters</h2>
<p>Write each Nepali word the way it sounds, using English letters, and the Nepali Unicode appears on the right as you type. This is called <strong>Romanized Nepali</strong>, and it is the same system most Nepali Unicode keyboards use, so what you learn here works elsewhere too.</p>
<ol>
<li><strong>Double a vowel to make it long.</strong> <code>a</code> → अ, <code>aa</code> → आ; <code>i</code> → इ, <code>ee</code> → ई; <code>u</code> → उ, <code>oo</code> → ऊ. So <code>naam</code> gives नाम.</li>
<li><strong>Capital letters give the “hard” sounds.</strong> <code>T D N</code> → ट ड ण, and <code>Sh</code> → ष. Lower case <code>t d n</code> stays त द न.</li>
<li><strong>Letters join automatically.</strong> Two consonants together make a conjunct: <code>namaste</code> → नमस्ते, <code>prashna</code> → प्रश्न.</li>
<li><strong>Use <code>M</code> for ं and <code>*</code> for ँ.</strong> <code>saMgIt</code> → संगीत, <code>sa*ga</code> → सँग.</li>
<li><strong>Put English words in braces.</strong> <code>{Facebook}</code> stays “Facebook”.</li>
</ol>
<p><strong>Smart spelling</strong> fixes a few dozen everyday words that people usually type with short vowels, such as <code>nepal</code> → नेपाल, <code>kathmandu</code> → काठमाडौं and <code>dhanyabad</code> → धन्यवाद, and turns a final <code>lai</code> into लाई. Switch it off to get the strict letter-by-letter result.</p>
<h2>Nepali typing on phone, laptop and Word</h2>
<p>This tool works in any browser, so it is the quickest way to type Nepali on a laptop, a library computer or a phone with no Nepali keyboard installed: type here, then copy into Facebook, WhatsApp, Gmail, Word or Google Docs. To type Nepali directly in every app, add a Nepali keyboard to your phone or computer; the <a href="/how-to-type-in-nepali-unicode-romanized/">Nepali typing guide</a> shows how on Android, iPhone, Windows, Mac, MS Word and Google Docs.</p>
<h2>Nepali Unicode, not Preeti</h2>
<p>Everything you type here is <strong>Nepali Unicode</strong>: real Devanagari letters that work on every device and that Google can search. Old fonts such as <strong>Preeti</strong> only look Nepali on computers that have the font. Already have text in Preeti? Change it with the <a href="/tools/preeti-to-unicode/">Preeti to Unicode converter</a>. Learned to type on the Preeti layout? The <a href="/tools/nepali-keyboard/">Nepali keyboard</a> keeps the same keys.</p>
<p>New to Nepali typing? Read the full guide: <a href="/how-to-type-in-nepali-unicode-romanized/">how to type in Nepali Unicode on phone and computer</a>. Need to change old Preeti text into Unicode? Use the <a href="/tools/preeti-to-unicode/">Preeti to Unicode converter</a>.</p>`;

  const faqs = [
    { q: 'Is this English to Nepali translation?', a: 'No. It converts the <em>sounds</em> you type in English letters into Nepali script (transliteration). “mero naam” becomes “मेरो नाम”. To translate meaning from English to Nepali you need a translator; this tool is for typing Nepali when you only have an English keyboard.' },
    { q: 'How do I type आ, ई and ऊ?', a: 'Double the vowel or use a capital: <code>aa</code> or <code>A</code> for आ/ा, <code>ee</code> or <code>I</code> for ई/ी, <code>oo</code> or <code>U</code> for ऊ/ू.' },
    { q: 'How do I type ट, ठ, ड, ढ, ण and ष?', a: 'Use capitals: <code>T</code> ट, <code>Th</code> ठ, <code>D</code> ड, <code>Dh</code> ढ, <code>N</code> ण and <code>Sh</code> ष.' },
    { q: 'How do I write ऋ and कृ?', a: 'Use capital <code>R</code> (or <code>rri</code>): <code>R</code> gives ऋ, and <code>kR</code> gives कृ, so <code>kRShNa</code> becomes कृष्ण.' },
    { q: 'How do I end a word with a halanta (्)?', a: 'Type a backslash after it: <code>garchhan\\</code> gives गर्छन्. Without the backslash a final consonant keeps its normal sound, so <code>naam</code> gives नाम.' },
    { q: 'Can I paste the result into Facebook, Word or Google Docs?', a: 'Yes. The output is standard Unicode Devanagari, so it works in Facebook, Messenger, WhatsApp, Gmail, Word, Google Docs and websites, on phones and computers, with no special font.' },
    { q: 'Is this Nepali typing tool free?', a: 'Yes, completely free, with no sign-up and no limit on how much you type. The conversion runs in your browser, so it keeps working even if your internet drops after the page has loaded.' },
    { q: 'Can I type Nepali on my phone with this?', a: 'Yes. Open this page in your phone browser, type with your normal English keyboard, and copy the Nepali. If you type Nepali every day, add a Nepali keyboard to your phone instead; the <a href="/how-to-type-in-nepali-unicode-romanized/">typing guide</a> shows how.' },
    { q: 'Is my text sent anywhere?', a: 'No. The conversion runs entirely in your browser. Nothing you type is uploaded or stored on a server.' },
  ];

  return toolPage({
    t,
    title: `Nepali Typing Online: Easy English to Nepali Unicode Typing | ${site.name}`,
    description: 'Type in English letters and get Nepali Unicode instantly: “mero naam” → “मेरो नाम”. Free Nepali typing with smart spelling. Copy, download, works on phone.',
    lead: 'Type Nepali the way it sounds in English letters. <span lang="ne">“mero naam” → “मेरो नाम”</span>, instantly, right in your browser.',
    toolHtml,
    explainer,
    faqs,
    script: '/assets/js/tool-romanized.js',
  })(version);
}

export function renderPreeti(version) {
  const t = toolBySlug('preeti-to-unicode');
  const toolHtml = `<div class="tool" id="pr-tool">
  <div class="seg seg-lg" role="radiogroup" aria-label="Conversion">
    <button type="button" role="radio" aria-checked="true" data-mode="p2u">Preeti → Unicode</button>
    <button type="button" role="radio" aria-checked="false" data-mode="u2p">Unicode → Preeti</button>
    <button type="button" role="radio" aria-checked="false" data-mode="r2p">Romanized → Preeti</button>
  </div>
  <div class="panes">
    <div class="pane">
      <label for="pr-in" class="pane-label" id="pr-in-label">Paste Preeti text</label>
      <textarea id="pr-in" spellcheck="false" autocapitalize="off" autocomplete="off" rows="9" placeholder="Paste text typed in the Preeti font, e.g. g]kfn"></textarea>
      <div class="pane-foot"><span id="pr-count">0 words</span><label class="btn-ghost file-btn">Open .txt<input type="file" id="pr-file" accept=".txt,text/plain" hidden></label><button type="button" class="btn-ghost" id="pr-clear">Clear</button></div>
    </div>
    <div class="pane pane-out">
      <label for="pr-out" class="pane-label" id="pr-out-label">Nepali Unicode</label>
      <textarea id="pr-out" readonly rows="9" lang="ne" placeholder="नेपाली युनिकोड यहाँ देखिन्छ"></textarea>
      <div class="pane-foot"><button type="button" class="btn" id="pr-copy">Copy</button><button type="button" class="btn-ghost" id="pr-swap" title="Use the result as input and reverse the direction">⇄ Swap</button><button type="button" class="btn-ghost" id="pr-download">Download .txt</button></div>
    </div>
  </div>
  <p class="tool-note" id="pr-note"></p>
  <div class="examples" aria-label="Examples"><span>Try:</span><span id="pr-examples"></span></div>
</div>`;

  const explainer = `<h2>How to convert Preeti to Unicode</h2>
<ol>
<li><strong>Copy your Preeti text</strong> from Word, Excel or an old document. It doesn't matter that it looks like <code>g]kfn</code> once the font is gone: that is what Preeti text really is.</li>
<li><strong>Paste it into the left box.</strong> The Nepali Unicode appears on the right as you paste: <code>g]kfn</code> → <span lang="ne">नेपाल</span>.</li>
<li><strong>Copy the result</strong> and paste it wherever you need it: Facebook, Gmail, Google Docs, a website, or back into Word with a Unicode font such as <strong>Kalimati</strong>, <strong>Mangal</strong> or <strong>Nirmala UI</strong>.</li>
</ol>
<h2>Why convert Preeti to Unicode?</h2>
<p><strong>Preeti</strong> is an old Nepali font that draws Devanagari shapes on top of ordinary English keys. Text typed in Preeti only looks Nepali on a computer that has the Preeti font, and becomes <code>g]kfn xf]</code> everywhere else: on phones, in email, on the web and in Google Docs. Google can't search it either.</p>
<p><strong>Unicode</strong> stores real Nepali letters. It works on every device and in every app, with no special font, and it is what government offices, news sites and Google use. If you are starting something new, type in Unicode from the start with our <a href="/tools/english-to-nepali/">Nepali typing tool</a> or the <a href="/tools/nepali-keyboard/">Nepali keyboard</a> (which keeps the Preeti layout you know).</p>
<h2>Unicode to Preeti, for Preeti documents</h2>
<p>Some offices and print shops still use documents set in Preeti. Choose <strong>Unicode → Preeti</strong>, paste Nepali Unicode text, and copy the result into your Preeti document. The result looks like English letters and symbols (<span lang="ne">नेपाल</span> → <code>g]kfn</code>) <strong>until you set the font to Preeti</strong> in Word; then it shows as Nepali.</p>
<p><strong>Romanized → Preeti</strong> does the same, starting from Nepali typed in English letters: <code>mero naam</code> → <code>d]/f] gfd</code>, which shows as <span lang="ne">मेरो नाम</span> in the Preeti font.</p>
<h2>Tips for a clean conversion</h2>
<ul>
<li><strong>Convert only the Preeti parts.</strong> In Preeti, ordinary keys are Nepali letters (<code>1</code> is <span lang="ne">ज्ञ</span>, <code>a</code> is <span lang="ne">ब</span>), so English words or numbers typed in another font will be converted too.</li>
<li><strong>Word documents:</strong> select the Preeti text in Word, copy and paste it here, then paste the Unicode back and choose a Unicode font. A whole page at a time works fine.</li>
<li><strong>Check names and rare conjuncts.</strong> The converter handles the usual Preeti rules (ि typed before the letter, reph <code>{</code> after it, <code>k</code> + <code>m</code> for <span lang="ne">फ</span>), but unusual spellings can still come out wrong. If one does, <a href="/contact-us/">tell me which word</a> and I'll fix it.</li>
</ul>
<h2>For developers: open source</h2>
<p>The converter is free and open source (MIT licence), with no dependencies: <a href="https://github.com/iammanoj807/nepali-unicode-tools" rel="noopener">nepali-unicode-tools on GitHub</a>. Use it in your own website or app.</p>`;

  const faqs = [
    { q: 'Why does the Unicode → Preeti result look like English letters?', a: 'That is normal. Preeti text is stored as English keys, so <span lang="ne">नेपाल</span> becomes <code>g]kfn</code>. Paste it into Word (or any program) and set the font to <strong>Preeti</strong>, and it shows as Nepali.' },
    { q: 'How do I convert Preeti to Kalimati?', a: 'Kalimati is a Unicode font, so converting Preeti to Kalimati is the same as converting Preeti to Unicode. Paste your Preeti text here, copy the Unicode result, paste it into your document and set the font to Kalimati.' },
    { q: 'How do I convert Mangal or Kalimati text to Preeti?', a: 'Mangal and Kalimati are Unicode fonts. Choose <strong>Unicode → Preeti</strong>, paste the text, and set the font of the result to Preeti in your document.' },
    { q: 'Can I convert a whole Word file?', a: 'Yes, by copy and paste: select all the Preeti text in Word (Ctrl + A), copy it, paste it here, then paste the Unicode result back into Word and choose a Unicode font. Plain .txt files can also be opened directly with the “Open .txt” button.' },
    { q: 'Where can I download the Preeti font?', a: 'Preeti is a font owned by its creator, so we don’t host it. For anything new, you don’t need it: type and share in Unicode, which needs no special font. Keep Preeti only for old documents that require it.' },
    { q: 'Is my text uploaded anywhere?', a: 'No. The conversion runs entirely in your browser, and nothing you paste is sent to a server.' },
  ];

  return toolPage({
    t,
    title: `Preeti to Unicode Converter: Nepali Unicode & Unicode to Preeti | ${site.name}`,
    description: 'Free Preeti to Unicode converter (Nepali Unicode converter): paste Preeti text, get Kalimati or Mangal Unicode instantly. Also Unicode to Preeti.',
    lead: 'Paste old <strong>Preeti</strong> text and get proper <strong>Nepali Unicode</strong>, instantly: <code>g]kfn</code> → <span lang="ne">नेपाल</span>. Or convert Unicode back to Preeti.',
    toolHtml,
    explainer,
    faqs,
    script: '/assets/js/tool-preeti.js',
  })(version);
}

export function renderKeyboard(version) {
  const t = toolBySlug('nepali-keyboard');
  const toolHtml = `<div class="tool kb-tool" id="kb-tool">
  <div class="kb-top">
    <div class="seg seg-lg" role="radiogroup" aria-label="Keyboard layout">
      <button type="button" role="radio" aria-checked="true" data-layout="preeti">Preeti layout</button>
      <button type="button" role="radio" aria-checked="false" data-layout="romanized">Romanized</button>
    </div>
    <label class="switch"><input type="checkbox" id="kb-on" checked><span>Type in Nepali <kbd>Ctrl</kbd>+<kbd>Space</kbd></span></label>
  </div>
  <label for="kb-text" class="sr-only">Your Nepali text</label>
  <textarea id="kb-text" lang="ne" spellcheck="false" autocapitalize="off" autocomplete="off" rows="6" placeholder="यहाँ टाइप गर्नुहोस्… Start typing, or tap the keys below."></textarea>
  <div class="pane-foot kb-actions"><span id="kb-count">0 words</span><button type="button" class="btn" id="kb-copy">Copy</button><button type="button" class="btn-ghost" id="kb-download">Download .txt</button><button type="button" class="btn-ghost" id="kb-clear">Clear</button></div>
  <div class="kb" id="kb" aria-label="On-screen Nepali keyboard"></div>
  <p class="tool-note" id="kb-note"></p>
</div>`;

  const explainer = `<h2>Two ways to type Nepali</h2>
<p>This keyboard writes real <strong>Nepali Unicode</strong>, which works in Facebook, WhatsApp, Gmail, Word and Google Docs on every device. Choose the layout you know:</p>
<ul>
<li><strong>Preeti layout.</strong> The layout many people in Nepal learned to type on: the same keys as the Preeti font. <code>g]kfn</code> types <span lang="ne">नेपाल</span>. Your old habits work: type <kbd>l</kbd> (ि) <em>before</em> the letter, <kbd>{</kbd> (reph) after it, and <kbd>k</kbd> + <kbd>m</kbd> for <span lang="ne">फ</span>. The output is still proper Unicode, not Preeti font text.</li>
<li><strong>Romanized.</strong> Type how it sounds: <code>namaste</code> → <span lang="ne">नमस्ते</span>. The same rules as our <a href="/tools/english-to-nepali/">English to Nepali typing tool</a>.</li>
</ul>
<h3>Tips</h3>
<ul>
<li>Press <kbd>Ctrl</kbd> + <kbd>Space</kbd> to switch between Nepali and English typing without leaving the box.</li>
<li>The on-screen keys show the Nepali letter each key types. Hold <kbd>Shift</kbd> (or tap ⇧) to see the second letter on each key.</li>
<li>On a phone, the on-screen keyboard replaces your phone’s keyboard, so you can type Nepali without installing anything.</li>
<li>A space finishes each word. While you are still inside a word, backspace removes the last key you pressed.</li>
</ul>
<p>Have old text that was already typed in the Preeti font? Don't retype it: paste it into the <a href="/tools/preeti-to-unicode/">Preeti to Unicode converter</a>.</p>`;

  const faqs = [
    { q: 'Is this the Preeti keyboard layout?', a: 'Yes. The “Preeti layout” option puts each letter on the same key as the Preeti font, which is the layout most people in Nepal learned to type on. The difference is that this keyboard produces Unicode, so your text works everywhere, not only on computers with the Preeti font.' },
    { q: 'Do I need to install anything?', a: 'No. It works in your browser on Windows, Mac, Android and iPhone. On a computer you can type with your physical keyboard; on a phone, tap the on-screen keys.' },
    { q: 'Why does my keyboard type the wrong letter on some symbol keys?', a: 'It shouldn’t: the keyboard reads which physical key you press, using the standard US key positions that Preeti is based on, so it works the same on UK and other keyboards. If a key still looks wrong, <a href="/contact-us/">let me know which one</a>.' },
    { q: 'How do I type English words in between?', a: 'Turn off “Type in Nepali” (or press Ctrl + Space), type your English words, then switch back.' },
    { q: 'Where is my text saved?', a: 'Only in your own browser, so it is still there if you reload the page. Nothing is uploaded. Use Copy or Download to keep it.' },
  ];

  return toolPage({
    t,
    title: `Nepali Keyboard Layout Online: Preeti and Romanized | ${site.name}`,
    description: 'Free online Nepali keyboard: type Nepali Unicode with the Preeti layout or Romanized keys, or tap the on-screen keyboard. Copy to Facebook, Word or anywhere.',
    lead: 'Type Nepali Unicode with the <strong>Preeti layout</strong> you already know, or with <strong>Romanized</strong> keys. On a phone, just tap the keys.',
    toolHtml,
    explainer,
    faqs,
    script: '/assets/js/tool-keyboard.js',
  })(version);
}

export function renderAge(version) {
  const t = toolBySlug('age-calculator');
  const years = [];
  for (let y = BS_MIN_YEAR; y <= BS_MAX_YEAR; y++) years.push(y);
  const toolHtml = `<div class="tool age-tool" id="age-tool">
  <div class="seg seg-lg" role="radiogroup" aria-label="Date of birth calendar">
    <button type="button" role="radio" aria-checked="true" data-cal="ad">Born (AD / English date)</button>
    <button type="button" role="radio" aria-checked="false" data-cal="bs">Born (BS / Nepali date)</button>
  </div>
  <div class="age-inputs">
    <label class="age-ad">Date of birth<input type="date" id="age-dob" min="1900-01-01"></label>
    <div class="age-bs bs-selects" hidden>
      <label>Year (BS)<select id="age-bs-y">${years.map((y) => `<option value="${y}">${y}</option>`).join('')}</select></label>
      <label>Month<select id="age-bs-m">${BS_MONTHS_EN.map((m, i) => `<option value="${i + 1}">${i + 1} · ${m}</option>`).join('')}</select></label>
      <label>Day<select id="age-bs-d"></select></label>
    </div>
    <label>Age on<input type="date" id="age-on"></label>
  </div>
  <div class="age-result" id="age-result" aria-live="polite">
    <p class="age-big"><span id="age-y">–</span><small>years</small> <span id="age-m">–</span><small>months</small> <span id="age-d">–</span><small>days</small></p>
    <div class="age-stats">
      <div><b id="age-total-months">–</b><span>months</span></div>
      <div><b id="age-total-weeks">–</b><span>weeks</span></div>
      <div><b id="age-total-days">–</b><span>days</span></div>
    </div>
    <ul class="age-facts">
      <li id="age-born"></li>
      <li id="age-next"></li>
      <li id="age-bs-born"></li>
      <li id="age-bs-next"></li>
    </ul>
  </div>
</div>`;

  const explainer = `<h2>How the age is calculated</h2>
<p>Your age is counted in <strong>whole calendar months</strong> from your date of birth, then the days left over, the same way people count birthdays. “Age on” starts at today’s date on <em>your</em> device, and you can change it to find your age on an exam date, a visa deadline or any other day.</p>
<ul>
<li><strong>Short months:</strong> if your birth day doesn’t exist in a month (for example the 31st), the last day of that month counts. Born on 31 January? On 1 March you are 1 month and 1 day older.</li>
<li><strong>Born on 29 February?</strong> In years without a 29 February, this calculator counts your birthday on 28 February.</li>
<li><strong>Nepali (BS) dates:</strong> choose “Born (BS)” to enter a Bikram Sambat date of birth, as on a Nepali citizenship certificate. The tool also shows when your next Nepali-calendar birthday falls, which moves in the English calendar every year.</li>
</ul>
<p>Need to convert a single date between BS and AD? Use the <a href="/tools/nepali-date-converter/">Nepali date converter</a>.</p>`;

  const faqs = [
    { q: 'How do I calculate my exact age?', a: 'Enter your date of birth. The calculator shows your age in years, months and days as of today, plus the total months, weeks and days you have lived.' },
    { q: 'Can I calculate my age on a specific date?', a: 'Yes. Change the “Age on” date to any day, such as the cut-off date in an application form, to see exactly how old you will be (or were) on that day.' },
    { q: 'Can I enter my date of birth in Nepali (BS)?', a: 'Yes. Choose “Born (BS / Nepali date)” and pick the year, month and day from your citizenship certificate or birth registration. Dates from 2000 to 2090 BS are supported.' },
    { q: 'How are birthdays on 29 February handled?', a: 'In years without a 29 February, the calculator treats 28 February as your birthday. Some countries use 1 March for legal purposes, so check if it matters for an official form.' },
    { q: 'Is my date of birth stored anywhere?', a: 'No. The calculation runs on your device and nothing is sent or saved.' },
  ];

  return toolPage({
    t,
    title: `Age Calculator Nepali (BS & AD): Exact Age by Date of Birth | ${site.name}`,
    description: 'Nepali age calculator: your exact age in years, months and days from your date of birth in BS or AD, plus total days lived and your next birthday. Free.',
    lead: 'Your exact age in years, months and days, how many days you have lived, and when your next birthday is. For everyone, in AD or Nepali BS.',
    toolHtml,
    explainer,
    faqs,
    script: '/assets/js/tool-age.js',
  })(version);
}

export function renderDate(version) {
  const t = toolBySlug('nepali-date-converter');
  const years = [];
  for (let y = BS_MIN_YEAR; y <= BS_MAX_YEAR; y++) years.push(y);
  const yearOpts = years.map((y) => `<option value="${y}">${y}${y >= BS_PROVISIONAL_FROM ? ' *' : ''}</option>`).join('');
  const monthOpts = BS_MONTHS_EN.map((m, i) => `<option value="${i + 1}">${i + 1} · ${m} (${BS_MONTHS_NE[i]})</option>`).join('');

  const toolHtml = `<div class="tool date-tool" id="dt-tool">
  <div class="today-card" aria-live="polite">
    <p class="today-label">Today’s Nepali date (<span lang="ne">आजको मिति</span>)</p>
    <p class="today-ne" lang="ne" id="dt-today-ne">&nbsp;</p>
    <p class="today-en" id="dt-today-en">&nbsp;</p>
    <p class="today-time" id="dt-time"></p>
  </div>
  <div class="convert-grid">
    <form class="convert-card" id="ad2bs" novalidate>
      <h2>English to Nepali date <span class="muted">(AD → BS)</span></h2>
      <label for="ad-date">English date (AD)</label>
      <input type="date" id="ad-date" min="1943-04-14" max="2034-04-13" required>
      <output class="result" id="ad2bs-out" for="ad-date"></output>
    </form>
    <form class="convert-card" id="bs2ad" novalidate>
      <h2>Nepali to English date <span class="muted">(BS → AD)</span></h2>
      <div class="bs-selects">
        <label>Year<select id="bs-y">${yearOpts}</select></label>
        <label>Month<select id="bs-m">${monthOpts}</select></label>
        <label>Day<select id="bs-d"></select></label>
      </div>
      <output class="result" id="bs2ad-out"></output>
    </form>
  </div>
  <section class="calendar" aria-labelledby="cal-title">
    <div class="cal-head">
      <button type="button" class="icon-btn" id="cal-prev" aria-label="Previous month">‹</button>
      <h2 id="cal-title" lang="ne"></h2>
      <button type="button" class="icon-btn" id="cal-next" aria-label="Next month">›</button>
      <button type="button" class="btn-ghost" id="cal-today">Today</button>
    </div>
    <div class="cal-grid" id="cal-grid" role="grid"></div>
    <p class="tool-note">Each box shows the BS day in Nepali and the AD date below it. Saturday is Nepal’s weekly holiday. <span id="cal-prov"></span></p>
  </section>
  <p class="tool-note">* Years from ${BS_PROVISIONAL_FROM} BS are provisional: the official calendar for them is not final, and published sources still disagree on some month lengths.</p>
</div>`;

  // Nepali calendar 2083: built from the same table the converter uses, so they can never disagree.
  const CAL_YEAR = 2083;
  const calRows = BS_MONTHS_EN.map((m, i) => {
    const start = bsToAd(CAL_YEAR, i + 1, 1);
    const days = daysInBsMonth(CAL_YEAR, i + 1);
    return `<tr><td>${m} <span lang="ne">(${BS_MONTHS_NE[i]})</span></td><td>${days}</td><td>${WEEKDAYS_EN[start.weekday]}, ${start.day} ${AD_MONTHS_EN[start.month - 1]} ${start.year}</td></tr>`;
  }).join('');
  const nextNy = bsToAd(CAL_YEAR + 1, 1, 1);

  const explainer = `<h2>How to convert a Nepali date to an English date</h2>
<ol>
<li>In the <strong>Nepali to English date</strong> box, choose the BS year, month and day, for example your date of birth from your citizenship certificate.</li>
<li>The English (AD) date and the weekday appear straight away. This is the date used on passports and applications abroad.</li>
<li>For the other way, pick a date in the <strong>English to Nepali date</strong> box to get the BS date in Nepali and English.</li>
</ol>
<h2>Nepali calendar ${CAL_YEAR} (<span lang="ne">नेपाली पात्रो ${toNepaliDigits(CAL_YEAR)}</span>)</h2>
<p>Nepali year ${CAL_YEAR} BS began on <strong>1 Baisakh ${CAL_YEAR} = 14 April 2026</strong> and ends on 30 Chaitra; 1 Baisakh ${CAL_YEAR + 1} falls on ${nextNy.day} ${AD_MONTHS_EN[nextNy.month - 1]} ${nextNy.year}. Each month starts on:</p>
<div class="table-wrap"><table><thead><tr><th>Month</th><th>Days</th><th>1st of the month (AD)</th></tr></thead><tbody>${calRows}</tbody></table></div>
<p>Use the calendar above the converter to see every day of any month, with the AD date under each BS day.</p>
<h2>About the Nepali calendar (Bikram Sambat)</h2>
<p><strong>Bikram Sambat (BS)</strong>, also written Vikram Samvat, is Nepal’s official calendar. Government documents, citizenship certificates, school certificates and many birth dates in Nepal are written in BS, which is why you often need to convert them to AD (the Gregorian calendar) for passports, visas and university applications abroad.</p>
<ul>
<li>BS runs roughly <strong>56 years and 8½ months ahead</strong> of AD. That is why the quick “add 57” trick goes wrong for dates between January and mid-April.</li>
<li>The BS year starts on <strong>1 Baisakh</strong>, in mid-April (13 or 14 April). 1 Baisakh 2083 was 14 April 2026.</li>
<li>BS months have <strong>29 to 32 days</strong>, and the lengths change from year to year. They come from astronomical calculation and are fixed in Nepal’s official calendar, so no simple formula can convert the dates. A converter needs the real table for every year.</li>
</ul>
<h3>How accurate is this converter?</h3>
<p>It uses the published month-length table for ${BS_MIN_YEAR}–${BS_MAX_YEAR} BS (1943–2034 AD). I checked that table against a second, independent source: they agree for every year from ${BS_MIN_YEAR} to ${BS_PROVISIONAL_FROM - 1} BS, and they match known dates such as New Year 2081 (13 April 2024) and Chaitra 13, 2082 (27 March 2026). Dates from ${BS_PROVISIONAL_FROM} BS onward are marked provisional. For legal documents, always confirm against the official calendar.</p>`;

  const faqs = [
    { q: 'How do I convert my date of birth from BS to AD?', a: 'Choose your birth year, month and day in the “BS → AD” box. The English (AD) date and the weekday appear immediately. This is the date normally used on passports and foreign applications.' },
    { q: 'How do I convert an English date to a Nepali date?', a: 'Pick the date in the “English to Nepali date (AD → BS)” box. You get the Bikram Sambat date in Nepali and English, with the weekday.' },
    { q: 'Is this a date of birth converter from Nepali to English?', a: 'Yes. Enter your BS date of birth in the “Nepali to English date” box to get the AD date for your passport, visa or university forms. Always check it against the date on your official documents.' },
    { q: 'What is today’s Nepali date?', a: 'It is shown at the top of this page, calculated for Nepal Standard Time (UTC+5:45), so it changes at midnight in Nepal, not at midnight where you are.' },
    { q: 'Why do Nepali months have 29, 30, 31 or 32 days?', a: 'BS months follow the Sun’s movement through the zodiac signs, which takes slightly different lengths of time. The official calendar fixes the length of each month every year, so the number of days in, say, Asar is not the same every year.' },
    { q: 'Which years can I convert?', a: `${BS_MIN_YEAR} to ${BS_MAX_YEAR} BS, which is 14 April 1943 to April 2034 AD. Years from ${BS_PROVISIONAL_FROM} BS are provisional until the official calendar is final.` },
    { q: 'What are the 12 Nepali months?', a: 'Baisakh (बैशाख), Jestha (जेठ), Asar (असार), Shrawan (साउन), Bhadra (भदौ), Ashwin (असोज), Kartik (कात्तिक), Mangsir (मंसिर), Poush (पुस), Magh (माघ), Falgun (फागुन) and Chaitra (चैत).' },
  ];

  return toolPage({
    t,
    title: `Nepali Date Converter: Nepali to English Date & Today's Date | ${site.name}`,
    description: 'Convert Nepali date to English date (BS to AD) and English to Nepali date. See today’s Nepali date (आजको मिति) and the Nepali calendar 2083. Free and accurate.',
    lead: 'Convert Bikram Sambat to AD and back, see <span lang="ne">आजको मिति</span> (today’s date), and browse the Nepali calendar.',
    toolHtml,
    explainer,
    faqs,
    script: '/assets/js/tool-date.js',
  })(version);
}

// ---------------------------------------------------------------------------
// Photo tool: one page, several sizes (DV, Nepal passport size, 2×2 inch, custom).

const DOS_PHOTOS = 'https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/photos.html';
const NP_EMBASSY = 'https://au.nepalembassy.gov.np/pages/required-documents-10/';
const GOV_UK_PHOTOS = 'https://www.gov.uk/photos-for-passports';

function photoToolHtml() {
  const presets = [['dv', 'DV Lottery 600×600'], ['np', 'Nepal passport 35×45 mm'], ['us2x2', '2×2 inch print'], ['custom', 'Custom size']];
  return `<div class="tool ph-tool" id="ph-tool" data-default="dv">
  <div class="seg seg-lg ph-presets" role="radiogroup" aria-label="Photo size">
    ${presets.map(([k, label]) => `<button type="button" role="radio" aria-checked="${k === 'dv'}" data-preset="${k}">${label}</button>`).join('\n    ')}
  </div>
  <div class="ph-custom" id="ph-custom" hidden>
    <label>Width<input type="number" id="ph-cw" min="0" step="any" inputmode="decimal" value="35"></label>
    <label>Height<input type="number" id="ph-ch" min="0" step="any" inputmode="decimal" value="45"></label>
    <label>Unit<select id="ph-cu"><option value="mm">mm</option><option value="cm">cm</option><option value="in">inch</option><option value="px">pixels</option></select></label>
    <label>Max size (kB)<input type="number" id="ph-ckb" min="0" step="1" inputmode="numeric" placeholder="No limit"></label>
  </div>
  <p class="tool-note" id="ph-spec"></p>
  <div class="ph-main">
    <div class="ph-stage">
      <div class="ph-drop" id="ph-drop">
        <label class="btn">Choose your photo<input type="file" id="ph-file" accept="image/*" hidden></label>
        <p>or drag it here. <b>Nothing is uploaded</b>: it stays on your device.</p>
        <button type="button" class="btn-ghost" id="ph-example" data-src="/images/tools/dv-example-photo.jpg">Try an example photo</button>
      </div>
      <canvas id="ph-canvas" tabindex="0" aria-label="Photo crop area. Drag to move, pinch or scroll to zoom, or use the arrow keys."></canvas>
      <p class="ph-hint">Drag to move · pinch, scroll or use Zoom to resize</p>
    </div>
    <div class="ph-side">
      <section class="ph-step" aria-labelledby="ph-s1">
        <h2 class="ph-step-h" id="ph-s1"><span>1</span> Check your photo</h2>
        <p class="ph-info" id="ph-info">Choose a photo and the tool checks it against the rules for the size you picked.</p>
        <ul class="ph-checks" id="ph-check-in"></ul>
        <p class="ph-verdict" id="ph-verdict"></p>
      </section>
      <fieldset class="ph-step ph-controls" id="ph-controls">
        <legend class="ph-step-h"><span>2</span> Fit your head inside the oval</legend>
        <div class="ph-guide-row" id="ph-guide-row">
          <p id="ph-guide-text"></p>
          <label class="switch"><input type="checkbox" id="ph-guide" checked><span>Show the oval</span></label>
        </div>
        <label class="ph-range">Zoom<input type="range" id="ph-zoom" min="0.5" max="4" step="0.01" value="1"></label>
        <label class="ph-range">Straighten<input type="range" id="ph-tilt" min="-15" max="15" step="0.5" value="0"></label>
        <div class="ph-btns">
          <button type="button" class="btn-ghost" id="ph-rotl" aria-label="Rotate left">⟲ Rotate</button>
          <button type="button" class="btn-ghost" id="ph-rotr" aria-label="Rotate right">⟳ Rotate</button>
          <button type="button" class="btn-ghost" id="ph-reset">Reset</button>
          <button type="button" class="btn-ghost" id="ph-change">Change photo</button>
        </div>
      </fieldset>
      <section class="ph-step ph-out" aria-labelledby="ph-s3">
        <h2 class="ph-step-h" id="ph-s3"><span>3</span> Download</h2>
        <ul class="ph-checks" id="ph-check-out" aria-live="polite"></ul>
        <div class="ph-btns">
          <button type="button" class="btn" id="ph-dl">Download photo</button>
          <button type="button" class="btn-ghost" id="ph-sheet">Download 4×6 print sheet</button>
        </div>
        <p class="ph-sheet-note" id="ph-sheet-note" aria-live="polite"></p>
      </section>
    </div>
  </div>
</div>`;
}

export function renderDvPhoto(version) {
  const t = toolBySlug('dv-photo-tool');
  const examples = `<div class="ph-examples">
${exampleSvg({ headShare: 0.6, label: 'Right: the head is between the two ovals', ok: true })}
${exampleSvg({ headShare: 0.36, label: 'Too small: zoom in', ok: false })}
${exampleSvg({ headShare: 0.84, label: 'Too big: zoom out', ok: false })}
</div>`;

  const explainer = `<blockquote class="callout callout-update"><p><strong>DV-2027 entries have not opened yet.</strong> You can get your photo ready now. For the opening date, follow the <a href="/edv-2027-nepal-dv-lottery-open-date/">EDV 2027 guide</a>.</p></blockquote>
<h2>DV lottery photo size and requirements</h2>
<p>This is what the U.S. Department of State asks for in the online DV entry (<a href="${DOS_PHOTOS}" rel="noopener">official photo requirements</a>):</p>
<div class="table-wrap"><table>
<tbody>
<tr><th scope="row">File format</th><td>JPEG (.jpg)</td></tr>
<tr><th scope="row">File size</th><td>240 kB or less</td></tr>
<tr><th scope="row">Shape and size</th><td>Square, 600 × 600 pixels</td></tr>
<tr><th scope="row">Head size</th><td>50% to 69% of the image height, from the bottom of the chin to the top of the head</td></tr>
<tr><th scope="row">Background</th><td>Plain white or off-white</td></tr>
<tr><th scope="row">Colour and age</th><td>In colour, taken within the last 6 months</td></tr>
<tr><th scope="row">Pose</th><td>Full face, looking straight at the camera, neutral expression, both eyes open</td></tr>
<tr><th scope="row">Glasses</th><td>Not allowed, except in rare medical cases</td></tr>
<tr><th scope="row">Editing</th><td>Must not be digitally enhanced or altered to change your appearance</td></tr>
</tbody>
</table></div>
<p>Steps 1 and 3 above check the file rules for you: format, file size, shape and pixel size. They also look at the colour and the background, but those are only hints. The head size you check by eye, with the oval.</p>
<h2>How to fit your head inside the oval</h2>
<p>For the DV size the tool shows two ovals. Move and zoom the photo until your head, from the chin to the top of your hair, is <strong>bigger than the inner oval and smaller than the outer one</strong>. That keeps it between 50% and 69% of the photo height.</p>
${examples}
<p>Not sure how it works? Press <strong>Try an example photo</strong> in the tool: the example person starts too small and off-centre, so you can practise zooming and moving them into the oval.</p>
<h2>How to make your DV photo, step by step</h2>
<ol>
<li><strong>Take the photo</strong> against a plain white or off-white wall, in even light, looking straight at the camera, with no glasses. Leave space around your head and shoulders.</li>
<li><strong>Check it</strong>: choose it in the tool. Step 1 shows what already meets the rules (✓) and what doesn't (✗).</li>
<li><strong>Crop it</strong>: drag and zoom until your head fits between the ovals. Use Straighten if your head is tilted.</li>
<li><strong>Download it</strong> when step 3 shows 600 × 600 pixels, JPEG and 240 kB or less, then upload that file in your entry.</li>
</ol>
<p>Every person on the entry needs their own photo: you, your spouse and each unmarried child under 21, even if they won't move with you (see the <a href="/edv-2027-nepal-dv-lottery-open-date/">EDV guide</a>). If you are selected, each applicant brings <strong>two identical 2 × 2 inch (51 × 51 mm) prints</strong> to the interview: choose <strong>2×2 inch print</strong> and download the 4×6 print sheet.</p>
<h2>What this DV photo editor changes, and what it doesn't</h2>
<p>It crops, rotates, straightens and resizes, and it saves the file small enough. It does not smooth skin, change colours or remove backgrounds, because the State Department says photos must not be digitally enhanced or altered to change your appearance. If step 1 says the background looks dark, take the photo again against a white wall.</p>
<p>The State Department also has its own free <a href="https://tsg.phototool.state.gov/photo" rel="noopener">photo tool</a> that crops a photo to 600 × 600 pixels. Whichever you use, a State Department employee makes the final decision on your photo: no tool can promise it will be accepted.</p>
<h2 id="passport-size-photo">Passport size photo: Nepal 35 × 45 mm</h2>
<p>The same tool makes passport size photos. A Nepali passport size (pp size) photo is <strong>35 mm wide and 45 mm tall</strong> (3.5 × 4.5 cm). The Nepal Embassy in Australia, for example, asks for “35mm X 45mm sized, only 70% face coverage, high resolution borderless photos” with a white background, and says photos with a tika on the forehead are not accepted (<a href="${NP_EMBASSY}" rel="noopener">Embassy of Nepal, Canberra</a>). Choose <strong>Nepal passport 35×45 mm</strong>, fit your face in the oval, and download the photo or a <strong>4×6 print sheet with 8 photos</strong>. Print the sheet at 100% (actual size), not “fit to page”.</p>
<div class="table-wrap"><table>
<thead><tr><th>Photo</th><th>mm</th><th>inches</th><th>pixels (300 dpi)</th><th>On a 4×6 sheet</th></tr></thead>
<tbody>
<tr><td>Nepal passport size</td><td>35 × 45</td><td>1.38 × 1.77</td><td>413 × 531</td><td>8</td></tr>
<tr><td>2 × 2 inch (US visa, DV interview)</td><td>51 × 51</td><td>2 × 2</td><td>600 × 600</td><td>2</td></tr>
<tr><td>DV lottery entry (digital)</td><td>–</td><td>–</td><td>600 × 600, 240 kB or less</td><td>–</td></tr>
</tbody>
</table></div>
<p>Online forms in Nepal can ask for other sizes or a file limit in kB. Follow what your form says: choose <strong>Custom size</strong> and enter it in mm, cm, inches or pixels, with a maximum size in kB.</p>
<p><strong>UK passport?</strong> Don't crop it. For online applications gov.uk says “Do not crop your photo” (the crop is done for you), and printed photos must not be “a cut down version of a larger picture” (<a href="${GOV_UK_PHOTOS}" rel="noopener">GOV.UK</a>).</p>`;

  const faqs = [
    { q: 'What is the photo size for the DV lottery?', a: 'A square JPEG of <strong>600 × 600 pixels</strong>, <strong>240 kB or less</strong>, with your head 50% to 69% of the image height on a plain white or off-white background.' },
    { q: 'How do I check if my DV photo is valid?', a: 'Choose it in step 1 of this tool. It checks the format (JPEG), the file size (240 kB or less), the shape (square) and the size (600 × 600 pixels), and gives hints on colour and background. Check the head size yourself with the oval. Only the State Department can make the final decision.' },
    { q: 'How do I edit my photo for the DV lottery?', a: 'Crop and resize it: move and zoom it until your head fits between the ovals, then download it. The tool saves a 600 × 600 JPEG of 240 kB or less. Don’t change your face or the background: the State Department says photos must not be digitally altered to change your appearance.' },
    { q: 'How do I make my DV photo under 240 kB?', a: 'The tool does it for you: it lowers the JPEG quality step by step until the file is 240 kB or less, and step 3 shows the final size before you download. A 600 × 600 photo is usually well under the limit.' },
    { q: 'Can I edit the background of my DV photo?', a: 'No. The background must be plain white or off-white, and the photo must not be digitally altered. If yours is not, take the photo again against a white wall.' },
    { q: 'Can I take my DV photo with an iPhone?', a: 'You may take the photo yourself, though the State Department recommends a professional photo service and says low quality mobile phone photos are not acceptable. If your iPhone saves HEIC photos and they won’t open here, open this page in Safari, or set Settings → Camera → Formats → Most Compatible.' },
    { q: 'Can I use an old photo for the DV lottery?', a: 'No. The photo must have been taken within the last 6 months, so take a new one for each entry.' },
    { q: 'Can I wear glasses in the DV photo?', a: 'No. Eyeglasses are no longer allowed in new visa photos, except in rare medical cases with a signed medical statement.' },
    { q: 'What is the passport size photo size in Nepal?', a: '<strong>35 × 45 mm</strong> (3.5 × 4.5 cm), which is 413 × 531 pixels at 300 dpi. The Nepal Embassy in Australia, for example, asks for a white background, about 70% face coverage and no border. Choose Nepal passport 35×45 mm in the tool.' },
    { q: 'Is my photo uploaded anywhere?', a: 'No. The photo is opened, checked, cropped and saved entirely in your browser. It never leaves your phone or computer and is not stored.' },
  ];

  return toolPage({
    t,
    h1: 'DV Lottery Photo Tool: Check and Crop Your Photo',
    title: 'DV Photo Editor & Checker: EDV Photo 600x600 Under 240 kB',
    description: 'Free DV lottery photo checker and editor: check your EDV photo, then crop it to 600×600 pixels under 240 kB. Also Nepal passport size 35×45 mm.',
    lead: 'Check whether your DV (EDV) photo meets the official rules, then crop it to <strong>600 × 600 pixels</strong> and save it <strong>under 240 kB</strong>. It also makes Nepal passport size (35 × 45 mm) and 2 × 2 inch photos. Free, and your photo never leaves your device.',
    toolHtml: photoToolHtml(),
    explainer,
    faqs,
    script: '/assets/js/tool-photo.js',
  })(version);
}

export function renderToolsHub(version) {
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'Tools', path: '/tools/' }];
  const body = `${pageHead({
    crumbs,
    eyebrow: 'Free tools',
    title: 'Free tools that just work',
    lead: 'Type Nepali with an English keyboard or the familiar Preeti layout, convert Preeti to Unicode, convert Nepali dates, work out your exact age, and check and crop DV lottery and passport size photos. Free, fast and private: everything runs in your browser.',
  })}
<section class="wrap">
  <div class="tool-cards">
    ${TOOLS.map(
      (t, i) => `<a class="tool-card" href="${toolPath(t.slug)}">
      <span class="tool-num">0${i + 1}</span>
      <h2>${esc(t.name)}</h2>
      <p>${esc(t.blurb)}</p>
      <span class="tool-demo"><code>${esc(t.sample[0])}</code><span aria-hidden="true">→</span><b${t.latin ? '' : ' lang="ne"'}>${esc(t.sample[1])}</b></span>
      <span class="btn">Open tool</span>
    </a>`,
    ).join('')}
  </div>
  <p class="suggest">Need another tool? <a href="/contact-us/">Suggest one</a>. The most requested ideas get built next.</p>
</section>`;
  return layout({
    title: `Free Nepali Tools: Typing, Preeti, Date Converter, DV Photo | ${site.name}`,
    description: 'Free tools: Nepali typing, Preeti to Unicode, Nepali keyboard, date converter, age calculator, and a DV lottery and passport size photo tool.',
    path: '/tools/',
    body,
    version,
    section: '/tools/',
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Free tools',
        itemListElement: TOOLS.map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.name, url: `${site.url}${toolPath(t.slug)}` })),
      },
      breadcrumbSchema(crumbs),
    ],
  });
}
