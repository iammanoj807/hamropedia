// Site-wide settings. Edit here; every page reads from this file.

export const site = {
  name: 'Hamropedia',
  url: 'https://hamropedia.com', // no trailing slash
  tagline: 'News, guides and learning, explained simply',
  description:
    'Study-abroad guides (NOC, WES, UK visas, EDV), news explained simply in English and Nepali, and free courses in AI, system design, SQL and DSA.',
  locale: 'en_GB',
  lang: 'en',
  author: {
    name: 'Manoj Kumar Thapa',
    role: 'AI Software Engineer',
    url: 'https://hamropedia.com/about-us/',
    location: 'Birmingham, United Kingdom',
  },
  email: 'thapam807@gmail.com',
  social: {
    github: 'https://github.com/iammanoj807',
    portfolio: 'https://iammanoj807.github.io/profile/',
    facebook: 'https://www.facebook.com/manojthapa807',
    linkedin: 'https://www.linkedin.com/in/manoj-kumar-thapa-7595a5168',
    youtube: 'https://www.youtube.com/@thapam807',
  },
  // Sister site: websites and AI for small businesses.
  digital: { name: 'Hamropedia Digital', url: 'https://digital.hamropedia.com/' },
  // Buy Me a Coffee username (buymeacoffee.com/<username>). Leave empty and no support
  // buttons appear anywhere; fill it in and they appear in the header, footer, About page
  // and at the end of every article and lesson.
  support: { buyMeACoffee: 'manojthapa' },
  // Paste the content value of Google Search Console's HTML-tag verification here.
  googleSiteVerification: '',
  // Google AdSense publisher ID ("ca-pub-..."; ads.txt uses the same number as "pub-...").
  // The AdSense tag also shows Google's consent message, set up in AdSense > Privacy & messaging.
  adsenseClient: 'ca-pub-2805610183510543',
  // Ahrefs Web Analytics site key (Ahrefs > Web Analytics > project settings > tracking code).
  ahrefsAnalyticsKey: 'V4417NRGR/Pok/eQAnOZYw',
  established: 2024,
};

export const nav = [
  { href: '/news/', label: 'News' },
  { href: '/blog/', label: 'Blog' },
  {
    href: '/learn/', label: 'Learn & Build',
    children: [
      { href: '/ai-roadmap/', label: 'AI & ML Roadmap' },
      { href: '/system-design/', label: 'System Design' },
      { href: '/sql/', label: 'SQL' },
      { href: '/dsa/', label: 'DSA (NeetCode 150)' },
    ],
  },
  { href: '/tools/', label: 'Tools' },
  { href: '/about-us/', label: 'About' },
];

// The same menu, for pages written in Nepali.
export const navNe = [
  { href: '/ne/', label: 'समाचार' },
  { href: '/blog/', label: 'ब्लग' },
  {
    href: '/learn/', label: 'सिक्नुहोस्',
    children: [
      { href: '/ai-roadmap/', label: 'एआई तथा एमएल रोडम्याप' },
      { href: '/system-design/', label: 'सिस्टम डिजाइन' },
      { href: '/sql/', label: 'एसक्यूएल (SQL)' },
      { href: '/dsa/', label: 'डीएसए (NeetCode 150)' },
    ],
  },
  { href: '/tools/', label: 'टुल्स' },
  { href: '/news/', label: 'English', lang: 'en' },
];

