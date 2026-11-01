import { site } from '../data/site.js';
import { esc } from '../lib/util.js';
import { layout } from '../templates/layout.js';
import { breadcrumbs, breadcrumbSchema, faqBlock, faqSchema, shareBar, pageHead } from '../templates/components.js';
import { CHEAT_SHEET } from '../assets/js/lib/romanized.js';
import { BS_MONTHS_EN, BS_MONTHS_NE, BS_MIN_YEAR, BS_MAX_YEAR, BS_PROVISIONAL_FROM } from '../assets/js/lib/bs-date.js';

export const TOOLS = [
  {
    slug: 'english-to-nepali',
    name: 'English to Nepali Typing',
    short: 'Type Nepali with English letters',
    blurb: 'Type “mero naam” and get “मेरो नाम”. Romanized Nepali to Unicode, live, with smart spelling for common words.',
    sample: ['namaste', 'नमस्ते'],
  },
  {
    slug: 'preeti-to-unicode',
    name: 'Preeti to Unicode Converter',
    short: 'Fix old Preeti text, both ways',
    blurb: 'Turn broken Preeti text like “g]kfn” into real Nepali “नेपाल”, or convert Unicode back to Preeti for old documents.',
    sample: ['g]kfn', 'नेपाल'],
  },
  {
    slug: 'nepali-date-converter',
    name: 'Nepali Date Converter',
    short: 'BS ↔ AD, with a Nepali calendar',
    blurb: 'Convert Bikram Sambat (BS) to AD and back, see today’s Nepali date, and browse any month of the Nepali calendar.',
    sample: ['2083/07/15', '1 Nov 2026'],
  },
];

const toolPath = (slug) => `/tools/${slug}/`;

function toolSchema(t, description) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: t.name,
    url: `${site.url}${toolPath(t.slug)}`,
    description,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any (runs in the browser)',
    inLanguage: ['ne', 'en'],
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    publisher: { '@type': 'Organization', name: site.name, url: site.url },
  };
}

function related(current) {
  return `<section class="related-tools" aria-labelledby="rt-h">
  <h2 id="rt-h">More free Nepali tools</h2>
  <div class="tool-mini-grid">${TOOLS.filter((t) => t.slug !== current)
    .map((t) => `<a class="tool-mini" href="${toolPath(t.slug)}"><b>${esc(t.name)}</b><span>${esc(t.short)}</span></a>`)
    .join('')}</div>
</section>`;
}

