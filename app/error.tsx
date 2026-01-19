'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center p-4">
      <div className="bg-neutral-800 rounded-2xl p-8 border border-red-500/30 max-w-md text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold mb-2">Bir Hata Oluştu</h1>
        <p className="text-neutral-400 mb-6 text-sm">{error.message || 'Beklenmeyen bir hata oluştu'}</p>
        <div className="space-y-2">
          <button
            onClick={reset}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg transition"
          >
            Tekrar Dene
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-neutral-700 hover:bg-neutral-600 text-white font-bold py-2 rounded-lg transition"
          >
            Anasayfaya Dön
          </button>
        </div>
      </div>
    </div>
  );
}
