import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function FeedbackPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state || JSON.parse(sessionStorage.getItem('interview_feedback') || '{}');

  if (!data || (!data.mcqScore && !data.codingResult && !data.feedback)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mb-2 text-lg">No feedback data found.</div>
          <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={() => navigate('/')}>Go Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <h1 className="text-2xl font-bold mb-6">Interview Feedback</h1>
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div>
            <div className="text-sm text-gray-600">MCQ Score</div>
            <div className="text-xl font-semibold">{data.mcqScore} / 10</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Coding Result</div>
            <div className={`text-xl font-semibold ${data.codingResult === 'pass' ? 'text-green-700' : 'text-red-700'}`}>{data.codingResult}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Feedback</div>
            <p className="mt-1 text-gray-800">{data.feedback}</p>
          </div>
        </div>
        <div className="mt-6">
          <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
        </div>
      </div>
    </div>
  );
}


