// Site-wide settings. Edit here; every page reads from this file.

export const site = {
  name: 'Hamropedia',
  url: 'https://hamropedia.com', // no trailing slash
  tagline: 'Nepali tools, AI learning and honest guides',
  description:
    'Free Nepali tools (English to Nepali typing, Nepali keyboard, Nepali date converter, age calculator), a free AI and machine learning roadmap, study-abroad guides for Nepali students, and sourced Nepal news in English and Nepali.',
  locale: 'en_GB',
  lang: 'en',
  author: {
    name: 'Manoj Kumar Thapa',
    role: 'Software Engineer',
    url: 'https://hamropedia.com/about-us/',
    location: 'Birmingham, United Kingdom',
    photo: '/images/manojkumarthapa-160.webp',
    photoLarge: '/images/manojkumarthapa-portrait.webp',
    photoSchema: '/images/manojkumarthapa.jpg',
  },
  email: 'thapam807@gmail.com',
  social: {
    facebook: 'https://www.facebook.com/manojthapa807',
    linkedin: 'https://www.linkedin.com/in/manoj-kumar-thapa-7595a5168',
    youtube: 'https://www.youtube.com/@thapam807',
  },
  // Paste the content value of Google Search Console's HTML-tag verification here.
  googleSiteVerification: '',
  established: 2024,
};

export const nav = [
  { href: '/blog/', label: 'Blog' },
  { href: '/news/', label: 'News' },
  { href: '/ai-roadmap/', label: 'AI Roadmap' },
  { href: '/tools/', label: 'Tools' },
  { href: '/ne/', label: 'नेपाली', lang: 'ne' },
  { href: '/about-us/', label: 'About' },
];

// The same menu, for pages written in Nepali.
export const navNe = [
  { href: '/blog/', label: 'ब्लग' },
  { href: '/ne/', label: 'समाचार' },
  { href: '/ai-roadmap/', label: 'एआई रोडम्याप' },
  { href: '/tools/', label: 'टुल्स' },
  { href: '/news/', label: 'English', lang: 'en' },
];

// Category slugs match the old WordPress category URLs (/category/<slug>/).
export const categories = {
  'study-abroad': {
    name: 'Study Abroad',
    nameNe: 'विदेश अध्ययन',
    description: 'Step-by-step, sourced guides for Nepali students: NOC, WES, UK visas and more.',
    hue: 'blue',
  },
  coding: {
    name: 'Coding',
    nameNe: 'कोडिङ',
    description: 'Programming guides and roadmaps for beginners, written for Nepali students.',
    hue: 'green',
  },
  ai: {
    name: 'AI & Machine Learning',
    nameNe: 'एआई र मेसिन लर्निङ',
    description: 'Learn AI and machine learning for free, and follow what AI means for Nepal.',
    hue: 'violet',
  },
  nepal: {
    name: 'Nepal',
    nameNe: 'नेपाल',
    description: 'Sourced news explainers and round-ups from Nepal, plus guides to typing and using Nepali online.',
    hue: 'indigo',
  },
};

// Old WordPress posts that were removed because they were outdated or
// inaccurate. Each old URL now forwards to the closest useful page, so links
// and Google results do not end in a 404.
export const redirects = [
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
    to: '/coding-for-beginners-the-complete-roadmap-for-nepali-students-in-2025/',
    title: 'Top programming languages to learn',
  },
  {
    from: '/devin-the-worlds-first-ai-software-engineer-who-never-sleeps/',
    to: '/how-to-learn-ai-and-machine-learning-for-free/',
    title: 'Devin, the AI software engineer',
  },
  { from: '/category/online-marketing/', to: '/blog/', title: 'Online marketing' },
  { from: '/home/', to: '/', title: 'Home' },
  { from: '/feed/', to: '/rss.xml', title: 'RSS feed' },
];
