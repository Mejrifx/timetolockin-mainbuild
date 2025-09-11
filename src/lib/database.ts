import { supabase } from './supabase'
import { Page, DailyTask, WorkspaceState, FinanceData, Wallet, Transaction, Category, Budget, FinanceGoal, FinanceSettings, HealthData, HealthProtocol, QuitHabit, HealthSettings, CalendarEvent } from '@/types'

// Database service for Pages
export const pagesService = {
  // Fetch all pages for the current user
  async getAll(): Promise<Page[]> {
    console.log('🔍 Fetching pages from database...')
    
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      console.log('👤 No user found, returning empty pages array')
      return []
    }
    
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .eq('user_id', userData.user.id)
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

    console.log('✅ Pages fetched successfully:', data?.length || 0, 'pages for user:', userData.user.id)

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
    console.log('🔄 pagesService.create called with:', { pageId: page.id, title: page.title, icon: page.icon });
    
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      console.error('❌ No user found in pagesService.create');
      return null
    }

    console.log('👤 User found for page creation:', userData.user.id);

    // Get or create default workspace for user
    let workspaceId = await this.getOrCreateDefaultWorkspace(userData.user.id);
    if (!workspaceId) {
      console.error('❌ Failed to get or create workspace for user');
      return null;
    }

    const pageData = {
      id: page.id,
      user_id: userData.user.id,
      workspace_id: workspaceId,
      title: page.title,
      content: page.content,
      blocks: page.blocks || [],
      icon: page.icon,
      parent_id: page.parentId,
      children: page.children,
      is_expanded: page.isExpanded,
    };

    console.log('📝 Inserting page data:', pageData);

    const { data, error } = await supabase
      .from('pages')
      .insert(pageData)
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating page in database:', error)
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return null
    }

    console.log('✅ Page successfully created in database:', data);

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

  // Get or create default workspace for user
  async getOrCreateDefaultWorkspace(userId: string): Promise<string | null> {
    console.log('🔄 Getting or creating default workspace for user:', userId);
    
    try {
      // First, try to get existing workspace
      const { data: existingWorkspace, error: fetchError } = await supabase
        .from('workspaces')
        .select('id')
        .eq('user_id', userId)
        .eq('is_default', true)
        .single();

      if (existingWorkspace && !fetchError) {
        console.log('✅ Found existing default workspace:', existingWorkspace.id);
        return existingWorkspace.id;
      }

      // If no default workspace exists, create one
      console.log('🔄 Creating new default workspace for user:', userId);
      const workspaceId = crypto.randomUUID();
      
      const { data: newWorkspace, error: createError } = await supabase
        .from('workspaces')
        .insert({
          id: workspaceId,
          user_id: userId,
          name: 'My Workspace',
          is_default: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating workspace:', createError);
        return null;
      }

      console.log('✅ Created new default workspace:', newWorkspace.id);
      return newWorkspace.id;
    } catch (error) {
      console.error('❌ Error in getOrCreateDefaultWorkspace:', error);
      return null;
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
    console.log('🔄 Deleting page from database:', pageId);
    
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      console.error('❌ No user found for page deletion');
      return false
    }

    console.log('👤 User found for page deletion:', userData.user.id);

    const { error } = await supabase
      .from('pages')
      .delete()
      .eq('id', pageId)
      .eq('user_id', userData.user.id)

    if (error) {
      console.error('❌ Error deleting page from database:', error)
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return false
    }

    console.log('✅ Page successfully deleted from database:', pageId);
    return true
  },
}

