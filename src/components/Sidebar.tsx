import { useState, useCallback, useMemo, memo } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  FileText, 
  Plus, 
  MoreHorizontal,
  Trash2,
  Edit3,
  ChevronLeft,
  BookOpen,
  Lightbulb,
  Target,
  Search,
  Briefcase,
  CheckSquare,
  Clock,
  Flame,
  Circle,
  CheckCircle2,
  Calendar as CalendarIcon,
  DollarSign,
  Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Page, DailyTask } from '@/types';
import { cn } from '@/lib/utils';

// Custom page icons
const pageIcons = {
  document: FileText,
  book: BookOpen,
  idea: Lightbulb,
  goal: Target,
};

interface SidebarProps {
  pages: Record<string, Page>;
  rootPages: string[];
  currentPageId?: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onPageSelect: (pageId: string) => void;
  onCreatePage: (parentId?: string) => void;
  onDeletePage: (pageId: string) => void;
  onUpdatePage: (pageId: string, updates: Partial<Page>) => void;
  onToggleExpansion: (pageId: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  currentSection: 'pages' | 'daily-tasks' | 'calendar' | 'finance' | 'health-lab';
  onSectionSelect: (section: 'pages' | 'daily-tasks' | 'calendar' | 'finance' | 'health-lab') => void;
  dailyTasks: Record<string, DailyTask>;
  onCreateDailyTask: (title: string, timeAllocation: number, priority: DailyTask['priority'], category: string, description?: string) => void;
  onUpdateDailyTask: (taskId: string, updates: Partial<DailyTask>) => void;
  onToggleTaskCompletion: (taskId: string) => void;
  onDeleteDailyTask: (taskId: string) => void;
}

interface PageItemProps {
  page: Page;
  level: number;
  isSelected: boolean;
  pages: Record<string, Page>;
  currentPageId?: string;
  searchQuery: string;
  onPageSelect: (pageId: string) => void;
  onCreatePage: (parentId?: string) => void;
  onDeletePage: (pageId: string) => void;
  onUpdatePage: (pageId: string, updates: Partial<Page>) => void;
  onToggleExpansion: (pageId: string) => void;
}

const PageItem = memo(({
  page,
  level,
  isSelected,
  pages,
  currentPageId,
  searchQuery,
  onPageSelect,
  onCreatePage,
  onDeletePage,
  onUpdatePage,
  onToggleExpansion,
}: PageItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(page.title);
  const [isHovered, setIsHovered] = useState(false);

  // Memoized calculations
  const hasChildren = useMemo(() => page.children.length > 0, [page.children.length]);
  const isExpanded = useMemo(() => page.isExpanded ?? true, [page.isExpanded]);
  const IconComponent = useMemo(() => 
    pageIcons[page.icon as keyof typeof pageIcons] || pageIcons.document, 
    [page.icon]
  );

  // Memoized event handlers
  const handleTitleSubmit = useCallback(() => {
    if (editTitle.trim() && editTitle !== page.title) {
      onUpdatePage(page.id, { title: editTitle.trim() });
    } else {
      setEditTitle(page.title);
    }
    setIsEditing(false);
  }, [editTitle, page.title, page.id, onUpdatePage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSubmit();
    } else if (e.key === 'Escape') {
      setEditTitle(page.title);
      setIsEditing(false);
    }
  }, [handleTitleSubmit, page.title]);

  const handleIconChange = useCallback((iconKey: string) => {
    onUpdatePage(page.id, { icon: iconKey });
  }, [page.id, onUpdatePage]);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);
  const handlePageSelect = useCallback(() => onPageSelect(page.id), [onPageSelect, page.id]);
  const handleToggleExpansion = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExpansion(page.id);
  }, [onToggleExpansion, page.id]);
  const handleCreatePage = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onCreatePage(page.id);
  }, [onCreatePage, page.id]);

  // Memoized search calculations
  const searchQueryLower = useMemo(() => searchQuery.toLowerCase(), [searchQuery]);
  
  const filteredChildren = useMemo(() => {
    if (!searchQuery) return page.children;
    return page.children.filter(childId => {
      const child = pages[childId];
      if (!child) return false;
      const inBlocks = (child.blocks || []).some(b =>
        typeof b.content === 'string' && b.content.toLowerCase().includes(searchQueryLower)
      );
      return child.title.toLowerCase().includes(searchQueryLower) ||
             child.content.toLowerCase().includes(searchQueryLower) ||
             inBlocks;
    });
  }, [page.children, pages, searchQuery, searchQueryLower]);

  const matchesSearch = useMemo(() => 
    !searchQuery || 
    page.title.toLowerCase().includes(searchQueryLower) ||
    page.content.toLowerCase().includes(searchQueryLower) ||
    (page.blocks || []).some(b => typeof b.content === 'string' && b.content.toLowerCase().includes(searchQueryLower))
  , [searchQuery, searchQueryLower, page.title, page.content, page.blocks]);

  if (!matchesSearch && filteredChildren.length === 0) {
    return null;
  }

  return (
    <div>
      <div
        className={cn(
          "page-item hover-target group flex items-center w-full text-left hover:bg-green-500/10 transition-colors duration-100 rounded-lg py-2 px-2 backdrop-blur-sm cursor-pointer",
          isSelected && "bg-green-500/20 border border-green-500/30 shadow-sm backdrop-blur-xl"
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handlePageSelect}
      >
        {hasChildren && (
          <Button
            variant="ghost"
            size="sm"
            className="performance-button h-6 w-6 p-0 mr-2 opacity-60 hover:opacity-100 transition-all duration-100 hover:bg-green-500/10 text-gray-300"
            onClick={handleToggleExpansion}
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        )}

        <div className="flex items-center flex-1 min-w-0">
          {/* Custom icon with dropdown to change it */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 mr-3 hover:bg-green-500/10 text-gray-300 transition-all duration-100 transform-gpu"
                onClick={(e) => e.stopPropagation()}
              >
                <IconComponent className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-black/90 backdrop-blur-xl border-green-500/30 shadow-xl">
              <DropdownMenuItem onClick={() => handleIconChange('document')} className="hover:bg-green-500/10 text-white">
                <FileText className="h-4 w-4 mr-2" />
                Document
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleIconChange('book')} className="hover:bg-green-500/10 text-white">
                <BookOpen className="h-4 w-4 mr-2" />
                Book
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleIconChange('idea')} className="hover:bg-green-500/10 text-white">
                <Lightbulb className="h-4 w-4 mr-2" />
                Idea
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleIconChange('goal')} className="hover:bg-green-500/10 text-white">
                <Target className="h-4 w-4 mr-2" />
                Goal
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {isEditing ? (
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="h-7 px-2 text-sm border-0 bg-black/20 focus-visible:ring-1 text-white shadow-sm backdrop-blur-xl"
              autoFocus
            />
          ) : (
            <span
              className={cn(
                "flex-1 text-left text-sm truncate transition-all duration-200 py-1 px-2 rounded-md",
                isSelected 
                  ? "text-white font-medium" 
                  : "text-gray-300"
              )}
            >
              {page.title}
            </span>
          )}
        </div>

        <div className={cn(
          "flex items-center ml-2 gap-1 transition-opacity duration-100 transform-gpu will-change-opacity",
          isHovered || isSelected ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
            <Button
              variant="ghost"
              size="sm"
              className="performance-button h-7 w-7 p-0 opacity-60 hover:opacity-100 transition-all duration-100 hover:bg-green-500/10 text-gray-300"
              onClick={handleCreatePage}
            >
              <Plus className="h-3 w-3" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="performance-button h-7 w-7 p-0 opacity-60 hover:opacity-100 transition-all duration-100 hover:bg-green-500/10 text-gray-300"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-black/90 backdrop-blur-xl border-green-500/30 shadow-xl">
                <DropdownMenuItem onClick={() => setIsEditing(true)} className="hover:bg-green-500/10 text-white">
                  <Edit3 className="h-4 w-4 mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDeletePage(page.id)}
                  className="text-red-400 focus:text-red-400 hover:bg-red-500/20"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="ml-2">
          {page.children.map(childId => {
            const childPage = pages[childId];
            if (!childPage) return null;

            return (
              <PageItem
                key={childId}
                page={childPage}
                level={level + 1}
                isSelected={childId === currentPageId}
                pages={pages}
                currentPageId={currentPageId}
                searchQuery={searchQuery}
                onPageSelect={onPageSelect}
                onCreatePage={onCreatePage}
                onDeletePage={onDeletePage}
                onUpdatePage={onUpdatePage}
                onToggleExpansion={onToggleExpansion}
              />
            );
          })}
        </div>
      )}
    </div>
  );
});

