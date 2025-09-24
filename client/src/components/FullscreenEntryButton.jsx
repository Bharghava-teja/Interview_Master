import React from 'react';

export default function FullscreenEntryButton({ onSuccess }) {
  return (
    <button
      onClick={async () => {
        try {
          if (!document.fullscreenElement) {
            await document.documentElement.requestFullscreen();
          }
          if (onSuccess) onSuccess();
        } catch (_) {}
      }}
      className="px-4 py-2 rounded bg-blue-600 text-white"
    >Enter Fullscreen</button>
  );
}


