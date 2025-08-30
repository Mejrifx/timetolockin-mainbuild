import { supabase } from './supabase'
import { Page, DailyTask, WorkspaceState, FinanceData, Wallet, Transaction, Category, Budget, FinanceGoal, FinanceSettings } from '@/types'

// Database service for Pages
export const pagesService = {
  // Fetch all pages for the current user
  async getAll(): Promise<Page[]> {
    console.log('🔍 Fetching pages from database...')
    
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('❌ Error fetching pages:', error)
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return []
    }

    console.log('✅ Pages fetched successfully:', data?.length || 0, 'pages')

    return data.map(dbPage => ({
      id: dbPage.id,
      title: dbPage.title,
      content: dbPage.content,
      // Load structured blocks if present; fallback to empty array
      blocks: (dbPage as any).blocks || [],
      icon: dbPage.icon,
      children: dbPage.children || [],
      parentId: dbPage.parent_id,
      isExpanded: dbPage.is_expanded,
      createdAt: new Date(dbPage.created_at).getTime(),
      updatedAt: new Date(dbPage.updated_at).getTime(),
    }))
  },

  // Create a new page
  async create(page: Omit<Page, 'createdAt' | 'updatedAt'>): Promise<Page | null> {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return null

    const { data, error } = await supabase
      .from('pages')
      .insert({
        id: page.id,
        user_id: userData.user.id,
        title: page.title,
        content: page.content,
        blocks: page.blocks || [],
        icon: page.icon,
        parent_id: page.parentId,
        children: page.children,
        is_expanded: page.isExpanded,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating page:', error)
      return null
    }

    return {
      id: data.id,
      title: data.title,
      content: data.content,
      blocks: (data as any).blocks || [],
      icon: data.icon,
      children: data.children || [],
      parentId: data.parent_id,
      isExpanded: data.is_expanded,
      createdAt: new Date(data.created_at).getTime(),
      updatedAt: new Date(data.updated_at).getTime(),
    }
  },

  // Update an existing page
  async update(pageId: string, updates: Partial<Page>): Promise<boolean> {
    const updateData: any = {}
    
    if (updates.title !== undefined) updateData.title = updates.title
    if (updates.content !== undefined) updateData.content = updates.content
    if (updates.icon !== undefined) updateData.icon = updates.icon
    if (updates.parentId !== undefined) updateData.parent_id = updates.parentId
    if (updates.children !== undefined) updateData.children = updates.children
    if (updates.isExpanded !== undefined) updateData.is_expanded = updates.isExpanded
    if (updates.blocks !== undefined) updateData.blocks = updates.blocks

    const { error } = await supabase
      .from('pages')
      .update(updateData)
      .eq('id', pageId)

    if (error) {
      console.error('Error updating page:', error)
      return false
    }

    return true
  },

  // Delete a page
  async delete(pageId: string): Promise<boolean> {
    const { error } = await supabase
      .from('pages')
      .delete()
      .eq('id', pageId)

    if (error) {
      console.error('Error deleting page:', error)
      return false
    }

    return true
  },
}

