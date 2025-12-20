import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BackButton } from '../components/BackButton';
import type { JournalEntry } from '../types';
import './JournalEntryScene.css';

export function JournalEntryScene() {
  const [searchParams] = useSearchParams();
  const [entry, setEntry] = useState<JournalEntry | null>(null);

  useEffect(() => {
    // Get entry data from URL params
    const entryData = searchParams.get('entry');
    if (entryData) {
      try {
        setEntry(JSON.parse(decodeURIComponent(entryData)));
      } catch (e) {
        console.error('Failed to parse entry data:', e);
      }
    }
  }, [searchParams]);

  if (!entry) {
    return <div className="loading">Loading...</div>;
  }

  const formattedDate = new Date(entry.timestamp).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div
      className="journal-entry-scene"
      style={{
        '--mood-color': entry.mood.color,
      } as React.CSSProperties}
    >
      <BackButton />
      <div className="floating-panel">
        <div className="mood-badge">
          <span className="mood-emoji">{entry.mood.emoji}</span>
          <span className="mood-name">{entry.mood.name}</span>
        </div>

        <div className="entry-content-full">
          {entry.content}
        </div>

        <div className="entry-metadata">
          <span>{formattedDate}</span>
        </div>
      </div>

      <div className="ambient-particles">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 10}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
