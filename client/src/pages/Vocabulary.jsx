import { useState,useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDailyVocab, submitVocabTest } from '../services/vocabService';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorAlert from '../components/ui/ErrorAlert';
import ScoreRing from '../components/ui/ScoreRing';
import { HiOutlineBookOpen, HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi2';
import { useLocation } from "react-router-dom"; 

export default function Vocabulary() {
  const { user } = useAuth();
  const location = useLocation();
  const [words, setWords] = useState(null);
  const [answers, setAnswers] = useState({ w1: '', w2: '', w3: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [blocked, setBlocked] = useState(false);


  useEffect(() => {
  if (location.state?.words) {
    setWords(location.state.words);
  }
}, [location.state]);

  const startExercise = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await getDailyVocab(user._id);
      if (res.data.success === false) {
        setBlocked(true);
        setError(res.data.message);
      } else {
        setWords(res.data.words);
        console.log("WORDS FROM BACKEND:", res.data.words);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load words');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!answers.w1 || !answers.w2 || !answers.w3) {
      setError('Please enter a synonym for all three words.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const res = await submitVocabTest({
        userId: user._id,
        w1_base: words.easy,
        w1_user: answers.w1,
        w2_base: words.medium,
        w2_user: answers.w2,
        w3_base: words.hard,
        w3_user: answers.w3,
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const wordList = words
    ? [
        { label: 'Easy', word: words.easy, key: 'w1', color: 'from-emerald-500 to-teal-500' },
        { label: 'Medium', word: words.medium, key: 'w2', color: 'from-amber-500 to-orange-500' },
        { label: 'Hard', word: words.hard, key: 'w3', color: 'from-red-500 to-pink-500' },
      ]
    : [];

  // Results view
  if (result) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="glass-card p-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Vocabulary Results 📚</h1>
          <div className="flex justify-center gap-8 mt-6">
            <ScoreRing score={result.finalScore} label="Score" />
            <div className="flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-white">{result.correctAnswers}</span>
              <span className="text-sm text-dark-400">/ 3 Correct</span>
            </div>
            <ScoreRing score={result.averageVocabularyScore} label="Average" />
          </div>
        </div>

        {result.results && (
          <div className="space-y-4">
            {result.results.map((r, i) => (
              <div key={i} className={`glass-card p-6 border-l-4 ${r.result === 'correct' ? 'border-l-emerald-500' : r.result === 'partial' ? 'border-l-amber-500' : 'border-l-red-500'}`}>
                <div className="flex items-start gap-3">
                  {r.result === 'correct' ? (
                    <HiOutlineCheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <HiOutlineXCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`badge ${r.result === 'correct' ? 'badge-success' : r.result === 'partial' ? 'badge-warning' : 'badge-danger'}`}>
                        {r.result}
                      </span>
                      <span className="text-white font-semibold">{wordList[i]?.word}</span>
                    </div>
                    {r.feedback && <p className="text-dark-300 text-sm mb-2">{r.feedback}</p>}
                    {r.new_word && (
                      <div className="mt-2 p-3 rounded-lg bg-primary-500/10 border border-primary-500/20">
                        <p className="text-xs text-primary-400 font-semibold mb-1">SUGGESTED WORD</p>
                        <p className="text-white font-medium">{r.new_word}</p>
                        {r.example && <p className="text-dark-400 text-sm mt-1 italic">"{r.example}"</p>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <button onClick={() => { setResult(null); setWords(null); setAnswers({ w1: '', w2: '', w3: '' }); }} className="btn-secondary">
          Back to Vocabulary
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
          <HiOutlineBookOpen className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Vocabulary Builder</h1>
          <p className="text-dark-400">Learn new words and test your synonym knowledge</p>
        </div>
      </div>

      {error && <ErrorAlert message={error} />}

      {!words && !loading && !blocked && (
        <div className="glass-card p-8 text-center">
          <div className="text-5xl mb-4">📖</div>
          <h2 className="text-xl font-bold text-white mb-2">Daily Vocabulary Challenge</h2>
          <p className="text-dark-400 mb-6">You'll get 3 words (easy, medium, hard). Write a synonym for each!</p>
          <button onClick={startExercise} className="btn-primary">Start Today's Words</button>
        </div>
      )}

      {loading && <LoadingSpinner text="Loading words..." />}

      {words && (
        <div className="space-y-4">
          {wordList.map((w) => (
            <div key={w.key} className="glass-card p-6 animate-slide-up">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${w.color} flex items-center justify-center`}>
                  <span className="text-white text-lg font-bold">{w.label[0]}</span>
                </div>
                <div>
                  <p className="text-xs text-dark-400">{w.label}</p>
                  <p className="text-xl font-bold text-white">{w.word}</p>
                </div>
              </div>
              <input
                type="text"
                value={answers[w.key]}
                onChange={(e) => setAnswers({ ...answers, [w.key]: e.target.value })}
                className="input-field"
                placeholder={`Write a synonym for "${w.word}"...`}
              />
            </div>
          ))}

          <div className="flex justify-end">
            <button onClick={handleSubmit} disabled={submitting} className="btn-primary">
              {submitting ? 'Submitting...' : 'Submit Answers'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