// Database service for Daily Tasks
export const dailyTasksService = {
  // Fetch all daily tasks for the current user
  async getAll(): Promise<DailyTask[]> {
    console.log('🔍 Fetching daily tasks from database...')
    
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      console.log('👤 No user found, returning empty daily tasks array')
      return []
    }
    
    const { data, error } = await supabase
      .from('daily_tasks')
      .select('*')
      .eq('user_id', userData.user.id)
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

    console.log('✅ Daily tasks fetched successfully:', data?.length || 0, 'tasks for user:', userData.user.id)

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

// Database service for Calendar Events
export const calendarService = {
  // Fetch all calendar events for the current user
  async getAll(): Promise<CalendarEvent[]> {
    console.log('🔍 Fetching calendar events from database...')
    
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      console.log('👤 No user found, returning empty calendar events array')
      return []
    }
    
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userData.user.id)
      .order('event_date', { ascending: true })

    if (error) {
      console.error('❌ Error fetching calendar events:', error)
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return []
    }

    console.log('✅ Calendar events fetched successfully:', data?.length || 0, 'events for user:', userData.user.id)

    return data.map(dbEvent => ({
      id: dbEvent.id,
      title: dbEvent.title,
      description: dbEvent.description || undefined,
      eventDate: dbEvent.event_date,
      eventTime: dbEvent.event_time || undefined,
      createdAt: new Date(dbEvent.created_at).getTime(),
      updatedAt: new Date(dbEvent.updated_at).getTime(),
    }))
  },

  // Create a new calendar event
  async create(event: Omit<CalendarEvent, 'createdAt' | 'updatedAt'>): Promise<CalendarEvent | null> {
    console.log('➕ Creating calendar event:', event.title, 'for user')
    
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      console.log('👤 No user found, cannot create calendar event')
      return null
    }

    const dbEvent = {
      id: event.id,
      user_id: userData.user.id,
      title: event.title,
      description: event.description || null,
      event_date: event.eventDate,
      event_time: event.eventTime || null,
    }

    const { data, error } = await supabase
      .from('calendar_events')
      .insert(dbEvent)
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating calendar event:', error)
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return null
    }

    console.log('✅ Calendar event created successfully:', data.id)

    return {
      id: data.id,
      title: data.title,
      description: data.description || undefined,
      eventDate: data.event_date,
      eventTime: data.event_time || undefined,
      createdAt: new Date(data.created_at).getTime(),
      updatedAt: new Date(data.updated_at).getTime(),
    }
  },

  // Update a calendar event
  async update(eventId: string, updates: Partial<Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>>): Promise<boolean> {
    console.log('🔄 Updating calendar event:', eventId)
    
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      console.log('👤 No user found, cannot update calendar event')
      return false
    }

    const dbUpdates: any = {}
    if (updates.title !== undefined) dbUpdates.title = updates.title
    if (updates.description !== undefined) dbUpdates.description = updates.description
    if (updates.eventDate !== undefined) dbUpdates.event_date = updates.eventDate
    if (updates.eventTime !== undefined) dbUpdates.event_time = updates.eventTime
    dbUpdates.updated_at = new Date().toISOString()

    const { error } = await supabase
      .from('calendar_events')
      .update(dbUpdates)
      .eq('id', eventId)
      .eq('user_id', userData.user.id)

    if (error) {
      console.error('❌ Error updating calendar event:', error)
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return false
    }

    console.log('✅ Calendar event updated successfully:', eventId)
    return true
  },

  // Delete a calendar event
  async delete(eventId: string): Promise<boolean> {
    console.log('🗑️ Deleting calendar event:', eventId)
    
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      console.log('👤 No user found, cannot delete calendar event')
      return false
    }

    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', eventId)
      .eq('user_id', userData.user.id)

    if (error) {
      console.error('❌ Error deleting calendar event:', error)
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return false
    }

    console.log('✅ Calendar event deleted successfully:', eventId)
    return true
  }
};

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

