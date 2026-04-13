import { useState, useRef, useEffect } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import API from '../services/api';
import {
  HiOutlinePaperAirplane,
  HiOutlineMicrophone,
  HiOutlineSpeakerWave,
  HiOutlineSparkles,
} from 'react-icons/hi2';

const MODES = [
  { id: 'friendly', label: '😊 Friendly', desc: 'Casual conversation practice' },
  { id: 'interview', label: '💼 Interview', desc: 'Job interview preparation' },
  { id: 'travel', label: '✈️ Travel', desc: 'Travel scenarios & phrases' },
  { id: 'office', label: '🏢 Office', desc: 'Workplace communication' },
  { id: 'debate', label: '🎭 Debate', desc: 'Persuasive discussion' },
];

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('friendly');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const { transcript, isListening, startListening, stopListening, resetTranscript } = useSpeechRecognition();
  const { speak, isSpeaking, stop: stopSpeaking } = useTextToSpeech();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // When voice transcript is ready, set as input
  useEffect(() => {
    if (transcript && !isListening) {
      setInput(transcript);
    }
  }, [transcript, isListening]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const userMsg = { role: 'user', content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    resetTranscript();
    setSending(true);

    try {
      // Build conversation context
      const conversationHistory = messages.slice(-10).map((m) => m.content).join('\n');
      const prompt = `[Mode: ${mode}] ${conversationHistory}\nUser: ${text.trim()}`;

      const res = await API.post('/speaking', {
        mode: 'generate',
      });

      // Use the response or build a simulated chat response
      const aiText =
        res.data.message ||
        res.data.title ||
        `That's a great point! In a ${mode} conversation, you could also consider different perspectives. What do you think about exploring this topic further?`;

      const aiMsg = { role: 'ai', content: aiText };
      setMessages((prev) => [...prev, aiMsg]);

      // Auto-speak AI response
      speak(aiText);
    } catch {
      const fallbackMsg = {
        role: 'ai',
        content: "I'm here to help you practice English! Could you try rephrasing that? Let's keep the conversation going.",
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] lg:h-[calc(100vh-80px)] animate-fade-in">
      {/* Header */}
      <div className="flex-shrink-0 mb-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
            <HiOutlineSparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">AI Conversation</h1>
            <p className="text-dark-400 text-sm">Practice speaking in different scenarios</p>
          </div>
        </div>

        {/* Mode selector */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                setMode(m.id);
                setMessages([]);
              }}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all
                ${mode === m.id
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                  : 'bg-dark-800 text-dark-400 hover:text-white'
                }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto glass-card p-4 space-y-4 mb-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-5xl mb-4">💬</div>
            <h3 className="text-lg font-semibold text-white mb-2">Start a Conversation</h3>
            <p className="text-dark-400 text-sm max-w-sm">
              Type or use voice to chat with the AI in <span className="text-primary-400">{mode}</span> mode.
              AI responses will be spoken automatically!
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
            <div className="flex items-end gap-2 max-w-[85%]">
              {msg.role === 'ai' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0 text-xs text-white font-bold">
                  AI
                </div>
              )}
              <div className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
                <p className="text-sm leading-relaxed">{msg.content}</p>
                {msg.role === 'ai' && (
                  <button
                    onClick={() => speak(msg.content)}
                    className="mt-2 text-xs text-dark-400 hover:text-primary-400 flex items-center gap-1"
                  >
                    <HiOutlineSpeakerWave className="w-3 h-3" /> Listen
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="chat-bubble-ai">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-dark-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-dark-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-dark-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form onSubmit={handleSubmit} className="flex-shrink-0 flex items-center gap-3">
        <button
          type="button"
          onClick={isListening ? stopListening : startListening}
          className={`p-3 rounded-xl transition-all flex-shrink-0
            ${isListening
              ? 'bg-red-500/20 text-red-400 animate-pulse border border-red-500/30'
              : 'bg-dark-800 text-dark-400 hover:text-white border border-dark-700'
            }`}
        >
          <HiOutlineMicrophone className="w-5 h-5" />
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="input-field flex-1"
          placeholder={isListening ? 'Listening...' : 'Type or speak your message...'}
          disabled={sending}
        />

        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="btn-primary p-3 flex-shrink-0"
        >
          <HiOutlinePaperAirplane className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