function toolPage({ t, title, description, lead, toolHtml, explainer, faqs, script }) {
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Nepali Tools', path: '/tools/' },
    { name: t.name, path: toolPath(t.slug) },
  ];
  const body = `${pageHead({ crumbs, eyebrow: 'Free Nepali tool · works offline after loading', title: esc(t.name), lead })}
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
      schema: [toolSchema(t, description), faqSchema(faqs), breadcrumbSchema(crumbs)],
    });
}

// ---------------------------------------------------------------------------

const cheatTable = (rows) =>
  `<table class="cheat"><tbody>${rows.map(([a, b]) => `<tr><td><kbd>${esc(a)}</kbd></td><td lang="ne">${esc(b)}</td></tr>`).join('')}</tbody></table>`;

export function renderRomanized(version) {
  const t = TOOLS[0];
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
<p>New to Nepali typing? Read the full guide: <a href="/how-to-type-in-nepali-unicode-romanized/">how to type in Nepali Unicode on phone and computer</a>.</p>`;

  const faqs = [
    { q: 'Is this English to Nepali translation?', a: 'No. It converts the <em>sounds</em> you type in English letters into Nepali script (transliteration). “mero naam” becomes “मेरो नाम”. To translate meaning from English to Nepali you need a translator; this tool is for typing Nepali when you only have an English keyboard.' },
    { q: 'How do I type आ, ई and ऊ?', a: 'Double the vowel or use a capital: <code>aa</code> or <code>A</code> for आ/ा, <code>ee</code> or <code>I</code> for ई/ी, <code>oo</code> or <code>U</code> for ऊ/ू.' },
    { q: 'How do I type ट, ठ, ड, ढ, ण and ष?', a: 'Use capitals: <code>T</code> ट, <code>Th</code> ठ, <code>D</code> ड, <code>Dh</code> ढ, <code>N</code> ण and <code>Sh</code> ष.' },
    { q: 'How do I write ऋ and कृ?', a: 'Use capital <code>R</code> (or <code>rri</code>): <code>R</code> gives ऋ, and <code>kR</code> gives कृ, so <code>kRShNa</code> becomes कृष्ण.' },
    { q: 'How do I end a word with a halanta (्)?', a: 'Type a backslash after it: <code>garchhan\\</code> gives गर्छन्. Without the backslash a final consonant keeps its normal sound, so <code>naam</code> gives नाम.' },
    { q: 'Can I paste the result into Facebook, Word or Google Docs?', a: 'Yes. The output is standard Unicode Devanagari, so it works in Facebook, Messenger, WhatsApp, Gmail, Word, Google Docs and websites, on phones and computers, with no special font.' },
    { q: 'Is my text sent anywhere?', a: 'No. The conversion runs entirely in your browser. Nothing you type is uploaded or stored on a server.' },
  ];

  return toolPage({
    t,
    title: `English to Nepali Typing (Romanized to Unicode), free & live | ${site.name}`,
    description: 'Type in English letters and get Nepali Unicode instantly: “mero naam” → “मेरो नाम”. Free Romanized Nepali typing with smart spelling, copy and download. Works on phone.',
    lead: 'Type Nepali the way it sounds in English letters. <span lang="ne">“mero naam” → “मेरो नाम”</span>, instantly, right in your browser.',
    toolHtml,
    explainer,
    faqs,
    script: '/assets/js/tool-romanized.js',
  })(version);
}

