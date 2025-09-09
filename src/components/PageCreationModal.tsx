import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, FileText, Image, Video, Music, Code, BookOpen, Calendar, Heart, Star, Zap, Target, Lightbulb } from 'lucide-react';

interface PageCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePage: (title: string, icon: string) => void;
}

const pageIcons = [
  { value: 'document', label: 'Document', icon: FileText },
  { value: 'image', label: 'Image', icon: Image },
  { value: 'video', label: 'Video', icon: Video },
  { value: 'music', label: 'Music', icon: Music },
  { value: 'code', label: 'Code', icon: Code },
  { value: 'book', label: 'Book', icon: BookOpen },
  { value: 'calendar', label: 'Calendar', icon: Calendar },
  { value: 'heart', label: 'Heart', icon: Heart },
  { value: 'star', label: 'Star', icon: Star },
  { value: 'zap', label: 'Zap', icon: Zap },
  { value: 'target', label: 'Target', icon: Target },
  { value: 'lightbulb', label: 'Lightbulb', icon: Lightbulb },
];

export const PageCreationModal: React.FC<PageCreationModalProps> = ({
  isOpen,
  onClose,
  onCreatePage
}) => {
  const [title, setTitle] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('document');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) return;
    
    setIsCreating(true);
    try {
      await onCreatePage(title.trim(), selectedIcon);
      setTitle('');
      setSelectedIcon('document');
      onClose();
    } catch (error) {
      console.error('Error creating page:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isCreating) {
      handleCreate();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black/80 backdrop-blur-xl border border-green-500/20 rounded-2xl p-8 w-full max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Create New Page</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-green-500/20"
          >
            <X className="h-4 w-4 text-gray-400" />
          </Button>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Page Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Page Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter page title..."
              className="bg-black/40 border-green-500/20 text-white placeholder:text-gray-500 focus:border-green-500/60"
              autoFocus
            />
          </div>

          {/* Icon Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Page Icon</label>
            <Select value={selectedIcon} onValueChange={setSelectedIcon}>
              <SelectTrigger className="bg-black/40 border-green-500/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black/80 backdrop-blur-xl border border-green-500/20">
                {pageIcons.map((icon) => {
                  const IconComponent = icon.icon;
                  return (
                    <SelectItem
                      key={icon.value}
                      value={icon.value}
                      className="text-white hover:bg-green-500/20 focus:bg-green-500/20"
                    >
                      <div className="flex items-center gap-3">
                        <IconComponent className="h-4 w-4 text-green-400" />
                        <span>{icon.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Preview</label>
            <div className="bg-black/20 backdrop-blur-xl rounded-lg border border-green-500/20 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg border border-green-500/20">
                  {React.createElement(pageIcons.find(i => i.value === selectedIcon)?.icon || FileText, {
                    className: "h-5 w-5 text-green-400"
                  })}
                </div>
                <span className="text-white font-medium">
                  {title || 'Untitled'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-8">
          <Button
            variant="ghost"
            onClick={onClose}
            className="flex-1 bg-black/20 hover:bg-black/40 text-gray-300 hover:text-white"
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!title.trim() || isCreating}
            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? 'Creating...' : 'Create Page'}
          </Button>
        </div>
      </div>
    </div>
  );
};
