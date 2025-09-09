import { useState, useMemo, memo } from 'react';
import { 
  Plus, 
  Search, 
  FileText, 
  BookOpen, 
  Lightbulb, 
  Target, 
  MoreHorizontal,
  Edit3,
  Trash2,
  Calendar,
  Clock,
  Star,
  Grid3X3,
  List,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Page } from '@/types';
import { cn } from '@/lib/utils';

// Custom page icons
const pageIcons = {
  document: FileText,
  book: BookOpen,
  idea: Lightbulb,
  goal: Target,
};

interface WorkspaceDashboardProps {
  pages: Record<string, Page>;
  rootPages: string[];
  currentPageId?: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onPageSelect: (pageId: string) => void;
  onCreatePage: () => void;
  onDeletePage: (pageId: string) => void;
  onUpdatePage: (pageId: string, updates: Partial<Page>) => void;
  onOpenPage: (pageId: string) => void;
}

export const WorkspaceDashboard = memo(({
  pages,
  rootPages,
  currentPageId,
  searchQuery,
  onSearchChange,
  onPageSelect,
  onCreatePage,
  onDeletePage,
  onUpdatePage,
  onOpenPage,
}: WorkspaceDashboardProps) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'type'>('date');
  const [filterType, setFilterType] = useState<'all' | 'document' | 'book' | 'idea' | 'goal'>('all');

  // Filter and sort pages
  const filteredAndSortedPages = useMemo(() => {
    let filtered = rootPages
      .map(pageId => pages[pageId])
      .filter(page => page && page.title.toLowerCase().includes(searchQuery.toLowerCase()));

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(page => page.icon === filterType);
    }

    // Sort pages
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.title.localeCompare(b.title);
        case 'date':
          return b.updatedAt - a.updatedAt;
        case 'type':
          return (a.icon || 'document').localeCompare(b.icon || 'document');
        default:
          return 0;
      }
    });

    return filtered;
  }, [rootPages, pages, searchQuery, sortBy, filterType]);

  const getPageIcon = (iconType: string | undefined) => {
    const IconComponent = pageIcons[(iconType || 'document') as keyof typeof pageIcons] || FileText;
    return IconComponent;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  const formatDateShort = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const PageCard = ({ page }: { page: Page }) => {
    const IconComponent = getPageIcon(page.icon);
    
    return (
      <div
        className="group relative bg-black/20 backdrop-blur-xl rounded-xl border border-green-500/20 p-6 hover:border-green-500/40 transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-green-500/10 hover:scale-105 h-48 flex flex-col self-start"
        onClick={() => onOpenPage(page.id)}
      >
        {/* Page Icon */}
        <div className="flex justify-center mb-4">
          <div className="p-2 bg-green-500/10 rounded-lg border border-green-500/20">
            <IconComponent className="h-4 w-4 text-green-400" />
          </div>
        </div>

        {/* Menu Button - Positioned absolutely */}
        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-green-500/20"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3 w-3 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-black/80 backdrop-blur-xl border border-green-500/20">
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdatePage(page.id, { icon: 'document' });
                }}
                className="text-white hover:bg-green-500/20"
              >
                <FileText className="h-4 w-4 mr-2" />
                Change to Document
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdatePage(page.id, { icon: 'book' });
                }}
                className="text-white hover:bg-green-500/20"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Change to Book
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdatePage(page.id, { icon: 'idea' });
                }}
                className="text-white hover:bg-green-500/20"
              >
                <Lightbulb className="h-4 w-4 mr-2" />
                Change to Idea
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdatePage(page.id, { icon: 'goal' });
                }}
                className="text-white hover:bg-green-500/20"
              >
                <Target className="h-4 w-4 mr-2" />
                Change to Goal
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  onDeletePage(page.id);
                }}
                className="text-red-400 hover:bg-red-500/20"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Page
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Page Title */}
        <h3 className="text-white font-semibold text-lg mb-4 line-clamp-2 group-hover:text-green-300 transition-colors duration-200 flex-1 text-center">
          {page.title}
        </h3>

        {/* Page Meta - Single Line */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Created at: {formatDateShort(page.createdAt)}</span>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>Last Edited: {formatDate(page.updatedAt)}</span>
          </div>
        </div>

        {/* Hover Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
      </div>
    );
  };

  const PageListItem = ({ page }: { page: Page }) => {
    const IconComponent = getPageIcon(page.icon);
    
    return (
      <div
        className={cn(
          "group flex items-center justify-between p-4 bg-black/20 backdrop-blur-xl rounded-lg border border-green-500/20 hover:border-green-500/40 transition-all duration-200 cursor-pointer hover:bg-green-500/5",
          currentPageId === page.id && "border-green-500/60 bg-green-500/10"
        )}
        onClick={() => onOpenPage(page.id)}
      >
        <div className="flex items-center gap-4">
          <div className="p-2 bg-green-500/10 rounded-lg border border-green-500/20">
            <IconComponent className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <h3 className="text-white font-medium group-hover:text-green-300 transition-colors duration-200">
              {page.title}
            </h3>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(page.updatedAt)}
              </span>
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3" />
                {page.children?.length || 0} sub-pages
              </span>
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-green-500/20"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4 text-gray-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-black/80 backdrop-blur-xl border border-green-500/20">
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation();
                onUpdatePage(page.id, { icon: 'document' });
              }}
              className="text-white hover:bg-green-500/20"
            >
              <FileText className="h-4 w-4 mr-2" />
              Change to Document
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation();
                onUpdatePage(page.id, { icon: 'book' });
              }}
              className="text-white hover:bg-green-500/20"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Change to Book
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation();
                onUpdatePage(page.id, { icon: 'idea' });
              }}
              className="text-white hover:bg-green-500/20"
            >
              <Lightbulb className="h-4 w-4 mr-2" />
              Change to Idea
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation();
                onUpdatePage(page.id, { icon: 'goal' });
              }}
              className="text-white hover:bg-green-500/20"
            >
              <Target className="h-4 w-4 mr-2" />
              Change to Goal
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation();
                onDeletePage(page.id);
              }}
              className="text-red-400 hover:bg-red-500/20"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Page
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-black/10">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-12 py-12">
          <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Workspace</h1>
                <p className="text-gray-300 text-lg">Organize your thoughts and ideas</p>
              </div>
              <Button
                onClick={() => {
                  console.log('🔄 New Page button clicked in WorkspaceDashboard');
                  onCreatePage();
                }}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                <Plus className="h-5 w-5 mr-2" />
                New Page
              </Button>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search pages..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10 bg-black/20 backdrop-blur-xl border-green-500/30 focus-visible:ring-green-500/50 focus-visible:ring-2 text-white placeholder:text-gray-400"
                />
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3">
                {/* Filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="bg-black/20 backdrop-blur-xl border-green-500/30 text-white hover:bg-green-500/10"
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      {filterType === 'all' ? 'All Types' : filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-black/80 backdrop-blur-xl border border-green-500/20">
                    <DropdownMenuItem onClick={() => setFilterType('all')} className="text-white hover:bg-green-500/20">
                      All Types
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterType('document')} className="text-white hover:bg-green-500/20">
                      <FileText className="h-4 w-4 mr-2" />
                      Documents
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterType('book')} className="text-white hover:bg-green-500/20">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Books
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterType('idea')} className="text-white hover:bg-green-500/20">
                      <Lightbulb className="h-4 w-4 mr-2" />
                      Ideas
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterType('goal')} className="text-white hover:bg-green-500/20">
                      <Target className="h-4 w-4 mr-2" />
                      Goals
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Sort */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="bg-black/20 backdrop-blur-xl border-green-500/30 text-white hover:bg-green-500/10"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      {sortBy === 'date' ? 'Recent' : sortBy === 'name' ? 'Name' : 'Type'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-black/80 backdrop-blur-xl border border-green-500/20">
                    <DropdownMenuItem onClick={() => setSortBy('date')} className="text-white hover:bg-green-500/20">
                      <Clock className="h-4 w-4 mr-2" />
                      Recent
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('name')} className="text-white hover:bg-green-500/20">
                      <FileText className="h-4 w-4 mr-2" />
                      Name
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('type')} className="text-white hover:bg-green-500/20">
                      <Grid3X3 className="h-4 w-4 mr-2" />
                      Type
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* View Mode */}
                <div className="flex bg-black/20 backdrop-blur-xl rounded-lg border border-green-500/30 p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      "h-8 w-8 p-0",
                      viewMode === 'grid' 
                        ? "bg-green-500 text-white" 
                        : "text-gray-400 hover:text-white hover:bg-green-500/20"
                    )}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className={cn(
                      "h-8 w-8 p-0",
                      viewMode === 'list' 
                        ? "bg-green-500 text-white" 
                        : "text-gray-400 hover:text-white hover:bg-green-500/20"
                    )}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Pages */}
            {filteredAndSortedPages.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-black/20 backdrop-blur-xl rounded-2xl p-12 border border-green-500/20 max-w-md mx-auto">
                  <div className="p-4 bg-green-500/10 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                    <FileText className="h-8 w-8 text-green-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {searchQuery ? 'No pages found' : 'No pages yet'}
                  </h3>
                  <p className="text-gray-400 mb-6">
                    {searchQuery 
                      ? 'Try adjusting your search terms' 
                      : 'Create your first page to get started'
                    }
                  </p>
                  {!searchQuery && (
                    <Button
                      onClick={() => {
                        console.log('🔄 Create First Page button clicked in WorkspaceDashboard');
                        onCreatePage();
                      }}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Page
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className={cn(
                viewMode === 'grid' 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start content-start" 
                  : "space-y-3"
              )}>
                {filteredAndSortedPages.map((page) => (
                  viewMode === 'grid' ? (
                    <PageCard key={page.id} page={page} />
                  ) : (
                    <PageListItem key={page.id} page={page} />
                  )
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

WorkspaceDashboard.displayName = 'WorkspaceDashboard';
