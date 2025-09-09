import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { WorkspaceState, Page, DailyTask, FinanceData, HealthData } from '@/types';
import { pagesService, dailyTasksService, workspaceService, financeService, healthService } from '@/lib/database';
import { useAuth } from '@/lib/AuthContextSync';
import { supabase } from './supabase';

const generateId = () => {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
};

export const useWorkspace = () => {
  const { user, session, loading: authLoading } = useAuth();
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<string>('');
  
  // Prevent duplicate loading calls and track loading state
  const isLoadingRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dataLoadedRef = useRef(false);
  const authStateRef = useRef<{ user: any, session: any } | null>(null);

  // Clear all data when user changes
  const clearUserData = useCallback(() => {
    console.log('🧹 Clearing user data for user isolation...');
    setState({
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
    dataLoadedRef.current = false;
  }, []);

  // Load data from Supabase when user logs in
  useEffect(() => {
    console.log('🔄 Workspace effect triggered - Auth loading:', authLoading, 'User:', user?.email, 'Session:', !!session);
    
    // Clear any existing timeout
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }

    // If auth is still loading, don't do anything
    if (authLoading) {
      console.log('⏳ Auth still loading, waiting...');
      return;
    }

    // If no user or session, clear data and stop loading
    if (!user || !session) {
      console.log('👤 No user or session found, clearing data and stopping loading...')
      clearUserData();
      setLoading(false);
      isLoadingRef.current = false;
      lastUserIdRef.current = null;
      authStateRef.current = null;
      return;
    }

    // Check if auth state actually changed
    const currentAuthState = { user, session };
    const authStateChanged = !authStateRef.current || 
      authStateRef.current.user?.id !== user.id || 
      authStateRef.current.session?.access_token !== session.access_token;

    if (!authStateChanged && dataLoadedRef.current) {
      console.log('✅ Auth state unchanged and data already loaded for user:', user.email);
      return;
    }

    // Update auth state reference
    authStateRef.current = currentAuthState;

    // If user changed, clear previous user's data immediately
    if (lastUserIdRef.current && lastUserIdRef.current !== user.id) {
      console.log('🔄 User changed from', lastUserIdRef.current, 'to', user.id);
      console.log('🧹 Clearing previous user data...');
      clearUserData();
      isLoadingRef.current = false;
    }

    // Prevent duplicate loading calls
    if (isLoadingRef.current) {
      console.log('⚠️ Loading already in progress, skipping...');
      return;
    }

    // Set current user ID
    lastUserIdRef.current = user.id;
    isLoadingRef.current = true;
    setLoading(true);
    setError(null);
    
    console.log('👤 Loading data for user:', user.email, 'ID:', user.id)
    
    const loadData = async () => {
      try {
        setLoadingStep('Loading your data...');
        
        // Verify authentication before loading data
        const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !currentUser) {
          console.error('❌ Authentication verification failed:', authError);
          setError('Authentication failed. Please sign in again.');
          setLoading(false);
          isLoadingRef.current = false;
          return;
        }
        
        // Check if user ID still matches (user might have switched)
        if (currentUser.id !== user.id) {
          console.log('⚠️ User ID changed during loading, stopping...');
          setLoading(false);
          isLoadingRef.current = false;
          return;
        }
        
        console.log('✅ Authentication verified for user:', currentUser.email);
        
        // Load data with proper user isolation
        const [pagesResult, tasksResult, financeResult, healthResult] = await Promise.allSettled([
          pagesService.getAll(),
          dailyTasksService.getAll(),
          financeService.getFinanceData(),
          healthService.getHealthData()
        ]);
        
        // Check if user is still the same after loading
        if (lastUserIdRef.current !== user.id) {
          console.log('⚠️ User changed during data loading, ignoring results...');
          setLoading(false);
          isLoadingRef.current = false;
          return;
        }
        
        // Process results
        const pages = pagesResult.status === 'fulfilled' ? pagesResult.value : [];
        const dailyTasks = tasksResult.status === 'fulfilled' ? tasksResult.value : [];
        const financeData = financeResult.status === 'fulfilled' ? financeResult.value : financeService.getDefaultFinanceData();
        const healthData = healthResult.status === 'fulfilled' ? healthResult.value : healthService.getDefaultHealthData();
        
        console.log('📊 Data loaded for user', user.email, '- Pages:', pages.length, 'Tasks:', dailyTasks.length)

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
        dataLoadedRef.current = true;
        console.log('✅ Workspace loaded successfully for user:', user.email)
      } catch (error) {
        console.error('❌ Error loading workspace data for user', user.email, ':', error);
        
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
        console.log('🏁 Loading complete for user:', user.email)
        setLoading(false);
        setLoadingStep('');
        isLoadingRef.current = false;
      }
    };

    // Set a maximum loading time to prevent infinite loading
    loadTimeoutRef.current = setTimeout(() => {
      if (isLoadingRef.current) {
        console.warn('⚠️ Loading timeout reached, stopping...');
        setLoading(false);
        setError('Loading timed out. Please refresh the page.');
        isLoadingRef.current = false;
      }
    }, 8000); // 8 second timeout

    loadData();
    
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
    };
  }, [user, session, authLoading, clearUserData]);

  // Page management
  const createPage = useCallback(async (title: string, parentId?: string, icon?: string) => {
    if (!user) return '';
    
    const pageId = generateId();
    const now = Date.now();
    const newPage: Page = {
      id: pageId,
      title,
      content: '',
      blocks: [],
      children: [],
      icon: icon || 'document',
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
      console.log('🔄 Attempting to save page to database:', { pageId, title, icon, user: user.email });
      const savedPage = await pagesService.create(newPage);
      if (savedPage) {
        console.log('✅ Page created and saved successfully for user:', user.email, 'Title:', title);
      } else {
        console.error('❌ Page creation returned null - database save failed');
        // Remove from local state if database save failed
        setState(prevState => {
          const newPages = { ...prevState.pages };
          delete newPages[pageId];
          return {
            ...prevState,
            pages: newPages,
            rootPages: parentId ? prevState.rootPages : prevState.rootPages.filter(id => id !== pageId),
          };
        });
        return '';
      }
    } catch (error) {
      console.error('❌ Failed to save page for user', user.email, ':', error);
      // Remove from local state if database save failed
      setState(prevState => {
        const newPages = { ...prevState.pages };
        delete newPages[pageId];
        return {
          ...prevState,
          pages: newPages,
          rootPages: parentId ? prevState.rootPages : prevState.rootPages.filter(id => id !== pageId),
        };
      });
      return '';
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
        console.log('✅ Page updated and saved for user:', user.email, 'Page ID:', pageId);
        return true;
      }
    } catch (error) {
      console.error('❌ Failed to update page for user', user.email, ':', error);
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
      console.log('✅ Page deleted for user:', user.email, 'Page ID:', pageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to delete page for user', user.email, ':', error);
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
      console.log('✅ Daily task created and saved for user:', user.email, 'Title:', title);
    } catch (error) {
      console.error('❌ Failed to save daily task for user', user.email, ':', error);
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
        console.log('✅ Daily task updated and saved for user:', user.email, 'Task ID:', taskId);
        return true;
      }
    } catch (error) {
      console.error('❌ Failed to update daily task for user', user.email, ':', error);
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
      console.log('✅ Daily task deleted for user:', user.email, 'Task ID:', taskId);
      return true;
    } catch (error) {
      console.error('❌ Failed to delete daily task for user', user.email, ':', error);
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
        console.log('✅ Finance data updated and saved for user:', user.email);
        return true;
      }
    } catch (error) {
      console.error('❌ Error updating finance data for user', user.email, ':', error);
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
        console.log('✅ Health data updated and saved for user:', user.email);
        return true;
      } else {
        console.error('❌ Some health data failed to save for user', user.email);
        return false;
      }
    } catch (error) {
      console.error('❌ Error updating health data for user', user.email, ':', error);
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
