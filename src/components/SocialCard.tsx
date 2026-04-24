import type { IconType } from 'react-icons';
import './SocialCard.css';

interface SocialCardProps {
  platformName: string;
  url: string;
  icon: IconType;
  color: string;
  followerCount: string;
  followerLabel: string;
  description: string;
}

export function SocialCard({ platformName, url, icon: Icon, color, followerCount, followerLabel, description }: SocialCardProps) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="social-card glass-card" style={{ '--hover-color': color } as React.CSSProperties}>
      <div className="social-card-content">
        <div className="icon-wrapper" style={{ color: color, borderColor: color }}>
          <Icon size={32} />
        </div>
        <div className="details">
          <h3>{platformName}</h3>
          <p className="description">{description}</p>
        </div>
      </div>
      <div className="stats-wrapper">
        <div className="follower-count" style={{ color: color }}>
          {followerCount}
        </div>
        <div className="follower-label">{followerLabel}</div>
      </div>
    </a>
  );
}
