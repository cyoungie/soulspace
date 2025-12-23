import { useEffect, useState, memo } from 'react';
import './VoiceActivationIndicator.css';

interface VoiceActivationIndicatorProps {
  isListening: boolean;
  isActivated: boolean;
  lastCommand: string | null;
}

export const VoiceActivationIndicator = memo(function VoiceActivationIndicator({ 
  isListening, 
  isActivated, 
  lastCommand 
}: VoiceActivationIndicatorProps) {
  const [showActivation, setShowActivation] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hasShownHint, setHasShownHint] = useState(false);

  useEffect(() => {
    if (isActivated) {
      setShowActivation(true);
      const timer = setTimeout(() => setShowActivation(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isActivated]);

  // Show hint only once after 5 seconds on initial load
  useEffect(() => {
    if (hasShownHint) return;
    
    const timer = setTimeout(() => {
      setShowHint(true);
      setHasShownHint(true);
    }, 5000);
    
    const hideTimer = setTimeout(() => setShowHint(false), 12000);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
    };
  }, [hasShownHint]);

  const getCommandLabel = (command: string | null) => {
    switch (command) {
      case 'journal':
        return 'Opening Journal...';
      case 'soul-summary':
        return 'Opening Soul Summary...';
      case 'emotion-sphere':
        return 'Opening Emotion Sphere...';
      case 'home':
        return 'Going Home...';
      default:
        return 'Command Received';
    }
  };

  return (
    <>
      {/* Listening indicator - small dot in corner */}
      <div className={`voice-listening-dot ${isListening ? 'active' : ''}`}>
        <div className="dot-pulse"></div>
        <span className="dot-label">🎤</span>
      </div>

      {/* Hint tooltip - only show once */}
      {showHint && (
        <div className="voice-hint">
          <p>Try saying:</p>
          <ul>
            <li>Hey SoulSpace</li>
            <li>Open journal</li>
            <li>I need to journal</li>
          </ul>
        </div>
      )}

      {/* Activation feedback overlay */}
      {showActivation && (
        <div className="voice-activation-overlay">
          <div className="activation-content">
            <div className="activation-icon">✨</div>
            <div className="activation-text">{getCommandLabel(lastCommand)}</div>
          </div>
        </div>
      )}
    </>
  );
});
