import './VideoCard.css';

interface VideoCardProps {
  videoId: string;
  title: string;
  thumbnail: string;
  views: string;
  published: string;
  url: string;
}

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Gerade eben';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `vor ${minutes} Min.`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `vor ${hours} Std.`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `vor ${days} Tag${days > 1 ? 'en' : ''}`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `vor ${weeks} Woche${weeks > 1 ? 'n' : ''}`;
  const months = Math.floor(days / 30);
  if (months < 12) return `vor ${months} Monat${months > 1 ? 'en' : ''}`;
  const years = Math.floor(days / 365);
  return `vor ${years} Jahr${years > 1 ? 'en' : ''}`;
}

function formatViews(views: string): string {
  const num = parseInt(views, 10);
  if (isNaN(num)) return views;
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toString();
}

export function VideoCard({ title, thumbnail, views, published, url }: VideoCardProps) {
  const isShort = url.includes('/shorts/');

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`video-card glass-card ${isShort ? 'video-card--short' : ''}`}
    >
      <div className="video-card__thumb-wrap">
        <img src={thumbnail} alt={title} className="video-card__thumb" loading="lazy" />
        <div className="video-card__play-icon">▶</div>
        {isShort && <span className="video-card__badge">Short</span>}
      </div>
      <div className="video-card__info">
        <h4 className="video-card__title">{title}</h4>
        <div className="video-card__meta">
          <span>{formatViews(views)} Views</span>
          <span>•</span>
          <span>{timeAgo(published)}</span>
        </div>
      </div>
    </a>
  );
}
