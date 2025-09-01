import { useState, useEffect } from 'react';
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

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const currentPage = state.currentPageId ? state.pages[state.currentPageId] : null;

  const handleCreatePage = async (parentId?: string) => {
    const pageId = await createPage('Untitled', parentId);
    if (pageId) {
      setCurrentPage(pageId);
    }
  };

  const handleDeletePage = async (pageId: string) => {
    await deletePage(pageId);
  };

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Initialize with a welcome page if no pages exist
  // IMPORTANT: This useEffect must be called BEFORE any early returns to maintain hook order
  useEffect(() => {
    // Always call this effect, but only do work if conditions are met
    if (!loading && !error && Object.keys(state.pages).length === 0) {
      console.log('👋 New user detected, creating welcome page...')
      
      const createWelcomePage = async () => {
        try {
          const welcomePageId = await createPage('Welcome to timetolockin');
          if (welcomePageId) {
            const welcomeContent = `# Welcome to timetolockin

Your intelligent workspace is ready! Here are some tips to get started:

## Features
- **Rich Text Editing**: Type naturally and use markdown formatting
- **Page Organization**: Create nested pages and organize your thoughts
- **Quick Search**: Find anything instantly with the search bar
- **Auto-Save**: Your work is automatically saved as you type

## Getting Started
1. Create new pages using the "New Page" button
2. Organize pages by creating sub-pages
3. Use the sidebar to navigate between pages
4. Search across all your content

## Keyboard Shortcuts
- **Enter** in title: Move to content
- **Tab** in content: Add indentation
- **Ctrl/Cmd + K**: Focus search

 Start creating your workspace and let timetolockin help you stay organized and productive!`;
            await updatePage(welcomePageId, {
              content: welcomeContent,
              blocks: [
                {
                  id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  type: 'text',
                  content: welcomeContent,
                  order: 0,
                }
              ]
            });
            setCurrentPage(welcomePageId);
            console.log('✅ Welcome page created successfully!')
          } else {
            console.error('❌ Failed to create welcome page - no page ID returned')
          }
        } catch (error) {
          console.error('❌ Failed to create welcome page:', error)
        }
      };

      // Small delay to ensure state is stable
      const timer = setTimeout(createWelcomePage, 100);
      return () => clearTimeout(timer);
    }
  }, [loading, error, state.pages, createPage, updatePage, setCurrentPage]);

  // Show loading state while data is being fetched
  if (loading) {
    return (
      <GridBackground className="h-screen overflow-hidden" blurBackground={true}>
        <div className="h-screen flex items-center justify-center">
          <div className="text-center max-w-md px-6">
            <div className="w-12 h-12 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white text-lg mb-2">Loading your workspace...</p>
            <p className="text-gray-400 text-sm">This should only take a few seconds</p>
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
          onCreatePage={() => handleCreatePage()}
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
                if (state.currentSection === 'daily-tasks') {
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
                  return <CalendarDashboard />;
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
                  console.log('📝 Rendering Editor for page:', currentPage.title)
                  return (
                    <Editor
                      key={currentPage.id}
                      page={currentPage}
                      onUpdatePage={updatePage}
                    />
                  );
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
    </GridBackground>
  );
};