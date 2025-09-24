import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAntiCheat from '../hooks/useAntiCheat';
import MCQSection from '../components/MCQSection';
import CodingSection from '../components/CodingSection';
import AntiCheatOverlay from '../components/AntiCheatOverlay';
import { interviewAPI } from '../services/api';
import {
  isMobileDevice,
  isTabletDevice,
  getTouchButtonClasses,
  getResponsiveTextClasses,
  getResponsiveSpacing,
  triggerHapticFeedback
} from '../utils/mobileOptimization';

export default function TechnicalInterview() {
  const navigate = useNavigate();
  const [section, setSection] = useState('menu'); // menu | mcq | coding
  const [mcqDone, setMcqDone] = useState(false);
  const [codingDone, setCodingDone] = useState(false);
  const [mcqPayload, setMcqPayload] = useState(null); // {questions, answers}
  const [codingOutput, setCodingOutput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fullscreenReady, setFullscreenReady] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');

  const handleFirstWarning = useCallback((reason) => {
    setWarningMessage(`Cheating attempt detected: ${reason}. Next attempt will auto-submit.`);
  }, []);
  const handleSecond = useCallback(async () => {
    await handleSubmit(true);
  }, []);

  const { warningVisible, hideWarning } = useAntiCheat({
    onFirstWarning: handleFirstWarning,
    onSecondInfraction: handleSecond,
  });

  // Request fullscreen at entry
  useEffect(() => {
    const tryFS = async () => {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        }
        setFullscreenReady(true);
      } catch (e) {
        // If blocked, show a click overlay
        setFullscreenReady(false);
      }
    };
    tryFS();
  }, []);

  const canSubmit = useMemo(() => mcqDone && codingDone, [mcqDone, codingDone]);

  const handleSubmit = async (auto = false) => {
    try {
      if (!auto && !canSubmit) return;
      setSubmitting(true);
      const payload = {
        mcqQuestions: mcqPayload?.questions || [],
        mcqAnswers: mcqPayload?.answers || [],
        codingOutput: (codingOutput || '').trim(),
      };
      const { data } = await interviewAPI.submitFeedback(payload);
      // Persist for refresh safety
      sessionStorage.setItem('interview_feedback', JSON.stringify(data));
      navigate('/feedback', { state: data });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Submission failed', e);
    } finally {
      setSubmitting(false);
    }
  };

  const startButtons = (
    <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
      <button
        className={`${getTouchButtonClasses()} w-64 h-40 ${getResponsiveTextClasses('text-xl', 'text-lg')} font-bold rounded-2xl bg-white shadow border hover:shadow-lg`}
        onClick={() => {
          triggerHapticFeedback();
          setSection('mcq');
        }}
      >MCQs</button>
      <button
        className={`${getTouchButtonClasses()} w-64 h-40 ${getResponsiveTextClasses('text-xl', 'text-lg')} font-bold rounded-2xl bg-white shadow border hover:shadow-lg`}
        onClick={() => {
          triggerHapticFeedback();
          setSection('coding');
        }}
      >Coding</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {!fullscreenReady && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-xl p-6 text-center max-w-md">
            <div className="font-semibold mb-2">Allow Fullscreen</div>
            <p className="text-sm text-gray-600">Click below to start in fullscreen mode.</p>
            <button
              className="mt-4 px-4 py-2 rounded bg-blue-600 text-white"
              onClick={async () => {
                try {
                  await document.documentElement.requestFullscreen();
                  setFullscreenReady(true);
                } catch (_) {}
              }}
            >Enter Fullscreen</button>
          </div>
        </div>
      )}

      <AntiCheatOverlay visible={warningVisible} message={warningMessage} onClose={hideWarning} />

      <div className={`container mx-auto ${getResponsiveSpacing('px-4', 'px-6')} ${getResponsiveSpacing('py-8', 'py-6')}`}>
        <div className="mb-6 flex items-center justify-between">
          <h1 className={`${getResponsiveTextClasses('text-2xl', 'text-xl')} font-bold`}>Technical Interview</h1>
          <div className="flex items-center gap-2 text-sm">
            <span className={`px-2 py-1 rounded ${mcqDone ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>MCQs {mcqDone ? '✓' : ''}</span>
            <span className={`px-2 py-1 rounded ${codingDone ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>Coding {codingDone ? '✓' : ''}</span>
          </div>
        </div>

        {section === 'menu' && (
          <div className="mt-20">
            <div className="text-center mb-8 text-gray-700">Please complete both sections.</div>
            {startButtons}
          </div>
        )}

        {section === 'mcq' && (
          <div className="space-y-4">
            <MCQSection
              onComplete={({ questions, answers }) => {
                setMcqPayload({ questions, answers });
                setMcqDone(true);
                setSection('menu');
              }}
            />
          </div>
        )}

        {section === 'coding' && (
          <div className="space-y-4">
            <CodingSection
              onComplete={({ ran, output }) => {
                if (ran) setCodingDone(true);
                setCodingOutput(output || '');
              }}
            />
            <div className="flex justify-end">
              <button 
                className={`${getTouchButtonClasses()} px-4 py-2 rounded bg-gray-100`} 
                onClick={() => {
                  triggerHapticFeedback();
                  setSection('menu');
                }}
              >Back</button>
            </div>
          </div>
        )}

        <div className="mt-10 flex justify-center">
          <button
            className={`${getTouchButtonClasses()} px-6 py-3 rounded text-white font-semibold ${canSubmit ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-300 cursor-not-allowed'}`}
            disabled={!canSubmit || submitting}
            onClick={() => {
              if (canSubmit && !submitting) {
                triggerHapticFeedback();
                handleSubmit(false);
              }
            }}
          >{submitting ? 'Submitting...' : 'Submit Technical Interview'}</button>
        </div>
      </div>
    </div>
  );
}


