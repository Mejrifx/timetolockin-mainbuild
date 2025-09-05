import { useState, useCallback, useEffect, useMemo } from 'react';
import { WorkspaceState, Page, DailyTask, FinanceData, HealthData } from '@/types';
import { pagesService, dailyTasksService, workspaceService, financeService, healthService } from '@/lib/database';
import { useAuth } from '@/lib/AuthContext';
import { testSupabaseConnection, showSetupInstructions } from '@/lib/supabaseTest';
import { useQueryCache } from '@/hooks/useQueryCache';
import { useDebounce } from '@/hooks/useDebounce';

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

  // Use cached query for loading workspace data
  const {
    data: workspaceData,
    isLoading: workspaceLoading,
    error: workspaceError,
    refetch: refetchWorkspace,
  } = useQueryCache(
    async () => {
      if (!user) throw new Error('No user found');
      
      // Test connection first
      const connectionOk = await testSupabaseConnection();
      if (!connectionOk) {
        showSetupInstructions();
        throw new Error('Database tables not found. Please run the SQL setup script in your Supabase dashboard.');
      }
      
      return workspaceService.loadWorkspaceData();
    },
    [user?.id],
    {
      ttl: 2 * 60 * 1000, // 2 minutes cache
      staleTime: 30 * 1000, // 30 seconds stale time
      cacheKey: `workspace_${user?.id}`,
    }
  );

  // Update state when workspace data changes
  useEffect(() => {
    if (workspaceData) {
      // Load currentSection from localStorage
      let savedCurrentSection: 'pages' | 'daily-tasks' | 'calendar' | 'finance' | 'health-lab' = 'pages';
      try {
        const saved = localStorage.getItem('currentSection');
        if (saved && ['pages', 'daily-tasks', 'calendar', 'finance', 'health-lab'].includes(saved)) {
          savedCurrentSection = saved as 'pages' | 'daily-tasks' | 'calendar' | 'finance' | 'health-lab';
        }
      } catch (error) {
        console.warn('Failed to load currentSection from localStorage:', error);
      }

      setState(prevState => ({
        ...prevState,
        ...(workspaceData as Partial<WorkspaceState>),
        currentSection: savedCurrentSection,
      }));
    }
  }, [workspaceData]);

  // Handle loading and error states
  useEffect(() => {
    setLoading(workspaceLoading);
    setError(workspaceError?.message || null);
  }, [workspaceLoading, workspaceError]);

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
    setState(prevState => {
      const newState = {
        ...prevState,
        currentSection: section,
        currentPageId: section === 'pages' ? prevState.currentPageId : undefined,
      };
      
      // Persist currentSection to localStorage
      try {
        localStorage.setItem('currentSection', section);
      } catch (error) {
        console.warn('Failed to save currentSection to localStorage:', error);
      }
      
      return newState;
    });
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