# Launch checklist

Kampa, https://farckron.github.io/Kampa/. Written 2026-07-25 at the end of
stage 07.

The site is built, tested and deployable. What is left before posting anywhere
is a short list of things only a human with a real API key and a real phone can
do. Do those first. A launch that sends people to a broken .ics file or a plan
that reads like filler is worse than no launch.

## Pre-flight, owner tasks

These are yours, not the build's. None of them are automatable and all three
gate the launch.

1. **Import the .ics into a real calendar.** Generate a campaign, export the
   calendar, import `kampa-calendar.ics` into Google Calendar and into one
   other client (Apple Calendar or Outlook). Check that week 1 lands on the
   Monday you picked, that the 12 weeks run consecutively, and that a second
   import updates the events instead of creating a duplicate set. The unit
   tests cover the file format. They cannot tell you whether Google accepts it.
2. **Quality pass with a real key, three personas.** Run the full wizard three
   times against the live API with three genuinely different businesses. Use
   the three sample plans as the personas: a Riga coffee shop at €400/month
   and 4 hours a week, a Jelgava hair salon at €250/month and 3 hours, an EU
   linen boutique at €700/month and 6 hours. For each, read the output as if
   you were the owner and answer one question honestly: would you actually
   execute this plan on Monday? Research §5.5 sets the bar at 5 of 10 for the
   interview version of that question. If two of three feel like generic
   marketing advice, fix the prompts before launching, not after.
   Record the euro cost of each run. The site claims under €1 and the blog
   claims a real run came in under €0.50. If the real numbers drift, change
   the copy, not the claim.
3. **Cross-browser check.** Chromium is covered by the e2e suite. Open the
   site by hand in Firefox, in desktop Safari, and on an iPhone. The wizard is
   the only page with JavaScript, so that is where to spend the time: key
   entry, the 8 intake steps, streaming output, and the three exports.
4. **Custom domain: not yet.** `farckron.github.io/Kampa/` is fine for launch.
   Moving to a domain later is a two-line change (`SITE` and `BASE` in
   `astro.config.mjs`), but it invalidates every link anyone has shared. Do it
   before launch or several months after, not during.

Also worth doing once, cheaply: paste three or four page URLs into Google's
Rich Results test to confirm the JSON-LD parses, and submit the sitemap in
Search Console so the 90-day distribution gate has data behind it.

## Channels

One channel per day at most. Posting the same thing to five places in one
morning is how you get flagged in three of them.

### Hacker News

Post as Show HN on a weekday morning US Eastern. The audience here cares about
the architecture, not the marketing outcome, so lead with the architecture.

Title:

> Show HN: Kampa, an AI campaign planner that runs entirely in your browser

First comment, from you, immediately after posting:

> I built this for small business owners who need a 90-day marketing plan and
> cannot justify €70 a month for Jasper. It is a static site on GitHub Pages.
> There is no backend, no accounts and no database, because there is nothing to
> put in one. You paste your own Anthropic API key, it goes into sessionStorage
> by default, and the only network request the app ever makes is to
> api.anthropic.com. The CSP is `connect-src 'self' https://api.anthropic.com`,
> so even if I wanted to exfiltrate your key the browser would block it.
>
> A full campaign costs about €0.50 to €1 in tokens on the default model. My
> last real test run was €0.47 for strategy, a 12-week calendar and every piece
> of copy. You can read three complete sample plans on the site without
> touching a key.
>
> The interesting constraint was that the plan has to respect the budget and
> the hours the owner actually has. Most AI marketing output ignores both and
> hands you a plan for a team of four. Kampa validates the split against the
> stated budget and flags any week that goes over the hours ceiling.
>
> Source is MIT, github.com/Farckron/Kampa. Happy to answer anything about the
> BYOK model, which is the part I expect people to push on.