// Category slugs match the old WordPress category URLs (/category/<slug>/).
export const categories = {
  'study-abroad': {
    name: 'Study Abroad',
    nameNe: 'विदेश अध्ययन',
    description: 'Step-by-step, sourced guides for students going abroad: NOC, WES, UK visas and more.',
    intro: 'Guides for Nepali students going abroad, each checked against official sources and dated. Start with the <a href="/noc-nepal-apply-online/">NOC online guide</a> if you will send fees from Nepal. Applying to the USA or Canada? See <a href="/wes-application-nepal/">how to apply for WES</a> and <a href="/wes-evaluation-cost-nepal/">what WES costs in rupees</a>. Going to the UK? Read the <a href="/uk-student-visa-nepal/">UK student visa from Nepal</a> guide, the <a href="/graduate-visa-uk-psw/">Graduate visa</a> rules, the <a href="/ilr-new-rules-uk/">new ILR rules</a> and <a href="/ukvi-credibility-interview-questions/">UKVI interview questions</a>.',
    hue: 'blue',
  },
  coding: {
    name: 'Coding',
    nameNe: 'कोडिङ',
    description: 'Programming guides and roadmaps for beginners: pick a language, build projects, and learn Git, DSA and Python.',
    intro: 'New to programming? Start with <a href="/how-to-learn-coding/">how to learn coding</a>, a free step-by-step roadmap. Then go deeper with the free courses: <a href="/dsa/">DSA with the NeetCode 150</a> for coding interviews, <a href="/sql/">SQL</a> with a query runner in your browser, and <a href="/system-design/">System Design</a> for building real systems. Not sure where to begin? The <a href="/learn/">Learn page</a> has a map and an order to take them in.',
    hue: 'green',
  },
  ai: {
    name: 'AI & Machine Learning',
    nameNe: 'एआई र मेसिन लर्निङ',
    description: 'Learn AI and machine learning for free, and follow the AI news that matters.',
    intro: 'Learn AI and machine learning properly, for free. Read <a href="/how-to-learn-ai-and-machine-learning-for-free/">how to learn machine learning for free</a> for a realistic plan, then follow the <a href="/ai-roadmap/">AI engineer roadmap</a>: 98 lessons from Python and maths to transformers, RAG and agents.',
    hue: 'violet',
  },
  nepal: {
    name: 'Nepal',
    nameNe: 'नेपाल',
    description: 'Sourced news explainers and round-ups from Nepal, plus guides to typing and using Nepali online.',
    intro: 'News from Nepal explained simply, with a link to the source for every fact, such as <a href="/nepal-gen-z-protests-to-balen-shah-government-explained/">how Balen Shah became prime minister after the Gen Z protests</a>. Need your national ID number? The <a href="/nid-card-check/">NID card check guide</a> shows how to find your NID number, check if your card is printed and download your eNID, the <a href="/driving-licence-online-form/">driving licence online form guide</a> shows how to apply for or renew a license on the DoTM eDLVRS portals, and the <a href="/smart-license-print-check/">license print check guide</a> shows how to find out if your smart driving license is printed. For your tax number, the <a href="/pan-card-registration/">PAN card registration guide</a> shows how to get a personal PAN online with your NID, and the <a href="/ird-pan-search-nepal/">IRD PAN search guide</a> shows how to check a PAN number. For typing Nepali online, read the <a href="/nepali-unicode-romanized-typing/">Nepali Unicode typing guide</a> and the <a href="/nepali-font-download-preeti-kalimati/">Nepali font download guide</a> (Preeti, Kalimati and Unicode fonts) or use the free tools: <a href="/tools/english-to-nepali/">Nepali typing</a>, the <a href="/tools/preeti-to-unicode/">Preeti to Unicode converter</a> and the <a href="/tools/nepali-date-converter/">Nepali date converter</a>.',
    hue: 'indigo',
  },
};

