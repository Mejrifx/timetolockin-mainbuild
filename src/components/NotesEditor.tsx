import { useState, useCallback, useEffect, useMemo } from 'react';
import { Page, NoteMetadata } from '@/types';
import { 
  Tag, 
  X,
  Plus,
  Trash2,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface NotesEditorProps {
  page: Page;
  onUpdatePage: (pageId: string, updates: Partial<Page>) => void;
  onDeletePage?: (pageId: string) => void;
}

const NOTE_COLORS = [
  { name: 'Default', value: undefined, class: 'bg-zinc-900/50 hover:bg-zinc-900/70', ringClass: 'ring-zinc-700' },
  { name: 'Blue', value: 'blue', class: 'bg-blue-950/40 hover:bg-blue-950/60', ringClass: 'ring-blue-700' },
  { name: 'Purple', value: 'purple', class: 'bg-purple-950/40 hover:bg-purple-950/60', ringClass: 'ring-purple-700' },
  { name: 'Green', value: 'green', class: 'bg-emerald-950/40 hover:bg-emerald-950/60', ringClass: 'ring-emerald-700' },
  { name: 'Orange', value: 'orange', class: 'bg-orange-950/40 hover:bg-orange-950/60', ringClass: 'ring-orange-700' },
];

export const NotesEditor = ({ page, onUpdatePage, onDeletePage }: NotesEditorProps) => {
  const [title, setTitle] = useState(page.title);
  const [content, setContent] = useState(page.content);
  const [newTag, setNewTag] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Initialize note metadata if it doesn't exist
  const noteMetadata: NoteMetadata = useMemo(() => ({
    tags: page.noteMetadata?.tags || [],
    color: page.noteMetadata?.color,
    isPinned: false,
    lastEditedAt: page.noteMetadata?.lastEditedAt || Date.now(),
    wordCount: page.noteMetadata?.wordCount || 0,
    readingTime: page.noteMetadata?.readingTime || 0,
  }), [page.noteMetadata]);

  // Calculate word count and reading time
  const calculateMetrics = useCallback((text: string) => {
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    const readingTime = Math.ceil(wordCount / 200); // Average reading speed: 200 words/min
    return { wordCount, readingTime };
  }, []);

  // Auto-save logic with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (title !== page.title || content !== page.content) {
        handleSave();
      }
    }, 1000); // Auto-save after 1 second of inactivity

    return () => clearTimeout(timeoutId);
  }, [title, content]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    const metrics = calculateMetrics(content);
    
    onUpdatePage(page.id, {
      title,
      content,
      noteMetadata: {
        ...noteMetadata,
        ...metrics,
        lastEditedAt: Date.now(),
      },
    });

    setLastSaved(new Date());
    setTimeout(() => setIsSaving(false), 500);
  }, [title, content, noteMetadata, page.id, onUpdatePage, calculateMetrics]);

  const handleAddTag = useCallback(() => {
    if (newTag.trim() && !noteMetadata.tags.includes(newTag.trim())) {
      const updatedTags = [...noteMetadata.tags, newTag.trim()];
      onUpdatePage(page.id, {
        noteMetadata: {
          ...noteMetadata,
          tags: updatedTags,
        },
      });
      setNewTag('');
    }
  }, [newTag, noteMetadata, page.id, onUpdatePage]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    const updatedTags = noteMetadata.tags.filter(tag => tag !== tagToRemove);
    onUpdatePage(page.id, {
      noteMetadata: {
        ...noteMetadata,
        tags: updatedTags,
      },
    });
  }, [noteMetadata, page.id, onUpdatePage]);

  const handleChangeColor = useCallback((color: string | undefined) => {
    onUpdatePage(page.id, {
      noteMetadata: {
        ...noteMetadata,
        color,
      },
    });
  }, [noteMetadata, page.id, onUpdatePage]);

  const handleDelete = useCallback(() => {
    if (window.confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      onDeletePage?.(page.id);
    }
  }, [page.id, onDeletePage]);

  const currentColor = NOTE_COLORS.find(c => c.value === noteMetadata.color) || NOTE_COLORS[0];
  const metrics = calculateMetrics(content);

  return (
    <div className="h-full flex flex-col performance-critical">
      {/* Modern, Clean Content Area */}
      <div className="flex-1 overflow-y-auto scroll-optimized">
        <div className="max-w-4xl mx-auto px-6 md:px-12 py-8">
          
          {/* Title Section */}
          <div className="mb-8">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled note"
              className="text-4xl font-bold bg-transparent border-none text-white placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-auto py-0 text-performance mb-2"
              style={{ color: 'white' }}
            />
            
            {/* Subtle metadata */}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>{metrics.wordCount} words</span>
              <span>•</span>
              <span>{metrics.readingTime} min read</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                {isSaving ? (
                  <>
                    <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse" />
                    Saving...
                  </>
                ) : lastSaved ? (
                  <>
                    <Check className="h-3 w-3 text-green-500" />
                    Saved
                  </>
                ) : (
                  <>Auto-save enabled</>
                )}
              </span>
            </div>
          </div>

          {/* Tags Section - Compact & Modern */}
          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-2">
              {noteMetadata.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-sm text-green-400 hover:bg-green-500/20 transition-colors group"
                >
                  <Tag className="h-3 w-3" />
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              
              {/* Add tag inline */}
              <div className="inline-flex items-center gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Add tag..."
                  className="h-8 w-32 bg-transparent border border-green-500/20 text-white placeholder:text-gray-400 text-sm focus:w-40 transition-all text-performance"
                  style={{ color: 'white' }}
                />
                {newTag && (
                  <Button
                    onClick={handleAddTag}
                    size="sm"
                    className="h-8 w-8 p-0 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20"
                  >
                    <Plus className="h-4 w-4 text-green-400" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Note Content - Lined Paper Effect */}
          <div className={cn(
            "rounded-xl border-2 border-green-500/30 shadow-xl overflow-hidden transition-all",
            "bg-gradient-to-br from-green-950/30 to-green-900/20",
            "focus-within:border-green-500/50 focus-within:shadow-2xl focus-within:shadow-green-500/20"
          )}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start writing your note..."
              className="w-full min-h-[calc(100vh-400px)] bg-transparent px-8 text-white placeholder:text-gray-500 focus:outline-none resize-none text-base text-performance scroll-optimized"
              style={{
                contain: 'layout style',
                willChange: 'contents',
                fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                lineHeight: '32px',
                paddingTop: '22px',
                paddingBottom: '22px',
                backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, rgba(34, 197, 94, 0.15) 31px, rgba(34, 197, 94, 0.15) 32px)',
                backgroundSize: '100% 32px',
                backgroundAttachment: 'local',
                backgroundPositionY: '22px',
              }}
            />
          </div>

          {/* Bottom Actions */}
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-white">Color:</span>
              {NOTE_COLORS.map((color) => (
                <button
                  key={color.name}
                  onClick={() => handleChangeColor(color.value)}
                  className={cn(
                    "h-6 w-6 rounded-lg transition-all hover:scale-110",
                    color.class,
                    noteMetadata.color === color.value && `ring-2 ${color.ringClass}`
                  )}
                  title={color.name}
                />
              ))}
            </div>
            
            <Button
              onClick={handleDelete}
              variant="ghost"
              size="sm"
              className="text-white hover:text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Note
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
