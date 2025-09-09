import { useState, useCallback, useEffect, useMemo } from 'react';
import { WorkspaceState, Page, DailyTask, FinanceData, HealthData } from '@/types';
import { pagesService, dailyTasksService, workspaceService, financeService, healthService } from '@/lib/database';
import { useAuth } from '@/lib/AuthContextFixed';
import { supabase } from './supabase';

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
  const [loadingStep, setLoadingStep] = useState<string>('');

  // Simple database test without complex timeouts
  const testDatabaseConnection = async () => {
    try {
      // Just test if we can query profiles table
      const { error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      return !error;
    } catch (error) {
      console.warn('⚠️ Database test failed:', error);
      return false;
    }
  };

  // Load data from Supabase when user logs in
  useEffect(() => {
    let isMounted = true;
    let loadTimeout: NodeJS.Timeout;
    
    const loadData = async () => {
      if (!user) {
        console.log('👤 No user found, stopping loading...')
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      console.log('👤 User found, starting data load for:', user.email)
      
      try {
        if (isMounted) {
          setError(null);
          setLoadingStep('Connecting to database...');
        }
        
        // Simple database test
        const dbConnected = await testDatabaseConnection();
        if (!dbConnected) {
          console.warn('⚠️ Database connection issue, but continuing...');
        }
        
        if (isMounted) {
          setLoadingStep('Loading your data...');
        }
        
        // Load data with simple approach - no complex timeouts
        const [pagesResult, tasksResult, financeResult, healthResult] = await Promise.allSettled([
          pagesService.getAll(),
          dailyTasksService.getAll(),
          financeService.getFinanceData(),
          healthService.getHealthData()
        ]);
        
        if (!isMounted) return;
        
        // Process results
        const pages = pagesResult.status === 'fulfilled' ? pagesResult.value : [];
        const dailyTasks = tasksResult.status === 'fulfilled' ? tasksResult.value : [];
        const financeData = financeResult.status === 'fulfilled' ? financeResult.value : financeService.getDefaultFinanceData();
        const healthData = healthResult.status === 'fulfilled' ? healthResult.value : healthService.getDefaultHealthData();
        
        console.log('📊 Data loaded - Pages:', pages.length, 'Tasks:', dailyTasks.length)

        // Convert pages array to record and determine root pages
        const pagesRecord: Record<string, Page> = {}
        const rootPages: string[] = []

        pages.forEach((page: Page) => {
          pagesRecord[page.id] = page
          if (!page.parentId) {
            rootPages.push(page.id)
          }
        })

        // Convert daily tasks array to record
        const dailyTasksRecord: Record<string, DailyTask> = {}
        dailyTasks.forEach((task: DailyTask) => {
          dailyTasksRecord[task.id] = task
        })

        if (isMounted) {
          setState(prevState => ({
            ...prevState,
            pages: pagesRecord,
            rootPages,
            dailyTasks: dailyTasksRecord,
            financeData,
            healthData,
            searchQuery: '',
            currentSection: 'pages' as 'pages' | 'daily-tasks' | 'calendar' | 'finance' | 'health-lab',
          }));
          
          setLoadingStep('Ready!');
          console.log('✅ Workspace loaded successfully!')
        }
      } catch (error) {
        console.error('❌ Error loading workspace data:', error);
        
        if (isMounted) {
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
        }
      } finally {
        if (isMounted) {
          console.log('🏁 Loading complete, setting loading to false')
          setLoading(false);
          setLoadingStep('');
        }
      }
    };

    // Set a maximum loading time to prevent infinite loading
    loadTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.warn('⚠️ Loading timeout reached, stopping...');
        setLoading(false);
        setError('Loading timed out. Please refresh the page.');
      }
    }, 15000); // 15 second timeout

    loadData();
    
    return () => {
      isMounted = false;
      clearTimeout(loadTimeout);
    };
  }, [user]);

  // Page management
  const createPage = useCallback(async (title: string, parentId?: string) => {
    if (!user) return '';
    
    const pageId = generateId();
    const now = Date.now();
    const newPage: Page = {
      id: pageId,
      title,
      content: '',
      blocks: [],
      children: [],
      icon: '📄',
      parentId,
      createdAt: now,
      updatedAt: now,
    };

    setState(prevState => ({
      ...prevState,
      pages: { ...prevState.pages, [pageId]: newPage },
      rootPages: parentId ? prevState.rootPages : [...prevState.rootPages, pageId],
    }));

    try {
      await pagesService.create(newPage);
      console.log('✅ Page created and saved:', title);
    } catch (error) {
      console.error('❌ Failed to save page:', error);
    }

    return pageId;
  }, [user]);

  const updatePage = useCallback(async (pageId: string, updates: Partial<Page>) => {
    if (!user) return false;

    setState(prevState => {
      const updatedPages = { ...prevState.pages };
      if (updatedPages[pageId]) {
        updatedPages[pageId] = { ...updatedPages[pageId], ...updates, updatedAt: Date.now() };
      }
      return { ...prevState, pages: updatedPages };
    });

    try {
      const page = state.pages[pageId];
      if (page) {
        const updatedPage = { ...page, ...updates, updatedAt: Date.now() };
        await pagesService.update(pageId, updatedPage);
        console.log('✅ Page updated and saved:', pageId);
        return true;
      }
    } catch (error) {
      console.error('❌ Failed to update page:', error);
    }

    return false;
  }, [user, state.pages]);

  const deletePage = useCallback(async (pageId: string) => {
    if (!user) return false;

    setState(prevState => {
      const updatedPages = { ...prevState.pages };
      delete updatedPages[pageId];
      
      const updatedRootPages = prevState.rootPages.filter(id => id !== pageId);
      
      return {
        ...prevState,
        pages: updatedPages,
        rootPages: updatedRootPages,
        currentPageId: prevState.currentPageId === pageId ? undefined : prevState.currentPageId,
      };
    });

    try {
      await pagesService.delete(pageId);
      console.log('✅ Page deleted:', pageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to delete page:', error);
    }

    return false;
  }, [user]);

  // Daily tasks management
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
      category,
      completed: false,
      streak: 0,
      createdAt: now,
      updatedAt: now,
    };

    setState(prevState => ({
      ...prevState,
      dailyTasks: { ...prevState.dailyTasks, [taskId]: newTask },
    }));

    try {
      await dailyTasksService.create(newTask);
      console.log('✅ Daily task created and saved:', title);
    } catch (error) {
      console.error('❌ Failed to save daily task:', error);
    }

    return taskId;
  }, [user]);

  const updateDailyTask = useCallback(async (taskId: string, updates: Partial<DailyTask>) => {
    if (!user) return false;

    setState(prevState => {
      const updatedTasks = { ...prevState.dailyTasks };
      if (updatedTasks[taskId]) {
        updatedTasks[taskId] = { ...updatedTasks[taskId], ...updates, updatedAt: Date.now() };
      }
      return { ...prevState, dailyTasks: updatedTasks };
    });

    try {
      const task = state.dailyTasks[taskId];
      if (task) {
        const updatedTask = { ...task, ...updates, updatedAt: Date.now() };
        await dailyTasksService.update(taskId, updatedTask);
        console.log('✅ Daily task updated and saved:', taskId);
        return true;
      }
    } catch (error) {
      console.error('❌ Failed to update daily task:', error);
    }

    return false;
  }, [user, state.dailyTasks]);

  const deleteDailyTask = useCallback(async (taskId: string) => {
    if (!user) return false;

    setState(prevState => {
      const updatedTasks = { ...prevState.dailyTasks };
      delete updatedTasks[taskId];
      return { ...prevState, dailyTasks: updatedTasks };
    });

    try {
      await dailyTasksService.delete(taskId);
      console.log('✅ Daily task deleted:', taskId);
      return true;
    } catch (error) {
      console.error('❌ Failed to delete daily task:', error);
    }

    return false;
  }, [user]);

  // Finance data management
  const updateFinanceData = useCallback(async (data: Partial<FinanceData>) => {
    if (!user) return false;

    setState(prevState => ({
      ...prevState,
      financeData: {
        ...prevState.financeData,
        ...data,
      },
    }));

    try {
      const completeData = {
        ...state.financeData,
        ...data,
      };
      const success = await financeService.saveFinanceData(completeData);
      if (success) {
        console.log('✅ Finance data updated and saved');
        return true;
      }
    } catch (error) {
      console.error('❌ Error updating finance data:', error);
    }

    return false;
  }, [user, state.financeData]);

  // Health data management
  const updateHealthData = useCallback(async (data: Partial<HealthData>) => {
    if (!user) return false;

    setState(prevState => ({
      ...prevState,
      healthData: {
        ...prevState.healthData,
        ...data,
      },
    }));

    try {
      let allSuccess = true;
      if (data.protocols) {
        for (const protocol of Object.values(data.protocols)) {
          const success = await healthService.saveProtocol(protocol);
          if (!success) allSuccess = false;
        }
      }
      if (data.quitHabits) {
        for (const habit of Object.values(data.quitHabits)) {
          const success = await healthService.saveQuitHabit(habit);
          if (!success) allSuccess = false;
        }
      }
      if (allSuccess) {
        console.log('✅ Health data updated and saved to database');
        return true;
      } else {
        console.error('❌ Some health data failed to save to database');
        return false;
      }
    } catch (error) {
      console.error('❌ Error updating health data:', error);
      return false;
    }
  }, [user]);

  // Other handlers
  const setCurrentPageId = useCallback((pageId: string | undefined) => {
    setState(prevState => ({ ...prevState, currentPageId: pageId }));
  }, []);

  const setCurrentSection = useCallback((section: 'pages' | 'daily-tasks' | 'calendar' | 'finance' | 'health-lab') => {
    setState(prevState => ({ ...prevState, currentSection: section }));
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setState(prevState => ({ ...prevState, searchQuery: query }));
  }, []);

  // Additional methods expected by Workspace component
  const setCurrentPage = useCallback((pageId: string) => {
    setState(prevState => ({ 
      ...prevState, 
      currentPageId: pageId 
    }));
  }, []);

  const togglePageExpansion = useCallback((pageId: string) => {
    setState(prevState => {
      const updatedPages = { ...prevState.pages };
      if (updatedPages[pageId]) {
        updatedPages[pageId] = { 
          ...updatedPages[pageId], 
          isExpanded: !updatedPages[pageId].isExpanded 
        };
      }
      return { ...prevState, pages: updatedPages };
    });
  }, []);

  const toggleTaskCompletion = useCallback(async (taskId: string) => {
    if (!user) return false;

    const task = state.dailyTasks[taskId];
    if (!task) return false;

    const updates = {
      completed: !task.completed,
      completedAt: !task.completed ? Date.now() : undefined,
      streak: !task.completed ? task.streak + 1 : Math.max(0, task.streak - 1)
    };

    return await updateDailyTask(taskId, updates);
  }, [user, state.dailyTasks, updateDailyTask]);

  // Computed values
  const currentPage = useMemo(() => {
    return state.currentPageId ? state.pages[state.currentPageId] : undefined;
  }, [state.currentPageId, state.pages]);

  const filteredPages = useMemo(() => {
    if (!state.searchQuery) return state.rootPages;
    return state.rootPages.filter(pageId => {
      const page = state.pages[pageId];
      return page?.title.toLowerCase().includes(state.searchQuery.toLowerCase());
    });
  }, [state.rootPages, state.pages, state.searchQuery]);

  const filteredDailyTasks = useMemo(() => {
    if (!state.searchQuery) return Object.values(state.dailyTasks);
    return Object.values(state.dailyTasks).filter(task =>
      task.title.toLowerCase().includes(state.searchQuery.toLowerCase())
    );
  }, [state.dailyTasks, state.searchQuery]);

  return {
    // State
    state,
    pages: state.pages,
    rootPages: state.rootPages,
    currentPageId: state.currentPageId,
    currentPage,
    currentSection: state.currentSection,
    searchQuery: state.searchQuery,
    dailyTasks: state.dailyTasks,
    financeData: state.financeData,
    healthData: state.healthData,
    loading,
    error,
    loadingStep,
    
    // Filtered data
    filteredPages,
    filteredDailyTasks,
    
    // Page actions
    createPage,
    updatePage,
    deletePage,
    setCurrentPageId,
    setCurrentPage,
    togglePageExpansion,
    
    // Daily task actions
    createDailyTask,
    updateDailyTask,
    deleteDailyTask,
    toggleTaskCompletion,
    
    // Data actions
    updateFinanceData,
    updateHealthData,
    
    // UI actions
    setCurrentSection,
    setSearchQuery,
  };
};
