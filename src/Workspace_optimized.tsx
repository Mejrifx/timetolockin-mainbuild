import { useState, useEffect, useMemo, memo } from 'react';
import { useWorkspace } from '@/lib/useWorkspace';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { Editor } from '@/components/Editor';
import { EmptyState } from '@/components/EmptyState';
import { DailyTasksDashboard } from '@/components/DailyTasksDashboard';
import { CalendarDashboard } from '@/components/CalendarDashboard';
import { FinanceDashboard } from '@/components/FinanceDashboard';
import { HealthLabDashboard } from '@/components/HealthLabDashboard';
import { GridBackground } from '@/components/ui/grid-background';
import { cn } from '@/lib/utils';

// Memoized dashboard components to prevent unnecessary re-renders
const MemoizedDailyTasksDashboard = memo(DailyTasksDashboard);
const MemoizedCalendarDashboard = memo(CalendarDashboard);
const MemoizedFinanceDashboard = memo(FinanceDashboard);
const MemoizedHealthLabDashboard = memo(HealthLabDashboard);
const MemoizedEditor = memo(Editor);
const MemoizedEmptyState = memo(EmptyState);

export const Workspace = () => {
  const {
    state,
    loading,
    error,
    createPage,
    updatePage,
    deletePage,
    setCurrentPage,
    setCurrentSection,
    setSearchQuery,
    togglePageExpansion,
    createDailyTask,
    updateDailyTask,
    toggleTaskCompletion,
    deleteDailyTask,
    updateFinanceData,
    updateHealthData,
  } = useWorkspace();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Memoize current page to prevent unnecessary recalculations
  const currentPage = useMemo(() => {
    return state.currentPageId ? state.pages[state.currentPageId] : null;
  }, [state.currentPageId, state.pages]);

  // Memoized handlers to prevent re-renders
  const handleCreatePage = useMemo(() => {
    return (parentId?: string) => {
      createPage(`New Page ${Object.keys(state.pages).length + 1}`, parentId);
    };
  }, [createPage, state.pages]);

  const handleSectionSelect = useMemo(() => {
    return (section: 'pages' | 'daily-tasks' | 'calendar' | 'finance' | 'health-lab') => {
      setCurrentSection(section);
    };
  }, [setCurrentSection]);

  const handleExportToWorkspace = useMemo(() => {
    return (content: string, title: string) => {
      createPage(title).then(pageId => {
        if (pageId) {
          updatePage(pageId, { content });
        }
      });
    };
  }, [createPage, updatePage]);

  // Handle sidebar toggle
  const handleSidebarToggle = () => setSidebarOpen(!sidebarOpen);

  // Loading state
  if (loading) {
    return (
      <GridBackground>
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading workspace...</p>
          </div>
        </div>
      </GridBackground>
    );
  }

  // Error state
  if (error) {
    return (
      <GridBackground>
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Something went wrong</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Reload App
            </button>
          </div>
        </div>
      </GridBackground>
    );
  }

  return (
    <GridBackground>
      <div className="min-h-screen bg-black text-white flex flex-col overflow-hidden">
        <Header 
          sidebarOpen={sidebarOpen}
          onToggleSidebar={handleSidebarToggle}
          onCreatePage={() => handleCreatePage()}
        />
        
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            pages={state.pages}
            rootPages={state.rootPages}
            currentPageId={state.currentPageId}
            searchQuery={state.searchQuery}
            onSearchChange={setSearchQuery}
            onPageSelect={setCurrentPage}
            onCreatePage={handleCreatePage}
            onDeletePage={deletePage}
            onUpdatePage={updatePage}
            onToggleExpansion={togglePageExpansion}
            isOpen={sidebarOpen}
            onToggle={handleSidebarToggle}
            currentSection={state.currentSection}
            onSectionSelect={handleSectionSelect}
            dailyTasks={state.dailyTasks}
            onCreateDailyTask={createDailyTask}
            onUpdateDailyTask={updateDailyTask}
            onToggleTaskCompletion={toggleTaskCompletion}
            onDeleteDailyTask={deleteDailyTask}
          />

          <main className="flex-1 overflow-hidden relative" style={{ contain: 'layout style paint' }}>
            {/* Daily Tasks Dashboard */}
            <div 
              className={cn(
                "absolute inset-0 transition-all duration-200 ease-out",
                "will-change-transform transform-gpu",
                state.currentSection === 'daily-tasks' 
                  ? "opacity-100 translate-x-0 pointer-events-auto z-10" 
                  : "opacity-0 translate-x-2 pointer-events-none z-0"
              )}
            >
              <MemoizedDailyTasksDashboard
                dailyTasks={state.dailyTasks}
                onCreateDailyTask={createDailyTask}
                onUpdateDailyTask={updateDailyTask}
                onToggleTaskCompletion={toggleTaskCompletion}
                onDeleteDailyTask={deleteDailyTask}
              />
            </div>

            {/* Calendar Dashboard */}
            <div 
              className={cn(
                "absolute inset-0 transition-all duration-200 ease-out",
                "will-change-transform transform-gpu",
                state.currentSection === 'calendar' 
                  ? "opacity-100 translate-x-0 pointer-events-auto z-10" 
                  : "opacity-0 translate-x-2 pointer-events-none z-0"
              )}
            >
              <MemoizedCalendarDashboard />
            </div>

            {/* Finance Dashboard */}
            <div 
              className={cn(
                "absolute inset-0 transition-all duration-200 ease-out",
                "will-change-transform transform-gpu",
                state.currentSection === 'finance' 
                  ? "opacity-100 translate-x-0 pointer-events-auto z-10" 
                  : "opacity-0 translate-x-2 pointer-events-none z-0"
              )}
            >
              <MemoizedFinanceDashboard 
                financeData={state.financeData}
                onUpdateFinanceData={updateFinanceData}
                onCreateDailyTask={createDailyTask}
                onExportToWorkspace={handleExportToWorkspace}
              />
            </div>

            {/* Health Lab Dashboard */}
            <div 
              className={cn(
                "absolute inset-0 transition-all duration-200 ease-out",
                "will-change-transform transform-gpu",
                state.currentSection === 'health-lab' 
                  ? "opacity-100 translate-x-0 pointer-events-auto z-10" 
                  : "opacity-0 translate-x-2 pointer-events-none z-0"
              )}
            >
              <MemoizedHealthLabDashboard 
                healthData={state.healthData}
                onUpdateHealthData={updateHealthData}
                onCreateDailyTask={createDailyTask}
                onExportToWorkspace={handleExportToWorkspace}
              />
            </div>

            {/* Pages/Editor Section */}
            <div 
              className={cn(
                "absolute inset-0 transition-all duration-200 ease-out",
                "will-change-transform transform-gpu",
                state.currentSection === 'pages' 
                  ? "opacity-100 translate-x-0 pointer-events-auto z-10" 
                  : "opacity-0 translate-x-2 pointer-events-none z-0"
              )}
            >
              {currentPage ? (
                <MemoizedEditor
                  key={currentPage.id}
                  page={currentPage}
                  onUpdatePage={updatePage}
                />
              ) : (
                <MemoizedEmptyState onCreatePage={() => handleCreatePage()} />
              )}
            </div>
          </main>
        </div>
      </div>
    </GridBackground>
  );
};
