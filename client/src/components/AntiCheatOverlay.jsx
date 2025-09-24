import React from 'react';

export default function AntiCheatOverlay({ visible, message, onClose }) {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl p-6 max-w-md text-center">
        <div className="text-red-600 font-bold mb-2">Warning</div>
        <p className="text-sm text-gray-700">{message || 'Cheating attempt detected. Next will auto-submit.'}</p>
        <button className="mt-4 px-4 py-2 rounded bg-blue-600 text-white" onClick={onClose}>Continue</button>
      </div>
    </div>
  );
}


