import { useState } from 'react';
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
  CheckCircle2
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
  currentSection: 'pages' | 'daily-tasks';
  onSectionSelect: (section: 'pages' | 'daily-tasks') => void;
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

const PageItem = ({
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

  const hasChildren = page.children.length > 0;
  const isExpanded = page.isExpanded ?? true;

  // Get the icon component for this page
  const IconComponent = pageIcons[page.icon as keyof typeof pageIcons] || pageIcons.document;

  const handleTitleSubmit = () => {
    if (editTitle.trim() && editTitle !== page.title) {
      onUpdatePage(page.id, { title: editTitle.trim() });
    } else {
      setEditTitle(page.title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSubmit();
    } else if (e.key === 'Escape') {
      setEditTitle(page.title);
      setIsEditing(false);
    }
  };

  const handleIconChange = (iconKey: string) => {
    onUpdatePage(page.id, { icon: iconKey });
  };

  // Filter children based on search
  const filteredChildren = page.children.filter(childId => {
    const child = pages[childId];
    if (!child) return false;
    if (!searchQuery) return true;
    return child.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           child.content.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const matchesSearch = !searchQuery || 
    page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.content.toLowerCase().includes(searchQuery.toLowerCase());

  if (!matchesSearch && filteredChildren.length === 0) {
    return null;
  }

  return (
    <div>
      <div
        className={cn(
          "group flex items-center w-full text-left hover:bg-green-500/10 transition-all duration-300 rounded-lg py-2 px-2 backdrop-blur-sm",
          isSelected && "bg-green-500/20 border border-green-500/30 shadow-sm backdrop-blur-xl"
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 mr-2 opacity-60 hover:opacity-100 transition-all duration-200 hover:bg-green-500/10 text-gray-300"
          onClick={() => hasChildren && onToggleExpansion(page.id)}
          disabled={!hasChildren}
        >
          {hasChildren && (
            isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
          )}
        </Button>

        <div className="flex items-center flex-1 min-w-0">
          {/* Custom icon with dropdown to change it */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 mr-3 hover:bg-green-500/10 text-gray-300 transition-all duration-200"
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
              className="h-7 px-2 text-sm border-0 bg-black/20 focus-visible:ring-1 text-white shadow-sm backdrop-blur-xl"
              autoFocus
            />
          ) : (
            <button
              onClick={() => onPageSelect(page.id)}
              className={cn(
                "flex-1 text-left text-sm truncate transition-all duration-200 py-1 px-2 rounded-md",
                isSelected 
                  ? "bg-green-500/20 text-white font-medium border border-green-500/30 shadow-sm backdrop-blur-xl" 
                  : "text-gray-300 hover:text-white hover:bg-green-500/10"
              )}
            >
              {page.title}
            </button>
          )}
        </div>

        {(isHovered || isSelected) && (
          <div className="flex items-center ml-2 gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 opacity-60 hover:opacity-100 transition-all duration-200 hover:bg-green-500/10 text-gray-300"
              onClick={() => onCreatePage(page.id)}
            >
              <Plus className="h-3 w-3" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 opacity-60 hover:opacity-100 transition-all duration-200 hover:bg-green-500/10 text-gray-300"
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
        )}
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
};

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
  const [workspaceExpanded, setWorkspaceExpanded] = useState(false);
  const [dailyTasksExpanded, setDailyTasksExpanded] = useState(false);
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
        "w-80 border-r border-green-500/20 transition-all duration-500 ease-in-out relative shadow-xl overflow-hidden bg-black/60 backdrop-blur-xl",
        isOpen ? "translate-x-0" : "-translate-x-full md:-translate-x-80",
        "fixed md:static inset-y-0 left-0 z-40 md:z-0"
      )}>
        {/* Sidebar content */}
        <div className="relative h-full flex flex-col z-10">
          <div className="flex-1 overflow-y-auto">
            {/* Page Workspace Section */}
            <div className="border-b border-green-500/10">
              {/* Section Header */}
              <div className="p-6 pb-4">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setWorkspaceExpanded(!workspaceExpanded);
                    if (!workspaceExpanded) {
                      onSectionSelect('pages');
                    }
                  }}
                  className={cn(
                    "w-full justify-start h-12 p-0 hover:bg-green-500/10 transition-all duration-300 rounded-lg group outline-none focus:outline-none hover:outline-none active:outline-none focus-visible:outline-none ring-0 focus:ring-0 hover:ring-0 active:ring-0 focus-visible:ring-0",
                    currentSection === 'pages' && "bg-green-500/20 border border-green-500/30"
                  )}
                >
                  <div className="flex items-center w-full px-4">
                    <div className="flex items-center gap-3">
                      {workspaceExpanded ? (
                        <ChevronDown className="h-4 w-4 text-green-400 transition-transform duration-300" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-green-400 transition-transform duration-300" />
                      )}
                      <Briefcase className="h-5 w-5 text-green-400" />
                      <span className="text-white font-medium text-base group-hover:text-green-300 transition-colors duration-300">
                        Workspace
                      </span>
                    </div>
                  </div>
                </Button>
              </div>

              {/* Collapsible Content */}
              {workspaceExpanded && (
                <div className="px-6 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-300">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search pages..."
                      value={searchQuery}
                      onChange={(e) => onSearchChange(e.target.value)}
                      className="pl-10 bg-black/20 backdrop-blur-xl border-green-500/30 focus-visible:ring-green-500/50 focus-visible:ring-2 focus-visible:outline-none text-white placeholder:text-gray-400 hover:bg-black/30 transition-all duration-300 shadow-sm"
                    />
                  </div>

                  {/* New Page Button */}
                  <Button
                    onClick={() => onCreatePage()}
                    variant="outline"
                    className="w-full justify-start h-10 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 border-green-500/30 text-white transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 backdrop-blur-xl"
                  >
                    <Plus className="h-4 w-4 mr-3" />
                    New Page
                  </Button>

                  {/* Pages List */}
                  <div className="space-y-1 pt-2">
                    {filteredRootPages.length === 0 ? (
                      <div className="p-4 text-center text-gray-400 text-sm">
                        {searchQuery ? 'No pages found' : 'No pages yet. Create your first page!'}
                      </div>
                    ) : (
                      filteredRootPages.map(pageId => {
                        const page = pages[pageId];
                        if (!page) return null;

                        return (
                          <PageItem
                            key={pageId}
                            page={page}
                            level={0}
                            isSelected={pageId === currentPageId}
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
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Daily Non-Negotiables Section */}
            <div className="border-b border-green-500/10">
              {/* Section Header */}
              <div className="p-6 pb-4">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setDailyTasksExpanded(!dailyTasksExpanded);
                    onSectionSelect('daily-tasks');
                  }}
                  className={cn(
                    "w-full justify-start h-12 p-0 hover:bg-green-500/10 transition-all duration-300 rounded-lg group bg-black/20 backdrop-blur-xl",
                    currentSection === 'daily-tasks' && "bg-green-500/20 border border-green-500/30"
                  )}
                >
                  <div className="flex items-center w-full px-4">
                    <div className="flex items-center gap-3">
                      {dailyTasksExpanded ? (
                        <ChevronDown className="h-4 w-4 text-green-400 transition-transform duration-300" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-green-400 transition-transform duration-300" />
                      )}
                      <CheckSquare className="h-5 w-5 text-green-400" />
                      <span className="text-white font-medium text-base group-hover:text-green-300 transition-colors duration-300">
                        Daily Non-Negotiables
                      </span>
                    </div>
                  </div>
                </Button>
              </div>

              {/* Collapsible Content */}
              {dailyTasksExpanded && (
                <div className="px-6 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-300">
                  {/* Simple Progress Bar */}
                  {totalTasks > 0 ? (
                    <div className="bg-black/20 backdrop-blur-xl rounded-lg p-3 border border-green-500/20">
                      <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
                          style={{ width: `${totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-400 mt-2">
                        <span>{completedTasks} completed</span>
                        <span>{totalTasks - completedTasks} remaining</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-400">
                      <p className="text-xs">Click to open dashboard</p>
                    </div>
                  )}
                </div>
              )}
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
          "fixed top-20 z-50 h-10 w-10 p-0 bg-black/60 backdrop-blur-xl border border-green-500/30 shadow-xl hover:bg-black/80 transition-all duration-500 ease-in-out text-white hover:scale-110 rounded-full",
          isOpen ? "left-[312px] md:left-[312px]" : "left-4",
          "transform hover:shadow-2xl"
        )}
      >
        <ChevronLeft className={cn(
          "h-5 w-5 transition-transform duration-500 ease-in-out",
          !isOpen && "rotate-180"
        )} />
      </Button>
    </>
  );
};