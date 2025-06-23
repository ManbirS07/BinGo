// src/pages/DailyQuest.jsx
import React, { useEffect, useState } from 'react';
import api from '../utils/api';

const DailyQuest = () => {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]); // array of selected indices
  const [attempted, setAttempted] = useState(false);
  const [previousScore, setPreviousScore] = useState(null);
  const [previousPoints, setPreviousPoints] = useState(null);
  const [resultMessage, setResultMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Fetch today's quiz on mount
    const fetchQuiz = async () => {
      try {
        const res = await api.get('/daily-quiz');
        const { questions: qs, attempted, previousScore, previousPoints } = res.data;
        setQuestions(qs);
        setAttempted(attempted);
        setPreviousScore(previousScore);
        setPreviousPoints(previousPoints);
        // Initialize answers array with nulls
        setAnswers(new Array(qs.length).fill(null));
      } catch (err) {
        console.error('Error fetching daily quiz', err);
        // Optionally handle 404 (no questions) or 401 (not logged in)
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, []);

  const handleOptionChange = (qIndex, optionIndex) => {
    if (attempted) return; // disable changes if already attempted
    const newAnswers = [...answers];
    newAnswers[qIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    // Simple validation: ensure all answered
    if (answers.some(ans => ans === null)) {
      alert('Please answer all questions before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/daily-quiz/submit', { answers });
      // res.data: { message, score, total, pointsEarned }
      setResultMessage(res.data.message);
      setPreviousScore(res.data.score);
      setPreviousPoints(res.data.pointsEarned);
      setAttempted(true);
    } catch (err) {
      console.error('Submission error', err);
      if (err.response) {
        alert(err.response.data.message || 'Error submitting quiz');
        if (err.response.status === 400 && err.response.data.message === 'Already attempted today') {
          setAttempted(true);
        }
      } else {
        alert('Network/server error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div>Loading Daily Quest...</div>;
  }

  if (questions.length === 0) {
    return <div>No questions found in the bank.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">🌱 Daily Quest</h1>
      <p className="mb-4">Answer 5 questions and earn points!</p>

      {attempted ? (
        <div className="bg-green-50 border border-green-200 p-4 rounded">
          <p className="font-medium">
            You already attempted today: Score {previousScore}/{questions.length}, earned {previousPoints} points.
          </p>
          {resultMessage && <p className="mt-2">{resultMessage}</p>}
        </div>
      ) : (
        <form onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
          {questions.map((q, qi) => (
            <div key={q._id} className="mb-6">
              <p className="font-medium mb-2">{qi + 1}. {q.question}</p>
              {q.options.map((opt, oi) => (
                <label key={oi} className="flex items-center mb-1">
                  <input
                    type="radio"
                    name={`question-${qi}`}
                    value={oi}
                    checked={answers[qi] === oi}
                    onChange={() => handleOptionChange(qi, oi)}
                    className="mr-2"
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          ))}
          <button
            type="submit"
            disabled={submitting}
            className={`px-4 py-2 rounded ${submitting ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
          >
            {submitting ? 'Submitting...' : 'Submit Answers'}
          </button>
        </form>
      )}

      {/* Optionally: show a “View Past Attempts” link to another page */}
    </div>
  );
};

export default DailyQuest;
