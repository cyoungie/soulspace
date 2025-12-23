import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Voice activation phrases and their corresponding actions
const VOICE_COMMANDS = [
  // Primary wake phrase
  { phrases: ['hey soulspace', 'hey soul space', 'hey soul-space', 'a soulspace', 'hey so space'], action: 'journal' },
  // Alternative activation phrases
  { phrases: ['i need to journal', 'i need journal', 'need to journal', 'i need a journal'], action: 'journal' },
  { phrases: ['open journal', 'open my journal', 'start journal', 'open the journal'], action: 'journal' },
  // Additional commands
  { phrases: ['open soul summary', 'soul summary', 'show summary', 'so summary'], action: 'soul-summary' },
  { phrases: ['open emotion sphere', 'emotion sphere', 'show emotions', 'emotion fear'], action: 'emotion-sphere' },
  { phrases: ['go home', 'go back home', 'take me home', 'go back'], action: 'home' },
];

export interface VoiceActivationState {
  isListening: boolean;
  isActivated: boolean;
  lastCommand: string | null;
  isSupported: boolean;
  error: string | null;
}

export function useVoiceActivation(enabled: boolean = true) {
  const navigate = useNavigate();
  const [state, setState] = useState<VoiceActivationState>({
    isListening: false,
    isActivated: false,
    lastCommand: null,
    isSupported: false,
    error: null,
  });
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const restartTimeoutRef = useRef<number | null>(null);
  const activatedTimeoutRef = useRef<number | null>(null);
  const navigateRef = useRef(navigate);
  const enabledRef = useRef(enabled);

  // Keep refs updated
  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  // Check for phrase match
  const checkForCommand = useCallback((transcript: string): { action: string; phrase: string } | null => {
    const lowerTranscript = transcript.toLowerCase().trim();
    
    for (const command of VOICE_COMMANDS) {
      for (const phrase of command.phrases) {
        if (lowerTranscript.includes(phrase)) {
          return { action: command.action, phrase };
        }
      }
    }
    return null;
  }, []);

  // Execute the matched command
  const executeCommand = useCallback((action: string) => {
    console.log('🚀 Executing command:', action);
    setState(prev => ({ ...prev, isActivated: true, lastCommand: action }));
    
    // Clear any existing timeout
    if (activatedTimeoutRef.current) {
      clearTimeout(activatedTimeoutRef.current);
    }
    
    // Reset activated state after animation
    activatedTimeoutRef.current = window.setTimeout(() => {
      setState(prev => ({ ...prev, isActivated: false }));
    }, 2000);

    // Navigate based on action using ref to get latest navigate function
    const nav = navigateRef.current;
    switch (action) {
      case 'journal':
        console.log('📔 Navigating to /journal');
        nav('/journal');
        break;
      case 'soul-summary':
        console.log('✨ Navigating to /mood-wrap');
        nav('/mood-wrap');
        break;
      case 'emotion-sphere':
        console.log('🫧 Navigating to /emotion-bubble');
        nav('/emotion-bubble');
        break;
      case 'home':
        console.log('🏠 Navigating to /');
        nav('/');
        break;
      default:
        console.log('Unknown voice command action:', action);
    }
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if (!enabled) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognitionClass) {
      console.log('❌ Speech recognition not supported in this browser');
      setState(prev => ({ 
        ...prev, 
        isSupported: false, 
        error: 'Speech recognition not supported. Please use Chrome or Edge.' 
      }));
      return;
    }

    console.log('✅ Speech recognition API available');
    setState(prev => ({ ...prev, isSupported: true }));

    let recognition: any = null;
    let isCleanedUp = false;

    // Request microphone permission and start recognition
    const startRecognition = async () => {
      // First request microphone permission explicitly
      try {
        console.log('🎙️ Requesting microphone permission...');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('✅ Microphone permission granted!');
        // Stop the stream since we just needed permission
        stream.getTracks().forEach(track => track.stop());
      } catch (err) {
        console.error('❌ Microphone access denied:', err);
        setState(prev => ({ 
          ...prev, 
          error: 'Microphone access denied. Please allow microphone in browser settings.',
          isListening: false,
          isSupported: true
        }));
        return;
      }

      if (isCleanedUp) return;

      // Now start speech recognition
      recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        console.log('🎤 Now listening for voice commands...');
        setState(prev => ({ ...prev, isListening: true, error: null }));
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let transcript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        
        console.log('🗣️ Heard:', transcript);
        
        const command = checkForCommand(transcript);
        if (command) {
          console.log('✨ Voice command detected:', command.phrase, '→', command.action);
          executeCommand(command.action);
          
          // Stop and restart to clear the transcript buffer
          try {
            recognition.stop();
          } catch (e) {
            // Ignore
          }
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        console.error('❌ Speech recognition error:', event.error);
        
        if (event.error === 'not-allowed') {
          setState(prev => ({ 
            ...prev, 
            error: 'Microphone access denied',
            isListening: false 
          }));
        } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
          setState(prev => ({ ...prev, error: event.error }));
        }
        
        setState(prev => ({ ...prev, isListening: false }));
      };

      recognition.onend = () => {
        if (isCleanedUp) return;
        
        console.log('🔇 Recognition ended, will restart...');
        setState(prev => ({ ...prev, isListening: false }));
        
        // Auto-restart if still enabled
        if (enabledRef.current) {
          restartTimeoutRef.current = window.setTimeout(() => {
            if (isCleanedUp || !recognition) return;
            try {
              console.log('🔄 Restarting recognition...');
              recognition.start();
            } catch (e) {
              console.log('Could not restart:', e);
            }
          }, 500);
        }
      };

      recognitionRef.current = recognition;

      // Start listening
      try {
        recognition.start();
        console.log('🎙️ Speech recognition started successfully!');
      } catch (e) {
        console.error('Could not start speech recognition:', e);
      }
    };

    startRecognition();

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up speech recognition');
      isCleanedUp = true;
      
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      if (activatedTimeoutRef.current) {
        clearTimeout(activatedTimeoutRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // Ignore
        }
        recognitionRef.current = null;
      }
    };
  }, [enabled, checkForCommand, executeCommand]);

  // Manual start/stop functions
  const startListening = useCallback(() => {
    if (recognitionRef.current && !state.isListening) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error('Could not start listening:', e);
      }
    }
  }, [state.isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && state.isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error('Could not stop listening:', e);
      }
    }
  }, [state.isListening]);

  return {
    ...state,
    startListening,
    stopListening,
  };
}