// Database service for Daily Tasks
export const dailyTasksService = {
  // Fetch all daily tasks for the current user
  async getAll(): Promise<DailyTask[]> {
    console.log('🔍 Fetching daily tasks from database...')
    
    const { data, error } = await supabase
      .from('daily_tasks')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching daily tasks:', error)
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return []
    }

    console.log('✅ Daily tasks fetched successfully:', data?.length || 0, 'tasks')

    return data.map(dbTask => ({
      id: dbTask.id,
      title: dbTask.title,
      description: dbTask.description || '',
      timeAllocation: dbTask.time_allocation,
      priority: dbTask.priority as DailyTask['priority'],
      category: dbTask.category,
      completed: dbTask.completed,
      streak: 0, // Initialize streak
      createdAt: new Date(dbTask.created_at).getTime(),
      updatedAt: new Date(dbTask.updated_at).getTime(),
    }))
  },

  // Create a new daily task
  async create(task: Omit<DailyTask, 'createdAt' | 'updatedAt'>): Promise<DailyTask | null> {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return null

    const { data, error } = await supabase
      .from('daily_tasks')
      .insert({
        id: task.id,
        user_id: userData.user.id,
        title: task.title,
        description: task.description,
        time_allocation: task.timeAllocation,
        priority: task.priority,
        category: task.category,
        completed: task.completed,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating daily task:', error)
      return null
    }

    return {
      id: data.id,
      title: data.title,
      description: data.description || '',
      timeAllocation: data.time_allocation,
      priority: data.priority as DailyTask['priority'],
      category: data.category,
      completed: data.completed,
      streak: 0, // Initialize streak
      createdAt: new Date(data.created_at).getTime(),
      updatedAt: new Date(data.updated_at).getTime(),
    }
  },

  // Update an existing daily task
  async update(taskId: string, updates: Partial<DailyTask>): Promise<boolean> {
    const updateData: any = {}
    
    if (updates.title !== undefined) updateData.title = updates.title
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.timeAllocation !== undefined) updateData.time_allocation = updates.timeAllocation
    if (updates.priority !== undefined) updateData.priority = updates.priority
    if (updates.category !== undefined) updateData.category = updates.category
    if (updates.completed !== undefined) updateData.completed = updates.completed

    const { error } = await supabase
      .from('daily_tasks')
      .update(updateData)
      .eq('id', taskId)

    if (error) {
      console.error('Error updating daily task:', error)
      return false
    }

    return true
  },

  // Delete a daily task
  async delete(taskId: string): Promise<boolean> {
    const { error } = await supabase
      .from('daily_tasks')
      .delete()
      .eq('id', taskId)

    if (error) {
      console.error('Error deleting daily task:', error)
      return false
    }

    return true
  },

  // Toggle task completion
  async toggleCompletion(taskId: string): Promise<boolean> {
    // First get the current state
    const { data: currentTask, error: fetchError } = await supabase
      .from('daily_tasks')
      .select('completed')
      .eq('id', taskId)
      .single()

    if (fetchError) {
      console.error('Error fetching task for toggle:', fetchError)
      return false
    }

    // Toggle the completion status
    const { error } = await supabase
      .from('daily_tasks')
      .update({ completed: !currentTask.completed })
      .eq('id', taskId)

    if (error) {
      console.error('Error toggling task completion:', error)
      return false
    }

    return true
  },
}

// Profile service for user data
export const profileService = {
  async getProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getProfile:', error);
      return null;
    }
  },

  async updateProfile(userId: string, updates: { username?: string; email?: string }) {
    try {
      // Build update object safely - only include fields that exist
      const updateData: any = {};
      if (updates.email) updateData.email = updates.email;
      if (updates.username) updateData.username = updates.username;
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        return { data: null, error };
      }

      console.log('✅ Profile updated successfully');
      return { data, error: null };
    } catch (error) {
      console.error('Error in updateProfile:', error);
      return { data: null, error };
    }
  },

  async createProfile(userId: string, email: string, username?: string) {
    try {
      // Use upsert to avoid duplicate key errors
      let data, error;
      
      try {
        const result = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            email,
            username: username || email.split('@')[0]
          }, {
            onConflict: 'id'
          })
          .select()
          .single();
        data = result.data;
        error = result.error;
      } catch (usernameError) {
        console.log('⚠️ Username column might not exist, creating basic profile...');
        const result = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            email
          }, {
            onConflict: 'id'
          })
          .select()
          .single();
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('Error creating profile:', error);
        return { data: null, error };
      }

      console.log('✅ Profile created successfully');
      return { data, error: null };
    } catch (error) {
      console.error('Error in createProfile:', error);
      return { data: null, error };
    }
  }
};

