## 1.0.0 (2026-05-29)

### Features

* add music feed and new music tuesday scaffolding ([d36cc95](https://github.com/ericmikkelsen/new-music-tuesdays/commit/d36cc95520a2d1700924ed942ddc488c40e7fe72))
* **content:** expose release art URLs and track lists ([62b4e8a](https://github.com/ericmikkelsen/new-music-tuesdays/commit/62b4e8a957303db7c16cb0fce593a49b7ff77dca))
* **itunes:** fetch album track lists with resilient matching ([9cbda9f](https://github.com/ericmikkelsen/new-music-tuesdays/commit/9cbda9fcad95b609e8ec10ac0d7df286a6516563))
* **new-music-tuesday:** polish index cards and block styling ([14f881d](https://github.com/ericmikkelsen/new-music-tuesdays/commit/14f881d34278ebb66a75929c1ab90460e12bf618))
* **nmt:** enrich hero metadata and index cards ([03c4cb7](https://github.com/ericmikkelsen/new-music-tuesdays/commit/03c4cb79468da0b2f5e2ebd3ed9478996cb859cc))
* **render:** prerender music and NMT pages with hero-grid assets ([5151b17](https://github.com/ericmikkelsen/new-music-tuesdays/commit/5151b1751ef9840cae1d1a90f8baf465fa1505ba))
* **sanity:** support image cover art and preview media ([25fbfd5](https://github.com/ericmikkelsen/new-music-tuesdays/commit/25fbfd54ecf46b5cdcaf08cf4cdb84588094c5dd))
* **seed:** migrate music seeding to wikidata and itunes ([c3d5d9b](https://github.com/ericmikkelsen/new-music-tuesdays/commit/c3d5d9ba00b784f7103612c6394a26077358fe32))
* **seed:** preserve release art and backfill missing metadata ([d7a63e9](https://github.com/ericmikkelsen/new-music-tuesdays/commit/d7a63e97a17a44d2e6bac8a6c712466d59d66fe5))
* **studio:** add deploy action and homepage music updates ([df5c1e1](https://github.com/ericmikkelsen/new-music-tuesdays/commit/df5c1e119075c75cb2ab5487827c1724331af54b))
* **studio:** add music and NMT preview link mapping ([309a3af](https://github.com/ericmikkelsen/new-music-tuesdays/commit/309a3aff90dd2ed2584ccfd264a33be6c839dc99))
* **studio:** sync presentation routing and draft redirects ([fcecd4d](https://github.com/ericmikkelsen/new-music-tuesdays/commit/fcecd4d384e710fe5fc7a6a7fee3974e2a7453dc))
* updates blocks to make a little more sense ([0e2ee7d](https://github.com/ericmikkelsen/new-music-tuesdays/commit/0e2ee7de39bcdccce379593763c2baab9efe2f37))

### Bug Fixes

* **test:** avoid studio runtime imports in node tests ([484573a](https://github.com/ericmikkelsen/new-music-tuesdays/commit/484573a1d2a3ad87763210ae3b244c0064dcfa8f))

## 1.0.0 (2026-04-27)

### Features

* add agent-skills Copilot chat modes and VS Code extension ([8fa981f](https://github.com/ericmikkelsen/starter-template/commit/8fa981fe968bce93485436b9a5ed0f213fa5258b))
* add F5 launch config, tasks, and VSIX package script to agent-skills-extension ([f33e29a](https://github.com/ericmikkelsen/starter-template/commit/f33e29aa169ef6bf08361b056ed25f5e758fd2e1))
* add story/chapter branch policy with CI validation ([2b38617](https://github.com/ericmikkelsen/starter-template/commit/2b386170ba15128b7f39ddad486d594e41241350))
* **deps:** use consistent caret ranges for all semantic-release plugins ([682cc3a](https://github.com/ericmikkelsen/starter-template/commit/682cc3ac33392af2c9d916b6da8da73c40192381))
* forces github to actually generate new branches and open PRs when possible ([1cb7c20](https://github.com/ericmikkelsen/starter-template/commit/1cb7c20486b2a41db3478fabb6810af6e92a02a8))
* **harness:** add Copilot SDK runner for /story, /visualize, /rescue skills ([4c9d588](https://github.com/ericmikkelsen/starter-template/commit/4c9d58816990eb6e185dc7bc8fce2fae97484b51))
* **harness:** forward COPILOT_GITHUB_TOKEN/GH_TOKEN to SDK gitHubToken ([15e5f85](https://github.com/ericmikkelsen/starter-template/commit/15e5f85b280526175ae9a3c7d5f1f79b106915a2))
* **scripts:** add PR body validator for visual-pr-communication SMART goals ([8cf8db4](https://github.com/ericmikkelsen/starter-template/commit/8cf8db46d1dac5e4d7b322a6c3d2233db07646a4))
* set up conventional commits, automated versioning, and Addy Osmani agent skills ([8a5b298](https://github.com/ericmikkelsen/starter-template/commit/8a5b298ca3f3df4185d130e09f89a9cd4306fdbb))
* **skills:** add narrative-branching, visual-pr-communication, prototype-decomposition skills ([5e6ccdf](https://github.com/ericmikkelsen/starter-template/commit/5e6ccdff08dbf30fc0363438915cdbd9045f60d7))
* update release.config.cjs ([af0aafd](https://github.com/ericmikkelsen/starter-template/commit/af0aafd7a9ee26ad504f45fbf9de9f4a1cf3ea04))

### Bug Fixes

* **ci:** add husky commit-msg hook, fix commitlint config, generate root lockfile ([1e1cf5c](https://github.com/ericmikkelsen/starter-template/commit/1e1cf5c923adc8e532fc3fd052cfde5eec830162))
* **ci:** broaden commitlint ignores to cover all legacy non-conventional commits ([a3336dd](https://github.com/ericmikkelsen/starter-template/commit/a3336dd056ef785387951ca6f3041bd7335a4533))
* **ci:** configure git identity for semantic-release commit step ([0508eb2](https://github.com/ericmikkelsen/starter-template/commit/0508eb233159e85923b1c52777ebf3291c367437))
* **ci:** disable body-max-line-length and ignore pre-conventional commit ([19a8109](https://github.com/ericmikkelsen/starter-template/commit/19a8109c56e0c6673eb51bceb389207538d03c33))
* **ci:** remove npm cache from setup-node to fix missing lock file error ([df13ec9](https://github.com/ericmikkelsen/starter-template/commit/df13ec9fd1995d8337814aebf7668c5db0db8379))
* **commitlint:** ignore legacy deps: Dependabot commits that cannot be rewritten ([ccef17e](https://github.com/ericmikkelsen/starter-template/commit/ccef17e29268f265058f7d941870fbb3b1949e07))
* **deps:** align semantic-release plugin majors with sr25 requirements ([0bdd183](https://github.com/ericmikkelsen/starter-template/commit/0bdd183af5947059d896f4adcb8a90905220dfe7))
* **harness:** default to claude-sonnet-4.5 (gpt-5 not always available) ([18a102d](https://github.com/ericmikkelsen/starter-template/commit/18a102d7337a70efd669e8ebc2f528c07c721748))
* **harness:** extract SYSTEM_PROMPT from .ts source and capture messages reliably ([fcc4ea6](https://github.com/ericmikkelsen/starter-template/commit/fcc4ea6667333983fc97f87f92be24f2a00cd973))
* **llm:** isolate system prompt in separate User message to prevent prompt injection ([07d800e](https://github.com/ericmikkelsen/starter-template/commit/07d800e3da9d17d1f7c45c389ef28fed091bd995))
* **release:** bump agent-skills-extension version via extra-files in release-please config ([863b894](https://github.com/ericmikkelsen/starter-template/commit/863b8943780c97bce70afdb3ef6ea8b6ef6cb6f2))

# Changelog

All notable changes to this project will be documented in this file.

This changelog is automatically generated by [semantic-release](https://semantic-release.gitbook.io/semantic-release/) from [Conventional Commits](https://www.conventionalcommits.org/).
