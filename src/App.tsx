import { useState } from 'react'
import './App.css'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SecondPage from "./SecondPage";
import { LandingPage } from './pages/LandingPage';
import { FeatureSelection } from './pages/FeatureSelection';
import { NewJournalEntry } from './pages/NewJournalEntry';
import { MoodWrap } from './pages/MoodWrap';
import { EmotionBubble } from './pages/EmotionBubble';
import { EmotionEntriesView } from './pages/EmotionEntriesView';
import type { JournalEntry, Mood } from './types';
import { MoodSelector } from './components/MoodSelector';
import { VoiceInput } from './components/VoiceInput';
import { SpatialGallery } from './components/SpatialGallery';
import { JournalEntryCard } from './components/JournalEntryCard';
import { JournalEntryScene } from './pages/JournalEntryScene';
import { OpenJournalPage } from './pages/OpenJournalPage';
import { TableOfContentsPage } from './pages/TableOfContentsPage';
import { AIAssistant } from './components/AIAssistant';
import { VoiceActivationProvider } from './components/VoiceActivationProvider';

function JournalApp() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [currentMood, setCurrentMood] = useState<Mood | null>(null);
  const [currentText, setCurrentText] = useState('');
  const [view, setView] = useState<'create' | 'list' | 'spatial'>('create');

  const handleSaveEntry = () => {
    if (!currentMood || !currentText.trim()) {
      alert('Please select a mood and add some content');
      return;
    }

    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      content: currentText,
      mood: currentMood,
      timestamp: new Date(),
      position: {
        x: (Math.random() - 0.5) * 5,
        y: (Math.random() - 0.5) * 5,
        z: (Math.random() - 0.5) * 2,
      }
    };

    setEntries([newEntry, ...entries]);
    setCurrentText('');
    setCurrentMood(null);
    setView('list');
  };

  return (
    <div className="journal-app">
      <header className="app-header">
        <h1>Your thoughts deserve space.</h1>
        <nav className="view-toggle">
          <button
            className={view === 'create' ? 'active' : ''}
            onClick={() => setView('create')}
          >
            Create
          </button>
          <button
            className={view === 'list' ? 'active' : ''}
            onClick={() => setView('list')}
          >
            Journal ({entries.length})
          </button>
          <button
            className={view === 'spatial' ? 'active' : ''}
            onClick={() => setView('spatial')}
          >
            3D View
          </button>
        </nav>
      </header>

      <main className="app-main">
        {view === 'create' && (
          <div className="create-view">
            <MoodSelector
              selectedMood={currentMood}
              onSelectMood={setCurrentMood}
            />

            <div className="input-section">
              <VoiceInput onTranscript={setCurrentText} />

              <div className="text-input-container">
                <textarea
                  className="journal-textarea"
                  placeholder="Or type your thoughts here..."
                  value={currentText}
                  onChange={(e) => setCurrentText(e.target.value)}
                  style={{
                    borderColor: currentMood?.color || 'rgba(255, 255, 255, 0.2)',
                    boxShadow: currentMood ? `0 0 20px ${currentMood.color}40` : 'none'
                  }}
                />
              </div>

              <AIAssistant
                mood={currentMood}
                entryText={currentText}
                onSuggestionSelect={(suggestion) => {
                  setCurrentText(prev => prev ? `${prev}\n\n${suggestion}` : suggestion);
                }}
              />

              <button
                className="save-button"
                onClick={handleSaveEntry}
                disabled={!currentMood || !currentText.trim()}
                style={{
                  background: currentMood
                    ? `linear-gradient(135deg, ${currentMood.color} 0%, ${currentMood.color}dd 100%)`
                    : 'rgba(255, 255, 255, 0.1)'
                }}
              >
                Save Entry
              </button>
            </div>
          </div>
        )}

        {view === 'list' && (
          <div className="list-view">
            {entries.length === 0 ? (
              <div className="empty-state">
                <p>No entries yet. Start journaling to see your thoughts here.</p>
                <button onClick={() => setView('create')}>Create First Entry</button>
              </div>
            ) : (
              <div className="entries-grid">
                {entries.map(entry => (
                  <JournalEntryCard key={entry.id} entry={entry} />
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'spatial' && (
          <div className="spatial-view">
            <SpatialGallery entries={entries} />
          </div>
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <Router basename={__XR_ENV_BASE__}>
      <VoiceActivationProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/open-journal" element={<OpenJournalPage />} />
          <Route path="/table-of-contents" element={<TableOfContentsPage />} />
          <Route path="/features" element={<FeatureSelection />} />
          <Route path="/journal" element={<NewJournalEntry />} />
          <Route path="/journal-old" element={<JournalApp />} />
          <Route path="/mood-wrap" element={<MoodWrap />} />
          <Route path="/emotion-bubble" element={<EmotionBubble />} />
          <Route path="/emotion-entries/:moodId" element={<EmotionEntriesView />} />
          <Route path="/second-page" element={<SecondPage />} />
          <Route path="/entry" element={<JournalEntryScene />} />
        </Routes>
      </VoiceActivationProvider>
    </Router>
  )
}

export default App
