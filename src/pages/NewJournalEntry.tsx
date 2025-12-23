import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { BackButton } from '../components/BackButton';
import { JournalPrompts } from '../components/JournalPrompts';
import { AIFeedback } from '../components/AIFeedback';
import { detectMood, generateJournalTitle } from '../services/claudeService';
import { MOODS, type JournalEntry } from '../types';
import './NewJournalEntry.css';

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: any) => void;
  onerror: (event: any) => void;
  onend: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
  }
}

export function NewJournalEntry() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    frameId: number;
  } | null>(null);
  
  const [entryTitle, setEntryTitle] = useState('');
  const [entryText, setEntryText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackEntry, setFeedbackEntry] = useState<{ content: string; mood: string; title?: string } | null>(null);

  // Load entries from localStorage
  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = () => {
    const stored = localStorage.getItem('journalEntries');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const entriesWithDates = parsed.map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp),
          mood: MOODS.find(m => m.id === entry.mood.id) || entry.mood,
        }));
        setEntries(entriesWithDates);
      } catch (e) {
        console.error('Error loading entries:', e);
      }
    }
  };

  // Create the 3D open journal background
  const createOpenJournal = () => {
    const bookGroup = new THREE.Group();
    
    const closedWidth = 3.2;
    const closedHeight = 4.2;
    const pageWidth = closedWidth;
    const pageHeight = closedHeight;
    const coverThickness = 0.08;
    const spineWidth = 0.15;
    
    // Pastel colors
    const coverColor = 0xf8c8dc;
    const spineColor = 0xb0e0e6;
    
    const coverMat = new THREE.MeshStandardMaterial({
      color: coverColor,
      roughness: 0.4,
      metalness: 0.05
    });
    
    const spineMat = new THREE.MeshStandardMaterial({
      color: spineColor,
      roughness: 0.4,
      metalness: 0.05
    });
    
    // Spine
    const spineGeo = new THREE.BoxGeometry(spineWidth, pageHeight, coverThickness);
    const spine = new THREE.Mesh(spineGeo, spineMat);
    spine.position.set(0, 0, -coverThickness / 2);
    bookGroup.add(spine);
    
    // Left Cover
    const coverGeo = new THREE.BoxGeometry(pageWidth, pageHeight, coverThickness);
    const leftCover = new THREE.Mesh(coverGeo, coverMat);
    leftCover.position.set(-spineWidth / 2 - pageWidth / 2, 0, 0);
    bookGroup.add(leftCover);
    
    // Right Cover
    const rightCover = new THREE.Mesh(coverGeo, coverMat);
    rightCover.position.set(spineWidth / 2 + pageWidth / 2, 0, 0);
    bookGroup.add(rightCover);
    
    // Left Page (lined paper texture)
    const leftPageCanvas = document.createElement('canvas');
    leftPageCanvas.width = 512;
    leftPageCanvas.height = 680;
    const leftCtx = leftPageCanvas.getContext('2d')!;
    leftCtx.fillStyle = '#fffdf8';
    leftCtx.fillRect(0, 0, 512, 680);
    
    // Lines
    leftCtx.strokeStyle = '#ebe7df';
    leftCtx.lineWidth = 1;
    for (let y = 60; y < 660; y += 24) {
      leftCtx.beginPath();
      leftCtx.moveTo(30, y);
      leftCtx.lineTo(482, y);
      leftCtx.stroke();
    }
    
    const leftPageTexture = new THREE.CanvasTexture(leftPageCanvas);
    const leftPageMat = new THREE.MeshStandardMaterial({
      map: leftPageTexture,
      roughness: 0.95
    });
    
    const pageGeo = new THREE.PlaneGeometry(pageWidth - 0.08, pageHeight - 0.08);
    const leftPage = new THREE.Mesh(pageGeo, leftPageMat);
    leftPage.position.set(-spineWidth / 2 - pageWidth / 2, 0, coverThickness / 2 + 0.01);
    bookGroup.add(leftPage);
    
    // Right Page
    const rightPageCanvas = document.createElement('canvas');
    rightPageCanvas.width = 512;
    rightPageCanvas.height = 680;
    const rightCtx = rightPageCanvas.getContext('2d')!;
    rightCtx.fillStyle = '#fffdf8';
    rightCtx.fillRect(0, 0, 512, 680);
    
    // Lines
    rightCtx.strokeStyle = '#ebe7df';
    rightCtx.lineWidth = 1;
    for (let y = 60; y < 660; y += 24) {
      rightCtx.beginPath();
      rightCtx.moveTo(30, y);
      rightCtx.lineTo(482, y);
      rightCtx.stroke();
    }
    
    const rightPageTexture = new THREE.CanvasTexture(rightPageCanvas);
    const rightPageMat = new THREE.MeshStandardMaterial({
      map: rightPageTexture,
      roughness: 0.95
    });
    
    const rightPage = new THREE.Mesh(pageGeo, rightPageMat);
    rightPage.position.set(spineWidth / 2 + pageWidth / 2, 0, coverThickness / 2 + 0.01);
    bookGroup.add(rightPage);
    
    return bookGroup;
  };

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Clean up existing canvas
    const existingCanvas = containerRef.current.querySelector('canvas');
    if (existingCanvas) {
      containerRef.current.removeChild(existingCanvas);
    }
    
    const scene = new THREE.Scene();
    scene.background = null;
    
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 9.5);
    camera.lookAt(0, 0, 0);
    
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.5;
    containerRef.current.appendChild(renderer.domElement);
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);
    
    const frontLight = new THREE.DirectionalLight(0xffffff, 0.7);
    frontLight.position.set(0, 0, 5);
    scene.add(frontLight);
    
    const topLight = new THREE.DirectionalLight(0xfff8f0, 0.4);
    topLight.position.set(0, 3, 3);
    scene.add(topLight);
    
    // Create journal
    const bookGroup = createOpenJournal();
    bookGroup.position.set(0, 0, 0);
    scene.add(bookGroup);
    
    sceneRef.current = { renderer, frameId: 0 };
    
    const animate = () => {
      if (!sceneRef.current) return;
      renderer.render(scene, camera);
      sceneRef.current.frameId = requestAnimationFrame(animate);
    };
    animate();
    
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.frameId);
        renderer.dispose();
        if (containerRef.current) {
          const canvas = containerRef.current.querySelector('canvas');
          if (canvas) containerRef.current.removeChild(canvas);
        }
      }
    };
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognitionClass();

      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        const newText = (finalTranscript || interimTranscript).trim();
        setEntryText(newText);
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  const toggleListening = () => {
    if (!recognition) {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  const handleSave = async () => {
    if (!entryText.trim()) {
      alert('Please write something before saving.');
      return;
    }

    setIsSaving(true);

    try {
      const result = await detectMood(entryText);
      let mood = MOODS[0];

      if ('mood' in result) {
        const foundMood = MOODS.find(m => m.id === result.mood);
        if (foundMood) {
          mood = foundMood;
        }
      }

      const stored = JSON.parse(localStorage.getItem('journalEntries') || '[]');
      const newEntry = {
        id: Date.now().toString(),
        title: entryTitle.trim() || undefined,
        content: entryText,
        mood: mood,
        timestamp: new Date().toISOString(),
        position: {
          x: (Math.random() - 0.5) * 5,
          y: (Math.random() - 0.5) * 5,
          z: (Math.random() - 0.5) * 2,
        }
      };
      stored.unshift(newEntry);
      localStorage.setItem('journalEntries', JSON.stringify(stored));

      loadEntries();

      const entryData = encodeURIComponent(JSON.stringify({
        ...newEntry,
        timestamp: new Date(newEntry.timestamp)
      }));
      const url = `${__XR_ENV_BASE__}/entry?entry=${entryData}`;
      window.open(url, `entry-${newEntry.id}`);

      setEntryText('');
      setEntryTitle('');
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
      }, 2000);
    } catch (error) {
      console.error('Error saving entry:', error);
      alert('Failed to save entry. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="journal-book-page">
      {/* 3D Journal Background */}
      <div ref={containerRef} className="journal-canvas-container" />
      
      <BackButton onClick={() => navigate('/table-of-contents')} />
      
      {/* Content overlaid on the journal */}
      <div className="journal-content-overlay">
        {/* Left Page - Title & Prompts */}
        <div className="left-page-content">
          
          <div className="title-section">
            <input
              type="text"
              className="journal-title-input"
              placeholder="Title (optional)"
              value={entryTitle}
              onChange={(e) => setEntryTitle(e.target.value)}
            />
            <button
              className="ai-title-btn"
              onClick={async () => {
                if (!entryText.trim()) {
                  alert('Please write something first.');
                  return;
                }
                setIsGeneratingTitle(true);
                try {
                  const result = await generateJournalTitle(entryText);
                  if (result.content && !result.error) {
                    setEntryTitle(result.content);
                  }
                } finally {
                  setIsGeneratingTitle(false);
                }
              }}
              disabled={isGeneratingTitle || !entryText.trim()}
            >
              {isGeneratingTitle ? '✨...' : '✨ AI'}
            </button>
          </div>
          
          <div className="prompts-section">
            <JournalPrompts 
              entryCount={entries.length}
              onSelectPrompt={(prompt) => {
                setEntryText(prev => prev ? `${prev}\n\n${prompt}\n\n` : `${prompt}\n\n`);
              }}
            />
          </div>
        </div>
        
        {/* Right Page - Text & Actions */}
        <div className="right-page-content">
          <div className="page-date">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long',
              month: 'long', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </div>
          <textarea
            className="journal-textarea"
            placeholder="Let your thoughts flow..."
            value={entryText}
            onChange={(e) => setEntryText(e.target.value)}
          />
          
          <div className="action-buttons">
            <button
              className={`voice-btn ${isListening ? 'listening' : ''}`}
              onClick={toggleListening}
            >
              {isListening ? '🔴 Stop' : '🎙️ Voice'}
            </button>
            
            <button
              className="save-btn"
              onClick={handleSave}
              disabled={!entryText.trim() || saved || isSaving}
            >
              {isSaving ? '...' : saved ? '✓' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* AI Feedback Modal */}
      {showFeedback && feedbackEntry && (
        <AIFeedback
          entryContent={feedbackEntry.content}
          detectedMood={feedbackEntry.mood}
          entryTitle={feedbackEntry.title}
          onClose={() => {
            setShowFeedback(false);
            setFeedbackEntry(null);
          }}
        />
      )}
    </div>
  );
}
