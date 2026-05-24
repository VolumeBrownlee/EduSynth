import { useEduSynthStore } from '@/store/edusynth-store';
import { documentsApi } from '@/services/api';
import { motion } from 'framer-motion';
import { ChevronLeft, ZoomIn, ZoomOut, Shield, FileText, Eye, Printer, Download, Ban, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState, useCallback, useEffect, useRef } from 'react';

interface SecurePdfViewerProps {
  jumpToPage?: number | null;
  onPageJumpHandled?: () => void;
}

export function SecurePdfViewer({ jumpToPage, onPageJumpHandled }: SecurePdfViewerProps) {
  const { selectedDocument, profile } = useEduSynthStore();

  const [pages, setPages] = useState<string[]>([]);
  const [docTitle, setDocTitle] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlightKey, setHighlightKey] = useState(0);

  // Track last jump so we don't fire twice on the same value
  const prevJumpRef = useRef<number | null | undefined>(null);
  if (jumpToPage !== prevJumpRef.current) {
    prevJumpRef.current = jumpToPage;
    if (jumpToPage != null && jumpToPage > 0 && jumpToPage <= pages.length) {
      setCurrentPage(jumpToPage - 1);
      setHighlightKey((k) => k + 1);
    }
  }

  // Notify parent after jump
  useEffect(() => {
    if (highlightKey > 0) onPageJumpHandled?.();
  }, [highlightKey, onPageJumpHandled]);

  useEffect(() => {
    if (highlightKey > 0) {
      const t = setTimeout(() => setHighlightKey(0), 1500);
      return () => clearTimeout(t);
    }
  }, [highlightKey]);

  // Fetch document content when selection changes
  useEffect(() => {
    if (!selectedDocument) {
      setPages([]);
      setDocTitle('');
      setCurrentPage(0);
      return;
    }

    setIsLoading(true);
    setError(null);
    setCurrentPage(0);

    (documentsApi.getContent(selectedDocument.id) as any)
      .then((res: any) => {
        const data = res?.data?.data ?? res?.data ?? res;
        const fetchedPages: string[] = data?.pages ?? [];
        setPages(fetchedPages.length > 0 ? fetchedPages : ['No readable content found.']);
        setDocTitle(data?.title ?? selectedDocument.title);
      })
      .catch(() => {
        setError('Could not load document content. The file may still be processing.');
        setPages(['Document content unavailable.']);
        setDocTitle(selectedDocument.title);
      })
      .finally(() => setIsLoading(false));
  }, [selectedDocument?.id]);

  // Anti-download protections
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ['s', 'p', 'u'].includes(e.key.toLowerCase())) e.preventDefault();
    };
    const handleContextMenu = (e: MouseEvent) => {
      const viewer = document.getElementById('secure-pdf-viewer');
      if (viewer?.contains(e.target as Node)) e.preventDefault();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  const handleZoomIn = useCallback(() => setZoom((z) => Math.min(z + 25, 200)), []);
  const handleZoomOut = useCallback(() => setZoom((z) => Math.max(z - 25, 50)), []);
  const goToPage = useCallback((p: number) => setCurrentPage(p), []);

  const totalPages = pages.length;
  const highlightActive = highlightKey > 0;
  const page = pages[currentPage] ?? '';

  return (
    <Card className="card-elevated border-border overflow-hidden h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-foreground truncate max-w-[200px] font-medium">
              {selectedDocument ? docTitle || selectedDocument.title : 'Select a document'}
            </p>
            <p className="text-2xs text-muted-foreground">
              {totalPages} page{totalPages !== 1 ? 's' : ''} • {selectedDocument?.category || 'textbook'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={handleZoomOut}
            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted" title="Zoom Out">
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          <span className="text-2xs text-muted-foreground w-10 text-center tabular-nums font-medium">{zoom}%</span>
          <Button variant="ghost" size="icon" onClick={handleZoomIn}
            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted" title="Zoom In">
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
          <div className="w-px h-4 bg-muted mx-1" />
          <Button variant="ghost" size="icon" onClick={() => goToPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0 || totalPages === 0}
            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30" title="Previous Page">
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>
          <span className="text-2xs text-muted-foreground tabular-nums font-medium px-1">
            {totalPages > 0 ? `${currentPage + 1} / ${totalPages}` : '—'}
          </span>
          <Button variant="ghost" size="icon" onClick={() => goToPage(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage >= totalPages - 1 || totalPages === 0}
            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30" title="Next Page">
            <ChevronLeft className="w-3.5 h-3.5 rotate-180" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-accent/10 text-accent border-accent/20 text-2xs px-2 py-0.5 h-5">
            <Eye className="w-2.5 h-2.5 mr-1" />
            Protected
          </Badge>
        </div>
      </div>

      {/* Security Banner */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/5 border-b border-accent/10 shrink-0">
        <Shield className="w-3 h-3 text-accent shrink-0" />
        <span className="text-2xs text-accent/80 truncate">
          Protected Document — Right-click, Save, and Print disabled. Watermark: {profile?.full_name} — {profile?.id?.slice(0, 8).toUpperCase()}
        </span>
        <div className="flex items-center gap-1 ml-auto shrink-0">
          <Ban className="w-2.5 h-2.5 text-accent/40" />
          <Printer className="w-2.5 h-2.5 text-accent/40" />
          <Download className="w-2.5 h-2.5 text-accent/40" />
        </div>
      </div>

      {/* Document Canvas */}
      <div
        id="secure-pdf-viewer"
        className="relative no-select overflow-auto bg-background/80 flex-1"
        style={{ minHeight: '400px' }}
      >
        {/* Watermark */}
        <div className="watermark-text" style={{ fontSize: '3rem' }}>
          {profile?.full_name} — {profile?.id?.slice(0, 8).toUpperCase()}
        </div>
        <div className="watermark-overlay" />

        {/* Jump-to-page highlight overlay */}
        {highlightActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 pointer-events-none border-2 border-primary/50 rounded-sm"
            style={{ boxShadow: 'inset 0 0 30px rgba(45, 212, 191, 0.15)' }}
          />
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
            <p className="text-sm text-muted-foreground">Loading document...</p>
          </div>
        )}

        {/* No document selected */}
        {!selectedDocument && !isLoading && (
          <div className="flex flex-col items-center justify-center h-64 text-center px-8">
            <FileText className="w-10 h-10 text-muted-foreground/60 mb-3" />
            <p className="text-sm text-muted-foreground font-medium">No document selected</p>
            <p className="text-xs text-muted-foreground mt-1">Choose a document from the course to start reading</p>
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center h-32 text-center px-8">
            <p className="text-xs text-destructive/70">{error}</p>
          </div>
        )}

        {/* Document content */}
        {!isLoading && selectedDocument && pages.length > 0 && (
          <motion.div
            key={`${selectedDocument.id}-${currentPage}`}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="relative p-6 md:p-10 max-w-3xl mx-auto"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
          >
            <div className="prose prose-invert prose-sm max-w-none">
              <div className="flex items-center gap-2 mb-5">
                <h2 className="text-base font-bold text-primary tracking-tight leading-tight m-0">
                  {docTitle || selectedDocument.title}
                </h2>
                <Badge className="bg-muted text-muted-foreground border-border text-2xs shrink-0">
                  Page {currentPage + 1}
                </Badge>
              </div>
              <div className={`whitespace-pre-wrap text-foreground text-sm leading-relaxed font-mono rounded-xl p-6 border transition-colors duration-500 ${
                highlightActive
                  ? 'bg-primary/5 border-primary/30'
                  : 'bg-muted/30 border-border'
              }`}>
                {page}
              </div>
            </div>
          </motion.div>
        )}

        {/* Page corner */}
        {totalPages > 0 && (
          <div className="absolute bottom-3 right-3 card-elevated rounded-md px-2 py-1 text-2xs text-muted-foreground tabular-nums">
            {currentPage + 1} / {totalPages}
          </div>
        )}
      </div>
    </Card>
  );
}
