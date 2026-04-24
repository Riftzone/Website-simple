// Cloudflare Pages Function – /api/stats
// Uses public endpoints to fetch live stats – no API keys required.

interface Env {}

interface YouTubeRSSVideo {
  id: string;
  title: string;
  thumbnail: string;
  published: string;
  views: string;
  url: string;
}

interface StatsResponse {
  youtube: {
    subscribers: number;
    subscribersFormatted: string;
    views: number;
    videos: number;
    name: string;
    avatar: string;
    latestVideos: YouTubeRSSVideo[];
  };
  twitch: {
    followers: number;
    followersFormatted: string;
  };
  tiktok: {
    followers: number;
    followersFormatted: string;
    note?: string;
  };
  instagram: {
    followers: number;
    followersFormatted: string;
    note?: string;
  };
  discord: {
    members: number | null;
    membersFormatted: string;
    online: number | null;
    onlineFormatted: string;
  };
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toString();
}

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// ─── YouTube via mixerno.space ──────────────────────────────────────
async function fetchYouTubeStats() {
  const channelId = 'UCVZmhmDtF8wCHNqpviNsAlw';
  
  let subscribers = 0, views = 0, videos = 0, name = 'Riftzone', avatar = '';
  try {
    const res = await fetch(`https://mixerno.space/api/youtube-channel-counter/user/${channelId}`);
    if (res.ok) {
      const data: any = await res.json();
      for (const c of data.counts || []) {
        if (c.value === 'subscribers') subscribers = c.count;
        if (c.value === 'views') views = c.count;
        if (c.value === 'videos') videos = c.count;
      }
      for (const u of data.user || []) {
        if (u.value === 'name') name = u.count;
        if (u.value === 'pfp') avatar = u.count;
      }
    }
  } catch (_) {}

  const latestVideos: YouTubeRSSVideo[] = [];
  try {
    const rssRes = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`);
    if (rssRes.ok) {
      const xml = await rssRes.text();
      const entries = xml.split('<entry>').slice(1, 7);
      for (const entry of entries) {
        const videoId = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/)?.[1] || '';
        const title = entry.match(/<title>(.*?)<\/title>/)?.[1] || '';
        const thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
        const published = entry.match(/<published>(.*?)<\/published>/)?.[1] || '';
        const viewsMatch = entry.match(/<media:statistics views="(\d+)"/)?.[1] || '0';
        const linkMatch = entry.match(/<link rel="alternate" href="(.*?)"/)?.[1] || '';

        latestVideos.push({
          id: videoId,
          title: decodeXML(title),
          thumbnail,
          published,
          views: viewsMatch,
          url: linkMatch,
        });
      }
    }
  } catch (_) {}

  return { subscribers, subscribersFormatted: formatNumber(subscribers), views, videos, name, avatar, latestVideos };
}

// ─── Twitch via decapi.me ───────────────────────────────────────────
async function fetchTwitchStats() {
  let followers = 0;
  try {
    const res = await fetch('https://decapi.me/twitch/followcount/riftzone');
    if (res.ok) {
      const text = await res.text();
      followers = parseInt(text.trim(), 10) || 0;
    }
  } catch (_) {}
  return { followers, followersFormatted: formatNumber(followers) };
}

// ─── Discord via Invite API (Public) ────────────────────────────────
async function fetchDiscordStats() {
  let members = 0;
  let online = 0;
  try {
    // wQ79Q96cxr is the real invite code from dc.riftzone.me redirect
    const res = await fetch('https://discord.com/api/v10/invites/wQ79Q96cxr?with_counts=true');
    if (res.ok) {
      const data: any = await res.json();
      members = data.approximate_member_count || 0;
      online = data.approximate_presence_count || 0;
    }
  } catch (_) {}
  return {
    members,
    membersFormatted: formatNumber(members),
    online,
    onlineFormatted: formatNumber(online),
  };
}

// ─── TikTok (Scraping Fallback) ──────────────────────────────────────
// TikTok doesn't have a public API, but we can try to find it in the HTML
// or in a public counter mirror. 
async function fetchTikTokStats() {
  let followers = 541200; // Updated fallback based on recent check
  try {
    // Attempt to scrape from TikTok directly (Cloudflare might block but we try)
    const res = await fetch('https://www.tiktok.com/@riftzoneyt', {
      headers: { 'User-Agent': USER_AGENT }
    });
    if (res.ok) {
      const html = await res.text();
      const match = html.match(/"followerCount":(\d+)/);
      if (match) followers = parseInt(match[1], 10);
    }
  } catch (_) {}
  return { followers, followersFormatted: formatNumber(followers) };
}

// ─── Instagram (Scraping Fallback) ───────────────────────────────────
async function fetchInstagramStats() {
  let followers = 32300; // Updated fallback
  try {
    // Instagram is very strict. We try to fetch and find it.
    const res = await fetch('https://www.instagram.com/riftzonee/', {
      headers: { 'User-Agent': USER_AGENT }
    });
    if (res.ok) {
      const html = await res.text();
      // Look for follower count in meta tags
      const match = html.match(/"edge_followed_by":\s?\{\s?"count":\s?(\d+)/);
      if (match) followers = parseInt(match[1], 10);
    }
  } catch (_) {}
  return { followers, followersFormatted: formatNumber(followers) };
}

function decodeXML(str: string): string {
  return str.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'");
}

export const onRequest: PagesFunction<Env> = async () => {
  const [youtube, twitch, discord, tiktok, instagram] = await Promise.all([
    fetchYouTubeStats(),
    fetchTwitchStats(),
    fetchDiscordStats(),
    fetchTikTokStats(),
    fetchInstagramStats(),
  ]);

  const response: StatsResponse = {
    youtube,
    twitch,
    tiktok,
    instagram,
    discord,
  };

  return new Response(JSON.stringify(response), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
