import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentsApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Upload,
  FileText,
  Search,
  MoreVertical,
  Eye,
  Download,
  Trash2,
  RefreshCw,
  Filter,
  X,
  Loader2,
  Lock,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';

interface Document {
  id: string;
  title: string;
  tier: 'public' | 'restricted';
  subject: string;
  topic: string;
  difficulty: string;
  fileSize: number;
  totalPages: number;
  wordCount: number;
  isProcessed: boolean;
  processingStatus: string;
  createdAt: string;
}

export default function Documents() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      const params: any = {};
      if (filterTier) params.tier = filterTier;
      if (searchQuery) params.search = searchQuery;
      
      const response = await documentsApi.getAll(params);
      setDocuments(response.data.documents);
    } catch (error) {
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  }, [filterTier, searchQuery]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(e.target.files);
    }
  };

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    setIsUploading(true);
    try {
      const filesArray = Array.from(selectedFiles);
      await documentsApi.upload(filesArray, {
        autoClassify: true
      });
      toast.success('Documents uploaded successfully');
      setUploadDialogOpen(false);
      setSelectedFiles(null);
      fetchDocuments();
    } catch (error) {
      toast.error('Failed to upload documents');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await documentsApi.delete(id);
      setDocuments(prev => prev.filter(d => d.id !== id));
      toast.success('Document deleted');
    } catch (error) {
      toast.error('Failed to delete document');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-emerald-500/20 text-emerald-400';
      case 'intermediate': return 'bg-amber-500/20 text-amber-400';
      case 'advanced': return 'bg-orange-500/20 text-orange-400';
      case 'expert': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-muted-foreground mt-1">
            Browse and manage your study materials
          </p>
        </div>
        
        {user?.role !== 'student' && (
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-button">
                <Upload className="w-4 h-4 mr-2" />
                Upload Documents
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card max-w-md">
              <DialogHeader>
                <DialogTitle>Upload Documents</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.txt,.md"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-sm font-medium">Click to select files</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF, DOC, DOCX, TXT up to 50MB
                    </p>
                  </label>
                </div>
                
                {selectedFiles && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Selected files:</p>
                    {Array.from(selectedFiles).map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded bg-white/5">
                        <span className="text-sm truncate">{file.name}</span>
                        <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFiles || isUploading}
                  className="w-full gradient-button"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Upload'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 glass-input"
          />
        </div>
        
        <select
          value={filterTier}
          onChange={(e) => setFilterTier(e.target.value)}
          className="glass-input px-4 py-2"
        >
          <option value="">All Tiers</option>
          <option value="public">Public</option>
          {user?.role !== 'student' && (
            <option value="restricted">Restricted</option>
          )}
        </select>
      </div>

      {/* Documents Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        </div>
      ) : documents.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No documents found</h3>
            <p className="text-muted-foreground">
              {searchQuery || filterTier
                ? 'Try adjusting your filters'
                : 'Upload some documents to get started'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <Card
              key={doc.id}
              className="glass-card hover:border-cyan-500/30 transition-all cursor-pointer group"
              onClick={() => navigate(`/documents/${doc.id}`)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      doc.tier === 'restricted' ? 'bg-red-500/20' : 'bg-cyan-500/20'
                    }`}>
                      {doc.tier === 'restricted' ? (
                        <Lock className="w-5 h-5 text-red-400" />
                      ) : (
                        <FileText className="w-5 h-5 text-cyan-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold truncate max-w-[150px]">{doc.title}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="secondary" className={`text-xs ${getDifficultyColor(doc.difficulty)}`}>
                          {doc.difficulty}
                        </Badge>
                        {doc.tier === 'restricted' && (
                          <Badge variant="secondary" className="text-xs bg-red-500/20 text-red-400">
                            Restricted
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {user?.role !== 'student' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="glass-card">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/documents/${doc.id}`);
                        }}>
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          documentsApi.download(doc.id);
                        }}>
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        {!doc.isProcessed && (
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            documentsApi.reprocess(doc.id);
                          }}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Reprocess
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(doc.id);
                          }}
                          className="text-red-400"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{doc.totalPages} pages</span>
                  <span>{formatFileSize(doc.fileSize)}</span>
                </div>
                
                {doc.subject && (
                  <div className="mt-3 flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {doc.subject}
                    </Badge>
                    {doc.topic && (
                      <Badge variant="outline" className="text-xs">
                        {doc.topic}
                      </Badge>
                    )}
                  </div>
                )}
                
                {!doc.isProcessed && (
                  <div className="mt-3 flex items-center text-amber-400 text-sm">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
