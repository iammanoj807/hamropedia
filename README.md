# Hamropedia

**[hamropedia.com](https://hamropedia.com)** · News, study-abroad guides and free tools, explained simply.

Hamropedia (हाम्रो, "our", + encyclopedia) is a free website with clear, sourced articles
and a few useful tools. Every article shows when it was published and last
updated, and links to the official or named sources it is based on.

## Free courses: now on AI Engineer Path

The four courses that used to be here (AI & ML Roadmap, System Design, SQL and DSA) were removed
on 20 November 2026. ML foundations, SQL and system design now live on
**[AI Engineer Path](https://learn.hamropedia.com/)**, a separate site. The
menu, the footer and the home page link to it.

The old course pages were not redirected: they now show the "page not found" page, so search
engines drop them.

## Also on the site

- **[News](https://hamropedia.com/news/)**: important news explained in plain English, with
  [Nepali versions](https://hamropedia.com/ne/) of every story.
- **[Study abroad guides](https://hamropedia.com/category/study-abroad/)**: step-by-step guides for
  NOC, WES evaluation, UK student visas, the UKVI credibility interview and more, checked against
  the official websites.
- **[Tools](https://hamropedia.com/tools/)**, all running in your browser:
  [English to Nepali typing](https://hamropedia.com/tools/english-to-nepali/),
  [Nepali keyboard](https://hamropedia.com/tools/nepali-keyboard/),
  [Preeti to Unicode converter](https://hamropedia.com/tools/preeti-to-unicode/),
  [Nepali date converter](https://hamropedia.com/tools/nepali-date-converter/) (BS ↔ AD) and
  [DV lottery photo tool](https://hamropedia.com/tools/dv-photo-tool/).

## How the site is built

A hand-built static site (Node.js, no framework) hosted on GitHub Pages:

```bash
npm install
npm run dev      # build into dist/ and serve it at http://localhost:4321
npm test         # unit tests
npm run verify   # checks every page: links, titles, descriptions, canonicals
```

## Author

Made by **Manoj Kumar Thapa**, AI software engineer in Birmingham, United Kingdom.

[GitHub](https://github.com/iammanoj807) · [Portfolio](https://iammanoj807.github.io/profile/) · [LinkedIn](https://www.linkedin.com/in/manoj-kumar-thapa-7595a5168)
