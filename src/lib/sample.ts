import type { Portfolio } from "./types";

const yt = (id: string) => `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
const watch = (id: string) => `https://www.youtube.com/watch?v=${id}`;

/**
 * Demo creator: Arun Maini (Mrwhosetheboss), from his public profiles, checked 25 Nov 2026.
 *  - Profile, avatar, banner, bio, socials, videos, view counts: his YouTube channel + Instagram.
 *  - Milestones: Streamys (tubefilter), Guinness World Records, Wikipedia.
 *  - Insights are derived from those public numbers only.
 *
 * Audience, brand collaborations and testimonials are NOT public, so those sections hold
 * clearly-fictional example data and ship hidden. Never present them as his.
 * TikTok/X follower counts couldn't be verified, so they're left out.
 *
 * Internal prototype use only: swap for a consenting creator before anything public.
 */
export const SAMPLE: Portfolio = {
  slug: "mrwhosetheboss",
  profile: {
    name: "Arun Maini",
    handle: "@Mrwhosetheboss",
    avatar:
      "https://yt3.googleusercontent.com/QFI5OsUuSRHV-YpwksnVqpqWC19gjU55smnxPzLVU5Y5ohqKIkxq21nV_VfBJhvanYeMBot21A=s800-c-k-c0x00ffffff-no-rj",
    banner: {
      type: "image",
      // full 16:9 banner artwork (not the 6:1 desktop crop), so square/wide covers both work
      url: "https://yt3.googleusercontent.com/LMWJHfAWq4USLdbuHfbJv4r6HtCl7YM6O63sVL3j0xLjyLBaAjc_5KocBtUAiqJjZJqmpVwnnw=w1600",
    },
    bio: "Let's build the greatest tech community on the planet 🌏",
    tags: ["Tech", "Smartphones", "Gadgets", "Explainers"],
    location: "United Kingdom",
    verified: true,
    available: true,
  },
  theme: { preset: "studio", mode: "light", layout: "split" },
  sections: [
    {
      id: "s-socials",
      type: "socials",
      title: "Find me on",
      visible: true,
      items: [
        { platform: "youtube", handle: "@Mrwhosetheboss", url: "https://www.youtube.com/@Mrwhosetheboss", followers: 23100000 },
        { platform: "instagram", handle: "@mrwhosetheboss", url: "https://www.instagram.com/mrwhosetheboss/", followers: 1900000 },
      ],
    },
    {
      id: "s-insights",
      type: "insights",
      title: "Key insights",
      visible: true,
      items: [
        { label: "Total followers", value: 25000000, format: "compact", note: "YouTube + Instagram" },
        { label: "Channel views", value: 9465121846, format: "compact", note: "since 2011" },
        { label: "Avg. views", value: 17000000, format: "compact", note: "6 latest featured videos" },
        { label: "Videos published", value: 1948, format: "plain", note: "on the main channel" },
      ],
    },
    {
      id: "s-featured",
      type: "featured",
      title: "Featured work",
      visible: true,
      items: [
        { platform: "youtube", url: watch("nQdXp6HKKik"), thumbnail: yt("nQdXp6HKKik"), caption: "I tested the most Futuristic Tech - it scared me.", views: 24000000 },
        { platform: "youtube", url: watch("VTLnDqjfRZQ"), thumbnail: yt("VTLnDqjfRZQ"), caption: "I spent $12,000 on the THINNEST Tech", views: 22000000 },
        { platform: "youtube", url: watch("eYBEJBfq_Zs"), thumbnail: yt("eYBEJBfq_Zs"), caption: "Xiaomi made an iPhone Duo. It's Unhinged.", views: 19000000 },
        { platform: "youtube", url: watch("awjlMCCdqXw"), thumbnail: yt("awjlMCCdqXw"), caption: "The Dark Side of China's Perfect Cars", views: 18000000 },
        { platform: "youtube", url: watch("NrF4mkTmuTU"), thumbnail: yt("NrF4mkTmuTU"), caption: "Why GTA 6 Broke the Internet.", views: 11000000 },
        { platform: "youtube", url: watch("JstGCPsj9wg"), thumbnail: yt("JstGCPsj9wg"), caption: "How Tech Companies Lie to You.", views: 8200000 },
      ],
    },
    {
      id: "s-moments",
      type: "moments",
      title: "Proud moments",
      visible: true,
      items: [
        {
          kind: "award",
          title: "Streamy Award, Technology",
          detail: "Won in 2021 and 2022",
          date: "2022",
          url: "https://tubefilter.com/2021/12/11/2021-streamy-award-winners/",
        },
        {
          kind: "milestone",
          title: "Guinness World Record",
          detail: "Largest smartphone replica, with DIY Perks",
          date: "2024",
          url: "https://www.guinnessworldrecords.com/world-records/423011-largest-smartphone-replica",
        },
        {
          kind: "viral",
          title: "Passed Apple on YouTube",
          detail: "More subscribers than Apple's own channel",
          date: "2024",
          url: "https://en.wikipedia.org/wiki/Mrwhosetheboss",
        },
        {
          kind: "press",
          title: "Collab with Marques Brownlee",
          detail: "“How Tech Companies Lie to You.”",
          date: "2026",
          url: watch("JstGCPsj9wg"),
        },
      ],
    },
    {
      id: "s-links",
      type: "links",
      title: "Links",
      visible: true,
      items: [
        { label: "Mrwhosetheboss Picks", url: "https://www.mrwhosetheboss.co/", emoji: "🛍️" },
        { label: "Second channel: MrwhosethebossPlus", url: "https://www.youtube.com/@MrwhosethebossPlus", emoji: "📺" },
        { label: "Latest video", url: watch("NrF4mkTmuTU"), emoji: "▶️" },
      ],
    },
    {
      id: "s-timeline",
      type: "timeline",
      title: "Timeline",
      visible: false,
      items: [
        { year: "2024", title: "Guinness World Record", detail: "A 2 m working iPhone replica, with DIY Perks" },
        { year: "2024", title: "Passed Apple on YouTube", detail: "A goal he set himself" },
        { year: "2022", title: "Streamy Award, Technology", detail: "Second win in a row" },
        { year: "2021", title: "Streamy Award, Technology", detail: "First win" },
        { year: "2011", title: "Started the channel", detail: "Joined YouTube on 20 April" },
      ],
    },
    {
      id: "s-contact",
      type: "contact",
      title: "Work with me",
      visible: true,
      items: [
        {
          email: "",
          url: "https://www.youtube.com/@Mrwhosetheboss/about",
          note: "Business enquiries go through the email on my YouTube About page.",
          responseTime: "",
        },
      ],
    },

    /* ── Example sections: fictional data, hidden by default (not public for this creator) ── */
    {
      id: "s-audience",
      type: "audience",
      title: "Audience",
      visible: false,
      items: [
        { group: "Top locations", label: "Example A", pct: 22 },
        { group: "Top locations", label: "Example B", pct: 17 },
        { group: "Top locations", label: "Example C", pct: 14 },
        { group: "Age", label: "18–24", pct: 46 },
        { group: "Age", label: "25–34", pct: 38 },
        { group: "Age", label: "35+", pct: 16 },
        { group: "Gender", label: "Women", pct: 40 },
        { group: "Gender", label: "Men", pct: 60 },
      ],
    },
    {
      id: "s-brands",
      type: "brands",
      title: "Brand collaborations",
      visible: false,
      items: [
        {
          brand: "Example Brand", color: "#ff5a1f", logo: "",
          campaign: "Example launch campaign", year: "2026",
          deliverables: "1 YT integration · 2 Shorts",
          results: "Example: 1M views, 5% CTR",
          note: "Example data. Replace with a real campaign.",
        },
      ],
    },
    {
      id: "s-testimonials",
      type: "testimonials",
      title: "What brands say",
      visible: false,
      items: [
        { quote: "Example quote. Add a real one from a brand you've worked with.", name: "Example name", role: "Role", brand: "Brand" },
      ],
    },
  ],
};
