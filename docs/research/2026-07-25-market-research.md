# Research Report: BYOK AI Marketing-Campaign Chatbot for SMEs

**Prepared:** July 2026 | **Method:** ~30 web searches + direct fetches of vendor pricing pages, primary survey reports, and Anthropic platform docs. Numbers marked *(low confidence)* come from SEO-farm aggregators rather than primary sources.

---

## 0. TL;DR verdict up front

The idea is technically trivial to build (Anthropic explicitly supports browser-side BYOK) and lands in a real, large, and growing pain point. But the exact shape proposed, "a chatbot that helps you plan a campaign," is the single most crowded and least defensible slice of the market: it competes with free HubSpot Campaign Assistant, free-tier ChatGPT/Claude, dozens of free "AI marketing plan generator" SEO tools, and GoDaddy/Canva/Mailchimp giving it away inside software SMBs already pay for.

The defensible version is narrower: **a structured, opinionated campaign *system* (not a chat box) that produces a complete, dated, channel-by-channel executable plan plus all copy assets, runs in the browser with zero data leaving the user's machine, and costs them ~$0.50 in API spend instead of $39-69/month.** Privacy + cost + "no signup, no seat, no vendor" is the wedge, and SEO/GEO is the only realistic distribution channel. Details and evidence below.

---

## 1. COMPETITIVE LANDSCAPE

### 1.1 Tier A: Paid AI content/marketing suites (the "obvious" competitors)

