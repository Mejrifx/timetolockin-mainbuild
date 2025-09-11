import { useState, useCallback, useEffect, useMemo } from 'react';
import { WorkspaceState, Page, DailyTask, FinanceData, HealthData } from '@/types';
import { pagesService, dailyTasksService, workspaceService, financeService, healthService } from '@/lib/database';
import { useAuth } from '@/lib/AuthContext';
import { testSupabaseConnection, showSetupInstructions } from '@/lib/supabaseTest';

const generateId = () => {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
};

export const useWorkspace = () => {
  const { user } = useAuth();
  const [state, setState] = useState<WorkspaceState>({
    pages: {},
    rootPages: [],
    currentPageId: undefined,
    currentSection: 'pages',
    searchQuery: '',
    dailyTasks: {},
    calendarEvents: {},
    financeData: financeService.getDefaultFinanceData(),
    healthData: {
      protocols: {},
      quitHabits: {},
      settings: {
        reminderEnabled: true,
        weeklyReviewDay: 0,
        notificationEnabled: true,
      },
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data from Supabase when user logs in
  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        console.log('👤 No user found, stopping loading...')
        setLoading(false);
        return;
      }

      console.log('👤 User found, starting data load for:', user.email)
      
      try {
        setError(null); // Clear any previous errors
        
        // First test the Supabase connection and ensure user profile exists
        console.log('🔧 Testing Supabase setup...')
        const connectionOk = await testSupabaseConnection();
        
        if (!connectionOk) {
          showSetupInstructions();
          setError('Database tables not found. Please run the SQL setup script in your Supabase dashboard.');
          return;
        }
        
        console.log('✅ Database setup verified, loading workspace data...')
        
        // Load workspace data with timeout
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Loading timeout after 10 seconds')), 10000)
        );
        
        const dataPromise = workspaceService.loadWorkspaceData();
        
        const workspaceData = await Promise.race([dataPromise, timeoutPromise]);
        
        console.log('📦 Setting workspace data...')
        setState(prevState => ({
          ...prevState,
          ...(workspaceData as Partial<WorkspaceState>),
        }));
        
        console.log('✅ Workspace loaded successfully!')
      } catch (error) {
        console.error('❌ Error loading workspace data:', error);
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setError(`Failed to load workspace: ${errorMessage}`);
        
        // Set default empty state on error
        setState(prevState => ({
          ...prevState,
          pages: {},
          rootPages: [],
          dailyTasks: {},
          financeData: financeService.getDefaultFinanceData(),
          healthData: {
            protocols: {},
            quitHabits: {},
            settings: {
              reminderEnabled: true,
              weeklyReviewDay: 0,
              notificationEnabled: true,
            },
          },
          searchQuery: '',
          currentSection: 'pages',
        }));
      } finally {
        console.log('🏁 Loading complete, setting loading to false')
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const createPage = useCallback(async (title: string, parentId?: string) => {
    if (!user) return '';

    const pageId = generateId();
    const now = Date.now();
    
    // Create page object
    const newPage: Page = {
      id: pageId,
      title,
      content: '',
      icon: 'document',
      children: [],
      parentId,
      isExpanded: false,
      blocks: [], // Initialize empty blocks array
      createdAt: now,
      updatedAt: now,
    };

    // Optimistic update
    setState(prevState => {
      const newState = {
        ...prevState,
        pages: {
          ...prevState.pages,
          [pageId]: newPage,
        },
      };

      if (parentId) {
        // Add to parent's children
        if (newState.pages[parentId]) {
          newState.pages[parentId] = {
            ...newState.pages[parentId],
            children: [...newState.pages[parentId].children, pageId],
            updatedAt: now,
          };
        }
      } else {
        // Add to root pages
        newState.rootPages = [...newState.rootPages, pageId];
      }

      return newState;
    });

    // Save to database
    try {
      await pagesService.create(newPage);
      
      // Update parent if needed
      if (parentId) {
        const parentPage = state.pages[parentId];
        if (parentPage) {
          await pagesService.update(parentId, {
            children: [...parentPage.children, pageId],
          });
        }
      }
    } catch (error) {
      console.error('Error creating page:', error);
      // Rollback optimistic update on error
      setState(prevState => {
        const newState = { ...prevState };
        delete newState.pages[pageId];
        
        if (!parentId) {
          newState.rootPages = newState.rootPages.filter(id => id !== pageId);
        }
        
        return newState;
      });
      return '';
    }

    return pageId;
  }, [user, state.pages]);

  const updatePage = useCallback(async (pageId: string, updates: Partial<Page>) => {
    if (!user) return;

    const updatedPage = {
      ...updates,
      updatedAt: Date.now(),
    };

    // Optimistic update
    setState(prevState => ({
      ...prevState,
      pages: {
        ...prevState.pages,
        [pageId]: {
          ...prevState.pages[pageId],
          ...updatedPage,
        },
      },
    }));

    // Save to database
    try {
      await pagesService.update(pageId, updatedPage);
    } catch (error) {
      console.error('Error updating page:', error);
      // Could implement rollback here if needed
    }
  }, [user]);

  const deletePage = useCallback(async (pageId: string) => {
    if (!user) return;

    const pageToDelete = state.pages[pageId];
    if (!pageToDelete) return;

    // Store reference for potential rollback
    const originalState = state;

    // Optimistic update
    setState(prevState => {
      const newState = { ...prevState };
      
      // Remove from parent's children or root pages
      if (pageToDelete.parentId) {
        const parent = newState.pages[pageToDelete.parentId];
        if (parent) {
          newState.pages[pageToDelete.parentId] = {
            ...parent,
            children: parent.children.filter(id => id !== pageId),
            updatedAt: Date.now(),
          };
        }
      } else {
        newState.rootPages = newState.rootPages.filter(id => id !== pageId);
      }

      // Delete the page and all its children recursively
      const deleteRecursively = (id: string) => {
        const page = newState.pages[id];
        if (page) {
          page.children.forEach(deleteRecursively);
          delete newState.pages[id];
        }
      };

      deleteRecursively(pageId);

      // Clear current page if it was deleted
      if (newState.currentPageId === pageId) {
        newState.currentPageId = undefined;
      }

      return newState;
    });

    // Save to database
    try {
      await pagesService.delete(pageId);
      
      // Update parent if needed
      if (pageToDelete.parentId) {
        const parent = originalState.pages[pageToDelete.parentId];
        if (parent) {
          await pagesService.update(pageToDelete.parentId, {
            children: parent.children.filter(id => id !== pageId),
          });
        }
      }
    } catch (error) {
      console.error('Error deleting page:', error);
      // Rollback on error
      setState(originalState);
    }
  }, [user, state]);

  const setCurrentPage = useCallback((pageId: string) => {
    setState(prevState => ({
      ...prevState,
      currentPageId: pageId,
      currentSection: 'pages',
    }));
  }, []);

  const setCurrentSection = useCallback((section: 'pages' | 'daily-tasks' | 'calendar' | 'finance' | 'health-lab') => {
    setState(prevState => ({
      ...prevState,
      currentSection: section,
      currentPageId: section === 'pages' ? prevState.currentPageId : undefined,
    }));
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setState(prevState => ({
      ...prevState,
      searchQuery: query,
    }));
  }, []);

  const togglePageExpansion = useCallback((pageId: string) => {
    setState(prevState => ({
      ...prevState,
      pages: {
        ...prevState.pages,
        [pageId]: {
          ...prevState.pages[pageId],
          isExpanded: !prevState.pages[pageId]?.isExpanded,
        },
      },
    }));
  }, []);

  const createDailyTask = useCallback(async (title: string, timeAllocation: number, priority: DailyTask['priority'], category: string, description?: string) => {
    if (!user) return '';

    const taskId = generateId();
    const now = Date.now();
    
    const newTask: DailyTask = {
      id: taskId,
      title,
      description: description || '',
      timeAllocation,
      priority,
      completed: false,
      streak: 0, // Initialize streak
      createdAt: now,
      updatedAt: now,
      category,
    };

    // Optimistic update
    setState(prevState => ({
      ...prevState,
      dailyTasks: {
        ...prevState.dailyTasks,
        [taskId]: newTask,
      },
    }));

    // Save to database
    try {
      await dailyTasksService.create(newTask);
    } catch (error) {
      console.error('Error creating daily task:', error);
      // Rollback on error
      setState(prevState => {
        const newTasks = { ...prevState.dailyTasks };
        delete newTasks[taskId];
        return {
          ...prevState,
          dailyTasks: newTasks,
        };
      });
      return '';
    }

    return taskId;
  }, [user]);

  const updateDailyTask = useCallback(async (taskId: string, updates: Partial<DailyTask>) => {
    if (!user) return;

    const updatedTask = {
      ...updates,
    };

    // Optimistic update
    setState(prevState => ({
      ...prevState,
      dailyTasks: {
        ...prevState.dailyTasks,
        [taskId]: {
          ...prevState.dailyTasks[taskId],
          ...updatedTask,
        },
      },
    }));

    // Save to database
    try {
      await dailyTasksService.update(taskId, updatedTask);
    } catch (error) {
      console.error('Error updating daily task:', error);
      // Could implement rollback here if needed
    }
  }, [user]);

  const toggleTaskCompletion = useCallback(async (taskId: string) => {
    if (!user) return;

    const task = state.dailyTasks[taskId];
    if (!task) return;

    const isCompleting = !task.completed;
    const updates: Partial<DailyTask> = {
      completed: isCompleting,
    };

    // Optimistic update
    setState(prevState => ({
      ...prevState,
      dailyTasks: {
        ...prevState.dailyTasks,
        [taskId]: {
          ...prevState.dailyTasks[taskId],
          ...updates,
        },
      },
    }));

    // Save to database
    try {
      await dailyTasksService.toggleCompletion(taskId);
    } catch (error) {
      console.error('Error toggling task completion:', error);
      // Rollback on error
      setState(prevState => ({
        ...prevState,
        dailyTasks: {
          ...prevState.dailyTasks,
          [taskId]: {
            ...prevState.dailyTasks[taskId],
            completed: task.completed, // Revert to original state
          },
        },
      }));
    }
  }, [user, state.dailyTasks]);

  const deleteDailyTask = useCallback(async (taskId: string) => {
    if (!user) return;

    const taskToDelete = state.dailyTasks[taskId];
    if (!taskToDelete) return;

    // Optimistic update
    setState(prevState => {
      const newTasks = { ...prevState.dailyTasks };
      delete newTasks[taskId];
      return {
        ...prevState,
        dailyTasks: newTasks,
      };
    });

    // Save to database
    try {
      await dailyTasksService.delete(taskId);
    } catch (error) {
      console.error('Error deleting daily task:', error);
      // Rollback on error
      setState(prevState => ({
        ...prevState,
        dailyTasks: {
          ...prevState.dailyTasks,
          [taskId]: taskToDelete,
        },
      }));
    }
  }, [user, state.dailyTasks]);

  const updateFinanceData = useCallback(async (updates: Partial<FinanceData>) => {
    if (!user) return;

    // Optimistic update
    setState(prevState => ({
      ...prevState,
      financeData: {
        ...prevState.financeData,
        ...updates,
      },
    }));

    // Save to database
    try {
      const newFinanceData = {
        ...state.financeData,
        ...updates,
      };
      await financeService.saveFinanceData(newFinanceData);
    } catch (error) {
      console.error('Error updating finance data:', error);
      // Could implement rollback here if needed
    }
  }, [user, state.financeData]);

  const updateHealthData = useCallback(async (updates: Partial<HealthData>) => {
    if (!user) return;

    // Optimistic update
    setState(prevState => ({
      ...prevState,
      healthData: {
        ...prevState.healthData,
        ...updates,
      },
    }));

    // Save to database
    try {
      if (updates.protocols) {
        for (const protocol of Object.values(updates.protocols)) {
          await healthService.saveProtocol(protocol);
        }
      }
      if (updates.quitHabits) {
        for (const habit of Object.values(updates.quitHabits)) {
          await healthService.saveQuitHabit(habit);
        }
      }
    } catch (error) {
      console.error('Error updating health data:', error);
      // Could implement rollback here if needed
    }
  }, [user, state.healthData]);

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(() => ({
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
  }), [
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
  ]);
};