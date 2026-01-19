export default function NotFound() {
  return (
    <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center p-4">
      <div className="bg-neutral-800 rounded-2xl p-8 border border-yellow-500/30 max-w-md text-center">
        <div className="text-6xl mb-4">🤔</div>
        <h1 className="text-2xl font-bold mb-2">Sayfa Bulunamadı</h1>
        <p className="text-neutral-400 mb-6">Aradığın sayfa mevcut değil.</p>
        <a
          href="/"
          className="inline-block w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 rounded-lg transition"
        >
          Anasayfaya Dön
        </a>
      </div>
    </div>
  );
}
