---
title: "How to Learn AI and Machine Learning for Free: A Realistic Roadmap"
seoTitle: "How to Learn Machine Learning and AI for Free: 2026 Roadmap"
description: "A realistic, free path into AI and machine learning: what to learn first, the best free courses and videos, the tools you need, and projects that stand out."
date: 2026-11-01
updated: 2026-11-05
category: ai
tags: [ai, machine learning, roadmap, learning, python]
coverWord: "Learn AI"
coverAlt: "A free roadmap for learning AI and machine learning"
---

You can learn AI and machine learning properly without paying for a single course. The best material in the world, from Stanford, MIT, Harvard, 3Blue1Brown and Andrej Karpathy, is free online. The hard part is not finding resources but **knowing what to learn, in what order, and what to skip**.

That is what the [Hamropedia AI & ML Roadmap](/ai-roadmap/) is for: 8 phases and 98 full lessons, in order. Every lesson has an animation, a diagram, worked code and four exercises with answers, plus hand-picked free videos and readings if you want a second explanation. This article explains how to use it.

## The AI roadmap: 8 phases

| Phase | What you learn | Why it matters |
|---|---|---|
| [0. Your toolkit](/ai-roadmap/your-toolkit/) | Python, NumPy, Git, the command line | Every later phase uses them daily |
| [1. Math foundations](/ai-roadmap/math-foundations/) | Linear algebra, calculus, probability | The language every model is written in |
| [2. Classical ML](/ai-roadmap/classical-ml-built-by-you/) | Regression, trees, evaluation, built in NumPy | Understanding *why* models work and fail |
| [3. Deep learning](/ai-roadmap/deep-learning-foundations/) | Neural networks, backprop, PyTorch | The engine behind modern AI |
| [4. Transformers & LLMs](/ai-roadmap/transformers-and-llms/) | Attention, tokenisers, building a small GPT | How ChatGPT-style models work inside |
| [5. AI engineering](/ai-roadmap/ai-engineering/) | RAG, evaluation, agents, deployment | The core of most AI engineer jobs |
| [6. Systems & scale](/ai-roadmap/systems-and-scale/) | GPUs, memory, speed, multi-GPU training | Making models fast and cheap |
| [7. Generative models & RL](/ai-roadmap/generative-models-and-reinforcement-learning/) | VAEs, diffusion, reinforcement learning | Image generators and RLHF |

## Five rules that matter more than any course

1. **Go in order.** Skipping maths to "get to the fun part" is the most common reason people stall at deep learning.
2. **One resource per topic.** Collecting courses feels like progress, but it isn't. On the roadmap, one resource per topic is marked **Worth it**. Start there.
3. **Build, then rebuild.** Code along with a video, then close it and write the code again from a blank file. The second time is where you learn.
4. **Explain it out loud.** If you can't explain gradient descent to a friend in two sentences, you don't know it yet.
5. **Revisit old topics.** Every couple of weeks, test yourself on earlier topics and untick anything you've forgotten. Each lesson's four checks (Explain, Derive, Build, Break) are saved in your browser for exactly this, and **Download my progress** keeps a copy.

## The best free resources (a starter set)

