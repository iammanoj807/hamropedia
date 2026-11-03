# Hamropedia

**[hamropedia.com](https://hamropedia.com)** · News, study-abroad guides and learning, explained simply.

Hamropedia (हाम्रो, "our", + encyclopedia) is a free website with clear, sourced articles
and a few useful tools. Every article shows when it was published and last updated, and
links to the official or named sources it is based on.

## What's on the site

- **News**: important news explained in plain English, with Nepali versions of every story.
- **Study abroad guides**: step-by-step guides for NOC, WES evaluation, UK student visas,
  the UKVI credibility interview and more, checked against the official websites.
- **Learning**: four free courses, with a "Start here" map on the Learn page, and beginner coding guides:
  - **AI & ML Roadmap**: 8 phases and 98 lessons, from NumPy to LLMs.
  - **System Design**: 10 phases and 72 lessons (high-level, low-level and AI/ML design, with 22
    full interview questions), plus revision notes for the night before an interview.
  - **SQL**: 9 phases and 61 lessons (14 interview problems) on one practice database, with a
    query runner in the browser (sql.js) and saved queries.
  - **DSA (NeetCode 150)**: 18 patterns and 150 problems, with templates, traced examples,
    question-and-answer cards, a review schedule (1, 3, 7, 14, 30 days) and a "Which pattern?" drill.

  Lessons have an animation, a diagram, worked code and exercises with answers. Progress is kept
  in the reader's browser (no accounts), with a download/load file to back it up.
- **Tools**: English to Nepali typing, a Nepali keyboard (Preeti layout and Romanized),
  a Nepali date converter (BS ↔ AD) and an age calculator. They all run in your browser.

## Updating the courses

The lessons are written in atomic-hub (my own study app) and copied here as JSON:

```bash
npm run sync-courses   # needs atomic-hub next to this repo, or ATOMIC_HUB=/path/to/atomic-hub
npm run build && npm run verify
```

Commit the changed files in `src/data/courses/`. The build only reads those files, never atomic-hub.
`slugs.json` keeps every lesson's URL fixed, even if a topic is renamed in atomic-hub.
Reading progress (ticked checks) is saved in each reader's browser; there are no accounts.

## Author

Made by **Manoj Kumar Thapa**, AI software engineer in Birmingham, United Kingdom.

[GitHub](https://github.com/iammanoj807) · [Portfolio](https://iammanoj807.github.io/profile/) · [LinkedIn](https://www.linkedin.com/in/manoj-kumar-thapa-7595a5168)
