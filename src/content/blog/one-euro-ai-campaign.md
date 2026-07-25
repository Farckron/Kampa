---
title: "What a €1 AI marketing campaign actually looks like"
description: "A real Kampa run cost under €0.50 in API tokens: one conversation covering strategy, a 12-week calendar and every piece of copy. Here is the full math."
date: 2026-07-25
keywords:
  - ai marketing campaign cost
  - cheap ai marketing
  - claude api pricing
  - small business marketing plan
  - marketing automation cost
---

## How much does an AI marketing campaign actually cost?

One full campaign in Kampa cost under €0.50 in API tokens on the default model. That is the whole bill, paid directly to Anthropic, with no subscription on top. The €1 in the title is the ceiling, not the average, because a longer business description or a second run pushes it up a bit.

Here is where the money goes. Kampa makes five short model calls per campaign, in three stages:

1. Strategy: positioning, audience, channel mix, the reasoning behind them.
2. A 12-week calendar: every week, every channel, every post slot.
3. All the copy: the actual text for each of those slots.

The default model bills roughly €3 per million input tokens and €15 per million output tokens. A campaign for a small local business sends something like 15,000 fresh input tokens across the run and gets back around 18,000 output tokens, because most of the cost is writing, not reading. That is about €0.05 of input and €0.27 of output. Prompt caching does the rest of the work: later calls resend the same business context and strategy, and cached input reads bill at roughly a tenth of the normal rate, so the repeat context is close to free.

Add it up and a typical run lands between €0.30 and €0.45. Anthropic publishes current per-token rates on its [pricing page](https://www.anthropic.com/pricing), so you can check the math against whatever the numbers are when you read this.

## What do you get for that?

You get three concrete deliverables, and you can read a finished one before spending anything. A campaign produces:

- A strategy section: who the campaign targets, what the positioning is, which channels to use and why the others were left out.
- A 12-week calendar with a fixed number of posts per week, sized to the weekly hours you entered. Say four hours a week and you do not get a plan that needs twelve.
- Ready-to-post copy for every slot on that calendar, in the tone and language you asked for.
- Exports: markdown, PDF, or an .ics calendar file you can drop straight into Google Calendar or Outlook.

The plan also respects the budget you type in. Enter €200 a month and the paid channels in the plan add up to €200 a month, not €2,000. See a real example at [the Riga coffee shop sample](/Kampa/samples/riga-coffee-shop), which was generated the same way and costs nothing to read.

## Why is it this cheap?

Because you are paying for compute and nothing else. A marketing agency invoice covers salaries, office rent, account management and margin. A SaaS subscription covers a sales team, a support team and a growth budget. Kampa is a static site that runs in your browser, so there is no server to pay for and no company to fund. Your Claude API key talks straight to api.anthropic.com, and Anthropic bills you for the tokens.

That also means the price scales with what you ask for, not with a plan tier. Two campaigns cost about twice one campaign. Fifty campaigns for fifty clients cost about fifty times one campaign, which is still under €25.

The tradeoff is honest: you need an API key and a payment method on your Anthropic account. That is a ten-minute setup, covered in [the API key guide](/Kampa/guide/api-key), and it is the reason the tool can stay free.

## When is €1 not enough?

€1 buys you a plan, not a campaign. The plan tells you to post a behind-the-counter photo on Wednesday. It does not take the photo, does not post it, does not reply to the person who asks about opening hours in the comments, and does not run your paid ads.

The costs that stay yours:

- Ad spend. If the plan allocates €150 a month to Meta ads, that €150 is real money on top.
- Your time. A four-hour-a-week plan takes four hours a week.
- Anything physical: photos, video, print, samples, event costs.
- Judgement. The model has never met your customers. It works from what you type in, so a vague description gives a generic plan.

If you were hoping to spend €1 and have marketing happen, that is not what this is. What €1 replaces is the blank page and the week you would spend structuring a plan yourself.

## How do you make sure it stays under €1?

Set a spend limit in your Anthropic console before your first run, so a mistake costs cents instead of euros. The console supports a hard monthly cap on the API key, and setting it to something small like €5 means no runaway loop or repeated retry can ever exceed that. Kampa itself makes a handful of calls per campaign (five, currently) and has no background jobs, but a cap protects you from your own experiments as much as from the tool.

The other habit that keeps costs down: read the strategy output before generating the calendar and copy. If the strategy is aimed at the wrong audience, fix the input and rerun the cheap first call rather than paying for a full plan you will throw away. More detail on models, limits and what happens to your data is in [the FAQ](/Kampa/faq).

## Is Kampa worth trying?

Kampa is free, open source, and runs entirely in your browser. Nothing you type is stored on any server, because there is no server: the only network request the app makes is to api.anthropic.com with your own key. The code is at github.com/Farckron/Kampa if you want to check that claim yourself. If you run a small business and you have been putting off writing a marketing plan, the realistic cost of finding out whether an AI-written one is useful to you is about the price of a coffee, minus the coffee. Try it at [/Kampa/app](/Kampa/app).
