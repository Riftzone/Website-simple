import { useEffect, useState } from 'react';
import { FaYoutube, FaTwitch, FaInstagram, FaDiscord, FaTiktok } from 'react-icons/fa';
import { SocialCard } from './components/SocialCard';
import { VideoShowcase } from './components/VideoShowcase';
import { VideoCard } from './components/VideoCard';
import './App.css';

interface VideoEntry {
  id: string;
  title: string;
  thumbnail: string;
  published: string;
  views: string;
  url: string;
}

interface Stats {
  youtube: {
    subscribers: number;
    subscribersFormatted: string;
    views: number;
    videos: number;
    name: string;
    avatar: string;
    latestVideos: VideoEntry[];
  };
  twitch: {
    followers: number;
    followersFormatted: string;
  };
  tiktok: { followers: string; note: string };
  instagram: { followers: string; note: string };
  discord: {
    members: number | null;
    membersFormatted: string;
    online: number | null;
    onlineFormatted: string;
  };
}

function App() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // In production (Cloudflare Pages), this hits /api/stats automatically.
        // For local dev, we fall back to a mock.
        const res = await fetch('/api/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        } else {
          throw new Error('API not available');
        }
      } catch {
        // Fallback: fetch directly from public endpoints on the client side
        // This is used during local dev where the Cloudflare function doesn't run.
        await fetchClientSide();
      } finally {
        setLoading(false);
      }
    };

    const fetchClientSide = async () => {
      // YouTube stats via mixerno
      let ytSubs = 0, ytViews = 0, ytVideos = 0, ytName = 'Riftzone', ytAvatar = '';
      try {
        const res = await fetch('https://mixerno.space/api/youtube-channel-counter/user/UCVZmhmDtF8wCHNqpviNsAlw');
        if (res.ok) {
          const data = await res.json();
          for (const c of data.counts || []) {
            if (c.value === 'subscribers') ytSubs = c.count;
            if (c.value === 'views') ytViews = c.count;
            if (c.value === 'videos') ytVideos = c.count;
          }
          for (const u of data.user || []) {
            if (u.value === 'name') ytName = u.count;
            if (u.value === 'pfp') ytAvatar = u.count;
          }
        }
      } catch {}

      // YouTube latest videos via RSS
      const latestVideos: VideoEntry[] = [];
      try {
        // Use Vite proxy during local dev to avoid CORS; in production the Cloudflare function fetches server-side.
        const rssUrl = '/yt-rss?channel_id=UCVZmhmDtF8wCHNqpviNsAlw';
        const res = await fetch(rssUrl);
        if (res.ok) {
          const xml = await res.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(xml, 'text/xml');
          const entries = doc.querySelectorAll('entry');
          entries.forEach((entry, i) => {
            if (i >= 6) return;
            const videoId = entry.querySelector('videoId')?.textContent || '';
            const title = entry.querySelector('title')?.textContent || '';
            const published = entry.querySelector('published')?.textContent || '';
            const link = entry.querySelector('link[rel="alternate"]')?.getAttribute('href') || '';
            const thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
            const statsEl = entry.querySelector('statistics');
            const views = statsEl?.getAttribute('views') || '0';
            latestVideos.push({ id: videoId, title, thumbnail, published, views, url: link });
          });
        }
      } catch {}

      // Twitch via decapi
      let twitchFollowers = 0;
      try {
        const res = await fetch('https://decapi.me/twitch/followcount/riftzone');
        if (res.ok) {
          twitchFollowers = parseInt(await res.text(), 10) || 0;
        }
      } catch {}

      // Discord via public invite API
      let discordMembers = 4023;
      let discordOnline = 745;
      try {
        const res = await fetch('https://discord.com/api/v10/invites/wQ79Q96cxr?with_counts=true');
        if (res.ok) {
          const data = await res.json();
          discordMembers = data.approximate_member_count || discordMembers;
          discordOnline = data.approximate_presence_count || discordOnline;
        }
      } catch {}

      const formatNum = (n: number) => {
        if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
        if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
        return n.toString();
      };

      setStats({
        youtube: {
          subscribers: ytSubs,
          subscribersFormatted: formatNum(ytSubs),
          views: ytViews,
          videos: ytVideos,
          name: ytName,
          avatar: ytAvatar,
          latestVideos,
        },
        twitch: { followers: twitchFollowers, followersFormatted: formatNum(twitchFollowers) },
        tiktok: { followers: '541.2K', note: 'Live Follower' },
        instagram: { followers: '32.3K', note: 'Live Follower' },
        discord: {
          members: discordMembers,
          membersFormatted: formatNum(discordMembers),
          online: discordOnline,
          onlineFormatted: formatNum(discordOnline)
        },
      });
    };

    fetchStats();
  }, []);

  const firstNonShort = stats?.youtube.latestVideos.find(v => !v.url.includes('/shorts/'));
  const latestVideoId = firstNonShort?.id || stats?.youtube.latestVideos[0]?.id;

  return (
    <>
      <div className="glow-orb orb-1"></div>
      <div className="glow-orb orb-2"></div>

      <div className="container">
        {/* ── Hero ── */}
        <header className="hero">
          <div className="hero-content">
            <div className="hero-main">
              {stats?.youtube.avatar && (
                <img src={stats.youtube.avatar} alt="Riftzone" className="hero-avatar" />
              )}
              <h1 className="glitch" data-text="RIFTZONE">RIFTZONE</h1>
            </div>
            <p className="subtitle">Creator • Streamer</p>
          </div>
        </header>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Lade Daten …</p>
          </div>
        ) : (
          <section className="dashboard-grid">
            {/* ── Social Cards ── */}
            <div className="social-grid">
              <SocialCard
                platformName="YouTube"
                url="https://www.youtube.com/channel/UCVZmhmDtF8wCHNqpviNsAlw"
                icon={FaYoutube}
                color="var(--platform-yt)"
                followerCount={stats?.youtube.subscribersFormatted || '—'}
                followerLabel="Subscribers"
                description={`${stats?.youtube.videos || '—'} Videos · ${stats ? (stats.youtube.views >= 1_000_000 ? (stats.youtube.views / 1_000_000).toFixed(1) + 'M' : (stats.youtube.views / 1_000).toFixed(0) + 'K') : '—'} Views`}
              />
              <SocialCard
                platformName="Twitch"
                url="https://www.twitch.tv/riftzone"
                icon={FaTwitch}
                color="var(--platform-twitch)"
                followerCount={stats?.twitch.followersFormatted || '—'}
                followerLabel="Followers"
                description="Live Streams & Clips"
              />
              <SocialCard
                platformName="TikTok"
                url="https://www.tiktok.com/@riftzoneyt"
                icon={FaTiktok}
                color="var(--platform-tiktok)"
                followerCount={stats?.tiktok.followers || '—'}
                followerLabel="Followers"
                description={stats?.tiktok.note || 'Kurzvideos & Clips'}
              />
              <SocialCard
                platformName="Instagram"
                url="https://www.instagram.com/riftzonee/"
                icon={FaInstagram}
                color="var(--platform-ig)"
                followerCount={stats?.instagram.followers || '—'}
                followerLabel="Followers"
                description={stats?.instagram.note || 'Behind the scenes'}
              />
              <SocialCard
                platformName="Discord"
                url="https://dc.riftzone.me/"
                icon={FaDiscord}
                color="var(--platform-discord)"
                followerCount={stats?.discord.membersFormatted || '—'}
                followerLabel="Members"
                description={stats?.discord.online != null
                  ? `${stats.discord.onlineFormatted} gerade online`
                  : 'Join the community!'}
              />
            </div>

            {/* ── Featured Video + Twitch Stream ── */}
            <div className="video-grid">
              <VideoShowcase
                platform="youtube"
                title="Neuestes Video"
                videoId={latestVideoId}
              />
              <VideoShowcase
                platform="twitch"
                title="Live Stream"
                channelName="riftzone"
              />
            </div>

            {/* ── Latest Videos Gallery ── */}
            {stats && stats.youtube.latestVideos.length > 0 && (
              <div className="latest-section">
                <h2 className="section-title">
                  <FaYoutube style={{ color: 'var(--platform-yt)', marginRight: 10 }} />
                  Neueste Videos
                </h2>
                <div className="videos-grid">
                  {stats.youtube.latestVideos.map((video) => (
                    <VideoCard
                      key={video.id}
                      videoId={video.id}
                      title={video.title}
                      thumbnail={video.thumbnail}
                      views={video.views}
                      published={video.published}
                      url={video.url}
                    />
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        <footer className="footer">
          <p>© {new Date().getFullYear()} Riftzone. All rights reserved.</p>
        </footer>
      </div>
    </>
  );
}

export default App;
