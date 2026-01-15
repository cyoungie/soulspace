# HealthXR - Mental Health Journal for Vision Pro


A spatial mental health journaling app built with React and WebSpatial for Apple Vision Pro.
https://smiling-cap-7e6.notion.site/SoulSpace-Making-Emotions-Tangible-in-Mixed-Reality-2dfdf2206e458019a436fdf11efef820 


## What It Does


- **Journal Entries**: Record your thoughts with voice or text input
- **Mood Tracking**: Select your current mood/emotion for each entry
- **Emotion Spheres**: Visualize your emotional patterns as interactive glass-jar bubbles
- **Soul Summary (Mood Wrap)**: Get AI-powered insights and summaries of your emotional journey
- **Spatial Experience**: Immersive 3D interface designed for Apple Vision Pro


## Features


- Voice-to-text journaling with AI mood detection
- 8 emotion categories: Sad, Angry, Anxious, Calm, Excited, Grateful, Reflective, Overwhelmed
- Percentage-based mood visualization showing emotional distribution
- Tap emotions to view related journal entries
- Works in both web browser and Vision Pro simulator


## Tech Stack


- React 19 + TypeScript
- WebSpatial SDK for Vision Pro
- Vite for build tooling
- Google Gemini AI for mood analysis


## Installation


```bash
npm install
```


## Running the App


### Web Browser (Development)
```bash
npm run dev
```
Open http://localhost:5173


### Apple Vision Pro Simulator


**Terminal 1** - Start the AVP dev server:
```bash
npm run start:avp
```


**Terminal 2** - Launch the simulator:
```bash
npm run simulate:avp
```


## Project Structure


```
src/
├── pages/
│   ├── LandingPage.tsx      # Home screen
│   ├── FeatureSelection.tsx # Choose Journal/Mood Wrap/Emotion Sphere
│   ├── EmotionBubble.tsx    # Emotion visualization spheres
│   ├── NewJournalEntry.tsx  # Create new entries
│   └── MoodWrap.tsx         # AI-powered mood summary
├── components/
│   ├── VoiceInput.tsx       # Voice recording
│   ├── MoodSelector.tsx     # Mood picker
│   └── MoodWrapSlides/      # Carousel slides for summaries
└── services/
    └── moodDetection.ts     # AI mood analysis
```


## Environment Variables


Create a `.env` file:
```
VITE_GEMINI_API_KEY=your_gemini_api_key
XR_DEV_PORT=5174
XR_DEV_SERVER=http://localhost:5174/webspatial/avp
```