Expect the pushback to be about putting an API key in a browser. Do not get
defensive about it. The honest answer is that `sessionStorage` is readable by
anything already running on the page, that the app runs no third-party code at
all, and that the alternative (a server holding everyone's key) is worse.
Point at the CSP and the source.

### Product Hunt

Tagline:

> A 90-day marketing plan for your small business, for about €1

Description:

> Kampa asks eight questions about your business, your budget and how many
> hours a week you actually have. It gives you back a full 90-day campaign:
> which channels to use and which to skip with the reasoning, a budget split in
> euros, a week-by-week calendar, and copy you can paste. Free and open source.
> You bring your own Claude API key and pay Anthropic directly, usually under
> €1 per campaign.

First comment:

> Maker here. Kampa exists because the tools in this category charge €60 to €70
> a month whether or not you use them, and most small business owners run one
> campaign a quarter. That is a bad trade.
>
> So there is no subscription and no account. The whole thing is a static site.
> You bring your own Claude API key, and you pay Anthropic for exactly the
> tokens you use, which has been €0.50 to €1 per full campaign in my testing.
> Nothing is stored on a server because there is no server.
>
> The part I would most like feedback on: the plan is built around the hours
> you say you have. Tell it 3 hours a week and it will not hand you a daily
> posting schedule. If you try it and the plan still feels unrealistic for your
> week, tell me, that is the failure mode I care about most.
>
> There are three finished sample plans on the site if you want to see the
> output before setting up a key.

### Indie Hackers

Build story, not a launch announcement. The angle that works here is the
pricing decision.

> **I built a marketing tool with no subscription, no server and no user data.
> Here is the reasoning.**
>
> Every AI marketing tool I looked at charges €60 to €70 per seat per month.
> The customer I had in mind, an owner-operator who plans a campaign once a
> quarter, would pay €800 a year to use something four times.
>
> So I inverted it. The software is free and open source. The user brings their
> own Claude API key and pays Anthropic directly for tokens, which comes to
> about €1 for a full 90-day campaign. I have no hosting bill, no Stripe
> integration, no support burden around billing, and no database of API keys to
> be responsible for.
>
> What this costs me: the API key step is the entire funnel. Every user has to
> create an Anthropic account, add credit and generate a key before they see
> anything. I wrote a guide and I am measuring the dropoff there, because if
> most people quit at that step, the model is wrong and the answer is either a
> different customer or a hosted key, not more features.
>
> Happy to talk about the BYOK tradeoff with anyone considering it.

### Reddit: r/smallbusiness and r/Entrepreneur

Value first. Do not open with the link. These subs remove promotional posts and
the moderators are not subtle about it. Post the content, put the tool in a
comment only if someone asks, and space the two subs at least a week apart.

The post is the €500 budget breakdown from the blog, rewritten as a post rather
than a link, with the actual numbers in the body. Something like:

> **What a €500/month marketing budget actually buys a small business**
>
> I put together a few 90-day plans at different budgets recently and the €500
> one surprised me, so here is the split I keep coming back to. [Then the
> actual channel split, in euros, and which channels to skip and why.]

Answer questions for a day. If the thread goes well and someone asks how you
built the plans, that is when the link is welcome. The sample plans are the
better link anyway, because they are useful without signing up for anything.

For Latvia specifically, the Facebook versus Instagram post is the more
relevant one and can run the same way in local groups.

### Latvian channels

Smaller, slower, and much more likely to produce an actual conversation than
HN traffic. Worth doing in week two.

- **startin.lv**, the Latvian startup association. Community channel and
  newsletter. Lead with the free and open source angle and the fact that it
  handles a Latvian small business budget in euros rather than a US one.
- **Facebook business groups.** Latvian small business and entrepreneur groups
  are where the actual target customer is. Same rule as Reddit: post the
  Facebook versus Instagram breakdown as content, link the sample plans, do not
  post the tool cold.
- Consider translating one post to Latvian before this round. The site itself
  stays English for now; a Latvian locale is post-launch backlog.

## Post-launch watch list

Check these weekly for the first month.

**The validation gate, from research §5.5.** At least 15% of engaged landing
page visitors should click through to key setup. This is the number that
decides whether the whole BYOK premise works. Measure it as visits to
`/guide/api-key` and `/app` divided by engaged sessions on `/`.

If it comes in under 15%, the research is explicit about the correct response:
change the customer or change the delivery, do not build more features. That
means either targeting consultants and agencies instead of owner-operators, or
offering a hosted key. Adding a feature to a funnel that nobody enters is the
tempting wrong move here.

Two other numbers from the same section, worth tracking but not gates for
launch week:

- MVP gate: at least 30% of users who enter a key complete the intake and
  export a plan.
- Distribution gate: 500 organic visits a month within 90 days of the blog
  going live.

Also watch, less formally:

- Which of the five blog posts gets traffic. That tells you which keyword layer
  is working and what to write next.
- Anything in HN or Reddit comments about the key handling. If the same
  objection comes up three times, it belongs in the FAQ.
- Real per-campaign cost reported by users against the under €1 claim. That
  claim is on the landing page, in the FAQ and in a blog post. If it stops
  being true, three places need editing.
