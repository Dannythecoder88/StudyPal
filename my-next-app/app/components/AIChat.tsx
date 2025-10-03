'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, X, Lightbulb, BookOpen, Target, Heart, ExternalLink, Square } from 'lucide-react';
import VoiceRecorder from './VoiceRecorder';
import VoiceConversationButton from './VoiceConversationButton';
import PureVoiceConversationButton, { PureVoiceConversationButtonRef } from './PureVoiceConversationButton';
import VoiceSettings from './VoiceSettings';
import { useTextToSpeech } from '../hooks/useTextToSpeech';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  type: 'explanation' | 'study_tip' | 'motivation' | 'schedule_help' | 'general' | 'google_classroom';
  timestamp: Date;
  toolResults?: any;
  hasToolCalls?: boolean;
}

interface AIChatProps {
  isOpen: boolean;
  onClose: () => void;
  currentSubject?: string;
  currentTask?: string;
  studyTime?: number;
  focusScore?: number;
  userId?: string;
}

export default function AIChat({ 
  isOpen, 
  onClose, 
  currentSubject, 
  currentTask, 
  studyTime = 0, 
  focusScore = 0,
  userId 
}: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hi! I'm StudyPal, your dedicated AI study assistant. I'm here to help you with:\n\n📚 Academic subjects and concepts\n📝 Homework and assignments\n💡 Study tips and techniques\n📅 Study scheduling and planning\n🎓 Google Classroom tasks\n💪 Academic motivation\n\n⚠️ Please note: I can only assist with study-related questions and educational topics. For the best help, ask me about your coursework, assignments, or study challenges!\n\nWhat would you like help with today?",
      sender: 'ai',
      type: 'general',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState('onyx'); // Default to male voice
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const voiceConversationRef = useRef<PureVoiceConversationButtonRef>(null);

  // Text-to-speech functionality for stopping when chat closes
  const { stop: stopSpeaking, forceStop: forceStopSpeaking, initializeUserGesture, isPlaying: isTTSPlaying } = useTextToSpeech();

  // Check if any voice activity is happening
  const isVoiceActive = isTTSPlaying || (voiceConversationRef.current !== null);

  const handleEmergencyStop = () => {
    console.log('🚨 EMERGENCY STOP BUTTON CLICKED 🚨');
    console.log('Calling forceStopSpeaking...');
    forceStopSpeaking();
    
    if (voiceConversationRef.current) {
      console.log('Calling voice conversation forceStop...');
      voiceConversationRef.current.forceStop();
    } else {
      console.log('No voice conversation ref available');
    }
    console.log('Emergency stop completed');
  };

  // Monitor chat open/close state and force stop voice when closed
  useEffect(() => {
    console.log(`Chat isOpen changed: ${isOpen}`);
    if (!isOpen) {
      console.log('🚫 CHAT CLOSED - FORCE STOPPING ALL VOICE ACTIVITIES 🚫');
      console.log('Calling forceStopSpeaking from useEffect...');
      forceStopSpeaking(); // Complete TTS cleanup
      
      if (voiceConversationRef.current) {
        console.log('Calling voice conversation forceStop from useEffect...');
        voiceConversationRef.current.forceStop(); // Complete voice conversation cleanup
      } else {
        console.log('No voice conversation ref in useEffect');
      }
      console.log('useEffect force stop completed');
    }
  }, [isOpen, forceStopSpeaking]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    console.log('Input message state changed:', inputMessage);
  }, [inputMessage]);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      type: 'general',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Check if this might be a Google Classroom related query
      const isGoogleClassroomQuery = /\b(assignment|classroom|course|due|homework|grade|announcement|class)\b/i.test(content);
      
      let response;
      
      if (isGoogleClassroomQuery && userId) {
        // Try Google Classroom integration first
        response = await fetch('/api/composio/tools', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userId,
            message: content,
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success && data.hasToolCalls) {
            // Google Classroom tools were used
            const aiMessage: Message = {
              id: (Date.now() + 1).toString(),
              content: data.message || "I've retrieved information from your Google Classroom.",
              sender: 'ai',
              type: 'google_classroom',
              timestamp: new Date(),
              toolResults: data.toolResults,
              hasToolCalls: true
            };
            setMessages(prev => [...prev, aiMessage]);
            setIsLoading(false);
            return;
          }
        }
      }
      
      // Fall back to regular AI assistant
      response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          type: 'general',
          context: {
            subject: currentSubject,
            currentTask,
            studyTime,
            focusScore
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.response,
          sender: 'ai',
          type: data.filtered ? 'general' : (data.type || 'general'),
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error('Failed to get AI response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        sender: 'ai',
        type: 'general',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      sendMessage(inputMessage.trim());
    }
  };

  const handleVoiceTranscription = (text: string) => {
    // Initialize user gesture for potential TTS use
    initializeUserGesture();
    
    setInputMessage(text);
    setVoiceError(null);
    // Optionally auto-send the transcribed message
    // sendMessage(text);
  };

  const handleVoiceError = (error: string) => {
    setVoiceError(error);
    console.error('Voice recording error:', error);
  };

  const handleClose = () => {
    console.log('❌ CLOSE BUTTON CLICKED - FORCE STOPPING ALL VOICE ACTIVITIES ❌');
    console.log('Calling forceStopSpeaking from handleClose...');
    forceStopSpeaking();
    
    if (voiceConversationRef.current) {
      console.log('Calling voice conversation forceStop from handleClose...');
      voiceConversationRef.current.forceStop();
    } else {
      console.log('No voice conversation ref in handleClose');
    }
    
    console.log('Calling onClose() to close chat...');
    onClose();
    console.log('handleClose completed');
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Stop speaking and close when clicking outside the modal
    if (e.target === e.currentTarget) {
      console.log('Clicked outside modal, force stopping voice');
      handleClose();
    }
  };

  const handlePureVoiceConversation = async (message: string): Promise<string> => {
    // This function handles pure voice conversation without adding messages to chat
    // Only returns the AI response text for TTS
    
    try {
      // Check if this might be a Google Classroom related query
      const isGoogleClassroomQuery = /\b(assignment|classroom|course|due|homework|grade|announcement|class)\b/i.test(message);
      
      let response;
      
      if (isGoogleClassroomQuery && userId) {
        // Try Google Classroom integration first
        response = await fetch('/api/composio/tools', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userId,
            message: message,
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success && data.hasToolCalls) {
            return data.message || "I've retrieved information from your Google Classroom.";
          }
        }
      }
      
      // Fall back to regular AI assistant
      response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          type: 'general',
          context: {
            subject: currentSubject,
            currentTask,
            studyTime,
            focusScore
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.response;
      } else {
        throw new Error('Failed to get AI response');
      }
    } catch (error) {
      console.error('Error in pure voice conversation:', error);
      return 'Sorry, I encountered an error. Please try again.';
    }
  };

  const handleVoiceConversation = async (message: string): Promise<string> => {
    // This function will be called by VoiceConversationButton
    // It should process the voice message and return the AI response text
    // The VoiceConversationButton will handle speaking the response
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      sender: 'user',
      type: 'general',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Check if this might be a Google Classroom related query
      const isGoogleClassroomQuery = /\b(assignment|classroom|course|due|homework|grade|announcement|class)\b/i.test(message);
      
      let response;
      
      if (isGoogleClassroomQuery && userId) {
        // Try Google Classroom integration first
        response = await fetch('/api/composio/tools', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userId,
            message: message,
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success && data.hasToolCalls) {
            // Google Classroom tools were used
            const aiMessage: Message = {
              id: (Date.now() + 1).toString(),
              content: data.message || "I've retrieved information from your Google Classroom.",
              sender: 'ai',
              type: 'google_classroom',
              timestamp: new Date(),
              toolResults: data.toolResults,
              hasToolCalls: true
            };
            setMessages(prev => [...prev, aiMessage]);
            setIsLoading(false);
            return aiMessage.content;
          }
        }
      }
      
      // Fall back to regular AI assistant
      response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          type: 'general',
          context: {
            subject: currentSubject,
            currentTask,
            studyTime,
            focusScore
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.response,
          sender: 'ai',
          type: data.filtered ? 'general' : (data.type || 'general'),
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
        setIsLoading(false);
        return data.response;
      } else {
        throw new Error('Failed to get AI response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = 'Sorry, I encountered an error. Please try again.';
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: errorMessage,
        sender: 'ai',
        type: 'general',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
      return errorMessage;
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            <Bot className="h-6 w-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900">AI Study Assistant</h2>
          </div>
          <div className="flex items-center space-x-2">
            <VoiceSettings 
              currentVoice={selectedVoice}
              onVoiceChange={setSelectedVoice}
            />
            {/* Emergency stop button - only show when voice is active */}
            {isTTSPlaying && (
              <button
                onClick={handleEmergencyStop}
                className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors shadow-md"
                title="Stop AI voice immediately"
              >
                <Square className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="flex items-start space-x-2">
                  {message.sender === 'ai' && (
                    <Bot className="h-4 w-4 text-primary-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    
                    {/* Display Google Classroom tool results */}
                    {message.hasToolCalls && message.toolResults && (
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                        <div className="flex items-center mb-1">
                          <ExternalLink className="h-3 w-3 text-blue-600 mr-1" />
                          <span className="text-blue-800 font-medium">Google Classroom Data</span>
                        </div>
                        <pre className="text-blue-700 whitespace-pre-wrap overflow-x-auto">
                          {JSON.stringify(message.toolResults, null, 2)}
                        </pre>
                      </div>
                    )}
                    
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                      {message.type === 'google_classroom' && (
                        <span className="ml-2 text-blue-600">• Google Classroom</span>
                      )}
                    </p>
                  </div>
                  {message.sender === 'user' && (
                    <User className="h-4 w-4 text-white mt-0.5 flex-shrink-0" />
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-900 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Bot className="h-4 w-4 text-primary-600" />
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="space-y-2">
            {/* Voice error display */}
            {voiceError && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
                Voice Error: {voiceError}
              </div>
            )}
            
            {/* Input row */}
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => {
                  console.log('Input changed:', e.target.value);
                  setInputMessage(e.target.value);
                  setVoiceError(null); // Clear voice error when typing
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e as any);
                  }
                }}
                placeholder="Type or record your question about studying, assignments, or Google Classroom..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                disabled={isLoading}
                autoComplete="off"
              />
              
              {/* Speech-to-Text button */}
              <VoiceRecorder
                onTranscription={handleVoiceTranscription}
                onError={handleVoiceError}
                disabled={isLoading}
                transcriptionOptions={{
                  model: 'whisper-1', // Fastest transcription model
                  prompt: 'Study conversation. Quick transcription.'
                }}
              />
              
              {/* Pure Voice Conversation button */}
              <PureVoiceConversationButton
                ref={voiceConversationRef}
                onVoiceMessage={handlePureVoiceConversation}
                disabled={isLoading}
                voice={selectedVoice}
              />
              
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 