export const Sidebar = ({
  pages,
  rootPages,
  currentPageId,
  searchQuery,
  onSearchChange,
  onPageSelect,
  onCreatePage,
  onDeletePage,
  onUpdatePage,
  onToggleExpansion,
  isOpen,
  onToggle,
  currentSection,
  onSectionSelect,
  dailyTasks,
  onCreateDailyTask,
  onUpdateDailyTask,
  onToggleTaskCompletion,
  onDeleteDailyTask,
}: SidebarProps) => {
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    timeAllocation: 30,
    priority: 'medium' as DailyTask['priority'],
    category: 'Personal',
  });

  const filteredRootPages = rootPages.filter(pageId => {
    const page = pages[pageId];
    if (!page) return false;
    
    if (!searchQuery) return true;
    
    // Check if page or any of its children match search
    const checkPageAndChildren = (p: Page): boolean => {
      const matches = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     p.content.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (matches) return true;
      
      return p.children.some(childId => {
        const child = pages[childId];
        return child && checkPageAndChildren(child);
      });
    };
    
    return checkPageAndChildren(page);
  });

  const handleCreateTask = () => {
    if (newTask.title.trim()) {
      onCreateDailyTask(
        newTask.title.trim(),
        newTask.timeAllocation,
        newTask.priority,
        newTask.category,
        newTask.description.trim() || undefined
      );
      setNewTask({
        title: '',
        description: '',
        timeAllocation: 30,
        priority: 'medium',
        category: 'Personal',
      });
      setShowTaskForm(false);
    }
  };

  const getPriorityColor = (priority: DailyTask['priority']) => {
    switch (priority) {
      case 'high': return 'text-red-400 border-red-400/30';
      case 'medium': return 'text-yellow-400 border-yellow-400/30';
      case 'low': return 'text-green-400 border-green-400/30';
    }
  };

  const completedTasks = dailyTasks ? Object.values(dailyTasks).filter(task => task.completed).length : 0;
  const totalTasks = dailyTasks ? Object.values(dailyTasks).length : 0;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <>
      {/* Sidebar with glass effect */}
      <aside className={cn(
        "sidebar-container w-80 border-r border-green-500/20 transition-all duration-500 ease-in-out relative shadow-xl overflow-hidden bg-black/60 performance-blur",
        isOpen ? "translate-x-0" : "-translate-x-full md:-translate-x-80",
        "fixed md:static inset-y-0 left-0 z-40 md:z-0"
      )}>
        {/* Sidebar content */}
        <div className="relative h-full flex flex-col z-10">
          <div className="flex-1 overflow-y-auto">
            {/* Calendar Section */}
            <div className="border-b border-green-500/10">
              {/* Section Header */}
              <div className="p-6 pb-4">
                <Button
                  variant="ghost"
                  onClick={() => onSectionSelect('calendar')}
                  className={cn(
                    "w-full justify-start h-12 p-0 hover:bg-green-500/10 transition-all duration-300 rounded-lg group bg-black/20 backdrop-blur-xl",
                    currentSection === 'calendar' && "bg-green-500/20 border border-green-500/30"
                  )}
                >
                  <div className="flex items-center w-full px-4">
                    <div className="flex items-center gap-3">
                      <CalendarIcon className="h-5 w-5 text-green-400" />
                      <span className="text-white font-medium text-base group-hover:text-green-300 transition-colors duration-300">
                        Calendar
                      </span>
                    </div>
                  </div>
                </Button>
              </div>
            </div>

            {/* Workspace Section */}
            <div className="border-b border-green-500/10">
              {/* Section Header */}
              <div className="p-6 pb-4">
                <Button
                  variant="ghost"
                  onClick={() => onSectionSelect('pages')}
                  className={cn(
                    "w-full justify-start h-12 p-0 hover:bg-green-500/10 transition-all duration-300 rounded-lg group bg-black/20 backdrop-blur-xl",
                    currentSection === 'pages' && "bg-green-500/20 border border-green-500/30"
                  )}
                >
                  <div className="flex items-center w-full px-4">
                    <div className="flex items-center gap-3">
                      <Briefcase className="h-5 w-5 text-green-400" />
                      <span className="text-white font-medium text-base group-hover:text-green-300 transition-colors duration-300">
                        Workspace
                      </span>
                    </div>
                  </div>
                </Button>
              </div>
            </div>

            {/* Daily Non-Negotiables Section */}
            <div className="border-b border-green-500/10">
              {/* Section Header */}
              <div className="p-6 pb-4">
                <Button
                  variant="ghost"
                  onClick={() => onSectionSelect('daily-tasks')}
                  className={cn(
                    "w-full justify-start h-12 p-0 hover:bg-green-500/10 transition-all duration-300 rounded-lg group bg-black/20 backdrop-blur-xl",
                    currentSection === 'daily-tasks' && "bg-green-500/20 border border-green-500/30"
                  )}
                >
                  <div className="flex items-center w-full px-4">
                    <div className="flex items-center gap-3">
                      <CheckSquare className="h-5 w-5 text-green-400" />
                      <span className="text-white font-medium text-base group-hover:text-green-300 transition-colors duration-300">
                        Daily Non-Negotiables
                      </span>
                    </div>
                  </div>
                </Button>
              </div>

            </div>

            {/* Finance Section */}
            <div className="border-b border-green-500/10">
              {/* Section Header */}
              <div className="p-6 pb-4">
                <Button
                  variant="ghost"
                  onClick={() => onSectionSelect('finance')}
                  className={cn(
                    "w-full justify-start h-12 p-0 hover:bg-green-500/10 transition-all duration-300 rounded-lg group bg-black/20 backdrop-blur-xl",
                    currentSection === 'finance' && "bg-green-500/20 border border-green-500/30"
                  )}
                >
                  <div className="flex items-center w-full px-4">
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-green-400" />
                      <span className="text-white font-medium text-base group-hover:text-green-300 transition-colors duration-300">
                        Finance Tracker
                      </span>
                    </div>
                  </div>
                </Button>
              </div>
            </div>

            {/* Health Lab Section */}
            <div className="border-b border-green-500/10">
              {/* Section Header */}
              <div className="p-6 pb-4">
                <Button
                  variant="ghost"
                  onClick={() => onSectionSelect('health-lab')}
                  className={cn(
                    "w-full justify-start h-12 p-0 hover:bg-green-500/10 transition-all duration-300 rounded-lg group bg-black/20 backdrop-blur-xl",
                    currentSection === 'health-lab' && "bg-green-500/20 border border-green-500/30"
                  )}
                >
                  <div className="flex items-center w-full px-4">
                    <div className="flex items-center gap-3">
                      <Heart className="h-5 w-5 text-green-400" />
                      <span className="text-white font-medium text-base group-hover:text-green-300 transition-colors duration-300">
                        Health Lab
                      </span>
                    </div>
                  </div>
                </Button>
              </div>
            </div>

            {/* Future sections placeholder */}
            <div className="p-6">
              <div className="text-center text-gray-500 text-sm">
                More sections coming soon...
              </div>
            </div>
          </div>
        </div>
      </aside>

            {/* Toggle button - positioned outside sidebar */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className={cn(
          "fixed top-1/2 -translate-y-1/2 z-50 h-10 w-10 p-0 bg-black/60 backdrop-blur-xl border border-green-500/30 shadow-xl hover:bg-black/80 text-white rounded-full transition-colors duration-200",
          isOpen ? "left-[300px] md:left-[300px]" : "left-4"
        )}
        style={{
          transform: 'translateY(-50%)',
          transition: 'left 500ms ease-in-out, background-color 200ms ease-in-out, transform 200ms ease-in-out',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-50%) scale(1.03)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
        }}
      >
        <ChevronLeft className={cn(
          "h-5 w-5 transition-transform duration-300 ease-in-out",
          !isOpen && "rotate-180"
        )} />
      </Button>
    </>
  );
};