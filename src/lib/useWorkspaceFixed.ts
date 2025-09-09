import { useState, useCallback, useEffect, useMemo } from 'react';
import { WorkspaceState, Page, DailyTask, FinanceData, HealthData } from '@/types';
import { pagesService, dailyTasksService, workspaceService, financeService, healthService } from '@/lib/database';
import { useAuth } from '@/lib/AuthContext';
import { testSupabaseConnection, showSetupInstructions } from '@/lib/supabaseTestFixed';

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

  // Load data from Supabase when user logs in
  useEffect(() => {
    let isMounted = true; // Prevent state updates after component unmounts
    
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
          setLoadingStep('Testing database connection...');
        }
        
        // Test connection with shorter timeout
        const connectionTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection test timeout')), 3000)
        );
        
        let connectionOk = false;
        try {
          const result = await Promise.race([
            testSupabaseConnection(),
            connectionTimeout
          ]);
          connectionOk = Boolean(result);
        } catch (error) {
          console.warn('⚠️ Connection test failed, but continuing with data load:', error);
          // Don't fail completely - try to load data anyway
          connectionOk = true;
        }
        
        if (!connectionOk) {
          if (isMounted) {
            showSetupInstructions();
            setError('Database connection failed. Please check your setup.');
            setLoading(false);
          }
          return;
        }
        
        if (isMounted) {
          setLoadingStep('Loading workspace data...');
        }
        
        console.log('✅ Database connection verified, loading workspace data...')
        
        // Load each service individually with timeouts to identify which one fails
        const loadPromises = [
          { name: 'pages', promise: pagesService.getAll() },
          { name: 'dailyTasks', promise: dailyTasksService.getAll() },
          { name: 'finance', promise: financeService.getFinanceData() },
          { name: 'health', promise: healthService.getHealthData() }
        ];
        
        const results: any = {};
        
        for (const { name, promise } of loadPromises) {
          if (!isMounted) break; // Stop if component unmounted
          
          try {
            console.log(`🔄 Loading ${name}...`);
            if (isMounted) {
              setLoadingStep(`Loading ${name}...`);
            }
            
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error(`${name} loading timeout`)), 8000)
            );
            
            results[name] = await Promise.race([promise, timeoutPromise]);
            console.log(`✅ ${name} loaded successfully`);
          } catch (error) {
            console.error(`❌ Failed to load ${name}:`, error);
            results[name] = null;
          }
        }
        
        if (!isMounted) return; // Stop if component unmounted
        
        // Process results safely
        const pages = results.pages || [];
        const dailyTasks = results.dailyTasks || [];
        const financeData = results.finance || financeService.getDefaultFinanceData();
        const healthData = results.health || healthService.getDefaultHealthData();
        
        console.log('📊 Data loaded - Pages:', pages.length, 'Tasks:', dailyTasks.length, 'Finance: loaded', 'Health: loaded')

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
          
          setLoadingStep('Workspace ready!');
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

    loadData();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
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
      const savedPage = await pagesService.create(newPage);
      if (savedPage) {
        console.log('✅ Page created and saved to database');
        return pageId;
      } else {
        console.error('❌ Failed to save page to database');
        return '';
      }
    } catch (error) {
      console.error('❌ Error creating page:', error);
      return '';
    }
  }, [user]);

  const updatePage = useCallback(async (pageId: string, updates: Partial<Page>) => {
    if (!user) return false;

    // Optimistic update
    setState(prevState => {
      if (!prevState.pages[pageId]) return prevState;

      return {
        ...prevState,
        pages: {
          ...prevState.pages,
          [pageId]: {
            ...prevState.pages[pageId],
            ...updates,
            updatedAt: Date.now(),
          },
        },
      };
    });

    // Save to database
    try {
      const success = await pagesService.update(pageId, updates);
      if (success) {
        console.log('✅ Page updated and saved to database');
        return true;
      } else {
        console.error('❌ Failed to save page update to database');
        return false;
      }
    } catch (error) {
      console.error('❌ Error updating page:', error);
      return false;
    }
  }, [user]);

  const deletePage = useCallback(async (pageId: string) => {
    if (!user) return false;

    const page = state.pages[pageId];
    if (!page) return false;

    // Optimistic update
    setState(prevState => {
      const newState = { ...prevState };
      delete newState.pages[pageId];

      // Remove from root pages if it's a root page
      newState.rootPages = newState.rootPages.filter(id => id !== pageId);

      // Remove from parent's children if it has a parent
      if (page.parentId && newState.pages[page.parentId]) {
        newState.pages[page.parentId] = {
          ...newState.pages[page.parentId],
          children: newState.pages[page.parentId].children.filter(id => id !== pageId),
          updatedAt: Date.now(),
        };
      }

      // Clear current page if it's being deleted
      if (newState.currentPageId === pageId) {
        newState.currentPageId = undefined;
      }

      return newState;
    });

    // Delete from database
    try {
      const success = await pagesService.delete(pageId);
      if (success) {
        console.log('✅ Page deleted from database');
        return true;
      } else {
        console.error('❌ Failed to delete page from database');
        return false;
      }
    } catch (error) {
      console.error('❌ Error deleting page:', error);
      return false;
    }
  }, [user, state.pages]);

  const setCurrentPage = useCallback((pageId: string | undefined) => {
    setState(prevState => ({
      ...prevState,
      currentPageId: pageId,
    }));
  }, []);

  const setCurrentSection = useCallback((section: 'pages' | 'daily-tasks' | 'calendar' | 'finance' | 'health-lab') => {
    setState(prevState => ({
      ...prevState,
      currentSection: section,
    }));
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setState(prevState => ({
      ...prevState,
      searchQuery: query,
    }));
  }, []);

  const togglePageExpansion = useCallback((pageId: string) => {
    setState(prevState => {
      if (!prevState.pages[pageId]) return prevState;

      return {
        ...prevState,
        pages: {
          ...prevState.pages,
          [pageId]: {
            ...prevState.pages[pageId],
            isExpanded: !prevState.pages[pageId].isExpanded,
            updatedAt: Date.now(),
          },
        },
      };
    });
  }, []);

  // Daily tasks functions
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
      const success = await dailyTasksService.create(newTask);
      if (success) {
        console.log('✅ Daily task created and saved to database');
        return taskId;
      } else {
        console.error('❌ Failed to save daily task to database');
        return '';
      }
    } catch (error) {
      console.error('❌ Error creating daily task:', error);
      return '';
    }
  }, [user]);

  const updateDailyTask = useCallback(async (taskId: string, updates: Partial<DailyTask>) => {
    if (!user) return false;

    // Optimistic update
    setState(prevState => {
      if (!prevState.dailyTasks[taskId]) return prevState;

      return {
        ...prevState,
        dailyTasks: {
          ...prevState.dailyTasks,
          [taskId]: {
            ...prevState.dailyTasks[taskId],
            ...updates,
            updatedAt: Date.now(),
          },
        },
      };
    });

    // Save to database
    try {
      const success = await dailyTasksService.update(taskId, updates);
      if (success) {
        console.log('✅ Daily task updated and saved to database');
        return true;
      } else {
        console.error('❌ Failed to save daily task update to database');
        return false;
      }
    } catch (error) {
      console.error('❌ Error updating daily task:', error);
      return false;
    }
  }, [user]);

  const toggleTaskCompletion = useCallback(async (taskId: string) => {
    if (!user) return false;

    const task = state.dailyTasks[taskId];
    if (!task) return false;

    const updates = {
      completed: !task.completed,
      completedAt: !task.completed ? Date.now() : undefined,
    };

    return updateDailyTask(taskId, updates);
  }, [user, state.dailyTasks, updateDailyTask]);

  const deleteDailyTask = useCallback(async (taskId: string) => {
    if (!user) return false;

    // Optimistic update
    setState(prevState => {
      const newState = { ...prevState };
      delete newState.dailyTasks[taskId];
      return newState;
    });

    // Delete from database
    try {
      const success = await dailyTasksService.delete(taskId);
      if (success) {
        console.log('✅ Daily task deleted from database');
        return true;
      } else {
        console.error('❌ Failed to delete daily task from database');
        return false;
      }
    } catch (error) {
      console.error('❌ Error deleting daily task:', error);
      return false;
    }
  }, [user]);

  // Finance functions
  const updateFinanceData = useCallback(async (data: Partial<FinanceData>) => {
    if (!user) return false;

    // Optimistic update
    setState(prevState => ({
      ...prevState,
      financeData: {
        ...prevState.financeData,
        ...data,
      },
    }));

    // Save to database
    try {
      // Merge with existing data to ensure we have a complete FinanceData object
      const completeData = {
        ...state.financeData,
        ...data,
      };
      
      const success = await financeService.saveFinanceData(completeData);
      if (success) {
        console.log('✅ Finance data updated and saved to database');
        return true;
      } else {
        console.error('❌ Failed to save finance data to database');
        return false;
      }
    } catch (error) {
      console.error('❌ Error updating finance data:', error);
      return false;
    }
  }, [user]);

  // Health functions
  const updateHealthData = useCallback(async (data: Partial<HealthData>) => {
    if (!user) return false;

    // Optimistic update
    setState(prevState => ({
      ...prevState,
      healthData: {
        ...prevState.healthData,
        ...data,
      },
    }));

    // Save individual components to database
    try {
      let allSuccess = true;
      
      // Save protocols if they exist
      if (data.protocols) {
        for (const protocol of Object.values(data.protocols)) {
          const success = await healthService.saveProtocol(protocol);
          if (!success) allSuccess = false;
        }
      }
      
      // Save quit habits if they exist
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

  // Memoized values
  const filteredPages = useMemo(() => {
    if (!state.searchQuery) return state.rootPages;
    
    const query = state.searchQuery.toLowerCase();
    return state.rootPages.filter(pageId => {
      const page = state.pages[pageId];
      return page && (
        page.title.toLowerCase().includes(query) ||
        page.content.toLowerCase().includes(query)
      );
    });
  }, [state.rootPages, state.pages, state.searchQuery]);

  const filteredDailyTasks = useMemo(() => {
    return Object.values(state.dailyTasks).filter(task => {
      if (!state.searchQuery) return true;
      const query = state.searchQuery.toLowerCase();
      return task.title.toLowerCase().includes(query) ||
             (task.description && task.description.toLowerCase().includes(query));
    });
  }, [state.dailyTasks, state.searchQuery]);

  return {
    state: {
      ...state,
      rootPages: filteredPages,
    },
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
    updateFinanceData,
    updateHealthData,
    filteredDailyTasks,
  };
};