| Product | What it does | Pricing (July 2026) | Target user | Strengths | Weaknesses / gaps |
|---|---|---|---|---|---|
| **Jasper** (jasper.ai) | Brand-voice content generation, "Canvas" workspace, marketing agents, Brand IQ/knowledge assets, Jasper Grid | **Pro $69/mo per seat monthly, $59/mo annual**, 1 seat, 2 Brand Voices, 5 knowledge assets, 3 audiences; 7-day free trial. Business = custom, 12-month minimum ([pricing page](https://www.jasper.ai/pricing)). Third-party estimates put Business at ~$900/mo for 3-5 seats *(low confidence)* | Marketing teams, agencies, mid-market | Best-in-class brand-voice consistency; deep template library; brand assets/knowledge | Priced far above the 52% of SMBs whose *entire* monthly marketing budget is under $1,000; no campaign *strategy/planning* layer, it is an asset factory; heavy onboarding; drifted upmarket away from solo owners |
| **Copy.ai** | Repositioned from copywriting to "GTM AI Platform": chat + workflow automation | **Chat $29/mo monthly / $24/mo annual (5 seats, unlimited chat)**; then a cliff to **Growth $1,000/mo** (75 seats, 20k workflow credits), Expansion $2,000/mo, Scale $3,000/mo, Enterprise custom. No free plan ([pricing page](https://www.copy.ai/prices)) | Sales/GTM teams at funded companies | Cheap chat entry point; multi-model (OpenAI/Anthropic/Gemini) | The $29 → $1,000 pricing cliff abandons SMBs entirely; the product a small business would actually want (workflows) is 34x the entry price; brand no longer speaks to SMBs |
| **Semrush** (+ ContentShake AI) | SEO/competitive research, AI content briefs, AI-visibility tracking across ChatGPT/Perplexity/Gemini | Restructured 2026: **SEO $139/mo ($117.33 annual), Starter $199 ($165.17), Pro+ $299 ($248.17), Advanced $549 ($455.67)**; extra users from $45/mo ([pricing page](https://www.semrush.com/pricing/)). ContentShake AI reported as a **+$60/mo** add-on *(low confidence, [demandsage](https://www.demandsage.com/semrush-pricing/))* | Marketers, agencies, SEO-serious SMBs | Best data moat (real keyword/competitor data an LLM cannot invent); now tracks AI-search visibility | Expensive and complex; a solo owner drowns in it; sells data, not decisions; nothing here tells you *what campaign to run next month* |
| **AdCreative.ai** | Generates ad creatives, banners, video ads, scores creatives | 8 tiers, roughly **$29/mo (10 credits) up to $999/mo**; yearly = 50% off; 7-day trial with card required ([TrustRadius](https://www.trustradius.com/products/adcreative-ai/pricing)) | Performance marketers, e-com | Solves a real, narrow, visual problem | Credit anxiety; card-gated trial; creative only, no strategy; well-documented cancellation friction complaints |
| **Writesonic** | Repositioned to AI-search-visibility + content | **Starter $79/mo, Basic $199/mo, Growth $399/mo** (annual billing) ([writesonic.com/pricing](https://writesonic.com/pricing)) | Solo marketers, SEO teams | Rode the GEO wave early | Priced above SMB reality; identity churn (writing tool → GEO tool) |
| **Markty** | "AI marketing employees" (social, SEO, email, design) built for SMBs, EN + Turkish | **from $45/mo** ([markty.ai](https://www.markty.ai/en/academy/blog/9-best-ai-marketing-tools-for-small-businesses-2026)) | Micro-SMBs, non-English markets | Explicit SMB positioning; role-based agents; human approval step | Tiny brand; unproven; still a subscription |
| **NoimosAI** and similar "autonomous agent squads" | Self-running campaign agents | **from $79/mo** *(low confidence, vendor blog)* | SMBs wanting hands-off | Story is compelling ("digital employee") | Mostly marketing copy; heavy trust ask given 78% of SMB owners do not trust AI to run tasks unsupervised (see §2.4) |

### 1.2 Tier B: Free / embedded AI inside tools SMBs already have (the real killers)

This is the tier most likely to eat a standalone campaign chatbot, because SMB owners overwhelmingly prefer AI embedded in software they already run.

- **HubSpot Campaign Assistant** ([hubspot.com/campaign-assistant](https://www.hubspot.com/campaign-assistant)): free, public beta, no subscription or per-campaign cost. You give objective + audience + tone, it returns landing page copy, email copy, and platform-specific ad copy (Google/Facebook/LinkedIn) in ~60 seconds. This is *the direct feature-level competitor* and it costs $0. Requires a HubSpot account.
- **HubSpot free CRM + Marketing Hub free tier**: $0, includes forms, email sends, landing pages. Marketing Hub Starter is **$20/seat/mo monthly, $15/seat/mo annual** for 1,000 contacts. Breeze AI's real power is gated to Professional ($800-890/mo) and Enterprise; Breeze credits are ~$10 per 1,000; HubSpot moved Customer Agent to **$0.50 per resolved conversation** and Prospecting Agent to **$1 per lead** effective **April 14, 2026** ([MarTech](https://martech.org/hubspot-moves-to-outcome-based-pricing-for-some-breeze-ai-agents/)).
- **Mailchimp / Intuit Assist**: Creative Assistant, Content Optimizer, predictive segmentation, Customer Journey Builder. Free tier exists; **Essentials $13/mo**, **Standard $20/mo** unlocks the Intuit Assist AI features; scales to ~$1,600/mo at 200k contacts.
- **GoDaddy Airo / Airo.ai**: agentic AI for SMBs bundled with domains/hosting. Includes a **Marketing Calendar and Social Posts Agent** that "helps small businesses plan and launch marketing campaigns," a Conversations inbox, AI SEO, and blog generation ([GoDaddy newsroom](https://aboutus.godaddy.net/newsroom/news-releases/press-release-details/2025/GoDaddy-Accelerates-Airo-ai-Momentum-with-New-AI-Agents-for-Small-Business-Growth/default.aspx)). Free plan capped at ~50 AI credits/month. GoDaddy reaches ~20M+ SMB customers, which is a distribution advantage no indie tool can match.
- **Canva Magic Studio**: free tier with AI; owns the "SMB makes a marketing asset" moment.
- **Buffer**: free plan (3 channels) with AI Assistant; Essentials from **$5/channel/mo**. Hootsuite is **$99/user/mo** with no free plan, so a 3-person team pays $297/mo, pushing SMBs to Buffer/Canva.
- **Channel-native AI (free, and getting better)**: Meta Advantage+ and Google Performance Max already do audience/creative/budget optimization inside the ad platforms at no software cost.

### 1.3 Tier C: Free "AI marketing plan generator" lead-magnet tools (your closest direct analogue)

An entire cluster of free, SEO-driven, one-shot generators already ranks for exactly the queries this product would chase:

- **FounderPal Marketing Plan Generator** ([founderpal.ai/marketing-plan-generator](https://founderpal.ai/marketing-plan-generator)) — explicitly "100% Free, No Email Required." The closest thing to the proposed positioning that already exists, and it monetizes via other FounderPal products.
- **Piktochart AI Marketing Plan Generator** (campaign plans, GTM plans, channel plans, launch plans) — free entry, upsells the design SaaS.
- **Venngage**, **Template.net** (no signup), **Easy-Peasy.AI**, **Taskade**, **Juma (Team-GPT)**, **Superframeworks** (no signup, returns channel recommendations, content plan, budget allocation) — all free, all lead magnets for a paid product.
- **HubSpot's "Your AI Marketing Plan"** gated offer at offers.hubspot.com.

**Implication:** "free AI marketing plan generator" is a saturated, commoditized SEO play with strong domain-authority incumbents (HubSpot, Canva-adjacent, Venngage, Piktochart). Winning that exact keyword head-on is not realistic for a new GitHub Pages domain.

### 1.4 Tier D: BYOK shells (the business-model analogue)

- **TypingMind**: the canonical BYOK proof point. One-time license, no subscription: **$39 Standard / $79 Extended / $99-198 Premium**, runs in browser with local storage, supports Anthropic/OpenAI/Google/Mistral/DeepSeek/Groq/Ollama keys. Reviewers claim heavy users save 70-90% vs stacking ChatGPT Plus + Claude Pro + Gemini ([review](https://diyai.io/ai-tools/productivity/reviews/typingmind-review/)).
- **LibreChat**, **Open WebUI**, **LocalAI** (35k+ GitHub stars), **OpenClaw Easy**, **Msty**, **Chatbox**: free/OSS BYOK chat frontends. All horizontal, none vertical to marketing.
- **Missive** is doing BYOK inside a real SMB product: "pay your AI provider directly, usually pennies per action, instead of paying the tool provider per-agent add-ons" ([Missive blog](https://missiveapp.com/blog/best-ai-tools-for-small-businesses)). Free for up to 3 users.
- Analysts now treat BYOK as a legitimate emerging pricing model: "BYOK is quietly rewriting how AI software gets priced," driven by inference costs falling ~10x/year since 2022 ([buildmvpfast](https://www.buildmvpfast.com/blog/byok-bring-your-own-key-ai-saas-pricing-model-2026)).

**Key finding: there is no well-known vertical BYOK tool for SMB marketing.** The BYOK pattern is well established horizontally (chat UIs, dev tools) and essentially unexploited in the SMB marketing vertical. That is the genuine white space.

### 1.5 Tier E: Indirect but strongest competition

- **ChatGPT** at 900M+ weekly active users (late Feb 2026, up from 800M in Oct 2025). Free tier is capable. **ChatGPT Business $25/user/mo monthly, $20/user/mo annual, 2-seat minimum** (so ~$40/mo floor) as of April 2, 2026; **ChatGPT Go $8/user/mo** launched January 2026 ([aipricing.guru](https://www.aipricing.guru/subscriptions/chatgpt-team/)).
- **Claude directly**: Claude Pro/Max, Projects, and now **Claude Cowork**, launched January 2026 as a macOS desktop agent for non-technical users, expanded to web and mobile on **July 7, 2026** ([TechCrunch](https://techcrunch.com/2026/07/07/the-coding-agent-wars-are-spilling-into-the-rest-of-the-office-claude-cowork/), [VentureBeat](https://venturebeat.com/technology/anthropic-brings-claude-cowork-to-mobile-and-web-as-usage-data-shows-most-users-arent-coding)). Anthropic's own usage data shows most Cowork users are not coding. **This is a direct platform-risk vector**: the exact user you are targeting can already ask Claude to plan a campaign, and Anthropic is actively building the non-technical surface.
- **Agencies and fractional CMOs**: the paid alternative. Fractional CMO retainers run **$3,000-$15,000/mo**; SEO retainers $500-$3,000/mo. This is the price anchor that makes even $69/mo tools look cheap, but note only **34% of SMBs now work with any marketing partner, down sharply from 60% the prior year** ([LocaliQ 2026](https://localiq.com/blog/small-business-marketing-trends-report-2026/)). SMBs are pulling marketing back in-house, which is tailwind for self-serve tools.

---

## 2. MARKET & TOPIC RESEARCH

### 2.1 SMB marketing reality (the strongest data, LocaliQ, published Feb 24, 2026, n=300+, 87% US/Canada)

Source: [localiq.com/blog/small-business-marketing-trends-report-2026](https://localiq.com/blog/small-business-marketing-trends-report-2026/)

- **52% have monthly marketing budgets under $1,000.**
- **50% have zero dedicated marketing employees.** Businesses with ≤10 employees are 45% more likely to have no full-time marketing staff.
- **60% spend 1-10 hours per week on marketing**; 72% of micro-businesses fall in that band.
- **66% call economic uncertainty challenging for 2026** (up from 48% the prior year); **59% expect lead generation to be challenging.**
- **60% already use AI in marketing**; of AI users: **81% for content creation** (up from 52%), **84% to save time** (up from 61%), **78% for idea generation** (up from 50%).
- Channels in use: unpaid social 66%, paid social 56%, SEO 53%, email 53%, search ads 45%, reputation management 28%, video 26%.
- **34% work with a marketing partner, down from 60%.**

Corroborating figures from other surveys: **56% of SMB owners have an hour or less per day for marketing**, **73% are not confident their current marketing strategy is working**, and 53% cite standing out from competitors, 49% budget, 47% choosing the right tactic as top hurdles *(low confidence, aggregator-sourced)*.

**The synthesized pain**: the median target user is a non-marketer, working alone, with under $1,000/month and roughly 5 hours a week, who is not confident anything they are doing works. Their problem is not *generating text*. It is **deciding what to do, in what order, on which channels, and then having the artifacts ready so it actually ships.**

### 2.2 AI adoption by SMBs (reconcile the wildly conflicting numbers)

Adoption stats range from 54% to 89% depending on who asks and how. The honest read:

| Source | Figure | Notes |
|---|---|---|
| **U.S. Chamber of Commerce, "Empowering Small Business," 4th ed., Aug 18, 2025** (with Teneo Research) | **58% used generative AI in 2025**, up from 40% (2024) and 23% (2023); 82% of AI-using SMBs grew headcount; 77% say AI limits would hurt growth; 65% worry about fragmented state AI regulation ([source](https://www.uschamber.com/technology/empowering-small-business-the-impact-of-technology-on-u-s-small-business)) | Most credible longitudinal series. Chamber calls it the fastest tech uptake it has tracked since social media. |
| **Bluevine 2026 Small Business AI Trends Report** (n=942, fielded Apr 7-9, 2026, ±3%) | **74% using or testing AI**; only **33% use it regularly across multiple areas**; **marketing and sales is the #2 use case at 37%** (behind data analysis at 39%) ([source](https://www.bluevine.com/blog/small-business-ai-trends-report-2026)) | Best 2026 primary source with methodology disclosed. |
| **Constant Contact "Small Business Now," Q1 2026** (1,500+ SMB owners, 5 countries) | **54% currently use AI marketing tools, +27% plan to adopt in 2026 → 80%+ by year end**; 45% use AI for trend analysis, 44% content, 40% images; **68% plan to increase marketing budgets; 74% expect to spend more time on marketing**; 44% cite customer engagement as top 2026 barrier; social 68% and email 41% seen as top revenue drivers ([Forbes coverage, Feb 11, 2026](https://www.forbes.com/sites/rogerdooley/2026/02/11/by-years-end-4-in-5-small-businesses-will-use-ai-marketing-tools/)) | The "87% of US SMBs use AI for marketing as of April 2026" figure floating around traces to a later Constant Contact release; treat as marketing-tool-inclusive and generous. |

**Consensus reading:** roughly 55-75% of SMBs touch AI, marketing is the #1 or #2 entry point, but **depth is shallow**, with only ~14-33% using it systematically. The gap between "I paste things into ChatGPT" and "I run a repeatable marketing system" is exactly the gap a product can occupy.

### 2.3 What SMBs actually spend on AI (critical for pricing strategy)

From Bluevine (Apr 2026, n=942):
- **33% spend $0/month on AI tools** (free tiers of ChatGPT/Gemini are carrying adoption)
- **28% spend $25-99/mo**
- **16% spend $100-249/mo**
- **10% spend $250+/mo**

Plus: the average SMB pays for 20+ software subscriptions with ~60% underutilized *(low confidence, [openpr](https://www.openpr.com/news/4392417/80-of-smbs-are-over-subscribed-but-under-staffed-why-2026))*; the average US AI subscriber pays for 4 AI products at ~$66/mo total and **53% cancel and restart AI tools as needed, making churn the default management strategy** *(low confidence)*. Bluevine's qualitative note is the most actionable: **when owners pay a premium for AI, it is usually for AI embedded in software they already use daily.**

**Consequence:** a standalone $19-49/mo marketing chatbot subscription faces a brutal market: a third of the audience pays nothing for AI at all, and subscription fatigue is documented. A $0-software + ~$1-of-API-spend model sidesteps that entire objection. It also means the eventual monetization must be a one-time price or an embedded/adjacent value, not another monthly seat.

### 2.4 Trust, security, and the "AI slop" backlash (both a risk and a positioning asset)

- **82% of SMBs report at least one barrier to deeper AI use**; the top two are **data security/privacy (33%, up 10 points YoY from 23%)** and **distrust of AI accuracy (31%)**. **78% do not trust AI to handle even low-level tasks without oversight** (Bluevine).
- **90% of consumers are worried about AI using their data without consent** ([Malwarebytes, Mar 2026](https://www.malwarebytes.com/blog/privacy/2026/03/90-of-people-dont-trust-ai-with-their-data)).
- **40% of SMBs have no policy restricting unapproved AI tools** (shadow AI).
- Fake/trojaned AI tools, including fake Claude installers, are a documented 2026 SMB threat vector ([Securelist SMB threat report 2026](https://securelist.com/smb-threat-report-2026/120357/)).
- **AI content backlash is now measurable**: consumers saying heavy AI use would decrease brand trust went from **20% (2025) to 40% (2026)**; ~half of US consumers say they prefer brands that do not use gen-AI in customer-facing content; 54% report "AI fatigue"; 39% of marketers worry about losing brand voice *(low confidence on individual figures, but the direction is corroborated across [eMarketer](https://www.emarketer.com/content/faq-on-content-marketing--ai-saturation--zero-click-search--what-s-still-working-2026), [Heinz Marketing](https://www.heinzmarketing.com/blog/anti-ai-marketing-slop-b2b/), and [Brillity](https://brillitydigital.com/blog/marketing-in-2026-ai-slop-and-the-human-filter/))*. Aerie, Equinox, and Almond Breeze ran explicitly anti-AI campaigns in early 2026.

**Double-edged:** the privacy angle ("your business data never leaves your browser, we have no server, no account, no database") maps directly onto the #1 stated barrier. But BYOK also asks users to paste a secret credential into a stranger's website, which is precisely the behavior security-aware SMBs are being trained to refuse. Trust engineering is not a nice-to-have here, it is the product's central UX problem.

### 2.5 Search behavior is shifting (matters for the SEO plan)

- AI-referred sessions grew **527% YoY** in the first five months of 2025; Conductor's 2026 benchmark puts **AI referral traffic at 1.08% of all web traffic with ChatGPT responsible for 87.4% of it**. LLM visitors reportedly convert at **15.9% from ChatGPT vs 1.76% for organic search** *(low confidence, vendor-sourced)*.
- **40% of SMBs report at least some traffic disruption from Google algorithm changes and AI in search**; 46% of SMBs with 11-100 employees saw traffic decline (LocaliQ).
- **Most enterprise marketing teams have a GEO initiative; most SMB teams have not started** ([Enrich Labs](https://www.enrichlabs.ai/blog/generative-engine-optimization-geo-complete-guide-2026)).

### 2.6 Market size (context only, treat all figures as soft)

Estimates for "AI in marketing" range from $6.2B (Future Market Insights, narrow "AI marketing tool" definition) to ~$35B in 2026 growing to $82.2B by 2030 ([Grand View Research](https://www.grandviewresearch.com/industry-analysis/artificial-intelligence-marketing-market-report)) to ~$58-65B (various). These do not disagree so much as measure different things. The number that matters for this product is not TAM, it is the ~52% of SMBs with sub-$1,000 monthly marketing budgets who are currently unmonetizable by every Tier A vendor.

---

## 3. POSITIONING GAPS & OPPORTUNITIES

### 3.1 The four real gaps

**Gap 1: Strategy and sequencing, not asset generation.**
Every Tier A/B tool generates *assets* (copy, creative, posts). Almost nothing generates a *decision*: given your business, budget, and 5 hours a week, here is the one campaign to run this quarter, on these two channels, in this order, with these dates, and here is why the other six ideas are wrong for you. LocaliQ's data says 47% of owners struggle with "choosing the right marketing tactic" and 73% are not confident their strategy works. Jasper will not tell you not to bother with TikTok. An opinionated planner will.

**Gap 2: Constraint-aware planning.**
No mainstream tool takes "I have $400/month and 4 hours a week and no video skills" as a hard input and plans within it. Generic marketing-plan generators output plans written for companies with marketing departments. A plan the owner cannot execute is worse than no plan. This is the single most differentiated feature available, it is cheap to build (it is prompt architecture, not infrastructure), and it is directly validated by the budget/time/staffing data in §2.1.

**Gap 3: Zero-trust-required architecture.**
No account, no server, no database, no data retention, nothing leaving the browser except the call to Anthropic under the user's own key. This is a credible answer to the 33% who name data security as their top AI barrier, and it is a genuine architectural claim (verifiable, since the site is static and open-sourceable) rather than a privacy-policy promise. No competitor in this niche can copy it without abandoning their business model.

**Gap 4: Cost transparency at the "$0 spenders."**
33% of SMBs spend nothing on AI. The BYOK pitch converts them without asking for a subscription: software free, and roughly a dollar of API spend for a full campaign plan.

**Cost model (compute it and publish it, it is the strongest marketing asset you have).** Current Anthropic API pricing: **Claude Opus 4.8 $5/$25 per Mtok, Sonnet 5 $3/$15 ($2/$10 promotional through Aug 31, 2026), Haiku 4.5 $1/$5**; prompt caching cuts input costs up to 90%, Batch API halves everything ([CloudZero](https://www.cloudzero.com/blog/claude-api-pricing/), [BenchLM](https://benchlm.ai/anthropic/api-pricing)). A 10-turn campaign-planning session with a growing context (~150k cumulative input, ~15k output) on Sonnet 5 costs roughly **$0.45 + $0.23 ≈ $0.68**, and materially less with caching. Five full campaigns a month lands around **$2-5/month** versus **$59-69/month for Jasper**. That is a 15-30x cost delta and it is the headline.

### 3.2 Differentiation angles, ranked by defensibility

1. **"Plans you can actually execute on $500 and 4 hours a week."** Constraint-first planning. Hardest to copy because it requires vendors to admit their customers are small.
2. **"Your data never leaves your browser."** Architecturally true, competitively impossible for SaaS incumbents.
3. **"Free forever. You pay Anthropic about a dollar."** Cost transparency as a wedge against subscription fatigue.
4. **Output completeness**: not a chat transcript but a downloadable, dated campaign package (positioning statement, ICP, channel plan with budget split, 8-12 week calendar, ready-to-paste email/social/ad copy, measurement plan with 3 KPIs). Exportable to Markdown/PDF/ICS/CSV. Chat transcripts are not deliverables; artifacts are.
5. **Anti-slop stance**: brand-voice capture from the owner's actual existing writing (paste your About page and 3 real posts), plus an explicit "this section needs a human" flag. Rides the documented 2025→2026 doubling in consumer distrust of AI-heavy brands.
6. **Vertical/locale specificity**: local service businesses (plumbers, dentists, salons, cafes) where "local SEO for small business" is the #1 query by volume (§4), or a non-English market where Tier A tools are weak (Markty's Turkish angle proves the thesis).

### 3.3 Risks, honestly stated

| Risk | Severity | Mitigation |
|---|---|---|
| **ChatGPT/Claude do this natively, for free, better** | **Severe.** 900M weekly ChatGPT users; Claude Cowork went web+mobile July 7, 2026 targeting exactly the non-technical worker | Compete on *structure and completeness*, not intelligence. The value is the interrogation sequence, the constraint enforcement, the artifact bundle, and never facing a blank prompt. Accept that a determined ChatGPT user can replicate it; most will not. |
| **BYOK conversion friction: the target user cannot get an API key** | **Severe and underrated.** Your ICP is a non-technical owner with no marketing staff. "Create an Anthropic Console account, add a payment method, generate a key" is a multi-step technical onboarding that will kill the majority of a non-technical funnel. This is the #1 thing to validate before building. | Ship a demo/sample-output mode that requires no key at all, so value is proven before the ask. Provide a 90-second illustrated key-setup walkthrough with screenshots. Set a low default spend cap. Consider that the true ICP may be *marketing-savvy solo consultants and agencies serving SMBs*, not the SME owner. |
| **Key-handling trust** | **High.** Anthropic's own guidance says never expose keys publicly, rotate every ~90 days, use separate keys per environment, set spend limits, and revoke immediately on suspicion ([Anthropic key best practices](https://support.claude.com/en/articles/9767949-api-key-best-practices-keeping-your-keys-safe-and-secure)). The SDK ships with browser use **disabled by default** and warns that `dangerouslyAllowBrowser` "exposes your secret API credentials in the client-side code," listing only internal tools and short-lived dev credentials as acceptable cases ([TypeScript SDK docs](https://platform.claude.com/docs/en/cli-sdks-libraries/sdks/typescript)) | Be radically transparent: open-source the repo, link it in the header, store the key only in `sessionStorage` (not `localStorage`) with an explicit opt-in to persist, show the exact network request being made, add a visible "clear key" control, ship a strict CSP with `connect-src` limited to `api.anthropic.com`, use zero third-party scripts (no analytics vendors, no fonts CDN, no tag manager), and instruct users to create a **dedicated, spend-capped key** for this site. Say plainly: the key stays in your browser, but a compromised site could steal it, so cap it and rotate it. |
| **Technical feasibility (non-risk, confirmed)** | Low | Anthropic added CORS support via the `anthropic-dangerous-direct-browser-access: true` header in Aug 2024 ([Simon Willison](https://simonwillison.net/2024/Aug/23/anthropic-dangerous-direct-browser-access/)); the TypeScript SDK supports browsers via `dangerouslyAllowBrowser: true`. Anthropic explicitly names "bring your own API key" client-side apps as a legitimate use case. A static Astro site on GitHub Pages can do this with no backend. |
| **Free incumbents (HubSpot Campaign Assistant, GoDaddy Airo, Canva)** | High | Do not compete on asset generation. Compete on the plan, the constraints, and the privacy story. Also note HubSpot's free tool requires an account and exists to funnel you into a $20→$890/mo ladder; you require neither. |
| **Distribution: zero brand, zero domain authority, saturated keywords** | **Severe.** Realistically the biggest failure mode | See §4. Go long-tail and GEO-first, not head-term. |
| **No email capture on a static site** | Medium | GitHub Pages has no backend. Use a third-party form endpoint (Formspree, Buttondown, Tally) but disclose it, since it breaks the "nothing leaves your browser" purity for that one interaction. Keep it strictly opt-in and off the main flow. |
| **Anthropic model/pricing/API changes** | Medium | Let users pick the model (Haiku for cheap drafts, Sonnet default, Opus for strategy). Consider multi-provider BYOK later; the OpenAI-compatible surface makes this cheap. |
| **AI content backlash tainting the category** | Medium | Turn it into positioning: human-in-the-loop by design, brand voice from the owner's real writing, explicit "do not automate this" flags. |

---

## 4. SEO / CONTENT ANGLE

### 4.1 What the actual search data says

The only credible volume data found is Pronto Marketing's May 2026 study of 159 queries across 12 categories using Ahrefs Keywords Explorer, US ([source](https://www.prontomarketing.com/blog/google-maps-is-the-new-marketing-plan-for-american-small-businesses/)):

| Query | US monthly volume | Trend |
|---|---|---|
| local SEO for small business | **3,500** | rising |
| how to market a small business | **900** | — |
| how to do email marketing | **600** | — |
| how to advertise my business | **400** | declining |
| how to respond to negative reviews | **350** | rising |
| how to do content marketing | **350** | declining |
| is SEO worth it for small business | **300** | rising |
| Facebook ads vs Google ads | **300** | stable |

A "local visibility cluster" of seven Google-focused queries totals **7,350+ monthly searches** and is the dominant concentration of SMB marketing demand.

**Two hard truths this implies:**
1. **Head-term volumes in this niche are small.** "How to market a small business" at 900/mo is not a business by itself, and HubSpot/Shopify/Wix own page one. Do not plan around head terms.
2. **The demand is concentrated in local visibility**, not in "marketing plans." If you want traffic, the local-business angle is where the searches are.

Caveat that keyword tools do not measure ChatGPT/Perplexity/Claude queries at all, which is why the GEO layer below is not optional.

### 4.2 Recommended keyword and content architecture for an Astro site

**Layer 1 — Bottom-of-funnel, low-competition, high-intent (build these first):**
- `free ai marketing plan generator no signup`
- `jasper ai alternative free` / `copy.ai alternative for small business` / `adcreative.ai alternative` — comparison content is a proven SaaS SEO play and these searchers have budget pain
- `marketing tools that don't require a subscription`
- `use your own claude api key marketing`
- `how much does the claude api cost for marketing` (owns your own differentiation narrative)
- `ai marketing tool that doesn't store your data` / `private ai marketing tool`
- `chatgpt vs claude for small business marketing`

**Layer 2 — Constraint-shaped long-tail (your unique angle, near-zero competition):**
- `marketing plan for a small business with a $500 budget`
- `marketing plan for a one person business`
- `how to market a business with no marketing budget`
- `5 hours a week marketing plan`
- `what marketing channel should i use for my small business`
- `first marketing campaign for a new business`

**Layer 3 — Programmatic SEO (the scale play, ideal fit for Astro's static generation):**
Generate landing pages across three axes:
- **Vertical × asset**: `marketing plan for a plumbing business`, `for a dental practice`, `for a coffee shop`, `for a hair salon`, `for a law firm`, `for a gym`, `for an e-commerce store`. Target the 30-80 vertical set with the highest SMB density.
- **Channel × goal**: `email campaign plan for a local restaurant`, `instagram plan for a boutique`, `google business profile posts for a contractor`.
- **Occasion**: `black friday marketing plan for a small business`, `holiday campaign plan`, `grand opening marketing plan`, `q1 marketing plan template`.

Each page must carry a genuinely useful pre-generated example plan (not a thin templated stub) plus a one-click "generate mine" CTA into the app. Thin programmatic pages get filtered; substantive ones rank.

**Layer 4 — Local visibility cluster (where the volume actually is):**
Since "local SEO for small business" (3,500/mo, rising) dwarfs everything else, build a genuine content cluster around Google Business Profile, review responses (350/mo, rising), and local campaign planning, then route it to the campaign planner. This is a traffic-acquisition wedge, not a positioning change.

**Layer 5 — GEO / AI-search visibility (do this from day one, not later):**
SMB teams have largely not started on GEO, so the window is open. Concretely:
- Publish clean, extractable, definitional content with direct question-and-answer headers, since LLMs cite structured answer blocks.
- Ship `Product`, `FAQPage`, `HowTo`, and `SoftwareApplication` JSON-LD schema (trivial in Astro).
- Publish `llms.txt` and a well-formed `sitemap.xml`.
- Maintain honest comparison tables (LLMs disproportionately surface comparison content when asked "what is a free alternative to Jasper").
- Get listed on aggregators LLMs quote heavily: G2, Capterra, AlternativeTo, Product Hunt, Reddit r/smallbusiness and r/marketing, Indie Hackers.
- Track citations for prompts like "free AI tool to plan a marketing campaign for my small business."

**Technical SEO notes for Astro on GitHub Pages:** static output gives near-perfect Core Web Vitals, which now matter for AI crawler trust as well as ranking. Ship per-page canonical tags, OG images generated at build time (`astro:assets` / satori), an RSS feed, and prerendered content for every programmatic page. Serve the marketing content statically and hydrate only the chat island (`client:visible`) so content pages ship almost no JS. GitHub Pages supports custom domains and HTTPS; use a real domain, not `*.github.io`, for credibility and link equity.

---

## 5. RECOMMENDED NEXT STEPS

### 5.1 Validate before building (1-2 weeks, and this is the highest-value work here)

The riskiest assumption is not "can I build it," it is **"will a non-technical SME owner obtain an Anthropic API key?"** Test that first, cheaply:

1. **Fake-door test.** Ship a single Astro landing page describing the product, with a working "See a sample campaign plan" (static, pre-generated, genuinely impressive) and a "Start with my Claude key" CTA that opens the real key-setup instructions. Measure the drop-off between those two clicks. If fewer than ~15-20% of engaged visitors even open the key instructions, the BYOK-to-SME thesis is broken and the ICP should shift to consultants/agencies or the model should shift to a hosted proxy.
2. **Ten manual concierge runs.** Interview 10 SMB owners, run the campaign-planning process by hand in Claude, deliver the plan, and watch what they do with it. You will learn the right question sequence, the right output format, and whether the plan actually gets executed. This is what makes the prompt architecture good, and prompt architecture is the whole product.
3. **Keyword reality check.** Pull real Ahrefs/Semrush volumes for the Layer 1-3 terms above before committing to the content plan. The published data suggests thin head-term volume, so confirm the long tail is there.
4. **Post the concept** to r/smallbusiness, r/marketing, r/EntrepreneurRideAlong, and Indie Hackers. Watch specifically for whether "I have to get an API key?" is the dominant objection.

### 5.2 MVP scope (deliberately small)

**Build:**
- Astro static site, one React island for the chat/wizard, deployed to GitHub Pages on a real custom domain.
- **A guided intake, not a blank chat.** 8-10 structured questions: what you sell, who buys it, city/region, monthly budget, hours per week available, existing channels, one goal for the next 90 days, what you have tried that failed, paste 2-3 samples of your own writing for voice.
- **One deliverable, done extremely well**: a complete 90-day campaign plan containing positioning statement, ICP summary, 2-3 recommended channels with explicit reasons for *rejecting* the others, budget split, week-by-week calendar, ready-to-paste copy for each planned asset, and 3 KPIs with target numbers.
- **Export**: Markdown, print-to-PDF, and calendar `.ics`. The plan must leave the site as a file the owner owns.
- **Key handling**: `sessionStorage` by default, explicit opt-in for persistence, visible "clear key" button, strict CSP restricting `connect-src` to `api.anthropic.com`, zero third-party scripts, public repo linked from the header, and an in-flow instruction to create a dedicated spend-capped key.
- **Live cost meter**: show tokens used and dollars spent per session, in real time. This turns the pricing wedge into a visible product feature and builds trust simultaneously.
- **Model selector** with Sonnet 5 as default, Haiku 4.5 for cheap iteration, Opus 4.8 for the strategy pass.
- **No-key demo mode** with 2-3 pre-generated example plans for different verticals.

**Explicitly do not build for MVP:** accounts, multi-user, integrations, publishing/scheduling, analytics dashboards, image generation, a general-purpose chat mode, multi-provider support, or a plugin marketplace. Every one of these is a Tier A competitor's moat and none is where you win.

### 5.3 Distribution sequence

1. Ship 5-10 genuinely excellent Layer 1 and Layer 2 pages before launch, not after.
2. Launch on Product Hunt, Indie Hackers, Hacker News (the "static site, BYOK, no server, no data" angle plays well on HN), and relevant subreddits.
3. Then scale Layer 3 programmatic pages, 30-80 vertical landing pages with real pre-generated plans.
4. Run GEO in parallel from day one: schema, llms.txt, comparison content, directory listings.
5. Open-source the repo. For a BYOK trust product, the repo *is* a marketing asset and a trust proof, and it earns GitHub-native distribution.

### 5.4 Monetization paths (later, in rough order of fit)

1. **One-time license, TypingMind model.** $29-49 lifetime for "Pro": saved brand profiles, multi-campaign library, more export formats, more verticals. Proven to work in BYOK (TypingMind sells at $39/$79/$99) and dodges the subscription-fatigue objection entirely.
2. **Templates and playbook packs.** Vertical-specific campaign systems (restaurant, dental, trades) as paid downloads. High margin, no infrastructure, and they double as SEO content.
3. **Hosted convenience tier.** For the segment that cannot or will not get a key, offer a managed key at a markup, e.g. $9-19/mo with a usage cap. This is a *distinct* product from the free BYOK version and should be positioned as convenience, not as the main path. It requires a backend and abandons the privacy claim for those users, so keep the two strictly separated.
4. **Affiliate revenue.** SMBs who finish a plan then need email (Mailchimp/Brevo), scheduling (Buffer), design (Canva), and a website. Recommendations inside the plan output are natural and non-intrusive. Disclose them.
5. **Agency/consultant white-label.** Marketing consultants serving SMBs are technically capable of managing API keys and have real willingness to pay. If the fake-door test shows SME owners bounce on the key step, this segment is the pivot: sell them a branded planning tool at $99-299 one-time or a low monthly.
6. **Do not** default to a $19-49/mo subscription. The data in §2.3 says a third of the market pays nothing for AI, churn is the norm, and premium willingness attaches to embedded AI. A standalone monthly seat is the weakest available model here.

### 5.5 Success criteria to define now

- **Validation gate:** ≥15% of engaged landing-page visitors click through to key setup, and ≥5 of 10 concierge interviewees say they would actually execute the plan produced.
- **MVP gate:** ≥30% of users who enter a key complete the full intake and export a plan.
- **Distribution gate:** 500 organic visits/month within 90 days of the content layer shipping.

If the validation gate fails, the correct move is to change the ICP (consultants, not owners) or the delivery (hosted key), not to build more features.

---

## Sources

**Vendor pricing (fetched directly):** [Jasper](https://www.jasper.ai/pricing) · [Copy.ai](https://www.copy.ai/prices) · [Semrush](https://www.semrush.com/pricing/) · [Writesonic](https://writesonic.com/pricing) · [HubSpot Campaign Assistant](https://www.hubspot.com/campaign-assistant) · [AdCreative.ai via TrustRadius](https://www.trustradius.com/products/adcreative-ai/pricing) · [ChatGPT Business](https://www.aipricing.guru/subscriptions/chatgpt-team/) · [Markty](https://www.markty.ai/en/academy/blog/9-best-ai-marketing-tools-for-small-businesses-2026)

**SMB market and survey data:** [LocaliQ 2026 Small Business Marketing Trends Report](https://localiq.com/blog/small-business-marketing-trends-report-2026/) · [Bluevine 2026 Small Business AI Trends Report](https://www.bluevine.com/blog/small-business-ai-trends-report-2026) · [U.S. Chamber Empowering Small Business](https://www.uschamber.com/technology/empowering-small-business-the-impact-of-technology-on-u-s-small-business) · [Forbes on Constant Contact Q1 2026](https://www.forbes.com/sites/rogerdooley/2026/02/11/by-years-end-4-in-5-small-businesses-will-use-ai-marketing-tools/) · [Constant Contact SMB creator report](https://www.constantcontact.com/news/2026-06-10-the-rise-of-the-smb-creator-how-small-businesses-are-leveraging-social-media-and-ai-to-capture-consumer-attention)

**Technical / BYOK:** [Anthropic TypeScript SDK docs (browser support, dangerouslyAllowBrowser)](https://platform.claude.com/docs/en/cli-sdks-libraries/sdks/typescript) · [Anthropic API key best practices](https://support.claude.com/en/articles/9767949-api-key-best-practices-keeping-your-keys-safe-and-secure) · [Simon Willison on anthropic-dangerous-direct-browser-access](https://simonwillison.net/2024/Aug/23/anthropic-dangerous-direct-browser-access/) · [Claude API pricing (CloudZero)](https://www.cloudzero.com/blog/claude-api-pricing/) · [BYOK as a pricing model](https://www.buildmvpfast.com/blog/byok-bring-your-own-key-ai-saas-pricing-model-2026) · [TypingMind review](https://diyai.io/ai-tools/productivity/reviews/typingmind-review/)

**Trust, backlash, search shift:** [Malwarebytes AI data trust survey](https://www.malwarebytes.com/blog/privacy/2026/03/90-of-people-dont-trust-ai-with-their-data) · [Securelist SMB threat report 2026](https://securelist.com/smb-threat-report-2026/120357/) · [eMarketer on AI saturation](https://www.emarketer.com/content/faq-on-content-marketing--ai-saturation--zero-click-search--what-s-still-working-2026) · [Heinz Marketing on slop](https://www.heinzmarketing.com/blog/anti-ai-marketing-slop-b2b/) · [Enrich Labs GEO guide](https://www.enrichlabs.ai/blog/generative-engine-optimization-geo-complete-guide-2026) · [Pronto Marketing SMB keyword study, May 2026](https://www.prontomarketing.com/blog/google-maps-is-the-new-marketing-plan-for-american-small-businesses/)

**Competitor context:** [GoDaddy Airo.ai agents](https://aboutus.godaddy.net/newsroom/news-releases/press-release-details/2025/GoDaddy-Accelerates-Airo-ai-Momentum-with-New-AI-Agents-for-Small-Business-Growth/default.aspx) · [HubSpot Breeze outcome-based pricing, MarTech](https://martech.org/hubspot-moves-to-outcome-based-pricing-for-some-breeze-ai-agents/) · [Claude Cowork on web/mobile, TechCrunch](https://techcrunch.com/2026/07/07/the-coding-agent-wars-are-spilling-into-the-rest-of-the-office-claude-cowork/) · [FounderPal marketing plan generator](https://founderpal.ai/marketing-plan-generator) · [Missive on BYOK for SMBs](https://missiveapp.com/blog/best-ai-tools-for-small-businesses)
