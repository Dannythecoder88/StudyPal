# Speech-to-Text Integration Guide

## Overview
StudyPal now includes powerful speech-to-text functionality powered by OpenAI's Whisper API. This allows students to interact with the AI assistant using voice commands, making studying more accessible and convenient.

## Features

### 🎤 Live Voice Recording
- **Real-time recording**: Click the microphone icon to start recording your voice
- **Pause/Resume**: Pause and resume recording as needed
- **Recording timer**: See how long you've been recording
- **Visual indicators**: Clear visual feedback for recording status

### 📁 Audio File Upload
- **File support**: Upload existing audio files (mp3, mp4, wav, webm, m4a, etc.)
- **Drag & drop**: Easy file upload interface
- **Size limit**: Supports files up to 25MB

### 🧠 AI-Powered Transcription
- **Multiple models**: Choose from Whisper-1, GPT-4o-mini-transcribe, or GPT-4o-transcribe
- **Study-optimized**: Specialized prompting for academic conversations
- **High accuracy**: Optimized for educational content and terminology

## How to Use

### 1. Voice Recording
1. Open the AI Chat in StudyPal
2. Click the **microphone icon** (🎤) next to the text input
3. Allow microphone permissions when prompted
4. Speak your question clearly
5. Click the **stop button** (⏹️) to end recording
6. The audio will be automatically transcribed and appear in the text input
7. Review the transcription and click **Send** or edit as needed

### 2. Audio File Upload
1. Click the **upload icon** (📤) next to the microphone
2. Select an audio file from your device
3. The file will be automatically transcribed
4. Review and send the transcribed text

### 3. Recording Controls
- **🎤 Start Recording**: Begin voice capture
- **⏸️ Pause**: Temporarily pause recording
- **▶️ Resume**: Continue paused recording
- **⏹️ Stop**: End recording and transcribe
- **📤 Upload**: Select audio file to transcribe

## Supported Audio Formats
- **MP3** (.mp3)
- **MP4** (.mp4, .m4a)
- **WAV** (.wav)
- **WebM** (.webm)
- **MPEG** (.mpeg, .mpga)

## Tips for Best Results

### 🎯 Recording Quality
- **Quiet environment**: Record in a quiet space for better accuracy
- **Clear speech**: Speak clearly and at a normal pace
- **Close to microphone**: Stay close to your device's microphone
- **Avoid background noise**: Minimize TV, music, or other distractions

### 📚 Study-Specific Tips
- **Use academic terms**: The system is optimized for educational vocabulary
- **Mention subjects**: Include course names or subjects for context
- **Be specific**: Detailed questions get better transcriptions
- **Check transcription**: Always review before sending

### 🔧 Troubleshooting
- **Microphone permissions**: Ensure your browser has microphone access
- **Browser compatibility**: Works best in Chrome, Firefox, Safari, Edge
- **File size**: Keep audio files under 25MB
- **Internet connection**: Requires stable internet for transcription

## Example Use Cases

### 📖 Study Questions
*"Can you explain photosynthesis in simple terms for my biology class?"*

### 📝 Assignment Help
*"I need help with my calculus homework on derivatives. Can you walk me through the chain rule?"*

### 📅 Schedule Planning
*"What's the best way to organize my study schedule for finals week?"*

### 🎓 Google Classroom
*"What assignments do I have due this week in my computer science course?"*

## Privacy & Security
- **No audio storage**: Audio files are processed and immediately deleted
- **Secure transmission**: All data is encrypted in transit
- **OpenAI processing**: Audio is processed by OpenAI's secure servers
- **No permanent records**: Transcriptions are only stored in your chat session

## Configuration

### Environment Variables
Make sure your `.env.local` file includes:
```env
OPENAI_API_KEY=your_openai_api_key_here
```

### Model Selection
The system uses `gpt-4o-mini-transcribe` by default for optimal cost and performance. You can modify this in the VoiceRecorder component if needed.

## Browser Support
- ✅ **Chrome** (Recommended)
- ✅ **Firefox**
- ✅ **Safari**
- ✅ **Edge**
- ❌ **Internet Explorer** (Not supported)

## Error Handling
The system includes comprehensive error handling:
- **Microphone access denied**: Clear instructions to enable permissions
- **Unsupported format**: Helpful messages about supported file types
- **Network issues**: Retry mechanisms and user feedback
- **API limits**: Graceful handling of rate limits and quotas

## Getting Help
If you encounter issues:
1. Check your microphone permissions
2. Ensure stable internet connection
3. Try a different audio format
4. Refresh the page and try again
5. Check the browser console for detailed error messages

---

**Happy studying with voice-powered AI assistance! 🎓🎤**