export function renderPreeti(version) {
  const t = TOOLS[1];
  const toolHtml = `<div class="tool" id="pr-tool">
  <div class="seg seg-lg" role="radiogroup" aria-label="Conversion direction">
    <button type="button" role="radio" aria-checked="true" data-dir="p2u">Preeti → Unicode</button>
    <button type="button" role="radio" aria-checked="false" data-dir="u2p">Unicode → Preeti</button>
  </div>
  <div class="panes">
    <div class="pane">
      <label for="pr-in" class="pane-label" id="pr-in-label">Paste Preeti text</label>
      <textarea id="pr-in" spellcheck="false" autocapitalize="off" autocomplete="off" rows="9" placeholder="e.g. xfd|f] b]z g]kfn xf] ."></textarea>
      <div class="pane-foot"><span id="pr-count">0 characters</span><button type="button" class="btn-ghost" id="pr-swap">Swap ⇄</button><button type="button" class="btn-ghost" id="pr-clear">Clear</button></div>
    </div>
    <div class="pane pane-out">
      <label for="pr-out" class="pane-label" id="pr-out-label">Unicode नेपाली</label>
      <textarea id="pr-out" readonly rows="9"></textarea>
      <div class="pane-foot"><button type="button" class="btn" id="pr-copy">Copy</button><button type="button" class="btn-ghost" id="pr-download">Download .txt</button></div>
    </div>
  </div>
  <p class="tool-note" id="pr-note">Paste text that was typed with the Preeti font. If it looks like <code>g]kfn</code> when the font is missing, it is Preeti.</p>
</div>`;

  const explainer = `<h2>Why Preeti text breaks, and why Unicode fixes it</h2>
<p>Preeti is an old Nepali <em>font</em>, not a real script. It draws Nepali letters on top of ordinary English keys, so the word नेपाल is actually stored as <code>g]kfn</code>. On a computer with the Preeti font it looks right; everywhere else (phones, websites, email, Google Docs) it turns into gibberish, and search engines cannot read it.</p>
<p><strong>Unicode</strong> stores the real Nepali letters, so it looks right on every device and Google can find it. That is why government forms, news sites and Facebook all use Unicode now.</p>
<h3>How the converter works</h3>
<p>Two things make Preeti harder than a letter-for-letter swap, and this converter handles both:</p>
<ul>
<li><strong>Visual order.</strong> In Preeti the short i-sign (ि) is typed <em>before</em> its letter and the reph (र्) is typed <em>after</em> it, because that is where they appear on screen. Unicode stores them in spoken order, so they are moved: <code>lxdfn</code> → हिमाल, <code>ug{]</code> → गर्ने.</li>
<li><strong>Two-key letters.</strong> Some letters are built from two keys: <code>k</code> + <code>m</code> = फ, <code>e</code> + <code>m</code> = झ, and a half letter plus the <code>f</code> stroke makes the full letter.</li>
</ul>
<p>Going the other way, <strong>Unicode → Preeti</strong> gives you the keys to paste into an old document that still uses the Preeti font.</p>
<p>This converter is built and tested for Preeti. Other legacy fonts use different key layouts, so text typed in them may not convert correctly.</p>`;

  const faqs = [
    { q: 'What is the difference between Preeti and Unicode?', a: 'Preeti is a legacy font that maps Nepali shapes onto English keys, so the text only looks Nepali when that font is installed. Unicode is the international standard that stores real Nepali characters, so it displays correctly on every phone, computer and website.' },
    { q: 'How do I know if my text is Preeti?', a: 'Paste it somewhere that does not have the Preeti font, such as this page or a phone. If नेपाल shows up as <code>g]kfn</code>, the text is Preeti and needs converting.' },
    { q: 'Can I convert Unicode back to Preeti?', a: 'Yes. Choose “Unicode → Preeti”, paste Nepali Unicode text, and copy the result into a document that uses the Preeti font.' },
    { q: 'Why is a word slightly wrong after converting?', a: 'Usually because the original was typed with a small mistake, such as a sign in the wrong order, which Preeti hides on screen. Fix it in the output, and if a correctly typed word converts wrongly, please <a href="/contact-us/">send it to me</a> so I can fix the converter.' },
    { q: 'Is my document uploaded?', a: 'No. The conversion runs entirely in your browser, so your text never leaves your device.' },
  ];

  return toolPage({
    t,
    title: `Preeti to Unicode Converter (and Unicode to Preeti), free | ${site.name}`,
    description: 'Convert Preeti font text to Nepali Unicode instantly (g]kfn → नेपाल), or Unicode back to Preeti. Handles ि, reph and two-key letters correctly. Free, private, no upload.',
    lead: 'Fix Nepali text that turned into <code>g]kfn</code>. Convert Preeti to Unicode <span lang="ne">(नेपाल)</span>, or back again, instantly and privately.',
    toolHtml,
    explainer,
    faqs,
    script: '/assets/js/tool-preeti.js',
  })(version);
}

