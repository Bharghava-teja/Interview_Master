import React from 'react';

const Footer = () => {
  return (
    <footer
      className="relative mt-16"
      style={{ background: 'var(--bg-main)', color: 'var(--text-main)' }}
    >
      <div className="absolute inset-0 -z-10">
        <div className="h-full w-full bg-gradient-to-t from-indigo-100/60 via-transparent to-transparent theme-dark:from-[#0b1220]" />
      </div>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10 py-10">
        <div className="rounded-3xl p-[1px] bg-gradient-to-r from-blue-400/40 via-indigo-300/40 to-blue-200/40">
          <div className="bg-white/70 backdrop-blur rounded-3xl px-6 py-8 flex flex-col items-center text-center"
               style={{ background: 'var(--glass)' }}>
            <p className="text-sm md:text-base">
              © {new Date().getFullYear()} Interview Master — Helping candidates practice smarter and present stronger.
            </p>
            <p className="text-xs md:text-sm mt-2 text-gray-700">
              Built with care. Privacy-first. No spam.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 