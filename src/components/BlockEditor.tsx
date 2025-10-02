import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Type, 
  Heading1, 
  Heading2, 
  Heading3, 
  Image, 
  Video, 
  Table,
  GripVertical,
  Trash2,
  Upload
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Block } from '@/types';
import { cn } from '@/lib/utils';
import { uploadFileToStorage } from '@/lib/media';

interface BlockEditorProps {
  blocks: Block[];
  onUpdateBlocks: (blocks: Block[]) => void;
}

interface BlockComponentProps {
  block: Block;
  onUpdate: (block: Block) => void;
  onDelete: (blockId: string) => void;
  onAddBlock: (afterBlockId: string, type: Block['type']) => void;
}

const SortableBlockComponent = ({ block, onUpdate, onDelete, onAddBlock }: BlockComponentProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [localContent, setLocalContent] = useState(block.content);
  const [isActive, setIsActive] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync local content with block content when block changes
  useEffect(() => {
    setLocalContent(block.content);
  }, [block.id, block.content]);

  // Debounced content update
  const handleContentChange = useCallback((content: string) => {
    setLocalContent(content);
    
    // Clear existing timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Set new timeout for debounced update
    debounceRef.current = setTimeout(() => {
      onUpdate({ ...block, content });
    }, 300); // 300ms debounce
  }, [block, onUpdate]);

  // Auto-resize textarea function
  const autoResizeTextarea = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, []);

  // Auto-resize on local content change (not block.content)
  useEffect(() => {
    if (block.type === 'text') {
      autoResizeTextarea();
    }
  }, [localContent, block.type, autoResizeTextarea]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      console.log('No file selected');
      return;
    }
    
    console.log('🔄 Starting file upload:', file.name, 'Type:', file.type, 'Size:', file.size);
    
    try {
      const uploaded = await uploadFileToStorage(file);
      console.log('✅ File uploaded successfully:', uploaded);
      
      onUpdate({
        ...block,
        content: file.name,
        data: { url: uploaded.url, type: uploaded.mimeType, path: uploaded.path },
      });
      
      console.log('✅ Block updated with uploaded file data');
    } catch (err) {
      console.error('❌ Media upload failed:', err);
      // Show user-friendly error message
      alert(`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const renderBlock = () => {
    switch (block.type) {
      case 'text':
        return (
          <Textarea
            ref={textareaRef}
            value={localContent}
            onChange={(e) => {
              handleContentChange(e.target.value);
            }}
            onInput={autoResizeTextarea}
            placeholder="Start writing..."
            className="min-h-[40px] border-0 p-4 bg-black/20 backdrop-blur-xl resize-none focus-visible:ring-0 text-base leading-7 w-full text-white placeholder:text-gray-400 focus:bg-black/30 transition-all duration-300 shadow-sm border border-green-500/20 rounded-lg overflow-hidden"
            data-block-id={block.id}
            style={{ height: 'auto' }}
          />
        );

      case 'header':
        const headerLevel = block.data?.level || 1;
        const headerClasses: Record<number, string> = {
          1: 'text-3xl font-bold',
          2: 'text-2xl font-semibold',
          3: 'text-xl font-medium'
        };
        const headerClass = headerClasses[headerLevel as number] || 'text-xl font-medium';

        return (
          <Input
            value={localContent}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder={`Heading ${headerLevel}`}
            className={cn(
              "p-4 bg-black/20 backdrop-blur-xl focus-visible:ring-0 focus-visible:ring-offset-0 w-full text-white placeholder:text-gray-400 focus:bg-black/30 transition-all duration-300 shadow-sm border border-green-500/20 rounded-lg h-auto overflow-hidden leading-tight",
              headerClass
            )}
            data-block-id={block.id}
            style={{ height: 'auto' }}
          />
        );

      case 'image':
        return (
          <div className="space-y-4 p-4 bg-black/20 backdrop-blur-xl rounded-lg border border-green-500/20 shadow-lg">
            {block.data?.url ? (
              <div className="relative">
                <img 
                  src={block.data.url} 
                  alt={block.content || 'Uploaded image'}
                  className="max-w-full h-auto rounded-lg border border-green-500/20 shadow-lg"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => imageInputRef.current?.click()}
                  className="absolute top-2 right-2 bg-black/60 backdrop-blur-xl border-green-500/30 hover:bg-black/80 text-white shadow-lg"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Change
                </Button>
              </div>
            ) : (
              <div 
                onClick={() => imageInputRef.current?.click()}
                className="border-2 border-dashed border-green-500/30 rounded-lg p-8 text-center cursor-pointer hover:border-green-500/50 transition-all duration-300 bg-black/10 backdrop-blur-xl hover:bg-black/20"
              >
                <Image className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-300">Click to upload an image</p>
              </div>
            )}
            <Input
              value={block.content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Image caption (optional)"
              className="border-0 p-0 bg-transparent focus-visible:ring-0 text-sm text-gray-300 placeholder:text-gray-500"
            />
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        );

      case 'video':
        return (
          <div className="space-y-4 p-4 bg-black/20 backdrop-blur-xl rounded-lg border border-green-500/20 shadow-lg">
            {block.data?.url ? (
              <div className="relative">
                <video 
                  src={block.data.url} 
                  controls
                  className="max-w-full h-auto rounded-lg border border-green-500/20 shadow-lg"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => videoInputRef.current?.click()}
                  className="absolute top-2 right-2 bg-black/60 backdrop-blur-xl border-green-500/30 hover:bg-black/80 text-white shadow-lg"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Change
                </Button>
              </div>
            ) : (
              <div 
                onClick={() => videoInputRef.current?.click()}
                className="border-2 border-dashed border-green-500/30 rounded-lg p-8 text-center cursor-pointer hover:border-green-500/50 transition-all duration-300 bg-black/10 backdrop-blur-xl hover:bg-black/20"
              >
                <Video className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-300">Click to upload a video</p>
              </div>
            )}
            <Input
              value={block.content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Video caption (optional)"
              className="border-0 p-0 bg-transparent focus-visible:ring-0 text-sm text-gray-300 placeholder:text-gray-500"
            />
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        );

      case 'table':
        const tableData = block.data || { rows: 3, cols: 3, cells: {} };
        return (
          <div className="space-y-4 p-4 bg-black/20 backdrop-blur-xl rounded-lg border border-green-500/20 shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full border border-green-500/20 rounded-lg bg-black/20 backdrop-blur-xl shadow-sm">
                <tbody>
                  {Array.from({ length: tableData.rows }, (_, rowIndex) => (
                    <tr key={rowIndex}>
                      {Array.from({ length: tableData.cols }, (_, colIndex) => (
                        <td key={colIndex} className="border border-green-500/20 p-2">
                          <Input
                            value={tableData.cells[`${rowIndex}-${colIndex}`] || ''}
                            onChange={(e) => {
                              const newCells = { ...tableData.cells };
                              newCells[`${rowIndex}-${colIndex}`] = e.target.value;
                              onUpdate({
                                ...block,
                                data: { ...tableData, cells: newCells }
                              });
                            }}
                            className="border-0 p-2 bg-black/20 backdrop-blur-xl focus-visible:ring-0 text-white placeholder:text-gray-400 focus:bg-black/30 shadow-sm"
                            placeholder={rowIndex === 0 ? `Column ${colIndex + 1}` : ''}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onUpdate({
                    ...block,
                    data: { ...tableData, rows: tableData.rows + 1 }
                  });
                }}
                className="bg-black/20 backdrop-blur-xl border-green-500/30 hover:bg-black/30 text-white shadow-sm"
              >
                Add Row
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onUpdate({
                    ...block,
                    data: { ...tableData, cols: tableData.cols + 1 }
                  });
                }}
                className="bg-black/20 backdrop-blur-xl border-green-500/30 hover:bg-black/30 text-white shadow-sm"
              >
                Add Column
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative transition-all duration-200 m-0",
        isDragging && "opacity-50 z-50"
      )}
    >
      <div className="flex items-start">
        {/* Block controls - visible when block is active (clicked/focused) */}
        <div className={cn(
          "flex flex-col gap-1.5 shrink-0 transition-all duration-200",
          isActive ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
        )}>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 bg-black/60 border border-green-500/30 hover:bg-black/80 hover:border-green-500/50 backdrop-blur-xl text-white hover:scale-105 transition-all duration-200 cursor-grab active:cursor-grabbing"
            title="Drag to reorder"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 bg-black/60 border border-green-500/30 hover:bg-green-500/30 hover:border-green-500/50 backdrop-blur-xl text-white hover:scale-105 transition-all duration-200"
                title="Add block below"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="right" className="bg-black/90 backdrop-blur-xl border-green-500/30 shadow-xl">
              <DropdownMenuItem onClick={() => onAddBlock(block.id, 'text')} className="hover:bg-green-500/10 text-white cursor-pointer">
                <Type className="h-4 w-4 mr-2" />
                Text
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddBlock(block.id, 'header')} className="hover:bg-green-500/10 text-white cursor-pointer">
                <Heading1 className="h-4 w-4 mr-2" />
                Heading 1
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddBlock(block.id, 'header')} className="hover:bg-green-500/10 text-white cursor-pointer">
                <Heading2 className="h-4 w-4 mr-2" />
                Heading 2
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddBlock(block.id, 'header')} className="hover:bg-green-500/10 text-white cursor-pointer">
                <Heading3 className="h-4 w-4 mr-2" />
                Heading 3
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddBlock(block.id, 'image')} className="hover:bg-green-500/10 text-white cursor-pointer">
                <Image className="h-4 w-4 mr-2" />
                Image
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddBlock(block.id, 'video')} className="hover:bg-green-500/10 text-white cursor-pointer">
                <Video className="h-4 w-4 mr-2" />
                Video
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddBlock(block.id, 'table')} className="hover:bg-green-500/10 text-white cursor-pointer">
                <Table className="h-4 w-4 mr-2" />
                Table
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 bg-black/60 border border-green-500/30 hover:bg-red-500/30 hover:border-red-500/50 backdrop-blur-xl text-white hover:scale-105 transition-all duration-200"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(block.id);
            }}
            title="Delete block"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Block content */}
        <div 
          className={cn(
            "flex-1 transition-all duration-200 cursor-text",
            isActive 
              ? "border border-green-500/40 rounded-lg shadow-lg shadow-green-500/10" 
              : "border border-transparent hover:border-green-500/20 rounded-lg"
          )}
          onClick={() => setIsActive(true)}
          onFocus={() => setIsActive(true)}
          onBlur={(e) => {
            // Only deactivate if clicking outside the entire block
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setIsActive(false);
            }
          }}
        >
          {renderBlock()}
        </div>
      </div>
    </div>
  );
};

export const BlockEditor = ({ blocks, onUpdateBlocks }: BlockEditorProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const createBlock = (type: Block['type'], afterBlockId?: string): Block => {
    const newBlock: Block = {
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      content: '',
      order: blocks.length,
      data: type === 'header' ? { level: 1 } : type === 'table' ? { rows: 3, cols: 3, cells: {} } : undefined
    };

    if (afterBlockId) {
      const afterIndex = blocks.findIndex(b => b.id === afterBlockId);
      newBlock.order = afterIndex + 1;
    }

    return newBlock;
  };

  const handleUpdateBlock = (updatedBlock: Block) => {
    console.log('🔄 BlockEditor: Updating block:', updatedBlock.id, 'Type:', updatedBlock.type);
    const newBlocks = blocks.map(block => 
      block.id === updatedBlock.id ? updatedBlock : block
    );
    console.log('📝 BlockEditor: New blocks array:', newBlocks);
    onUpdateBlocks(newBlocks);
  };

  const handleDeleteBlock = (blockId: string) => {
    const newBlocks = blocks.filter(block => block.id !== blockId);
    // Reorder remaining blocks
    newBlocks.forEach((block, index) => {
      block.order = index;
    });
    onUpdateBlocks(newBlocks);
  };

  const handleAddBlock = (afterBlockId: string, type: Block['type'] = 'text') => {
    const newBlock = createBlock(type, afterBlockId);
    const afterIndex = blocks.findIndex(b => b.id === afterBlockId);
    const newBlocks = [...blocks];
    newBlocks.splice(afterIndex + 1, 0, newBlock);
    
    // Reorder blocks
    newBlocks.forEach((block, index) => {
      block.order = index;
    });
    
    onUpdateBlocks(newBlocks);
  };

  const handleAddFirstBlock = (type: Block['type'] = 'text') => {
    const newBlock = createBlock(type);
    onUpdateBlocks([...blocks, newBlock]);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = blocks.findIndex(block => block.id === active.id);
      const newIndex = blocks.findIndex(block => block.id === over?.id);

    const newBlocks = arrayMove(blocks, oldIndex, newIndex);
      
      // Update order property for all blocks
      newBlocks.forEach((block, index) => {
        block.order = index;
      });

      onUpdateBlocks(newBlocks);
    }
  };

  if (blocks.length === 0) {
    return (
      <div className="py-12 text-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="lg"
              className="text-white hover:text-white border border-dashed border-green-500/30 hover:border-green-500/50 px-8 py-6 bg-black/20 backdrop-blur-xl hover:bg-black/30 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            >
              <Plus className="h-5 w-5 mr-3" />
              Click to add your first block
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="bg-black/90 backdrop-blur-xl border-green-500/30 shadow-xl">
            <DropdownMenuItem onClick={() => handleAddFirstBlock('text')} className="hover:bg-green-500/10 text-white">
              <Type className="h-4 w-4 mr-2" />
              Text
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAddFirstBlock('header')} className="hover:bg-green-500/10 text-white">
              <Heading1 className="h-4 w-4 mr-2" />
              Heading 1
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAddFirstBlock('image')} className="hover:bg-green-500/10 text-white">
              <Image className="h-4 w-4 mr-2" />
              Image
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAddFirstBlock('video')} className="hover:bg-green-500/10 text-white">
              <Video className="h-4 w-4 mr-2" />
              Video
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAddFirstBlock('table')} className="hover:bg-green-500/10 text-white">
              <Table className="h-4 w-4 mr-2" />
              Table
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-0">
        <SortableContext items={sortedBlocks.map(block => block.id)} strategy={verticalListSortingStrategy}>
          {sortedBlocks.map(block => (
            <SortableBlockComponent
              key={block.id}
              block={block}
              onUpdate={handleUpdateBlock}
              onDelete={handleDeleteBlock}
              onAddBlock={handleAddBlock}
            />
          ))}
        </SortableContext>
        
        {/* Final add block button */}
        <div className="flex justify-center py-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="text-white hover:text-white border border-dashed border-green-500/30 hover:border-green-500/50 px-6 py-3 bg-black/20 backdrop-blur-xl hover:bg-black/30 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add a block
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="bg-black/90 backdrop-blur-xl border-green-500/30 shadow-xl">
              <DropdownMenuItem onClick={() => handleAddFirstBlock('text')} className="hover:bg-green-500/10 text-white">
                <Type className="h-4 w-4 mr-2" />
                Text
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddFirstBlock('header')} className="hover:bg-green-500/10 text-white">
                <Heading1 className="h-4 w-4 mr-2" />
                Heading 1
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddFirstBlock('image')} className="hover:bg-green-500/10 text-white">
                <Image className="h-4 w-4 mr-2" />
                Image
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddFirstBlock('video')} className="hover:bg-green-500/10 text-white">
                <Video className="h-4 w-4 mr-2" />
                Video
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddFirstBlock('table')} className="hover:bg-green-500/10 text-white">
                <Table className="h-4 w-4 mr-2" />
                Table
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </DndContext>
  );
};