export function renderDate(version) {
  const t = TOOLS[2];
  const years = [];
  for (let y = BS_MIN_YEAR; y <= BS_MAX_YEAR; y++) years.push(y);
  const yearOpts = years.map((y) => `<option value="${y}">${y}${y >= BS_PROVISIONAL_FROM ? ' *' : ''}</option>`).join('');
  const monthOpts = BS_MONTHS_EN.map((m, i) => `<option value="${i + 1}">${i + 1} · ${m} (${BS_MONTHS_NE[i]})</option>`).join('');

  const toolHtml = `<div class="tool date-tool" id="dt-tool">
  <div class="today-card" aria-live="polite">
    <p class="today-label">Today in Nepal</p>
    <p class="today-ne" lang="ne" id="dt-today-ne">&nbsp;</p>
    <p class="today-en" id="dt-today-en">&nbsp;</p>
    <p class="today-time" id="dt-time"></p>
  </div>
  <div class="convert-grid">
    <form class="convert-card" id="ad2bs" novalidate>
      <h2>AD → BS</h2>
      <label for="ad-date">English date (AD)</label>
      <input type="date" id="ad-date" min="1943-04-14" max="2034-04-13" required>
      <output class="result" id="ad2bs-out" for="ad-date"></output>
    </form>
    <form class="convert-card" id="bs2ad" novalidate>
      <h2>BS → AD</h2>
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

  const explainer = `<h2>About the Nepali calendar (Bikram Sambat)</h2>
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
    { q: 'What is today’s Nepali date?', a: 'It is shown at the top of this page, calculated for Nepal Standard Time (UTC+5:45), so it changes at midnight in Nepal, not at midnight where you are.' },
    { q: 'Why do Nepali months have 29, 30, 31 or 32 days?', a: 'BS months follow the Sun’s movement through the zodiac signs, which takes slightly different lengths of time. The official calendar fixes the length of each month every year, so the number of days in, say, Asar is not the same every year.' },
    { q: 'Which years can I convert?', a: `${BS_MIN_YEAR} to ${BS_MAX_YEAR} BS, which is 14 April 1943 to April 2034 AD. Years from ${BS_PROVISIONAL_FROM} BS are provisional until the official calendar is final.` },
    { q: 'What are the 12 Nepali months?', a: 'Baisakh (बैशाख), Jestha (जेठ), Asar (असार), Shrawan (साउन), Bhadra (भदौ), Ashwin (असोज), Kartik (कात्तिक), Mangsir (मंसिर), Poush (पुस), Magh (माघ), Falgun (फागुन) and Chaitra (चैत).' },
  ];

  return toolPage({
    t,
    title: `Nepali Date Converter: BS to AD & AD to BS, with calendar | ${site.name}`,
    description: 'Convert Nepali date (Bikram Sambat) to English date and back. See today’s Nepali date and the full Nepali calendar month. Accurate table for 2000–2090 BS. Free.',
    lead: 'Convert Bikram Sambat to AD and back, see <span lang="ne">आजको मिति</span> (today’s date), and browse the Nepali calendar.',
    toolHtml,
    explainer,
    faqs,
    script: '/assets/js/tool-date.js',
  })(version);
}

export function renderToolsHub(version) {
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'Nepali Tools', path: '/tools/' }];
  const body = `${pageHead({
    crumbs,
    eyebrow: 'Free Nepali tools',
    title: 'Nepali tools that just work',
    lead: 'Type Nepali with an English keyboard, rescue old Preeti documents, and convert Nepali dates. Free, fast, private: everything runs in your browser.',
  })}
<section class="wrap">
  <div class="tool-cards">
    ${TOOLS.map(
      (t, i) => `<a class="tool-card" href="${toolPath(t.slug)}">
      <span class="tool-num">0${i + 1}</span>
      <h2>${esc(t.name)}</h2>
      <p>${esc(t.blurb)}</p>
      <span class="tool-demo"><code>${esc(t.sample[0])}</code><span aria-hidden="true">→</span><b lang="ne">${esc(t.sample[1])}</b></span>
      <span class="btn">Open tool</span>
    </a>`,
    ).join('')}
  </div>
  <p class="suggest">Need another Nepali tool? <a href="/contact-us/">Suggest one</a>. The most requested ideas get built next.</p>
</section>`;
  return layout({
    title: `Free Nepali Tools: English to Nepali typing, Preeti to Unicode, date converter | ${site.name}`,
    description: 'Free online Nepali tools: English to Nepali (Romanized) typing, Preeti to Unicode converter and Nepali date converter (BS to AD). Private, fast and mobile friendly.',
    path: '/tools/',
    body,
    version,
    section: '/tools/',
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Free Nepali tools',
        itemListElement: TOOLS.map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.name, url: `${site.url}${toolPath(t.slug)}` })),
      },
      breadcrumbSchema(crumbs),
    ],
  });
}
