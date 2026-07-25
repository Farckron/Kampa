import type { Campaign, Intake } from "./types";

/** The answers this fixture is the plan for — exports read the intake for the
 *  title, budget and hours line, so demo mode needs them too. */
export const demoIntake: Intake = {
  sell: "Rīts, a 20-seat speciality coffee shop on Miera iela",
  buyer: "People walking to work in the quarter, 28 to 45",
  region: "Riga, Latvia",
  budget: 400,
  hours: 4,
  channels: ["Instagram", "Google Business Profile", "Email"],
  goal: "Lift weekday morning transactions from 41 to 51 a day",
  voiceSamples: "Doors open 07:30. Your coffee is on the counter before 09:00.",
};

// Demo fixture: the Rīts coffee shop sample (src/content/samples/riga-coffee-shop.md),
// shaped into the wizard's Campaign type. No network, no key needed.
export const demoCampaign: Campaign = {
  strategy: {
    positioning:
      "Rīts is the 90-second coffee stop for people who walk to work in the Miera iela quarter, not a laptop cafe and not a destination brunch spot. Doors open at 07:30, your drink is on the counter before 09:00 no matter the queue, and by the third visit the barista starts it when you walk in.",
    icp: "28 to 45 year olds working within a 700 metre walk — the design and IT offices in Tallinas kvartāls, the Laima offices at Miera 22, the clinics on Bruņinieku. They arrive on foot between 08:20 and 09:15, buy one drink (cappuccino €3.20, filter €2.80), 40% add a pastry. Price-insensitive, ferociously time-sensitive, and they already have a default coffee habit we intend to steal.",
    chosen: [
      {
        channel: "Instagram",
        reason:
          "Everyone in the 700 m catchment has already seen the street, so the job is not awareness but giving them a reason to break their routine on one specific morning. €35 per boosted post puts a dated offer in front of ~9,000 locals at a 3 km radius — the cheapest first visit we can buy.",
      },
      {
        channel: "Google Business Profile",
        reason:
          '"Coffee near me" and "kafejnīca Miera iela" are searched by the person already on the street with 10 minutes spare. The profile is free real estate we under-use: 11 photos, no menu, no posts. It is the only channel here that keeps working after the budget stops.',
      },
      {
        channel: "Email",
        reason:
          "A morning habit is a repetition problem, not a discovery problem. A counter signup tied to the coffee card gives us a list of people who have already paid us once, and it costs €0 to mail under 1,000 subscribers.",
      },
    ],
    rejected: [
      {
        channel: "TikTok",
        reason:
          "Reach is national and mostly under 25, and a 20-seat shop cannot serve reach it cannot walk to. Also eats 3 to 5 of the 4 weekly hours to do non-embarrassingly.",
      },
      {
        channel: "Google Ads",
        reason:
          "Riga coffee keywords are cheap but volume inside 1 km is a few hundred searches a month, and the organic map pack captures them once the profile is fixed. Paying for clicks we can have for free.",
      },
      {
        channel: "Wolt / Bolt Food",
        reason:
          "25 to 30% commission on a €3.20 drink kills the margin, and delivered coffee cannibalises exactly the walk-in habit we are building.",
      },
    ],
    budgetSplit: [
      { item: "Instagram boosted posts (4 × €35)", eur: 140 },
      { item: "Coffee card programme", eur: 90 },
      { item: "Monthly photo session", eur: 60 },
      { item: "Morning tastings", eur: 50 },
      { item: "Print (poster, office flyers)", eur: 40 },
      { item: "Test budget, held back", eur: 20 },
    ],
    kpis: [
      {
        name: "Weekday morning transactions, 07:30–10:30",
        target: "41/day baseline → 51/day by week 12 (+25%)",
        where:
          "POS daily Z-report, filtered Mon–Fri to that window, logged every Monday",
      },
      {
        name: "Google Business Profile direction requests",
        target: "45/month → 80/month by week 12",
        where: "Business Profile performance tab, first Monday of each month",
      },
      {
        name: "Coffee card redemption rate",
        target: "500 cards issued, 30%+ reaching stamp 10 (150 redemptions)",
        where: "Count completed cards in the till drawer each Friday",
      },
    ],
  },
  calendar: [
    {
      week: 1,
      channel: "Google Business Profile",
      assetType: "Profile fix",
      title:
        "Claim and verify the profile, add menu with prices, set 07:30 opening",
      minutes: 100,
    },
    {
      week: 2,
      channel: "Instagram",
      assetType: "Photo set",
      title: "Morning-light photo session with a student, upload 20 frames",
      minutes: 150,
    },
    {
      week: 3,
      channel: "Print",
      assetType: "Poster",
      title: "A3 window poster: we open at 07:30",
      minutes: 60,
    },
    {
      week: 4,
      channel: "Instagram",
      assetType: "Post + boost",
      title: "The 07:30 opening shot, €1.50 filter before 09:00",
      minutes: 90,
    },
    {
      week: 5,
      channel: "Email",
      assetType: "Newsletter",
      title: "Email 1 to the first ~40 subscribers",
      minutes: 75,
    },
    {
      week: 6,
      channel: "Print",
      assetType: "Flyer drop",
      title: "200 flyers to 6 reception desks within 400 m",
      minutes: 120,
    },
    {
      week: 7,
      channel: "Instagram",
      assetType: "Photo set",
      title: "Session 2, schedule 4 weeks of posts from the image bank",
      minutes: 180,
    },
    {
      week: 8,
      channel: "Google Business Profile",
      assetType: "Review push",
      title: "Review QR on the receipt roll, ask 5 named regulars",
      minutes: 90,
    },
    {
      week: 9,
      channel: "Instagram",
      assetType: "Post + boost",
      title: "Mid-point read: kill the weak format, boost the one that carried",
      minutes: 70,
    },
    {
      week: 10,
      channel: "Instagram",
      assetType: "Post + boost",
      title: "Free Ethiopian filter tasting, 08:00 to 09:30",
      minutes: 80,
    },
    {
      week: 11,
      channel: "Email",
      assetType: "Newsletter",
      title: "Email 2: your card is probably at stamp 6",
      minutes: 75,
    },
    {
      week: 12,
      channel: "Google Business Profile",
      assetType: "Post",
      title: "90-day numbers, next quarter's offer live on the profile",
      minutes: 60,
    },
  ],
  copy: [
    {
      week: 4,
      channel: "Instagram",
      title: "We open at 07:30",
      body: 'We open at 07:30. Not 08:00, not "around eight."\n\nHalf of Miera iela is still shuttered when we grind the first batch, and honestly that first hour is the best one: no queue, the machine is warm, and there are usually still almond croissants.\n\nIf you walk past us on the way to the tram and you have never come in, this week is the week. Filter coffee is €1.50 before 09:00, Tuesday to Thursday. No card, no app.\n\nI will be the one behind the machine.',
    },
    {
      week: 5,
      channel: "Email",
      title: "Subject: Why we open at 07:30",
      body: "Hi,\n\nYou picked up a coffee card from us, so you get this once a month. It is short, and unsubscribing is one click at the bottom.\n\nWe open at 07:30 because I used to work in an office on Ģertrūdes and there was nowhere to get a decent coffee before the meeting nobody wanted to be in. Twenty seats, one machine, me and one other person.\n\nThis month we are pouring a washed Guji from Ethiopia as filter, €2.80. If you take milk, the flat white is the one I would order.\n\nThe card only stamps before 11:00. That is deliberate — mornings are what we are good at.\n\nSee you Tuesday,\nIlze\nRīts, Miera iela",
    },
    {
      week: 8,
      channel: "Google Business Profile",
      title: "Weekly post: the first hour",
      body: "Open 07:30 to 18:00, Monday to Friday. Filter €2.80, cappuccino €3.20, card payments, dogs welcome.\n\nThe queue before 09:00 is about 90 seconds. Say at the door if you are in a hurry and we start your drink before you reach the till.\n\nIf we got your morning right, a review takes 20 seconds and it is the only thing that moves us up this map.",
    },
    {
      week: 10,
      channel: "Instagram",
      title: "Free filter by the door tomorrow",
      body: "Tomorrow morning there is a jug of Ethiopian filter by the door and it is free.\n\nWe bought 3 kg of a washed Guji from a roaster in Tartu and it tastes like apricot and black tea, which sounds like something people say to sound clever, but stand at the counter and you will get it in one sip.\n\n08:00 to 09:30, until it runs out. Take the 60 ml, tell me if you hate it, that is genuinely useful to me.",
    },
    {
      week: 11,
      channel: "Email",
      title: "Subject: You are probably at stamp 6",
      body: "Hi,\n\nCards went out ten weeks ago, so if you come in twice a week you are somewhere around stamp 6. Stamp 10 is a free drink of your choice, and I would spend it on the Guji filter while we still have it.\n\nOne change: from next month the tasting jug moves to Thursdays, because Tuesday mornings are busy enough without me handing out free coffee at the door.\n\nStamps happen before 11:00 only. See you early,\nIlze",
    },
    {
      week: 12,
      channel: "Google Business Profile",
      title: "Post: what the next 90 days look like",
      body: "Ninety days ago we served 41 morning coffees a day. This week it was 51.\n\nThank you, genuinely — that number is the whole business.\n\nNew cards are at the till from Monday, same rule: stamps before 11:00, tenth one is free. Opening stays 07:30.",
    },
  ],
};
