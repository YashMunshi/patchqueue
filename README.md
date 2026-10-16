# PatchQueue

Deduplicate supplied findings, propose exact version updates, and track rescan evidence.

**Field:** Security automation & tooling  
**Relevant roles:** Security Automation Engineer · Security Tools Engineer  
**Status:** working prototype, published on GitHub and Vercel.

[**Open the live interactive lab**](https://patchqueue.vercel.app/)

The hosted lab runs synthetic exercises in your browser. See the scope below for local integration exercises and limitations.

## Run

Requires Node.js 22 or newer. The core prototype has no npm dependencies.

```sh
npm test
npm run build
npm start
```

Open `http://127.0.0.1:8767`. Use `PORT=8770 npm start` for another port.
To run analysis without a browser:

```sh
npm run analyze
node run.mjs input.json
```

## Explore

1. Run the bundled scan. Four records become three distinct remediation items.
2. Select a fixed version in candidates. The item remains a proposal until rescan evidence is supplied.
3. Import a normalized complete rescan and inspect which advisories are absent. The tool never treats a version change alone as proof.

## What is implemented

- A project-specific analysis engine shared by the browser and CLI.
- Guided controls plus editable/importable JSON input (maximum 1 MB).
- Computed decisions, supporting records, explicit empty/error states, and
  downloadable evidence containing the input and limitations.
- Self-hosted Space Grotesk headings and DM Sans text; 18px body text,
  16px supporting text, 15px technical labels, keyboard focus, reduced motion,
  and responsive evidence rows.
- Independent boundary and regression tests in `tests/`.

## Scope and limitations

Bundled package names and advisories are fictional. Version comparison supports stable exact versions only. No PR, dependency change, or scanner execution happens automatically.

All bundled identities, documents, logs, and advisories are fictional. Browser
inputs are visitor-controlled; this public demo is not a trusted security
boundary. Do not use it with private production data. Local enforcement or
provider runners, where provided, have their own documented setup and limits.
Do not report fixture outcomes as production results or live-model findings.

## Publish independently

This directory is a complete, separate GitHub/Vercel project. After creating a
repository, push this directory as its root. Import that repository in Vercel:
framework **Other**, build command **npm run build**, output **public**.
There are no required secrets for the public demo. Do not include `public/`,
`.env`, provider credentials, or actual investigation evidence in Git.

## Structure

- `web/engine.js`: domain-specific analysis and validation
- `web/runtime.js`: input validation, canonicalization, and hashing utilities
- `web/app.js`: accessible controls, result views, imports, and exports
- `tests/`: independently asserted security and behavior tests
- `docs/THREAT-MODEL.md`: trust boundaries and claims
- `scripts/`: optional local integrations, if applicable

## Validation

Run `npm test` for current results. Browser viewport checks and performance
metrics must be measured separately; passing engine tests does not establish
visual accessibility or production readiness.

Font notices are included in `web/fonts/`. Source code is MIT licensed.

## Import a real npm scan and propose a fix

Export an npm audit JSON report and its matching package-lock file from a
repository you own. Normalize them with:

```sh
node scripts/import-audit.mjs npm-audit.json package-lock.json imported-audit.json
```

The importer supports npm audit v2 plus lockfile v2/v3. Reachability remains
unknown and is not inferred from a scan. Exact stable versions are required by
the analysis engine; unsupported version forms fail instead of guessing.

The optional proposal script defaults to preview only:

```sh
node scripts/propose-fix.mjs --repo-dir /path/to/test-repo --package example-http --version 1.2.3
```

Use a real installed package when testing this script. Add `--apply` to create
a local branch, update a direct dependency and lockfile with install scripts
disabled, run npm audit, and commit. Add `--publish` as well to push that branch
and open a PR using your own authenticated `gh` CLI. The working tree must be
clean. It does not merge changes or claim compatibility. This external proposal
workflow was not executed against a real repository during this build.
