# OpenCode Prompt — Copy This When You Start

> **Paste the text below into OpenCode every time you begin working on MedZiva.**

---

```
I am working on the MedZiva healthcare website.

PROJECT STRUCTURE:
- med21/ = React frontend (Vite + TypeScript + Tailwind)
- med21-laravel/ = Laravel backend (PHP + MySQL)
- Both hosted on GoDaddy shared hosting
- Live site: https://medzivahealthcare.com
- Test site: https://staging.medzivahealthcare.com

RULES I MUST FOLLOW:
1. Always use src/lib/api.ts for API calls (never use raw fetch)
2. Run npm run lint, npm run format, npm run typecheck, npm run build after changes
3. Never modify .env files (only edit .env.staging and .env.production templates)
4. Never add comments to code unless I explicitly ask
5. Never add demo credentials or hardcoded passwords
6. Use American English spelling (Color not Colour, Center not Centre)
7. Never commit secrets (passwords, API keys, tokens)
8. Never push directly to main branch
9. Never use image filenames with spaces or mixed case — always lowercase slugs (e.g. generic-nurse-visit.jpg)
10. Always use the SafeImage component for images, never raw <img>
11. After changing images or seeders, run php artisan images:verify

BRANCHING:
- main = production (live website)
- develop = staging (test website)
- feature/* = individual features (branch off develop)

DEPLOYMENT:
- ./deploy.sh staging = deploy to test site
- ./deploy.sh production = deploy to live site
- Always test on staging before production

READ THESE FILES FIRST:
- BALA_START_HERE.md (project overview and setup)
- DEPLOYMENT.md (how deployment works)
- CONTRIBUTING.md (full contribution guidelines)
- AUDIT_REPORT.md (current known issues and roadmap)
```

---

## What to Say When...

### Starting a new feature:
```
I need to add [feature name]. 

Read BALA_START_HERE.md first. 
Create a feature branch from develop.
Build the feature.
Run lint, format, typecheck, and build.
Do not commit unless I ask you to.
```

### Fixing a bug:
```
There's a bug: [describe the bug].

Read the relevant files in med21/src/components/ or med21-laravel/app/.
Fix the bug.
Run lint, format, typecheck, and build.
Do not commit unless I ask you to.
```

### Deploying:
```
Deploy the latest changes to staging.
Run ./deploy.sh staging
Tell me when it's done.
```

### Going live:
```
I've tested on staging and it works.
Deploy to production.
1. Merge develop into main
2. Push to origin
3. Run ./deploy.sh production
Tell me when it's done.
```

---

## Image Handling Reminder

Images break easily. Follow these rules:

- **Filenames:** lowercase, hyphen-separated, no spaces  
  Good: `generic-nurse-visit.jpg`  
  Bad: `Generic Nurse Visit.jpg`
- **Component:** Use `SafeImage` from `@/components/SafeImage`, never raw `<img>`.
- **No fallbacks:** Do not add placeholder images to hide broken paths. Fix the source data.
- **Verification:** After image/seeder changes run:  
  ```bash
  cd med21-laravel
  php artisan images:verify
  ```
