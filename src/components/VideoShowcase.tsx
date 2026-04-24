import { FaYoutube, FaTwitch } from 'react-icons/fa';
import './VideoShowcase.css';

interface VideoShowcaseProps {
  platform: 'youtube' | 'twitch';
  videoId?: string;
  channelName?: string;
  title: string;
}

export function VideoShowcase({ platform, videoId, channelName, title }: VideoShowcaseProps) {
  const isYoutube = platform === 'youtube';
  const Icon = isYoutube ? FaYoutube : FaTwitch;
  const color = isYoutube ? 'var(--platform-yt)' : 'var(--platform-twitch)';

  return (
    <div className="video-showcase glass-card">
      <div className="showcase-header">
        <div className="showcase-title">
          <Icon size={24} style={{ color }} />
          <h2>{title}</h2>
        </div>
      </div>
      <div className="video-container">
        {isYoutube && videoId ? (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        ) : !isYoutube && channelName ? (
          <iframe
            src={`https://player.twitch.tv/?channel=${channelName}&parent=${window.location.hostname || 'localhost'}`}
            frameBorder="0"
            allowFullScreen
            scrolling="no"
            title="Twitch Player"
          ></iframe>
        ) : (
          <div className="video-placeholder">
            <p>Loading Video...</p>
          </div>
        )}
      </div>
    </div>
  );
}
