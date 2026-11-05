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
    intro: 'Guides for Nepali students going abroad, each checked against official sources and dated. Start with the <a href="/how-to-apply-noc-online-easy-steps-for-nepali-students/">NOC online guide</a> if you will send fees from Nepal. Applying to the USA or Canada? See <a href="/how-to-apply-for-wes-evaluation/">how to apply for WES</a> and <a href="/important-details-about-wes-evaluation-for-nepali-students/">what WES costs in rupees</a>. Going to the UK? Read the <a href="/uk-student-visa-from-nepal/">UK student visa from Nepal</a> guide, the <a href="/uk-graduate-visa-two-years-high-compliance-universities/">Graduate visa</a> rules, the <a href="/ilr-changes-uk-5-year-vs-10-year-route-earned-settlement/">new ILR rules</a> and <a href="/top-ukvi-interview-question-examples-and-answers/">UKVI interview questions</a>.',
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
    intro: 'Learn AI and machine learning properly, for free. Read <a href="/how-to-learn-ai-and-machine-learning-for-free/">how to learn machine learning for free</a> for a realistic plan, then follow the <a href="/ai-roadmap/">AI engineer roadmap</a>: 98 lessons from Python and maths to transformers, RAG and agents. For AI in Nepal, see <a href="/nepal-national-ai-policy-2082-explained/">Nepal\'s National AI Policy 2082</a>.',
    hue: 'violet',
  },
  nepal: {
    name: 'Nepal',
    nameNe: 'नेपाल',
    description: 'Sourced news explainers and round-ups from Nepal, plus guides to typing and using Nepali online.',
    intro: 'News from Nepal explained simply, with a link to the source for every fact, such as <a href="/nepal-gen-z-protests-to-balen-shah-government-explained/">how Balen Shah became prime minister after the Gen Z protests</a>. For typing Nepali online, read the <a href="/how-to-type-in-nepali-unicode-romanized/">Nepali Unicode typing guide</a> or use the free tools: <a href="/tools/english-to-nepali/">Nepali typing</a>, the <a href="/tools/preeti-to-unicode/">Preeti to Unicode converter</a> and the <a href="/tools/nepali-date-converter/">Nepali date converter</a>.',
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
  { from: '/how-to-apply-for-wes-evaluation-in-2025-a-complete-step-by-step-guide/', to: '/how-to-apply-for-wes-evaluation/', title: 'How to apply for WES evaluation', moved: true },
  { from: '/uk-immigration-2025-new-student-visa-rules-explained-simply/', to: '/uk-student-visa-from-nepal/', title: 'UK student visa from Nepal', moved: true },
  { from: '/category/online-marketing/', to: '/blog/', title: 'Online marketing' },
  { from: '/home/', to: '/', title: 'Home' },
  { from: '/feed/', to: '/rss.xml', title: 'RSS feed' },
];
