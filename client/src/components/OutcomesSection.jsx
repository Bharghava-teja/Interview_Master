import React from 'react';

const OutcomesSection = () => {
  const outcomes = [
    {
      title: 'Improve Communication',
      description: 'Enhance your verbal and non-verbal communication skills through realistic interview scenarios.',
      icon: '💬'
    },
    {
      title: 'Build Confidence',
      description: 'Practice in a safe environment to build confidence and reduce interview anxiety.',
      icon: '💪'
    },
    {
      title: 'Get Instant Feedback',
      description: 'Receive detailed feedback on your performance to identify areas for improvement.',
      icon: '📊'
    },
    {
      title: 'Track Progress',
      description: 'Monitor your interview skills development over time with comprehensive analytics.',
      icon: '📈'
    }
  ];

  return (
    <section className="py-20 flex justify-center items-center">
      <div className="w-full max-w-5xl mx-auto px-2 md:px-6">
        <div className="rounded-3xl p-1 bg-gradient-to-r from-blue-400 via-indigo-300 to-blue-200 shadow-xl">
          <div className="bg-white/70 backdrop-blur-lg rounded-3xl p-6 md:p-12 lg:p-16" style={{ background: 'var(--glass)' }}>
            <h2 className="text-3xl font-bold text-center mb-12 text-blue-700 drop-shadow">
              Why Choose Interview Master?
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {outcomes.map((outcome, index) => (
                <div key={index} className="text-center rounded-2xl p-5 md:p-6 lg:p-8 bg-white/60 backdrop-blur border border-blue-100 shadow-md hover:shadow-xl transition-all duration-200" style={{ background: 'var(--glass)' }}>
                  <div className="text-4xl mb-4">{outcome.icon}</div>
                  <h3 className="text-xl font-semibold text-blue-800 mb-3">
                    {outcome.title}
                  </h3>
                  <p className="text-gray-700">
                    {outcome.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OutcomesSection; 