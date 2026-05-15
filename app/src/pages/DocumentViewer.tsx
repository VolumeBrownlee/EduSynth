import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { documentsApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Download,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Lock,
  FileText,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface DocumentInfo {
  id: string;
  title: string;
  totalPages: number;
  fileUrl: string;
  watermark: {
    text: string;
    opacity: number;
  };
}

export default function DocumentViewer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [document, setDocument] = useState<DocumentInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [showSecurityWarning, setShowSecurityWarning] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchDocument();
  }, [id]);

  // Security: Disable right-click, print, save
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      toast.error('Right-click is disabled for security');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block Ctrl+P (Print)
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        toast.error('Printing is disabled for security');
      }
      // Block Ctrl+S (Save)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        toast.error('Saving is disabled for security');
      }
      // Block Ctrl+C (Copy)
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        toast.error('Copying is disabled for security');
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const fetchDocument = async () => {
    if (!id) return;
    
    try {
      const response = await documentsApi.view(id);
      setDocument(response.data.document);
    } catch (error) {
      toast.error('Failed to load document');
      navigate('/documents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!id) return;
    try {
      const response = await documentsApi.download(id);
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = document?.title || 'document.pdf';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to download document');
    }
  };

  const renderWatermark = useCallback((canvas: HTMLCanvasElement) => {
    if (!document?.watermark || !user) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const watermarkText = `${user.fullName} | ${user.registrationId}`;
    
    ctx.save();
    ctx.globalAlpha = document.watermark.opacity;
    ctx.fillStyle = '#000';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw watermark diagonally across the canvas
    const stepX = 300;
    const stepY = 200;
    
    for (let x = 0; x < canvas.width + stepX; x += stepX) {
      for (let y = 0; y < canvas.height + stepY; y += stepY) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-Math.PI / 4);
        ctx.fillText(watermarkText, 0, 0);
        ctx.restore();
      }
    }

    ctx.restore();
  }, [document?.watermark, user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
        <FileText className="w-16 h-16 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Document not found</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col animate-fade-in">
      {/* Security Warning */}
      {showSecurityWarning && (
        <div className="glass-card mb-4 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Lock className="w-5 h-5 text-amber-400" />
            <div>
              <p className="font-medium">Secure Document Viewer</p>
              <p className="text-sm text-muted-foreground">
                Copy, print, and save are disabled. Watermarked with your credentials.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSecurityWarning(false)}
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Toolbar */}
      <div className="glass-card mb-4 p-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/documents')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="font-semibold">{document.title}</h1>
            <p className="text-sm text-muted-foreground">
              Page {currentPage} of {document.totalPages}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Zoom Controls */}
          <div className="flex items-center space-x-1 glass-card px-2 py-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom(z => Math.max(50, z - 10))}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm w-12 text-center">{zoom}%</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom(z => Math.min(200, z + 10))}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>

          {/* Page Navigation */}
          <div className="flex items-center space-x-1 glass-card px-2 py-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm px-2">
              {currentPage} / {document.totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(document.totalPages, p + 1))}
              disabled={currentPage === document.totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="glass-button"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      {/* Document Viewer */}
      <div 
        ref={containerRef}
        className="flex-1 glass-card overflow-auto pdf-viewer-secure relative"
      >
        <div 
          className="min-h-full flex items-center justify-center p-8"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center top' }}
        >
          {/* PDF Canvas */}
          <canvas
            ref={canvasRef}
            className="bg-white shadow-lg"
            style={{ width: '800px', height: '1131px' }}
          />
          
          {/* Watermark Overlay */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div 
              className="watermark-overlay"
              style={{ opacity: document.watermark.opacity }}
            >
              {Array.from({ length: 20 }).map((_, i) => (
                <span key={i}>{document.watermark.text}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
