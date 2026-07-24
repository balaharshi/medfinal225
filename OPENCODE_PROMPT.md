# OpenCode Guide for Bala

> Copy-paste the prompts below. Replace text in `[brackets]` with your own words.

---

## Start every session with this

Paste this into OpenCode before doing anything:

```
I am working on the MedZiva healthcare website (React + Laravel on GoDaddy).

RULES:
1. Use src/lib/api.ts for API calls, never raw fetch
2. Run npm run lint, npm run format, npm run typecheck, npm run build after every change
3. Never edit .env files — only .env.staging or .env.production templates
4. Never add comments to code unless I say so
5. Never add demo credentials or hardcoded passwords
6. Use American English spelling (Color, Center)
7. Never commit secrets (passwords, API keys, tokens)
8. Never push to main branch
9. Always use SafeImage component, never raw <img>
10. Never hardcode vendor names — they come from the database
11. After changing images or seeders, run php artisan images:verify
12. Read CONTRIBUTING.md — it has everything

BRANCHING: main = production, develop = staging, feature/* = new features

DEPLOYMENT: ./deploy.sh staging = test, ./deploy.sh production = live
```

---

## Common tasks — just copy and paste

### Fix a bug

```
There is a bug: [describe what happens, what you expected instead, and steps to reproduce].
Find the relevant code in med21/src/ or med21-laravel/app/.
Fix the bug.
Run lint, format, typecheck, and build.
Do not commit unless I ask.
```

### Add a new feature

```
I need to add: [describe the feature].
Create a feature branch from develop.
Build the feature.
Run lint, format, typecheck, and build.
Do not commit unless I ask.
```

### Deploy to staging

```
Deploy the latest changes to staging.
Run ./deploy.sh staging.
Tell me when it is done.
```

### Deploy to production (only after testing on staging)

```
I tested on staging and it works.
Deploy to production:
1. Merge develop into main
2. Push to origin
3. Run ./deploy.sh production
Tell me when it is done.
```

### Explain something in the code

```
Explain how [feature name] works. Show me the relevant files and line numbers.
```

### Make changes to the database

```
I need to [describe the change]. Update the Laravel migration or seeder.
Run php artisan migrate:fresh --seed after.
Do not commit unless I ask.
```

---

## OpenCode tips

- **Be specific** — say exactly what you want, where you want it, and what it should look like
- **If confused** — tell OpenCode "Read the relevant files first" before asking it to edit anything
- **If something breaks** — paste the error message and say "Fix this error"
- **Never approve a commit** unless you have reviewed the changes
- **Run `npm run build`** before every commit to make sure nothing is broken