// Old WordPress posts that were removed because they were outdated or
// inaccurate. Each old URL now forwards to the closest useful page, so links
// and Google results do not end in a 404.
export const redirects = [
  {
    // Removed on 3 November 2026; the old address still works (it was on the WordPress site).
    from: '/python-decorators-explained-for-beginners/',
    to: '/category/coding/',
    title: 'Python decorators explained for beginners',
  },
  {
    from: '/top-skills-for-nepali-students-to-get-high-paying-jobs-in-canada-in-2025/',
    to: '/category/study-abroad/',
    title: 'Top skills for Nepali students to get jobs in Canada',
  },
  {
    from: '/the-top-destination-for-nepali-students-studying-abroad-in-2025/',
    to: '/category/study-abroad/',
    title: 'Top study-abroad destinations for Nepali students',
  },
  {
    from: '/a-guide-to-the-top-5-programming-languages-to-learn-in-2025/',
    to: '/how-to-learn-coding/',
    title: 'Top programming languages to learn',
  },
  {
    from: '/devin-the-worlds-first-ai-software-engineer-who-never-sleeps/',
    to: '/how-to-learn-ai-and-machine-learning-for-free/',
    title: 'Devin, the AI software engineer',
  },
  // Renamed on 5 November 2026 to short URLs without a year (the year lives in the title).
  { from: '/coding-for-beginners-the-complete-roadmap-for-nepali-students-in-2025/', to: '/how-to-learn-coding/', title: 'How to learn coding', moved: true },
  // Removed on 5 November 2026 (the photo tool is now DV size only).
  { from: '/tools/age-calculator/', to: '/tools/', title: 'Age calculator' },
  { from: '/tools/passport-size-photo-maker/', to: '/tools/dv-photo-tool/', title: 'Passport size photo maker' },
  { from: '/how-to-apply-for-wes-evaluation-in-2025-a-complete-step-by-step-guide/', to: '/wes-application-nepal/', title: 'WES application from Nepal', moved: true },
  // Rewritten from scratch on 6 November 2026 under new URLs (old posts removed; the old addresses forward here).
  { from: '/how-to-apply-noc-online-easy-steps-for-nepali-students/', to: '/noc-nepal-apply-online/', title: 'NOC online in Nepal', moved: true },
  { from: '/how-to-apply-for-wes-evaluation/', to: '/wes-application-nepal/', title: 'WES application from Nepal', moved: true },
  { from: '/important-details-about-wes-evaluation-for-nepali-students/', to: '/wes-evaluation-cost-nepal/', title: 'WES evaluation cost', moved: true },
  { from: '/uk-immigration-2025-new-student-visa-rules-explained-simply/', to: '/uk-student-visa-nepal/', title: 'UK student visa from Nepal', moved: true },
  // Removed on 7 November 2026: little search demand for the topic.
  { from: '/nepal-national-ai-policy-2082-explained/', to: '/category/ai/', title: 'Nepal National AI Policy 2082', note: 'This article has been removed.' },
  { from: '/ne/nepal-national-ai-policy-2082-explained/', to: '/ne/', title: 'Nepal National AI Policy 2082', note: 'यो लेख हटाइएको छ।' },
  { from: '/category/online-marketing/', to: '/blog/', title: 'Online marketing' },
  { from: '/home/', to: '/', title: 'Home' },
  { from: '/feed/', to: '/rss.xml', title: 'RSS feed' },
  { from: '/driving-licence-online-form-nepal/', to: '/driving-licence-online-form/', title: 'Driving licence online form in Nepal', moved: true },
  { from: '/license-print-check-nepal/', to: '/smart-license-print-check/', title: 'License print check in Nepal', moved: true },
  { from: '/nid-card-check-nepal/', to: '/nid-card-check/', title: 'NID card check in Nepal', moved: true },
  { from: '/ne/nid-card-check-nepal/', to: '/ne/nid-card-check/', title: 'NID card check in Nepal', moved: true, note: 'यो लेख नयाँ ठेगानामा सरेको छ।' },
  { from: '/pan-card-registration-nepal/', to: '/pan-card-registration/', title: 'PAN card registration in Nepal', moved: true },
  { from: '/ird-pan-search/', to: '/ird-pan-search-nepal/', title: 'IRD PAN search', moved: true },
  { from: '/noc-online-nepal/', to: '/noc-nepal-apply-online/', title: 'NOC online in Nepal', moved: true },
  { from: '/nepali-font-download/', to: '/nepali-font-download-preeti-kalimati/', title: 'Nepali font download', moved: true },
  { from: '/how-to-type-in-nepali-unicode-romanized/', to: '/nepali-unicode-romanized-typing/', title: 'How to type in Nepali', moved: true },
  { from: '/wes-application-from-nepal/', to: '/wes-application-nepal/', title: 'WES application from Nepal', moved: true },
  { from: '/wes-evaluation-cost/', to: '/wes-evaluation-cost-nepal/', title: 'WES evaluation cost', moved: true },
  { from: '/uk-student-visa-from-nepal/', to: '/uk-student-visa-nepal/', title: 'UK student visa from Nepal', moved: true },
  { from: '/uk-graduate-visa-two-years-high-compliance-universities/', to: '/graduate-visa-uk-psw/', title: 'UK Graduate visa: 18 months or 2 years', moved: true },
  { from: '/ne/uk-graduate-visa-two-years-high-compliance-universities/', to: '/ne/graduate-visa-uk-psw/', title: 'UK Graduate visa: 18 months or 2 years', moved: true, note: 'यो लेख नयाँ ठेगानामा सरेको छ।' },
  { from: '/ilr-changes-uk-5-year-vs-10-year-route-earned-settlement/', to: '/ilr-new-rules-uk/', title: 'ILR new rules', moved: true },
  { from: '/top-ukvi-interview-question-examples-and-answers/', to: '/ukvi-credibility-interview-questions/', title: 'UKVI credibility interview questions', moved: true },
  { from: '/edv-2027-nepal-dv-lottery-open-date/', to: '/edv-2027-nepal/', title: 'EDV 2027 in Nepal', moved: true },
  { from: '/ne/edv-2027-nepal-dv-lottery-open-date/', to: '/ne/edv-2027-nepal/', title: 'EDV 2027 in Nepal', moved: true, note: 'यो लेख नयाँ ठेगानामा सरेको छ।' },
];
