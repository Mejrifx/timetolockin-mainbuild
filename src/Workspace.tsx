import { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { useWorkspace } from '@/lib/useWorkspaceSync';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { EmptyState } from '@/components/EmptyState';
import { WorkspaceDashboard } from '@/components/WorkspaceDashboard';
import { PageCreationModal } from '@/components/PageCreationModal';
import { NotesEditor } from '@/components/NotesEditor';
import { GridBackground } from '@/components/ui/grid-background';
import { cn } from '@/lib/utils';

// Lazy load dashboard components for better performance
import { 
  DailyTasksDashboard, 
  CalendarDashboard, 
  FinanceDashboard, 
  HealthLabDashboard,
  Editor
} from '@/components/LazyComponents';

export const Workspace = () => {
  const {
    state,
    loading,
    error,
    loadingStep,
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
    createCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    updateFinanceData,
    updateHealthData,
  } = useWorkspace();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isPageCreationModalOpen, setIsPageCreationModalOpen] = useState(false);

  // Memoize current page to prevent unnecessary re-renders
  const currentPage = useMemo(() => 
    state.currentPageId ? state.pages[state.currentPageId] : null, 
    [state.currentPageId, state.pages]
  );

  // Memoize handlers to prevent unnecessary re-renders
  const handleCreatePage = useCallback(() => {
    console.log('🔄 Opening page creation modal...');
    setIsPageCreationModalOpen(true);
  }, []);

  const handleCreatePageWithDetails = useCallback(async (title: string, icon: string, pageType: 'workspace' | 'note' = 'workspace') => {
    console.log('🔄 Creating new page with details:', { title, icon, pageType });
    try {
      const pageId = await createPage(title, undefined, icon, pageType);
      console.log('✅ Page created with ID:', pageId);
      // Don't auto-select the page - just create it and stay in dashboard
      console.log('✅ Page created successfully, staying in dashboard');
    } catch (error) {
      console.error('❌ Error creating page:', error);
      throw error; // Re-throw so modal can handle it
    }
  }, [createPage]);

  const handleOpenPage = useCallback((pageId: string) => {
    setCurrentPage(pageId);
    // Switch to editor view by setting current section to null
    // This will trigger the editor to render instead of the dashboard
    setCurrentSection(null as any);
  }, [setCurrentPage, setCurrentSection]);

  const handleDeletePage = useCallback(async (pageId: string) => {
    await deletePage(pageId);
  }, [deletePage]);

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen(!sidebarOpen);
  }, [sidebarOpen]);

  // Note: Welcome page creation is now handled by AuthContext.tsx
  // This ensures each user gets exactly one welcome page with consistent content

  // Show loading state while data is being fetched
  if (loading) {
    return (
      <GridBackground className="h-screen overflow-hidden" blurBackground={true}>
        <div className="h-screen flex items-center justify-center">
          <div className="text-center max-w-md px-6">
            <div className="w-12 h-12 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white text-lg mb-2">Loading your workspace...</p>
            {loadingStep && (
              <p className="text-gray-300 text-sm mb-2">{loadingStep}</p>
            )}
            <p className="text-gray-400 text-sm">This should only take a few seconds</p>
            <div className="mt-4 bg-black/20 rounded-lg p-3 text-xs text-gray-400">
              <p>If this takes too long, please refresh the page.</p>
            </div>
          </div>
        </div>
      </GridBackground>
    );
  }

  // Show error state if something went wrong
  if (error) {
    return (
      <GridBackground className="h-screen overflow-hidden">
        <div className="h-screen flex items-center justify-center">
          <div className="text-center max-w-md px-6">
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 mb-6">
              <h2 className="text-red-400 text-xl font-semibold mb-3">Setup Required</h2>
              <p className="text-red-300 text-sm mb-4">{error}</p>
              <div className="text-left bg-black/40 rounded-lg p-4 text-xs">
                <p className="text-gray-300 mb-2">Quick fix:</p>
                <ol className="text-gray-400 space-y-1">
                  <li>1. Go to supabase.com/dashboard</li>
                  <li>2. Select your GM AI project</li>
                  <li>3. Go to SQL Editor</li>
                  <li>4. Run the setup script from SUPABASE_SETUP.md</li>
                </ol>
              </div>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-all duration-300"
            >
              Retry Loading
            </button>
          </div>
        </div>
      </GridBackground>
    );
  }

  console.log('🏠 Workspace component rendering:', {
    loading,
    error,
    pagesCount: Object.keys(state.pages).length,
    currentPageId: state.currentPageId,
    currentSection: state.currentSection
  });

  return (
    <GridBackground className="h-screen overflow-hidden" blurBackground={true}>
      <div className="h-screen flex flex-col w-full">
        <Header 
          onToggleSidebar={handleToggleSidebar}
          sidebarOpen={sidebarOpen}
        />
        
        <div className="flex-1 flex overflow-hidden relative">
          <Sidebar
            pages={state.pages}
            rootPages={state.rootPages}
            currentPageId={state.currentPageId}
            currentSection={state.currentSection || 'pages'}
            searchQuery={state.searchQuery}
            onSearchChange={setSearchQuery}
            onPageSelect={setCurrentPage}
            onSectionSelect={setCurrentSection}
            onCreatePage={handleCreatePage}
            onDeletePage={handleDeletePage}
            onUpdatePage={updatePage}
            onToggleExpansion={async (pageId: string) => {
              await updatePage(pageId, { 
                isExpanded: !state.pages[pageId]?.isExpanded 
              });
            }}
            isOpen={sidebarOpen}
            onToggle={handleToggleSidebar}
            dailyTasks={state.dailyTasks}
            onCreateDailyTask={createDailyTask}
            onUpdateDailyTask={updateDailyTask}
            onToggleTaskCompletion={toggleTaskCompletion}
            onDeleteDailyTask={deleteDailyTask}
          />

          {/* Overlay for mobile */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/20 z-30 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <main className={cn(
            "flex-1 flex flex-col overflow-hidden transition-all duration-500 ease-in-out",
            sidebarOpen ? "md:ml-0" : "md:-ml-80"
          )}>
            {(() => {
              console.log('🖥️ Rendering main content:', {
                currentSection: state.currentSection,
                currentPageId: state.currentPageId,
                currentPage: currentPage?.title,
                totalPages: Object.keys(state.pages).length,
                loading,
                error
              });

              try {
                if (state.currentSection === 'pages') {
                  console.log('📁 Rendering Workspace Dashboard')
                  return (
                    <WorkspaceDashboard
                      pages={state.pages}
                      rootPages={state.rootPages}
                      currentPageId={state.currentPageId}
                      searchQuery={state.searchQuery}
                      onSearchChange={setSearchQuery}
                      onPageSelect={setCurrentPage}
                      onCreatePage={handleCreatePage}
                      onDeletePage={handleDeletePage}
                      onUpdatePage={updatePage}
                      onOpenPage={handleOpenPage}
                    />
                  );
                } else if (state.currentSection === 'daily-tasks') {
                  console.log('📋 Rendering Daily Tasks Dashboard')
                  return (
                    <DailyTasksDashboard
                dailyTasks={state.dailyTasks}
                onCreateDailyTask={createDailyTask}
                onUpdateDailyTask={updateDailyTask}
                onToggleTaskCompletion={toggleTaskCompletion}
                onDeleteDailyTask={deleteDailyTask}
              />
                  );
                } else if (state.currentSection === 'calendar') {
                  console.log('📅 Rendering Calendar Dashboard')
                  return (
                    <CalendarDashboard 
                      calendarEvents={state.calendarEvents}
                      onCreateCalendarEvent={createCalendarEvent}
                      onUpdateCalendarEvent={updateCalendarEvent}
                      onDeleteCalendarEvent={deleteCalendarEvent}
                    />
                  );
                } else if (state.currentSection === 'finance') {
                  console.log('💰 Rendering Finance Dashboard')
                  return (
                    <FinanceDashboard 
                financeData={state.financeData}
                onUpdateFinanceData={updateFinanceData}
                onCreateDailyTask={createDailyTask}
                      onExportToWorkspace={(content, title) => {
                        // Create a new page with the exported content
                        createPage(title).then(pageId => {
                          if (pageId) {
                            updatePage(pageId, { content });
                          }
                        });
                      }}
                    />
                  );
                } else if (state.currentSection === 'health-lab') {
                  console.log('💪 Rendering Health Lab Dashboard')
                  return (
                    <HealthLabDashboard 
                healthData={state.healthData}
                onUpdateHealthData={updateHealthData}
                onCreateDailyTask={createDailyTask}
                      onExportToWorkspace={(content, title) => {
                        // Create a new page with the exported content
                        createPage(title).then(pageId => {
                          if (pageId) {
                            updatePage(pageId, { content });
                          }
                        });
                      }}
                    />
                  );
                } else if (currentPage) {
                  console.log('📝 Rendering Editor for page:', currentPage.title, 'Type:', currentPage.pageType)
                  // Render NotesEditor for note pages, Editor for workspace pages
                  return currentPage.pageType === 'note' ? (
                    <NotesEditor
                      key={currentPage.id}
                      page={currentPage}
                      onUpdatePage={updatePage}
                      onDeletePage={deletePage}
                    />
                  ) : (
                    <Editor
                      key={currentPage.id}
                      page={currentPage}
                      onUpdatePage={updatePage}
                    />
                  );
                } else if (state.currentSection === null) {
                  console.log('📄 Rendering Empty State - no current page')
                  return <EmptyState onCreatePage={() => handleCreatePage()} />;
                } else {
                  console.log('📄 Rendering Empty State - no current page')
                  return <EmptyState onCreatePage={() => handleCreatePage()} />;
                }
              } catch (renderError) {
                console.error('❌ Error rendering main content:', renderError)
                return (
                  <div className="flex-1 flex items-center justify-center bg-black/5">
                    <div className="text-center">
                      <h3 className="text-red-400 text-xl mb-2">Rendering Error</h3>
                      <p className="text-gray-400 mb-4">Something went wrong while loading the workspace</p>
                      <button
                        onClick={() => window.location.reload()}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                      >
                        Reload
                      </button>
                    </div>
            </div>
                );
              }
            })()}
          </main>
        </div>
      </div>

      {/* Page Creation Modal */}
      <PageCreationModal
        isOpen={isPageCreationModalOpen}
        onClose={() => setIsPageCreationModalOpen(false)}
        onCreatePage={handleCreatePageWithDetails}
      />
    </GridBackground>
  );
};