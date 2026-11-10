# Name & domain

"Memorial Garden" is a **working name**. The public name and domain must be decided together, and **before launch**: after search engines index the site, changing the domain means redirecting every memorial page and losing some search ranking (DESIGN §6.14: URLs never change once published).

## Deadline

- **Decide by the start of M6** (launch prep), ideally sooner.
- **Must be final before:** buying the domain, publishing the Google OAuth consent screen, activating Stripe live mode (statement descriptor), registering the DMCA agent, and generating the terms of service and privacy policy. Each of these shows the name to the public or to a registry.
- Until launch, the site sends `X-Robots-Tag: noindex` (`apps/web/public/_headers`) so the `pages.dev` placeholder isn't indexed. Remove it at launch.

## Criteria

- **Distinctive.** "Memorial Garden(s)" is used by many real cemeteries and funeral homes: hard to rank for, easy to confuse with a physical place, and hard to protect.
- **Short and spellable aloud** (someone should be able to type it after hearing it once at a funeral).
- **Gentle in tone**, suitable for grief; nothing playful or salesy.
- **Works for pets too** (DESIGN §6.13) and for every tradition in §6.12.
- **Domain available**: `.com` preferred; otherwise a fitting, trusted TLD. Avoid hyphens and numbers.
- **Matching handles** available where useful (Instagram, Facebook, TikTok) and the project email.
- Keywords in the domain matter little for SEO. Memorial pages rank on their titles ("In loving memory of Rosa Martinez (1932–2024)"), content, and links.

## Clearance checks (for each finalist)

Not legal advice. Do these before buying the domain, and consider a short lawyer review alongside the terms of service (DESIGN §8.8).

- [ ] **USPTO trademark search** for the name and close variants: [tmsearch.uspto.gov](https://tmsearch.uspto.gov). Look especially at classes for online services, memorial/funeral services, and software (e.g. classes 9, 42, 45). A live mark in a related class is a no.
- [ ] Web search for existing businesses, apps, and nonprofits with the name.
- [ ] Your state's business entity search (relevant once you form an LLC).
- [ ] App Store and Google Play search.
- [ ] Domain and social handle availability.
- [ ] Say it aloud to a few people and ask them to spell it.

## Candidates

| Name | Domain | USPTO | Other checks | Notes |
| ---- | ------ | ----- | ------------ | ----- |
|      |        |       |              |       |

## Decision

- Name: _TBD_
- Domain: _TBD_
- Decided on: _TBD_ (then update DESIGN §2 "Name")

## Rename checklist (once decided)

Code and config:

- [ ] `apps/web/src/locales/en/common.json` → `brand.name`, plus any copy that uses the name
- [ ] Reserved display-name phrase for the site name: `RESERVED` in `packages/shared/src/profile.ts` and a **new migration** updating `private.display_name_problem` (keep the old name reserved too), with tests
- [ ] `apps/web/e2e/home.spec.ts` title assertion
- [ ] `README.md`, `docs/DESIGN.md` title and §2, this file
- [ ] Remove `X-Robots-Tag: noindex` from `apps/web/public/_headers`; extend the CSP if the domain adds new origins (e.g. `media.<domain>`)
- [ ] Internal identifiers (`@memorial-garden/*` packages, `memorial-garden-api` Worker, `supabase/config.toml` `project_id`, GitHub repo name) can stay; renaming them is optional

Accounts (domain):

- [ ] Buy the domain (Cloudflare Registrar) and add it to the Pages project under Custom domains
- [ ] Supabase → Authentication → URL Configuration: Site URL and redirect URL for the domain
- [ ] Google Auth Platform: app name, authorized JavaScript origin, app home page / privacy / terms links
- [ ] Cloudflare Email Routing `support@<domain>`; reply address on the contact form
- [ ] Stripe statement descriptor (currently planned as `MEMORIALGARDEN`)
- [ ] Sentry allowed domains, if restricted
- [ ] Sitemap and `robots.txt` (M1 SEO Worker) use the domain
