"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { ArrowLeft, Save, Edit3, Calendar, Dumbbell, Heart, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';

export default function NotesPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (!storedUser) {
      router.push('/');
      return;
    }
    const user = JSON.parse(storedUser);
    setCurrentUser(user);
    fetchHistory(user.id);
  }, []);

  const fetchHistory = async (userId: string) => {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('activity_date', { ascending: false });

    if (data) setLogs(data);
    setLoading(false);
  };

  const startEditing = (log: any) => {
    setEditingId(log.id);
    setEditText(log.note || '');
  };

  const saveNote = async (logId: string) => {
    const { error } = await supabase
      .from('activity_logs')
      .update({ note: editText })
      .eq('id', logId);

    if (!error) {
      setLogs(logs.map(log => log.id === logId ? { ...log, note: editText } : log));
      setEditingId(null);
    } else {
      alert("Hata: " + error.message);
    }
  };

  const handleImageUpload = async (logId: string, file: File) => {
    if (!currentUser) return;
    if (!file.type.startsWith('image/')) {
      alert('Sadece resim dosyaları kabul edilir');
      return;
    }

    setUploadingId(logId);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', currentUser.id);

      const res = await fetch('/api/activity', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setLogs(logs.map(log => log.id === logId ? { ...log, image_url: data.url } : log));
        alert('Resim yüklendi!');
      } else {
        const error = await res.json();
        alert(error.error || 'Yükleme hatası');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Yükleme başarısız');
    } finally {
      setUploadingId(null);
    }
  };

  const deleteImage = async (logId: string) => {
    const { error } = await supabase
      .from('activity_logs')
      .update({ image_url: null })
      .eq('id', logId);

    if (!error) {
      setLogs(logs.map(log => log.id === logId ? { ...log, image_url: null } : log));
    }
  };

  if (loading) return <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center">Yükleniyor...</div>;

  return (
    <div className="min-h-screen bg-neutral-900 text-white pb-10">
      
      {/* Üst Başlık */}
      <div className="bg-neutral-800 p-6 rounded-b-3xl border-b border-neutral-700 shadow-xl mb-6 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 bg-neutral-700 rounded-full hover:bg-neutral-600 transition">
            <ArrowLeft className="w-5 h-5 text-neutral-300" />
          </button>
          <h1 className="text-xl font-bold">Antrenman Günlüğü</h1>
        </div>
      </div>

      {/* Liste */}
      <div className="px-4 space-y-4">
        {logs.length === 0 ? (
          <div className="text-center text-neutral-500 py-10">
            <p>Henüz hiç antrenman kaydın yok.</p>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="bg-neutral-800 rounded-xl p-4 border border-neutral-700/50 shadow-sm">
              
              {/* Kart Başlığı (Tarih ve Tür) */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    log.activity_type === 'gym' ? 'bg-blue-900/20 text-blue-400' : 'bg-pink-900/20 text-pink-400'
                  }`}>
                    {log.activity_type === 'gym' ? <Dumbbell size={20} /> : <Heart size={20} />}
                  </div>
                  <div>
                    <div className="font-semibold text-neutral-200 capitalize flex items-center gap-2">
                      {log.activity_type}
                    </div>
                    <div className="text-xs text-neutral-500 flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(log.activity_date).toLocaleDateString('tr-TR', { 
                        year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' 
                      })}
                    </div>
                  </div>
                </div>
                
                {/* Düzenle Butonu */}
                {editingId !== log.id && (
                  <button onClick={() => startEditing(log)} className="text-neutral-500 hover:text-white transition">
                    <Edit3 size={18} />
                  </button>
                )}
              </div>

              {/* RESİM ALANI */}
              {log.image_url && (
                <div className="mb-3 relative">
                  <img 
                    src={log.image_url} 
                    alt="Antrenman" 
                    className="w-full h-48 object-cover rounded-lg border border-neutral-700"
                  />
                  <button
                    onClick={() => deleteImage(log.id)}
                    className="absolute top-2 right-2 bg-red-900/80 hover:bg-red-900 p-2 rounded-full text-red-200 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}

              {/* NOT ALANI */}
              {editingId === log.id ? (
                <div className="animate-in fade-in">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-600 rounded-lg p-3 text-sm text-white focus:border-blue-500 outline-none min-h-[100px]"
                    placeholder="Bugün neler yaptın? (Örn: Bench Press 80kg 3x10...)"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button 
                      onClick={() => setEditingId(null)} 
                      className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
                    >
                      İptal
                    </button>
                    <button 
                      onClick={() => saveNote(log.id)} 
                      className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                    >
                      <Save size={14} /> Kaydet
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div 
                    onClick={() => startEditing(log)} 
                    className={`text-sm whitespace-pre-wrap cursor-pointer hover:bg-neutral-700/30 p-2 rounded-lg transition ${
                      log.note ? 'text-neutral-300' : 'text-neutral-600 italic'
                    }`}
                  >
                    {log.note || "Antrenman notu eklemek için dokun..."}
                  </div>
                  
                  {/* RESİM YÜKLEME */}
                  <label className="block mt-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleImageUpload(log.id, e.target.files[0]);
                        }
                      }}
                      disabled={uploadingId === log.id}
                      className="hidden"
                    />
                    <div className="flex items-center justify-center gap-2 p-3 border border-dashed border-neutral-600 rounded-lg hover:border-blue-500 hover:bg-blue-900/10 cursor-pointer transition text-xs text-neutral-400 hover:text-blue-400">
                      <ImageIcon size={14} />
                      {uploadingId === log.id ? 'Yükleniyor...' : 'Resim Ekle'}
                    </div>
                  </label>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}