// Finance service for managing financial data
export const financeService = {
  // Get finance data for the current user
  async getFinanceData(): Promise<FinanceData> {
    console.log('🔍 Fetching finance data from database...')
    
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      return this.getDefaultFinanceData();
    }

    try {
      const { data, error } = await supabase
        .from('finance_data')
        .select('data')
        .eq('user_id', userData.user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error fetching finance data:', error);
        return this.getDefaultFinanceData();
      }

      if (!data) {
        console.log('💰 No finance data found, creating default...');
        const defaultData = this.getDefaultFinanceData();
        await this.saveFinanceData(defaultData);
        return defaultData;
      }

      console.log('✅ Finance data fetched successfully');
      return data.data || this.getDefaultFinanceData();
    } catch (error) {
      console.error('❌ Error in getFinanceData:', error);
      return this.getDefaultFinanceData();
    }
  },

  // Save finance data
  async saveFinanceData(financeData: FinanceData): Promise<boolean> {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return false

    try {
      const { error } = await supabase
        .from('finance_data')
        .upsert({
          user_id: userData.user.id,
          data: financeData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('❌ Error saving finance data:', error);
        return false;
      }

      console.log('✅ Finance data saved successfully');
      return true;
    } catch (error) {
      console.error('❌ Error in saveFinanceData:', error);
      return false;
    }
  },

  // Get default finance data structure
  getDefaultFinanceData(): FinanceData {
    return {
      wallets: {},
      transactions: {},
      categories: {
        'food': { id: 'food', name: 'Food & Dining', type: 'essential', color: '#ef4444', icon: 'food', isCustom: false, createdAt: Date.now() },
        'housing': { id: 'housing', name: 'Housing & Rent', type: 'essential', color: '#3b82f6', icon: 'housing', isCustom: false, createdAt: Date.now() },
        'education': { id: 'education', name: 'Books & Courses', type: 'growth', color: '#10b981', icon: 'education', isCustom: false, createdAt: Date.now() },
        'shopping': { id: 'shopping', name: 'Shopping', type: 'fun', color: '#f59e0b', icon: 'shopping', isCustom: false, createdAt: Date.now() },
        'transport': { id: 'transport', name: 'Transportation', type: 'essential', color: '#8b5cf6', icon: 'transport', isCustom: false, createdAt: Date.now() },
        'health': { id: 'health', name: 'Health & Fitness', type: 'growth', color: '#06b6d4', icon: 'health', isCustom: false, createdAt: Date.now() },
      },
      budgets: {},
      goals: {},
      settings: {
        defaultCurrency: 'USD',
        reminderEnabled: true,
        weeklyReviewDay: 0, // Sunday
        monthlyReviewDay: 1, // First of month
        mindfulSpendingEnabled: true,
        exportFormat: 'csv',
      }
    };
  }
};

// Workspace data service
export const workspaceService = {
  // Load all user data from database
  async loadWorkspaceData(): Promise<Partial<WorkspaceState>> {
    console.log('🚀 Starting workspace data load...')
    
    try {
      // Use Promise.allSettled to handle any individual query failures gracefully
      const results = await Promise.allSettled([
        pagesService.getAll(),
        dailyTasksService.getAll(),
        financeService.getFinanceData(),
      ])
      
      const pages = results[0].status === 'fulfilled' ? results[0].value : []
      const dailyTasks = results[1].status === 'fulfilled' ? results[1].value : []
      const financeData = results[2].status === 'fulfilled' ? results[2].value : financeService.getDefaultFinanceData()
      
      if (results[0].status === 'rejected') {
        console.warn('⚠️ Failed to load pages:', results[0].reason)
      }
      if (results[1].status === 'rejected') {
        console.warn('⚠️ Failed to load daily tasks:', results[1].reason)
      }
      if (results[2].status === 'rejected') {
        console.warn('⚠️ Failed to load finance data:', results[2].reason)
      }
      
      console.log('📊 Data loaded - Pages:', pages.length, 'Tasks:', dailyTasks.length, 'Finance: loaded')

      // Convert pages array to record and determine root pages
      const pagesRecord: Record<string, Page> = {}
      const rootPages: string[] = []

      pages.forEach(page => {
        pagesRecord[page.id] = page
        if (!page.parentId) {
          rootPages.push(page.id)
        }
      })

      // Convert daily tasks array to record
      const dailyTasksRecord: Record<string, DailyTask> = {}
      dailyTasks.forEach(task => {
        dailyTasksRecord[task.id] = task
      })

      const result: Partial<WorkspaceState> = {
        pages: pagesRecord,
        rootPages,
        dailyTasks: dailyTasksRecord,
        financeData,
        searchQuery: '',
        currentSection: 'pages' as 'pages' | 'daily-tasks' | 'calendar' | 'finance',
      }
      
      console.log('✅ Workspace data loaded successfully:', {
        pagesCount: Object.keys(pagesRecord).length,
        rootPagesCount: rootPages.length,
        tasksCount: Object.keys(dailyTasksRecord).length
      })
      
      return result
    } catch (error) {
      console.error('❌ Error loading workspace data:', error)
      console.error('Full error details:', error)
      
      return {
        pages: {},
        rootPages: [],
        dailyTasks: {},
        financeData: financeService.getDefaultFinanceData(),
        searchQuery: '',
        currentSection: 'pages' as 'pages' | 'daily-tasks' | 'calendar' | 'finance',
      }
    }
  },

  // Sync local changes back to database (for optimistic updates)
  async syncChanges(state: WorkspaceState): Promise<void> {
    try {
      // This could be used for batch updates if needed
      console.log('Workspace state synced:', state)
    } catch (error) {
      console.error('Error syncing changes:', error)
    }
  },
} 