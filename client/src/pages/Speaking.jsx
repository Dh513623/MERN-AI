import { useState } from 'react';
import { generateSpeakingTopic, evaluateSpeaking } from '../services/speakingService';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorAlert from '../components/ui/ErrorAlert';
import ScoreRing from '../components/ui/ScoreRing';
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineMicrophone,
  HiOutlineSpeakerWave,
  HiOutlineArrowPath,
} from 'react-icons/hi2';

export default function Speaking() {
  const [topic, setTopic] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState('');
  const [inputMode, setInputMode] = useState('record'); // 'record' | 'voice'

  const { isRecording, audioBlob, startRecording, stopRecording, resetRecording } = useAudioRecorder();
  const { transcript, isListening, startListening, stopListening, resetTranscript } = useSpeechRecognition();
  const { speak, isSpeaking } = useTextToSpeech();

  const handleGenerate = async () => {
    setError('');
    setLoading(true);
    setResult(null);
    resetRecording();
    resetTranscript();
    try {
      const res = await generateSpeakingTopic();
      setTopic(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate topic');
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async () => {
    setError('');
    setEvaluating(true);
    try {
      const formData = new FormData();
      formData.append('mode', 'evaluate');
      formData.append('topicId', topic.topicId);

      if (inputMode === 'record' && audioBlob) {
        formData.append('audio', audioBlob, 'recording.webm');
        formData.append('sentence', topic.title);
      } else if (inputMode === 'voice' && transcript) {
        // Create a dummy audio blob for the API (it expects a file)
        const blob = new Blob([transcript], { type: 'audio/webm' });
        formData.append('audio', blob, 'recording.webm');
        formData.append('sentence', transcript);
      } else {
        setError('Please record audio or use voice input first.');
        setEvaluating(false);
        return;
      }

      const res = await evaluateSpeaking(formData);
      setResult(res.data);

      // Auto-speak improved version
      if (res.data.improved_version) {
        setTimeout(() => speak(res.data.improved_version), 500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Evaluation failed');
    } finally {
      setEvaluating(false);
    }
  };

  const diffColors = {
    easy: 'badge-success',
    medium: 'badge-warning',
    hard: 'badge-danger',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center">
          <HiOutlineChatBubbleLeftRight className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Speaking Evaluation</h1>
          <p className="text-dark-400">Get a topic, speak about it, and receive AI feedback</p>
        </div>
      </div>

      {error && <ErrorAlert message={error} />}

      {!topic && !loading && (
        <div className="glass-card p-8 text-center">
          <div className="text-5xl mb-4">🎯</div>
          <h2 className="text-xl font-bold text-white mb-2">Speaking Practice</h2>
          <p className="text-dark-400 mb-6">Get a topic based on your level and speak about it for evaluation</p>
          <button onClick={handleGenerate} className="btn-primary">Get Topic</button>
        </div>
      )}

      {loading && <LoadingSpinner text="Finding a topic for you..." />}

      {topic && !result && (
        <div className="space-y-6">
          {/* Topic card */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className={`${diffColors[topic.difficulty] || 'badge-primary'}`}>
                {topic.difficulty}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mb-4">{topic.title}</h2>
            {topic.cuePoints && topic.cuePoints.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-dark-400 font-semibold">Cue Points:</p>
                <ul className="space-y-1">
                  {topic.cuePoints.map((cp, i) => (
                    <li key={i} className="text-dark-300 text-sm flex items-start gap-2">
                      <span className="text-primary-400 font-bold">{i + 1}.</span> {cp}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Input mode toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setInputMode('record')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                inputMode === 'record' ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'text-dark-400 hover:bg-dark-800'
              }`}
            >
              🎤 Record Audio
            </button>
            <button
              onClick={() => setInputMode('voice')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                inputMode === 'voice' ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'text-dark-400 hover:bg-dark-800'
              }`}
            >
              🗣️ Live Speech
            </button>
          </div>

          {/* Recording area */}
          <div className="glass-card p-6 flex flex-col items-center gap-4">
            {inputMode === 'record' ? (
              <>
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={isRecording ? 'mic-btn-recording' : 'mic-btn'}
                >
                  <HiOutlineMicrophone className="w-7 h-7" />
                </button>
                <p className="text-sm text-dark-400">
                  {isRecording ? 'Recording... Tap to stop' : audioBlob ? 'Audio captured!' : 'Tap to record your speech'}
                </p>
                {audioBlob && (
                  <button onClick={() => resetRecording()} className="btn-ghost text-sm">
                    <HiOutlineArrowPath className="w-4 h-4 inline mr-1" /> Re-record
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={isListening ? stopListening : startListening}
                  className={isListening ? 'mic-btn-recording' : 'mic-btn'}
                >
                  <HiOutlineMicrophone className="w-7 h-7" />
                </button>
                <p className="text-sm text-dark-400">
                  {isListening ? 'Listening...' : transcript ? 'Speech captured!' : 'Tap and start speaking'}
                </p>
                {transcript && (
                  <div className="w-full p-4 rounded-xl bg-primary-500/10 border border-primary-500/20 text-sm text-primary-200">
                    {transcript}
                  </div>
                )}
              </>
            )}

            <button
              onClick={handleEvaluate}
              disabled={evaluating || (inputMode === 'record' ? !audioBlob : !transcript)}
              className="btn-primary mt-4"
            >
              {evaluating ? 'Evaluating...' : 'Submit for Evaluation'}
            </button>
          </div>

          <button onClick={handleGenerate} className="btn-secondary text-sm">
            Skip → New Topic
          </button>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-6 animate-slide-up">
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-white mb-6 text-center">Speaking Evaluation Results 🎯</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 justify-items-center">
              <ScoreRing score={result.grammarScore || 0} label="Grammar" />
              <ScoreRing score={result.fluencyScore || 0} label="Fluency" />
              <ScoreRing score={result.vocabularyScore || 0} label="Vocabulary" />
              <ScoreRing score={result.pronunciationScore || 0} label="Pronunciation" />
              <ScoreRing score={result.confidenceScore || 0} label="Confidence" />
              <ScoreRing score={result.overallScore || 0} label="Overall" size={90} />
            </div>
          </div>

          {result.spoken_text && (
            <div className="glass-card p-6">
              <p className="text-sm text-dark-400 mb-1">What you said:</p>
              <p className="text-white">{result.spoken_text}</p>
            </div>
          )}

          {result.strengths?.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="text-emerald-400 font-semibold mb-3">✅ Strengths</h3>
              <ul className="space-y-1">
                {result.strengths.map((s, i) => (
                  <li key={i} className="text-dark-300 text-sm">• {s}</li>
                ))}
              </ul>
            </div>
          )}

          {result.weaknesses?.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="text-amber-400 font-semibold mb-3">⚠️ Weaknesses</h3>
              <ul className="space-y-1">
                {result.weaknesses.map((w, i) => (
                  <li key={i} className="text-dark-300 text-sm">• {w}</li>
                ))}
              </ul>
            </div>
          )}

          {result.improved_version && (
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-primary-400 font-semibold">✨ Improved Version</h3>
                <button onClick={() => speak(result.improved_version)} disabled={isSpeaking} className="btn-ghost text-sm">
                  <HiOutlineSpeakerWave className="w-4 h-4 inline mr-1" /> 🔊 Listen
                </button>
              </div>
              <p className="text-dark-200 text-sm leading-relaxed">{result.improved_version}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => { setResult(null); setTopic(null); resetRecording(); resetTranscript(); }} className="btn-secondary">
              Back
            </button>
            <button onClick={handleGenerate} className="btn-primary">Next Topic</button>
          </div>
        </div>
      )}
    </div>
  );
}