// Health service for managing health lab data
export const healthService = {
  // Get health data for the current user
  async getHealthData(): Promise<HealthData> {
    console.log('🔍 Fetching health data from database...')
    
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      console.log('👤 No user found, returning default health data')
      return this.getDefaultHealthData();
    }

    try {
      console.log('🔄 Querying health tables for user:', userData.user.id)
      
      // Use sequential queries for better reliability instead of Promise.allSettled
      console.log('🔍 Fetching health protocols...')
      const { data: protocolsData, error: protocolsError } = await supabase
        .from('health_protocols')
        .select('*')
        .eq('user_id', userData.user.id);

      console.log('🔍 Fetching quit habits...')
      const { data: habitsData, error: habitsError } = await supabase
        .from('quit_habits')
        .select('*')
        .eq('user_id', userData.user.id);

      console.log('🔍 Fetching health settings...')
      const { data: settingsData, error: settingsError } = await supabase
        .from('health_settings')
        .select('*')
        .eq('user_id', userData.user.id)
        .single();

      // Log results for debugging
      console.log('📊 Health query results:', {
        protocols: protocolsError ? 'error' : 'success',
        habits: habitsError ? 'error' : 'success', 
        settings: settingsError ? 'error' : 'success'
      });

      if (protocolsError) {
        console.error('❌ Failed to fetch protocols:', protocolsError);
      }
      if (habitsError) {
        console.error('❌ Failed to fetch habits:', habitsError);
      }
      if (settingsError && settingsError.code !== 'PGRST116') {
        console.error('❌ Failed to fetch settings:', settingsError);
      }

      // Convert protocols
      const protocols: Record<string, HealthProtocol> = {};
      if (protocolsData) {
        protocolsData.forEach(dbProtocol => {
          protocols[dbProtocol.id] = {
            id: dbProtocol.id,
            title: dbProtocol.title,
            description: dbProtocol.description || '',
            content: dbProtocol.content,
            category: dbProtocol.category as HealthProtocol['category'],
            isExpanded: dbProtocol.is_expanded,
            isCompleted: dbProtocol.is_completed,
            completedAt: dbProtocol.completed_at ? new Date(dbProtocol.completed_at).getTime() : undefined,
            createdAt: new Date(dbProtocol.created_at).getTime(),
            updatedAt: new Date(dbProtocol.updated_at).getTime(),
          };
        });
      }

      // Convert quit habits
      const quitHabits: Record<string, QuitHabit> = {};
      if (habitsData) {
        habitsData.forEach(dbHabit => {
          quitHabits[dbHabit.id] = {
            id: dbHabit.id,
            name: dbHabit.name,
            description: dbHabit.description || '',
            quitDate: new Date(dbHabit.quit_date).getTime(),
            category: dbHabit.category as QuitHabit['category'],
            customCategory: dbHabit.custom_category,
            isActive: dbHabit.is_active,
            milestones: dbHabit.milestones || [],
            createdAt: new Date(dbHabit.created_at).getTime(),
          };
        });
      }

      // Convert settings
      let settings = this.getDefaultHealthData().settings;
      if (settingsData) {
        settings = {
          reminderEnabled: settingsData.reminder_enabled,
          dailyCheckInTime: settingsData.daily_checkin_time,
          weeklyReviewDay: settingsData.weekly_review_day,
          notificationEnabled: settingsData.notification_enabled,
        };
      }

      console.log('✅ Health data fetched successfully');
      console.log('📊 Health data summary:', {
        protocolCount: Object.keys(protocols).length,
        habitCount: Object.keys(quitHabits).length,
        settingsLoaded: !!settingsData
      });
      
      // Debug: Log the actual quit habits data
      if (Object.keys(quitHabits).length > 0) {
        console.log('🔍 Quit habits found:', Object.values(quitHabits));
      } else {
        console.log('⚠️ No quit habits found in database');
      }
      
      return { protocols, quitHabits, settings };
    } catch (error) {
      console.error('❌ Error in getHealthData:', error);
      return this.getDefaultHealthData();
    }
  },

  // Save health protocol
  async saveProtocol(protocol: HealthProtocol): Promise<boolean> {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return false

    try {
      const { error } = await supabase
        .from('health_protocols')
        .upsert({
          id: protocol.id,
          user_id: userData.user.id,
          title: protocol.title,
          description: protocol.description,
          content: protocol.content,
          category: protocol.category,
          is_expanded: protocol.isExpanded,
          is_completed: protocol.isCompleted,
          completed_at: protocol.completedAt ? new Date(protocol.completedAt).toISOString() : null,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('❌ Error saving protocol:', error);
        return false;
      }

      console.log('✅ Protocol saved successfully');
      return true;
    } catch (error) {
      console.error('❌ Error in saveProtocol:', error);
      return false;
    }
  },

  // Save quit habit
  async saveQuitHabit(habit: QuitHabit): Promise<boolean> {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return false

    try {
      const { error } = await supabase
        .from('quit_habits')
        .upsert({
          id: habit.id,
          user_id: userData.user.id,
          name: habit.name,
          description: habit.description,
          quit_date: new Date(habit.quitDate).toISOString(),
          category: habit.category,
          custom_category: habit.customCategory,
          is_active: habit.isActive,
          milestones: habit.milestones,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('❌ Error saving quit habit:', error);
        return false;
      }

      console.log('✅ Quit habit saved successfully');
      return true;
    } catch (error) {
      console.error('❌ Error in saveQuitHabit:', error);
      return false;
    }
  },

  // Delete protocol
  async deleteProtocol(protocolId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('health_protocols')
        .delete()
        .eq('id', protocolId);

      if (error) {
        console.error('❌ Error deleting protocol:', error);
        return false;
      }

      console.log('✅ Protocol deleted successfully');
      return true;
    } catch (error) {
      console.error('❌ Error in deleteProtocol:', error);
      return false;
    }
  },

  // Delete quit habit
  async deleteQuitHabit(habitId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('quit_habits')
        .delete()
        .eq('id', habitId);

      if (error) {
        console.error('❌ Error deleting quit habit:', error);
        return false;
      }

      console.log('✅ Quit habit deleted successfully');
      return true;
    } catch (error) {
      console.error('❌ Error in deleteQuitHabit:', error);
      return false;
    }
  },

  // Get default health data structure
  getDefaultHealthData(): HealthData {
    return {
      protocols: {},
      quitHabits: {},
      settings: {
        reminderEnabled: true,
        weeklyReviewDay: 0,
        notificationEnabled: true,
      },
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
        calendarService.getAll(),
        financeService.getFinanceData(),
        healthService.getHealthData(),
      ])
      
      const pages = results[0].status === 'fulfilled' ? results[0].value : []
      const dailyTasks = results[1].status === 'fulfilled' ? results[1].value : []
      const calendarEvents = results[2].status === 'fulfilled' ? results[2].value : []
      const financeData = results[3].status === 'fulfilled' ? results[3].value : financeService.getDefaultFinanceData()
      const healthData = results[4].status === 'fulfilled' ? results[4].value : healthService.getDefaultHealthData()
      
      if (results[0].status === 'rejected') {
        console.warn('⚠️ Failed to load pages:', results[0].reason)
      }
      if (results[1].status === 'rejected') {
        console.warn('⚠️ Failed to load daily tasks:', results[1].reason)
      }
      if (results[2].status === 'rejected') {
        console.warn('⚠️ Failed to load calendar events:', results[2].reason)
      }
      if (results[3].status === 'rejected') {
        console.warn('⚠️ Failed to load finance data:', results[3].reason)
      }
      if (results[4].status === 'rejected') {
        console.warn('⚠️ Failed to load health data:', results[4].reason)
      }
      
      console.log('📊 Data loaded - Pages:', pages.length, 'Tasks:', dailyTasks.length, 'Finance: loaded', 'Health: loaded')

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

      // Convert calendar events array to record
      const calendarEventsRecord: Record<string, CalendarEvent> = {}
      calendarEvents.forEach(event => {
        calendarEventsRecord[event.id] = event
      })

      const result: Partial<WorkspaceState> = {
        pages: pagesRecord,
        rootPages,
        dailyTasks: dailyTasksRecord,
        calendarEvents: calendarEventsRecord,
        financeData,
        healthData,
        searchQuery: '',
        currentSection: 'pages' as 'pages' | 'daily-tasks' | 'calendar' | 'finance' | 'health-lab',
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
        healthData: healthService.getDefaultHealthData(),
        searchQuery: '',
        currentSection: 'pages' as 'pages' | 'daily-tasks' | 'calendar' | 'finance' | 'health-lab',
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