import { site } from '../data/site.js';
import { esc } from '../lib/util.js';
import { layout } from '../templates/layout.js';
import { breadcrumbs, breadcrumbSchema, faqBlock, faqSchema, shareBar, pageHead } from '../templates/components.js';
import { CHEAT_SHEET } from '../assets/js/lib/romanized.js';
import { exampleSet } from '../assets/js/lib/photo-figure.js';
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
    short: 'Nepali Unicode Traditional layout, on screen',
    blurb: 'Type Nepali Unicode with the standard Nepali Unicode Traditional layout, close to the Preeti keys, or tap the on-screen keys on your phone.',
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
    slug: 'dv-photo-tool',
    name: 'DV Lottery Photo Tool',
    short: 'Check and crop your EDV photo: 600×600, under 240 kB',
    blurb: 'Check your DV (EDV) photo, then crop it to 600×600 pixels under 240 kB. It shows live when your head size is right. Nothing is uploaded.',
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
      <div class="pane-foot"><span id="rz-count">0 words</span><span class="pane-actions"><a class="btn-ghost" id="rz-translate" href="https://translate.google.com/?sl=en&amp;tl=ne&amp;op=translate" target="_blank" rel="noopener" title="Opens Google Translate with your text">Translate with Google ↗</a><button type="button" class="btn-ghost" id="rz-clear">Clear</button></span></div>
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
<p>This is an English to Nepali converter for Unicode: everything you type here becomes <strong>Nepali Unicode</strong>, real Devanagari letters that work on every device and that Google can search. Old fonts such as <strong>Preeti</strong> only look Nepali on computers that have the font. Already have text in Preeti? Change it with the <a href="/tools/preeti-to-unicode/">Preeti to Unicode converter</a>. Learned to type on the Preeti layout? The <a href="/tools/nepali-keyboard/">Nepali keyboard</a> uses the standard Nepali Unicode Traditional layout, which keeps most Preeti keys.</p>
<p>New to Nepali typing? Read the full guide: <a href="/how-to-type-in-nepali-unicode-romanized/">how to type in Nepali Unicode on phone and computer</a>. Need to change old Preeti text into Unicode? Use the <a href="/tools/preeti-to-unicode/">Preeti to Unicode converter</a>.</p>`;

  const faqs = [
    { q: 'Is this English to Nepali translation?', a: 'No. It converts the <em>sounds</em> you type in English letters into Nepali script (transliteration): “mero naam” becomes “मेरो नाम”. To translate the meaning of an English sentence, such as “My name is Manoj” into “मेरो नाम मनोज हो”, type it in the box and click <strong>Translate with Google</strong>, which opens Google Translate with your text.' },
    { q: 'How do I type आ, ई and ऊ?', a: 'Double the vowel or use a capital: <code>aa</code> or <code>A</code> for आ/ा, <code>ee</code> or <code>I</code> for ई/ी, <code>oo</code> or <code>U</code> for ऊ/ू.' },
    { q: 'How do I type ट, ठ, ड, ढ, ण and ष?', a: 'Use capitals: <code>T</code> ट, <code>Th</code> ठ, <code>D</code> ड, <code>Dh</code> ढ, <code>N</code> ण and <code>Sh</code> ष.' },
    { q: 'How do I write ऋ and कृ?', a: 'Use capital <code>R</code> (or <code>rri</code>): <code>R</code> gives ऋ, and <code>kR</code> gives कृ, so <code>kRShNa</code> becomes कृष्ण.' },
    { q: 'How do I end a word with a halanta (्)?', a: 'Type a backslash after it: <code>garchhan\\</code> gives गर्छन्. Without the backslash a final consonant keeps its normal sound, so <code>naam</code> gives नाम.' },
    { q: 'Can I paste the result into Facebook, Word or Google Docs?', a: 'Yes. The output is standard Unicode Devanagari, so it works in Facebook, Messenger, WhatsApp, Gmail, Word, Google Docs and websites, on phones and computers, with no special font.' },
    { q: 'Is this Nepali typing tool free?', a: 'Yes, completely free, with no sign-up and no limit on how much you type. The conversion runs in your browser, so it keeps working even if your internet drops after the page has loaded.' },
    { q: 'Can I type Nepali on my phone with this?', a: 'Yes. Open this page in your phone browser, type with your normal English keyboard, and copy the Nepali. If you type Nepali every day, add a Nepali keyboard to your phone instead; the <a href="/how-to-type-in-nepali-unicode-romanized/">typing guide</a> shows how.' },
    { q: 'Is my text sent anywhere?', a: 'No. The conversion runs entirely in your browser, and nothing you type is uploaded or stored on our server. Only if you click <strong>Translate with Google</strong> is your text sent to Google Translate, in a new tab.' },
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
<p><strong>Unicode</strong> stores real Nepali letters. It works on every device and in every app, with no special font, and it is what government offices, news sites and Google use. If you are starting something new, type in Unicode from the start with our <a href="/tools/english-to-nepali/">Nepali typing tool</a> or the <a href="/tools/nepali-keyboard/">Nepali keyboard</a> (the standard Traditional layout, close to the Preeti keys you know).</p>
<h2>Unicode to Preeti converter, for Preeti documents</h2>
<p>Some offices and print shops still use documents set in Preeti. To convert to Preeti, choose <strong>Unicode → Preeti</strong>, paste Nepali Unicode text, and copy the result into your Preeti document. It works as a <strong>Mangal to Preeti converter</strong> too: Mangal and Kalimati are Unicode fonts, so text typed in them converts the same way. The result looks like English letters and symbols (<span lang="ne">नेपाल</span> → <code>g]kfn</code>) <strong>until you set the font to Preeti</strong> in Word; then it shows as Nepali.</p>
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
    { q: 'Is this a Mangal to Preeti converter?', a: 'Yes. Mangal and Kalimati are Unicode fonts, so this Unicode Nepali converter handles them. Choose <strong>Unicode → Preeti</strong>, paste the text, and set the font of the result to Preeti in your document.' },
    { q: 'Can I convert a whole Word file?', a: 'Yes, by copy and paste: select all the Preeti text in Word (Ctrl + A), copy it, paste it here, then paste the Unicode result back into Word and choose a Unicode font. Plain .txt files can also be opened directly with the “Open .txt” button.' },
    { q: 'Where can I download the Preeti font?', a: 'Preeti is a font owned by its creator, so we don’t host it. For anything new, you don’t need it: type and share in Unicode, which needs no special font. Keep Preeti only for old documents that require it.' },
    { q: 'Is my text uploaded anywhere?', a: 'No. The conversion runs entirely in your browser, and nothing you paste is sent to a server.' },
  ];

  return toolPage({
    t,
    title: `Preeti to Unicode Converter: Nepali Unicode & Unicode to Preeti | ${site.name}`,
    description: 'Free Preeti to Unicode converter and Unicode to Preeti converter: paste Preeti text and get Kalimati or Mangal Unicode instantly, or convert to Preeti.',
    lead: 'Paste old <strong>Preeti</strong> text and get proper <strong>Nepali Unicode</strong>, instantly: <code>g]kfn</code> → <span lang="ne">नेपाल</span>. It is also a <strong>Unicode to Preeti converter</strong>, so you can convert Nepali Unicode back to Preeti.',
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
    <p class="kb-layout-name"><b>Nepali Unicode Traditional</b> layout</p>
    <label class="switch"><input type="checkbox" id="kb-on" checked><span>Type in Nepali <kbd>Ctrl</kbd>+<kbd>Space</kbd></span></label>
  </div>
  <label for="kb-text" class="sr-only">Your Nepali text</label>
  <textarea id="kb-text" lang="ne" spellcheck="false" autocapitalize="off" autocomplete="off" rows="6" placeholder="यहाँ टाइप गर्नुहोस्… Start typing, or tap the keys below."></textarea>
  <div class="pane-foot kb-actions"><span id="kb-count">0 words</span><button type="button" class="btn" id="kb-copy">Copy</button><button type="button" class="btn-ghost" id="kb-download">Download .txt</button><button type="button" class="btn-ghost" id="kb-clear">Clear</button></div>
  <div class="kb" id="kb" aria-label="On-screen Nepali keyboard"></div>
  <p class="tool-note" id="kb-note">Each key shows its letter, and the small letter above it is <b>Shift</b> + that key: <kbd>Shift</kbd>+<kbd>K</kbd> = <span lang="ne">फ</span>, <kbd>Shift</kbd>+<kbd>H</kbd> = <span lang="ne">झ</span>. Type <kbd>l</kbd> (<span lang="ne">ि</span>) after the letter: <code>xl</code> = <span lang="ne">हि</span>.</p>
</div>`;

  const LTK = 'https://ltk.org.np/keyboard_layouts.php';
  const explainer = `<h2>One Nepali keyboard: Nepali Unicode Traditional</h2>
<p>This keyboard uses the <strong>Nepali Unicode Traditional</strong> layout, the standard layout of Madan Puraskar Pustakalaya and Language Technology Kendra for typing Nepali in Unicode. Language Technology Kendra describes it as the layout “designed for True Type Font (TTF) like Preeti, Kantipur etc users” (<a href="${LTK}" rel="noopener">LTK keyboard layouts</a>), so if you learned to type on Preeti, most keys are where your fingers expect them: <code>g]kfn</code> still types <span lang="ne">नेपाल</span>.</p>
<p>What you type is real <strong>Nepali Unicode</strong>, so it works in Facebook, WhatsApp, Gmail, Word, Google Docs and online forms such as the Lok Sewa application, on every device and without the Preeti font.</p>
<h2>Coming from Preeti? What is different</h2>
<div class="table-wrap"><table>
<thead><tr><th>To type</th><th>Traditional (this keyboard)</th><th>Preeti font</th></tr></thead>
<tbody>
<tr><td lang="ne">फ</td><td><kbd>Shift</kbd>+<kbd>K</kbd> (<kbd>k</kbd> then <kbd>m</kbd> also works)</td><td><kbd>k</kbd> then <kbd>m</kbd></td></tr>
<tr><td lang="ne">झ</td><td><kbd>Shift</kbd>+<kbd>H</kbd> (<kbd>e</kbd> then <kbd>m</kbd> also works)</td><td><kbd>e</kbd> then <kbd>m</kbd></td></tr>
<tr><td lang="ne">ि</td><td><kbd>l</kbd> <em>after</em> the letter: <code>xl</code> = <span lang="ne">हि</span></td><td><kbd>l</kbd> before the letter</td></tr>
<tr><td lang="ne">र् (reph)</td><td><kbd>[</kbd> <em>before</em> the letter: <code>u[g</code> = <span lang="ne">गर्न</span></td><td><kbd>{</kbd> after the letter</td></tr>
<tr><td>Half letters</td><td>letter + <kbd>\\</kbd> (<span lang="ne">्</span>): <code>s\\</code> = <span lang="ne">क्</span></td><td><kbd>Shift</kbd> + the letter</td></tr>
<tr><td lang="ne">ो and ौ</td><td><kbd>Shift</kbd>+<kbd>J</kbd> and <kbd>Shift</kbd>+<kbd>B</kbd> (<kbd>f</kbd> then <kbd>]</kbd> also works)</td><td><kbd>f</kbd> then <kbd>]</kbd> or <kbd>}</kbd></td></tr>
<tr><td>Numbers <span lang="ne">१२३</span></td><td>the number keys</td><td><kbd>Shift</kbd> + the number keys</td></tr>
<tr><td lang="ne">ं</td><td><kbd>Shift</kbd>+<kbd>\\</kbd></td><td><kbd>Shift</kbd>+<kbd>=</kbd></td></tr>
</tbody>
</table></div>
<p>Joined letters that are used a lot have their own keys: <kbd>!</kbd> <span lang="ne">ज्ञ</span>, <kbd>q</kbd> <span lang="ne">त्र</span>, <kbd>Q</kbd> <span lang="ne">त्त</span>, <kbd>Shift</kbd>+<kbd>I</kbd> <span lang="ne">क्ष</span>, <kbd>&gt;</kbd> <span lang="ne">श्र</span>, <kbd>$</kbd> <span lang="ne">द्ध</span> and <kbd>?</kbd> <span lang="ne">रु</span>.</p>
<h2>Tips</h2>
<ul>
<li>Press <kbd>Ctrl</kbd> + <kbd>Space</kbd> to switch between Nepali and English typing without leaving the box.</li>
<li>On a phone, the on-screen keys replace your phone’s keyboard, so you can type Nepali without installing anything. Tap ⇧ for the Shift letters.</li>
<li>A space finishes each word. While you are still inside a word, backspace removes the last key you pressed.</li>
</ul>
<p>Prefer to type Nepali the way it sounds in English letters (<code>namaste</code> → <span lang="ne">नमस्ते</span>)? Use <a href="/tools/english-to-nepali/">English to Nepali typing</a>. Have text that was typed in the Preeti font? Paste it into the <a href="/tools/preeti-to-unicode/">Preeti to Unicode converter</a>.</p>`;

  const faqs = [
    { q: 'How do I type फ and झ?', a: '<kbd>Shift</kbd> + <kbd>K</kbd> types फ and <kbd>Shift</kbd> + <kbd>H</kbd> types झ. On the on-screen keyboard, tap ⇧ and then the key. The Preeti way, <kbd>k</kbd> then <kbd>m</kbd> for फ and <kbd>e</kbd> then <kbd>m</kbd> for झ, works too.' },
    { q: 'Is this the same as the Preeti keyboard?', a: 'Most letter keys are the same as Preeti, because the Traditional layout was made for Preeti and Kantipur typists. A few things differ: ि is typed after the letter, half letters use <kbd>\\</kbd>, and the number keys type Nepali numbers. The table above lists them all. Unlike Preeti, the text is Unicode, so it works everywhere.' },
    { q: 'Which Nepali keyboard layout should I learn?', a: 'For typing Nepali Unicode on a computer, Nepali Unicode Traditional: it is the standard layout from Madan Puraskar Pustakalaya and Language Technology Kendra, and it is close to Preeti. If you would rather type how words sound in English letters, use the Romanized method in our <a href="/tools/english-to-nepali/">English to Nepali typing tool</a>.' },
    { q: 'How do I type ि, ी and half letters?', a: 'Type the letter first, then <kbd>l</kbd> for ि or <kbd>Shift</kbd> + <kbd>L</kbd> for ी: <code>xl</code> = हि. For a half letter, type the letter and then <kbd>\\</kbd> (्): <code>s\\</code> = क्.' },
    { q: 'Do I need to install anything?', a: 'No. It works in your browser on Windows, Mac, Android and iPhone. On a computer you can type with your physical keyboard; on a phone, tap the on-screen keys.' },
    { q: 'How do I type English words in between?', a: 'Turn off “Type in Nepali” (or press Ctrl + Space), type your English words, then switch back.' },
    { q: 'Where is my text saved?', a: 'Only in your own browser, so it is still there if you reload the page. Nothing is uploaded. Use Copy or Download to keep it.' },
  ];

  return toolPage({
    t,
    title: 'Nepali Keyboard Online: Nepali Unicode Traditional Layout',
    description: 'Free online Nepali keyboard with the standard Nepali Unicode Traditional layout (Preeti-style keys). Type or tap Nepali, then copy it to Facebook or Word.',
    lead: 'Type Nepali Unicode with the standard <strong>Nepali Unicode Traditional</strong> layout, close to the Preeti keys you may already know. On a phone, just tap the keys: <kbd>Shift</kbd>+<kbd>K</kbd> = <span lang="ne">फ</span>, <kbd>Shift</kbd>+<kbd>H</kbd> = <span lang="ne">झ</span>.',
    toolHtml,
    explainer,
    faqs,
    script: '/assets/js/tool-keyboard.js',
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
<h2>English date converter and DOB converter</h2>
<p>This page is an <strong>English date converter</strong> in both directions. For a <strong>date converter AD to BS</strong>, use the English to Nepali date box; for BS to AD, use the Nepali to English date box. As a <strong>DOB converter</strong>, enter the date of birth from your citizenship certificate (BS) to get the English date for your passport, visa or university forms.</p>
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
    { q: 'Is this a DOB converter (date of birth converter) from Nepali to English?', a: 'Yes. Enter your BS date of birth in the “Nepali to English date” box to get the AD date for your passport, visa or university forms. Always check it against the date on your official documents.' },
    { q: 'What is today’s Nepali date?', a: 'It is shown at the top of this page, calculated for Nepal Standard Time (UTC+5:45), so it changes at midnight in Nepal, not at midnight where you are.' },
    { q: 'Why do Nepali months have 29, 30, 31 or 32 days?', a: 'BS months follow the Sun’s movement through the zodiac signs, which takes slightly different lengths of time. The official calendar fixes the length of each month every year, so the number of days in, say, Asar is not the same every year.' },
    { q: 'Which years can I convert?', a: `${BS_MIN_YEAR} to ${BS_MAX_YEAR} BS, which is 14 April 1943 to April 2034 AD. Years from ${BS_PROVISIONAL_FROM} BS are provisional until the official calendar is final.` },
    { q: 'Is there an English to Nepali date converter in Excel?', a: 'Excel doesn’t include the Bikram Sambat calendar, and BS month lengths change from year to year, so no simple Excel formula converts the dates correctly. Convert each date here and paste the result into your spreadsheet.' },
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
// DV lottery photo tool: check, crop and download a 600 × 600 JPEG under 240 kB.

const DOS_PHOTOS = 'https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/photos.html';

function photoToolHtml() {
  return `<div class="tool ph-tool" id="ph-tool">
  <p class="tool-note">DV Lottery entry photo: 600 × 600 pixels, square JPEG, 240 kB or less.</p>
  <div class="ph-main">
    <div class="ph-stage">
      <div class="ph-drop" id="ph-drop">
        <label class="btn">Choose your photo<input type="file" id="ph-file" accept="image/*" hidden></label>
        <p>or drag it here. <b>Nothing is uploaded</b>: it stays on your device.</p>
        <button type="button" class="btn-ghost" id="ph-example" data-src="/images/tools/dv-example-photo.jpg">Try an example photo</button>
      </div>
      <canvas id="ph-canvas" tabindex="0" aria-label="Photo crop area. Drag to move, pinch or scroll to zoom, or use the arrow keys."></canvas>
      <p class="ph-badge" id="ph-badge-stage" aria-hidden="true"></p>
      <p class="ph-hint">Drag to move · pinch, scroll or use Zoom to resize</p>
    </div>
    <div class="ph-side">
      <section class="ph-step" aria-labelledby="ph-s1">
        <h2 class="ph-step-h" id="ph-s1"><span>1</span> Check your photo</h2>
        <p class="ph-info" id="ph-info">Choose a photo and the tool checks it against the DV lottery rules.</p>
        <ul class="ph-checks" id="ph-check-in"></ul>
        <p class="ph-verdict" id="ph-verdict"></p>
      </section>
      <fieldset class="ph-step ph-controls" id="ph-controls">
        <legend class="ph-step-h"><span>2</span> Fit your head between the ovals</legend>
        <p class="ph-guide-text">Your head, chin to top of hair, must be bigger than the inner oval and smaller than the outer one: 50% to 69% of the photo height. The ovals turn <b class="ph-c-ok">green</b> when it fits.</p>
        <div class="ph-mini" id="ph-mini" aria-label="Examples"></div>
        <label class="switch"><input type="checkbox" id="ph-guide" checked><span>Show the ovals</span></label>
        <label class="ph-range">Zoom<input type="range" id="ph-zoom" min="1" max="4" step="0.01" value="1"></label>
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
        <div class="ph-live" id="ph-live" aria-live="polite"></div>
        <ul class="ph-checks" id="ph-check-out"></ul>
        <div class="ph-btns"><button type="button" class="btn" id="ph-dl">Download photo</button></div>
      </section>
    </div>
  </div>
</div>`;
}

export function renderDvPhoto(version) {
  const t = toolBySlug('dv-photo-tool');
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
<p>The tool checks these for you. Step 1 checks the photo you chose: format, file size, shape and pixel size, plus hints on colour and background. While you crop, face detection on your device <strong>checks the head size live</strong>: the ovals and the result in step 3 turn <strong>green</strong> when your head looks the right size, amber when it is almost right and red when it is too small or too big. Step 3 then checks the file you will download.</p>
<h2>How to fit your head between the ovals</h2>
<p>Move and zoom the photo until your head, from the chin to the top of your hair, is <strong>bigger than the inner oval and smaller than the outer one</strong>. That keeps it between 50% and 69% of the photo height. The photo always fills the square, so you can't zoom out into white space.</p>
<div class="ph-examples">${exampleSet('dv')}</div>
<p>Not sure how it works? Press <strong>Try an example photo</strong> in the tool: the example person starts too small and off-centre, so you can practise zooming and moving them until step 3 turns green.</p>
<h2>How to make your DV photo, step by step</h2>
<ol>
<li><strong>Take the photo</strong> against a plain white or off-white wall, in even light, looking straight at the camera, with no glasses. Leave space around your head and shoulders.</li>
<li><strong>Check it</strong>: choose it in the tool. Step 1 shows what already meets the rules (✓) and what doesn't (✗).</li>
<li><strong>Crop it</strong>: drag and zoom until the ovals turn green. Use Straighten if your head is tilted.</li>
<li><strong>Download it</strong> when step 3 shows the head size is OK, 600 × 600 pixels, JPEG and 240 kB or less, then upload that file in your entry.</li>
</ol>
<p>Every person on the entry needs their own photo: you, your spouse and each unmarried child under 21, even if they won't move with you (see the <a href="/edv-2027-nepal-dv-lottery-open-date/">EDV guide</a>). If you are selected, each applicant brings two identical 2 × 2 inch (51 × 51 mm) printed photos to the interview.</p>
<h2>What this DV photo editor changes, and what it doesn't</h2>
<p>It crops, rotates, straightens and resizes, and it saves the file small enough. It does not smooth skin, change colours or remove backgrounds, because the State Department says photos must not be digitally enhanced or altered to change your appearance. If step 1 says the background looks dark, take the photo again against a white wall.</p>
<p>The State Department also has its own free <a href="https://tsg.phototool.state.gov/photo" rel="noopener">photo tool</a> that crops a photo to 600 × 600 pixels. Whichever you use, a State Department employee makes the final decision on your photo: no tool can promise it will be accepted.</p>`;

  const faqs = [
    { q: 'What is the photo size for the DV lottery?', a: 'A square JPEG of <strong>600 × 600 pixels</strong>, <strong>240 kB or less</strong>, with your head 50% to 69% of the image height on a plain white or off-white background.' },
    { q: 'How do I check if my DV photo is valid?', a: 'Choose it in step 1 of this tool. It checks the format (JPEG), the file size (240 kB or less), the shape (square) and the size (600 × 600 pixels), and gives hints on colour and background. While you crop, it checks your head size live and turns green when it looks right. It is an estimate, and only the State Department can make the final decision.' },
    { q: 'How do I edit my photo for the DV lottery?', a: 'Crop and resize it: move and zoom it until your head fits between the ovals and they turn green, then download it. The tool saves a 600 × 600 JPEG of 240 kB or less. Don’t change your face or the background: the State Department says photos must not be digitally altered to change your appearance.' },
    { q: 'How do I make my DV photo under 240 kB?', a: 'The tool does it for you: it lowers the JPEG quality step by step until the file is 240 kB or less, and step 3 shows the final size before you download. A 600 × 600 photo is usually well under the limit.' },
    { q: 'Can I edit the background of my DV photo?', a: 'No. The background must be plain white or off-white, and the photo must not be digitally altered. If yours is not, take the photo again against a white wall.' },
    { q: 'Can I take my DV photo with an iPhone?', a: 'You may take the photo yourself, though the State Department recommends a professional photo service and says low quality mobile phone photos are not acceptable. If your iPhone saves HEIC photos and they won’t open here, open this page in Safari, or set Settings → Camera → Formats → Most Compatible.' },
    { q: 'Can I use an old photo for the DV lottery?', a: 'No. The photo must have been taken within the last 6 months, so take a new one for each entry.' },
    { q: 'Can I wear glasses in the DV photo?', a: 'No. Eyeglasses are no longer allowed in new visa photos, except in rare medical cases with a signed medical statement.' },
    { q: 'Is my photo uploaded anywhere?', a: 'No. The photo is opened, checked, cropped and saved entirely in your browser. It never leaves your phone or computer and is not stored.' },
  ];

  return toolPage({
    t,
    h1: 'DV Lottery Photo Tool: Check and Crop Your Photo',
    title: 'DV Photo Editor & Checker: EDV Photo 600x600 Under 240 kB',
    description: 'Free DV lottery photo checker and editor: check your EDV photo, crop it to 600×600 pixels under 240 kB, and see live when the head size is right.',
    lead: 'Check whether your DV (EDV) photo meets the official rules, then crop it to <strong>600 × 600 pixels</strong> and save it <strong>under 240 kB</strong>. The tool shows live when your head size is right. Free, and your photo never leaves your device.',
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
    lead: 'Type Nepali with an English keyboard or the familiar Preeti layout, convert Preeti to Unicode, convert Nepali dates, and check and crop your DV lottery photo. Free, fast and private: everything runs in your browser.',
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
    description: 'Free tools: Nepali typing, Preeti to Unicode converter, Nepali keyboard, Nepali date converter, and a DV lottery photo checker and editor.',
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
