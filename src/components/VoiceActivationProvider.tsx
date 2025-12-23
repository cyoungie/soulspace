import { createContext, useContext, useState, useMemo, type ReactNode } from 'react';
import { useVoiceActivation, type VoiceActivationState } from '../hooks/useVoiceActivation';
import { VoiceActivationIndicator } from './VoiceActivationIndicator';

interface VoiceActivationContextType extends VoiceActivationState {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  startListening: () => void;
  stopListening: () => void;
}

const VoiceActivationContext = createContext<VoiceActivationContextType | null>(null);

interface VoiceActivationProviderProps {
  children: ReactNode;
}

export function VoiceActivationProvider({ children }: VoiceActivationProviderProps) {
  const [enabled, setEnabled] = useState(true);
  const voiceActivation = useVoiceActivation(enabled);

  // Memoize context value to prevent unnecessary re-renders of children
  const contextValue = useMemo(() => ({
    ...voiceActivation,
    enabled,
    setEnabled
  }), [voiceActivation, enabled]);

  return (
    <VoiceActivationContext.Provider value={contextValue}>
      {children}
      {voiceActivation.isSupported && (
        <VoiceActivationIndicator
          isListening={voiceActivation.isListening}
          isActivated={voiceActivation.isActivated}
          lastCommand={voiceActivation.lastCommand}
        />
      )}
    </VoiceActivationContext.Provider>
  );
}

export function useVoiceActivationContext() {
  const context = useContext(VoiceActivationContext);
  if (!context) {
    throw new Error('useVoiceActivationContext must be used within VoiceActivationProvider');
  }
  return context;
}
