import { useState, useCallback, useEffect, useMemo } from 'react';
import { Page, NoteMetadata } from '@/types';
import { 
  FileText, 
  Tag, 
  Clock, 
  BookOpen, 
  Pin, 
  PinOff,
  Palette,
  Save,
  MoreVertical,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NotesEditorProps {
  page: Page;
  onUpdatePage: (pageId: string, updates: Partial<Page>) => void;
  onDeletePage?: (pageId: string) => void;
}

const NOTE_COLORS = [
  { name: 'Default', value: undefined, bg: 'bg-gray-900/50', border: 'border-gray-700' },
  { name: 'Blue', value: 'blue', bg: 'bg-blue-900/30', border: 'border-blue-700/50' },
  { name: 'Green', value: 'green', bg: 'bg-green-900/30', border: 'border-green-700/50' },
  { name: 'Purple', value: 'purple', bg: 'bg-purple-900/30', border: 'border-purple-700/50' },
  { name: 'Orange', value: 'orange', bg: 'bg-orange-900/30', border: 'border-orange-700/50' },
  { name: 'Pink', value: 'pink', bg: 'bg-pink-900/30', border: 'border-pink-700/50' },
  { name: 'Yellow', value: 'yellow', bg: 'bg-yellow-900/30', border: 'border-yellow-700/50' },
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
    isPinned: page.noteMetadata?.isPinned || false,
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

  const handleTogglePin = useCallback(() => {
    onUpdatePage(page.id, {
      noteMetadata: {
        ...noteMetadata,
        isPinned: !noteMetadata.isPinned,
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
    <div className="h-full flex flex-col bg-black performance-critical">
      {/* Header */}
      <div className={cn(
        "border-b border-green-500/20 performance-blur sticky top-0 z-10",
        currentColor.bg,
        currentColor.border
      )}>
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-green-400" />
              <div>
                <h2 className="text-sm font-medium text-green-400">Note</h2>
                <p className="text-xs text-gray-400">Professional note-taking</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Auto-save indicator */}
              <div className="flex items-center gap-2 text-xs text-gray-400">
                {isSaving ? (
                  <>
                    <Save className="h-3 w-3 animate-pulse" />
                    <span>Saving...</span>
                  </>
                ) : lastSaved ? (
                  <>
                    <Clock className="h-3 w-3" />
                    <span>Saved {lastSaved.toLocaleTimeString()}</span>
                  </>
                ) : null}
              </div>

              {/* Pin button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleTogglePin}
                className={cn(
                  "h-8 w-8 p-0",
                  noteMetadata.isPinned ? "text-yellow-400 hover:text-yellow-300" : "text-gray-400 hover:text-white"
                )}
                title={noteMetadata.isPinned ? "Unpin note" : "Pin note"}
              >
                {noteMetadata.isPinned ? <Pin className="h-4 w-4" /> : <PinOff className="h-4 w-4" />}
              </Button>

              {/* More options */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-2">
                    <p className="text-xs font-medium text-gray-400 mb-2">Note Color</p>
                    <div className="grid grid-cols-4 gap-2">
                      {NOTE_COLORS.map((color) => (
                        <button
                          key={color.name}
                          onClick={() => handleChangeColor(color.value)}
                          className={cn(
                            "h-6 w-6 rounded border-2 transition-all",
                            color.bg,
                            noteMetadata.color === color.value ? color.border : "border-transparent",
                            "hover:scale-110"
                          )}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Note
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Title Input */}
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title..."
            className="text-2xl font-bold bg-transparent border-none text-white placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-auto py-2 text-performance"
          />

          {/* Metadata Bar */}
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              <span>{metrics.wordCount} words</span>
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              <span>{metrics.readingTime} min read</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Last edited {new Date(noteMetadata.lastEditedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto scroll-optimized">
        <div className="max-w-5xl mx-auto px-6 py-6">
          {/* Tags Section */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="h-4 w-4 text-green-400" />
              <span className="text-sm font-medium text-green-400">Tags</span>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {noteMetadata.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-full text-sm text-green-400"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:text-red-400 transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add a tag..."
                className="flex-1 h-9 bg-black/40 border-green-500/30 text-white placeholder:text-gray-500 text-performance"
              />
              <Button
                onClick={handleAddTag}
                variant="outline"
                size="sm"
                className="border-green-500/30 hover:bg-green-500/10 text-green-400"
              >
                Add
              </Button>
            </div>
          </div>

          {/* Note Content */}
          <div className="mb-6">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start writing your note..."
              className="w-full min-h-[600px] bg-transparent border border-green-500/20 rounded-lg px-4 py-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/30 resize-none font-mono text-sm leading-relaxed text-performance scroll-optimized"
              style={{
                contain: 'layout style',
                willChange: 'contents',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
