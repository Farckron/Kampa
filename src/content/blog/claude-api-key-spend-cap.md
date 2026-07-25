---
title: "How to get a Claude API key and cap your spend"
description: "A five step walkthrough for creating a Claude API key, setting a monthly spend limit in the console, and knowing what an AI campaign really costs in euros."
date: 2026-07-25
keywords: ["claude api key", "claude api spend limit", "anthropic api key", "bring your own key", "ai marketing cost"]
---

## What is an API key, in plain terms?

An API key is a password that lets a piece of software use your Claude account instead of its own. Nothing more complicated than that. When you use Claude in a chat window, you are logged in and Anthropic bills your subscription. When a tool like Kampa asks Claude to write your marketing plan, it needs a way to prove it is allowed to spend your account's money, and the key is that proof.

Two consequences follow. First, whoever holds the key can spend on your behalf, so you treat it like a card number rather than a username. Second, you pay per use rather than per month, which is usually much cheaper for occasional work but is unbounded unless you set a limit. That is why the spend cap below is not an optional extra step.

## How do you get a Claude API key?

Five steps, roughly two minutes, at [console.anthropic.com](https://console.anthropic.com).

1. **Create an account.** Sign up with an email address and a password. This is Anthropic's own developer console, the same company that makes Claude. It is separate from a Claude.ai chat subscription, and having one does not give you the other.
2. **Add billing.** The API does not respond until a payment method exists. Add the minimum, which is $5 of credit. You are buying prepaid credit, not starting a subscription, and there is no recurring charge.
3. **Create the key.** Go to Settings, then API keys, then Create key. Give it a name that tells you later what it was for, like kampa. Copy it immediately. The full key is shown exactly once and cannot be retrieved afterwards, only replaced.
4. **Set a monthly spend limit.** Go to Settings, then Limits, and set a monthly cap. $10 is more than enough for occasional use. This is the step people skip and the one that matters most.
5. **Paste it into the tool.** In Kampa, the key goes into a field on the [app page](/Kampa/app) and stays in your browser. Nothing is sent to a Kampa server, because there isn't one.

The console prices and limits are in US dollars while the campaign costs below are in euros. At current rates the difference does not change any decision you are making here.

## Why does the spend cap matter for any bring-your-own-key tool?

Because it converts an open-ended risk into a number you chose. Without a cap, the worst case is whatever a buggy or badly behaved application can spend before you notice. With a $10 monthly cap, the worst case is $10. Requests simply start failing once the limit is reached, and the failure is visible and recoverable.

This applies to every tool that asks you to bring your own API key, not just Kampa. The question to ask is not "do I trust this developer" but "what happens if I am wrong". A capped key answers that question in advance. It is also why you should set the cap before you paste the key anywhere, rather than after.

## What does a campaign actually cost?

A full campaign plan in Kampa typically costs under €1 on the default model. A real test run, generating a complete 90-day plan for a small business, came in under €0.50.

That number holds because the work is one long conversation, not a running service. You describe your business, your budget and your weekly hours, the model writes a plan, and the spending stops. There is no background usage, no polling, nothing accruing while the tab sits open. If you generate ten plans across a month while trying different angles, you are still comfortably inside a $10 cap.

You can see the shape of the output before spending anything. The [Riga coffee shop sample](/Kampa/samples/riga-coffee-shop) is a real generated plan, published in full.

## What are the safety rules for an API key?

Three rules cover almost everything.

**Never paste a key into a site you have not checked.** A chat interface that asks for your Anthropic key and runs on someone else's server can log it. Prefer tools that run in your browser and are open source, so the claim can be verified rather than believed. Kampa's source is at [github.com/Farckron/Kampa](https://github.com/Farckron/Kampa), and the only network request the app makes is to api.anthropic.com.

**Rotate occasionally.** Every few months, create a new key and delete the old one. It takes thirty seconds and it limits the damage from a leak you never noticed, such as a key pasted into a support ticket or left in a screenshot.

**Revoke instantly if in doubt.** In the console, deleting a key takes effect immediately. There is no waiting period and no cost to being paranoid. If you think a key has been exposed, delete it first and investigate afterwards.

## Where can I see this with screenshots?

The [illustrated key guide](/Kampa/guide/api-key) walks through the same five steps with pictures of each console screen. If you have a different question first, such as what happens to your data or which model is used, the [FAQ](/Kampa/faq) is probably faster.

Kampa is a free, open-source campaign planner that runs entirely in your browser. It takes your business description, your budget and the hours you can actually spend per week, and produces a 90-day marketing plan that respects both constraints instead of assuming an agency retainer. You bring your own Claude API key, so you pay Anthropic directly, usually under €1 per campaign, and nothing you type is stored on any server. Plans export as Markdown, PDF or calendar files. If you have a capped key, [open the app](/Kampa/app) and generate one.