- **Maths, visually:** [3Blue1Brown: Essence of Linear Algebra](https://www.3blue1brown.com/topics/linear-algebra) and [Essence of Calculus](https://www.3blue1brown.com/topics/calculus).
- **Maths, written:** [Mathematics for Machine Learning](https://mml-book.github.io/) (free book).
- **Classical ML:** [StatQuest](https://www.youtube.com/@statquest) videos and [An Introduction to Statistical Learning](https://www.statlearning.com/) (free book, Python edition).
- **Deep learning from scratch:** [Andrej Karpathy: Neural Networks: Zero to Hero](https://karpathy.ai/zero-to-hero.html).
- **Deep learning book:** [Understanding Deep Learning](https://udlbook.github.io/udlbook/) by Simon Prince (free PDF).
- **Transformers:** [The Illustrated Transformer](https://jalammar.github.io/illustrated-transformer/) and Karpathy's "Let's build GPT".
- **AI engineering:** [Your AI Product Needs Evals](https://hamel.dev/blog/posts/evals/) by Hamel Husain.

The full list, sorted by topic and type (video, interactive, reading, code, paper), is inside each lesson of the [roadmap](/ai-roadmap/).

Aiming for an AI engineer job? Interviews usually test more than machine learning. Hamropedia has free courses for those too: [SQL](/sql/) (with a query runner in your browser), [DSA with the NeetCode 150](/dsa/) for coding rounds, and [System Design](/system-design/), including [AI and ML system design](/system-design/ai-ml-design/). The [Start here map](/learn/#start-here) shows an order to take them alongside the roadmap.

## What you need

- **A normal laptop.** Phases 0 to 3 run fine on any recent computer.
- **Python** (free) and a code editor such as VS Code (free).
- **Free GPU time** when you need it: [Google Colab](https://colab.research.google.com/) and [Kaggle notebooks](https://www.kaggle.com/code) both offer free GPU hours, which is enough for this roadmap's projects.
- **Time:** consistency beats intensity. One focused hour a day, every day, goes further than a ten-hour weekend once a month.

## Projects that make you stand out

Employers and universities remember projects that solve a real problem, especially with local data. Ideas:

- **Devanagari handwriting recogniser** using the public [Devanagari Handwritten Character Dataset](https://archive.ics.uci.edu/dataset/389/devanagari+handwritten+character+dataset) (Phase 3).
- **Nepali news topic classifier**: scrape headlines, label a few hundred, train and evaluate (Phases 2–3).
- **Romanized-to-Nepali typing model** that learns from examples instead of rules. Compare it with our [rule-based typing tool](/tools/english-to-nepali/) (Phase 4).
- **A RAG assistant** that answers questions about NOC or WES rules from official documents, with an evaluation set you wrote yourself (Phase 5).

Put each one on GitHub with a short README: the problem, the data, how you measured success, and what didn't work.

## Frequently asked questions

**Can I learn machine learning for free?** Yes. The best courses and books are free online, and the [Hamropedia AI & ML roadmap](/ai-roadmap/) puts them in order with 98 free lessons. You only need a laptop; free cloud notebooks such as Google Colab give you a GPU when you need one.

**How do I teach myself machine learning?** Follow one ordered path instead of collecting courses: Python and NumPy, then the maths, then classical ML, then deep learning. Build a small project at the end of each stage.

**How long does it take to learn machine learning?** At about an hour a day, plan on several months to get through the foundations (Python, the maths and classical ML), and longer for deep learning and LLMs. Consistency matters more than speed.

**Can I learn ML in 1 week?** You can learn what ML is and train your first model in a week. Learning it properly takes months of steady practice.

**Can I do machine learning without maths?** You can use ML libraries without much maths, but to understand, debug and improve models you need some linear algebra, calculus and probability. Phase 1 of the roadmap teaches exactly the parts you need.

**How do I become an AI engineer?** Learn Python and the maths, then classical ML, deep learning and LLMs, and finish with AI engineering: retrieval (RAG), evaluation, agents and deployment. Build and publish projects at each stage. The [AI & ML roadmap](/ai-roadmap/) follows exactly this order.

**Python or C++ for AI?** Python. C++ is used inside the libraries for speed, but you write AI code in Python.

**Is ChatGPT AI or ML?** Both. ChatGPT is an AI product built with machine learning: a large language model trained on huge amounts of text. Phase 4 of the roadmap explains how such models work.

**Do I need a computer science degree?** No. You need patience with maths and lots of practice. Many working ML engineers are self-taught or came from other fields.

**Python or something else?** Python. Almost every AI library and course uses it.

**Should I start with ChatGPT-style apps (Phase 5) because that's where the jobs are?** You can build simple apps early, and that's motivating. But to debug them, evaluate them and stand out in interviews, you need Phases 1–4. Do both: build small apps while working through the foundations.

**Is AI going to replace programmers?** AI is changing what programmers spend their time on. People who understand how models work, and can judge when they are wrong, are in a strong position. This roadmap is designed to make you one of them.

---

Start now: [Phase 0: Your toolkit →](/ai-roadmap/your-toolkit/)
