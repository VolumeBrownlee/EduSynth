import { documentsApi } from '@/services/api';
import { useEduSynthStore } from '@/store/edusynth-store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  BookOpen,
  ClipboardList,
  StickyNote,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState, useRef, useCallback } from 'react';

interface LecturerUploadProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  { value: 'textbook', label: 'Textbook / Notes', icon: BookOpen, color: '#2DD4BF', desc: 'Readable by all students' },
  { value: 'exam', label: 'Past Paper', icon: ClipboardList, color: '#F59E0B', desc: 'Restricted — hidden from students' },
  { value: 'notes', label: 'Lecture Notes', icon: StickyNote, color: '#8B5CF6', desc: 'Readable by all students' },
];

interface UploadFile {
  file: File;
  status: 'idle' | 'uploading' | 'done' | 'error';
  error?: string;
}

export function LecturerUpload({ isOpen, onClose }: LecturerUploadProps) {
  const { initializeData, addToast } = useEduSynthStore();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState('textbook');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [allDone, setAllDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((incoming: File[]) => {
    const pdfs = incoming.filter((f) => f.type === 'application/pdf' || f.name.endsWith('.pdf') || f.name.endsWith('.txt') || f.name.endsWith('.docx'));
    if (pdfs.length === 0) {
      addToast({ type: 'warning', title: 'Unsupported format', message: 'Please upload PDF, TXT or DOCX files.' });
      return;
    }
    setFiles((prev) => [
      ...prev,
      ...pdfs.map((f) => ({ file: f, status: 'idle' as const })),
    ]);
  }, [addToast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  }, [addFiles]);

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpload = async () => {
    if (!files.length || !subject.trim()) {
      addToast({ type: 'warning', title: 'Missing info', message: 'Add at least one file and a course/subject name.' });
      return;
    }
    setIsUploading(true);

    const fileObjects = files.map((f) => f.file);
    setFiles((prev) => prev.map((f) => ({ ...f, status: 'uploading' })));

    const tierMap: Record<string, string> = {
      textbook: 'public',
      exam: 'restricted',
      notes: 'public',
    };

    try {
      await documentsApi.upload(fileObjects, {
        subject: subject.trim(),
        topic: topic.trim() || undefined,
        autoClassify: false,
        tier: tierMap[category] || 'public',
      });

      setFiles((prev) => prev.map((f) => ({ ...f, status: 'done' })));
      setAllDone(true);
      addToast({ type: 'success', title: 'Upload complete!', message: `${files.length} document(s) added to ${subject}.` });
      await initializeData();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Upload failed';
      setFiles((prev) => prev.map((f) => ({ ...f, status: 'error', error: msg })));
      addToast({ type: 'warning', title: 'Upload failed', message: msg });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFiles([]);
    setSubject('');
    setTopic('');
    setCategory('textbook');
    setAllDone(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed inset-x-4 top-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 z-[90] w-full md:max-w-xl"
          >
            <div className="glass-strong rounded-2xl border border-zinc-700/50 shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#2DD4BF]/10 border border-[#2DD4BF]/20 flex items-center justify-center">
                    <Upload className="w-4 h-4 text-[#2DD4BF]" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-zinc-100">Upload Documents</h2>
                    <p className="text-[10px] text-zinc-500">Add notes, textbooks or past papers for students</p>
                  </div>
                </div>
                <button onClick={handleClose} className="text-zinc-500 hover:text-zinc-200 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                {allDone ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="w-12 h-12 text-[#2DD4BF] mx-auto mb-3" />
                    <p className="text-sm font-semibold text-zinc-100">Upload Successful!</p>
                    <p className="text-xs text-zinc-500 mt-1">Documents are being processed and will appear in the course shortly.</p>
                    <Button onClick={handleClose} className="mt-4 bg-[#2DD4BF]/10 text-[#2DD4BF] hover:bg-[#2DD4BF]/20 border border-[#2DD4BF]/20">
                      Done
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Document Type */}
                    <div>
                      <p className="text-[11px] text-zinc-400 font-medium mb-2 uppercase tracking-widest">Document Type</p>
                      <div className="grid grid-cols-3 gap-2">
                        {CATEGORIES.map((cat) => {
                          const Icon = cat.icon;
                          return (
                            <button
                              key={cat.value}
                              onClick={() => setCategory(cat.value)}
                              className={`p-3 rounded-xl border text-left transition-all ${
                                category === cat.value
                                  ? `bg-[${cat.color}]/10 border-[${cat.color}]/30`
                                  : 'bg-zinc-800/30 border-zinc-700/50 hover:border-zinc-600'
                              }`}
                            >
                              <Icon className="w-4 h-4 mb-1.5" style={{ color: cat.color }} />
                              <p className="text-[11px] font-medium text-zinc-200">{cat.label}</p>
                              <p className="text-[9px] text-zinc-500 mt-0.5">{cat.desc}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Course / Subject */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-zinc-400 font-medium mb-1.5 block uppercase tracking-widest">
                          Course Unit <span className="text-[#EF4444]">*</span>
                        </label>
                        <input
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder="e.g., Data Structures"
                          className="w-full bg-zinc-900/60 border border-zinc-700/50 rounded-xl px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-[#2DD4BF]/40 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-zinc-400 font-medium mb-1.5 block uppercase tracking-widest">
                          Topic (optional)
                        </label>
                        <input
                          value={topic}
                          onChange={(e) => setTopic(e.target.value)}
                          placeholder="e.g., Linked Lists"
                          className="w-full bg-zinc-900/60 border border-zinc-700/50 rounded-xl px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-[#2DD4BF]/40 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Drop Zone */}
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                        isDragging
                          ? 'border-[#2DD4BF]/60 bg-[#2DD4BF]/5'
                          : 'border-zinc-700/50 hover:border-zinc-600 hover:bg-zinc-800/20'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".pdf,.txt,.docx"
                        className="hidden"
                        onChange={(e) => addFiles(Array.from(e.target.files || []))}
                      />
                      <Upload className="w-6 h-6 text-zinc-500 mx-auto mb-2" />
                      <p className="text-sm text-zinc-300 font-medium">Drag & drop files here</p>
                      <p className="text-[10px] text-zinc-600 mt-1">or click to browse — PDF, TXT, DOCX</p>
                    </div>

                    {/* File List */}
                    {files.length > 0 && (
                      <div className="space-y-2">
                        {files.map((f, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-zinc-800/30 border border-zinc-700/30"
                          >
                            <FileText className="w-4 h-4 text-[#2DD4BF] shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-zinc-200 truncate">{f.file.name}</p>
                              <p className="text-[9px] text-zinc-600">{(f.file.size / 1024 / 1024).toFixed(1)} MB</p>
                            </div>
                            {f.status === 'uploading' && <Loader2 className="w-3.5 h-3.5 text-[#2DD4BF] animate-spin shrink-0" />}
                            {f.status === 'done' && <CheckCircle2 className="w-3.5 h-3.5 text-[#2DD4BF] shrink-0" />}
                            {f.status === 'error' && <AlertCircle className="w-3.5 h-3.5 text-[#EF4444] shrink-0" />}
                            {f.status === 'idle' && (
                              <button onClick={() => removeFile(idx)} className="text-zinc-600 hover:text-zinc-300 shrink-0">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Category badge reminder */}
                    {category === 'exam' && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#F59E0B]/5 border border-[#F59E0B]/20">
                        <AlertCircle className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
                        <p className="text-[10px] text-[#F59E0B]">Past papers are restricted — students cannot view or download them.</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-1">
                      <Button variant="ghost" onClick={handleClose} className="flex-1 text-zinc-400 hover:text-zinc-200 border border-zinc-700/50">
                        Cancel
                      </Button>
                      <Button
                        onClick={handleUpload}
                        disabled={!files.length || !subject.trim() || isUploading}
                        className="flex-1 bg-[#2DD4BF]/10 text-[#2DD4BF] hover:bg-[#2DD4BF]/20 border border-[#2DD4BF]/20 disabled:opacity-40"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5 mr-1.5" />
                            Upload {files.length > 0 ? `(${files.length})` : ''}
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
