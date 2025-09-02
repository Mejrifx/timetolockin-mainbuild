import { supabase } from './supabase'

export const testSupabaseConnection = async () => {
  console.log('🔧 Testing Supabase connection...')
  
  try {
    // Test 1: Check if Supabase client is working
    console.log('1️⃣ Testing Supabase client...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('❌ Auth error:', authError)
      
      // If token is expired, sign out to clear the stale session
      if (authError.message?.includes('expired') || authError.message?.includes('invalid JWT')) {
        console.log('🔄 Clearing expired session...')
        await supabase.auth.signOut()
        console.log('✅ Session cleared. Please log in again.')
      }
      return false
    }
    
    if (!user) {
      console.error('❌ No user found - please log in')
      return false
    }
    
    console.log('✅ Auth working, user:', user.email)
    
    // Ensure user profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code === 'PGRST116') {
      // Profile doesn't exist, create it
      console.log('👤 Creating user profile...');
      
      // Use upsert to avoid duplicate key errors
      let createError;
      try {
        const { error } = await supabase
          .from('profiles')
          .upsert({ 
            id: user.id, 
            email: user.email || '',
            username: user.email?.split('@')[0] || 'User'
          }, {
            onConflict: 'id'
          });
        createError = error;
      } catch (error) {
        console.log('⚠️ Username column might not exist, trying basic profile...');
        const { error: basicError } = await supabase
          .from('profiles')
          .upsert({ 
            id: user.id, 
            email: user.email || ''
          }, {
            onConflict: 'id'
          });
        createError = basicError;
      }

      if (createError) {
        console.error('❌ Failed to create profile:', createError);
        throw new Error(`Failed to create user profile: ${createError.message}`);
      }
      console.log('✅ Profile created successfully');
    } else if (profileError) {
      console.error('❌ Error checking profile:', profileError);
      throw new Error(`Database connection failed: ${profileError.message}`);
    } else {
      console.log('✅ User profile exists');
    }
    
    // Test 3: Quick test of other tables (just check if they exist)
    console.log('3️⃣ Testing database tables...')
    
    // Just test if we can query pages (should return empty array for new user)
    const { error: pagesError } = await supabase
      .from('pages')
      .select('id')
      .limit(1)
    
    if (pagesError) {
      console.error('❌ Pages table error:', pagesError)
      console.log('💡 This means you need to run the SQL setup script!')
      return false
    }
    
    // Test daily_tasks table
    const { error: tasksError } = await supabase
      .from('daily_tasks')
      .select('id')
      .limit(1)
    
    if (tasksError) {
      console.error('❌ Daily tasks table error:', tasksError)
      console.log('💡 This means you need to run the SQL setup script!')
      return false
    }
    
    // Test health_protocols table (for Health Lab)
    console.log('4️⃣ Testing Health Lab tables...')
    const { error: healthError } = await supabase
      .from('health_protocols')
      .select('id')
      .limit(1)
    
    if (healthError) {
      console.error('❌ Health protocols table error:', healthError)
      console.log('💡 Health Lab tables are missing! You need to run the health-lab-setup.sql script!')
      // Don't return false here - let's continue testing other tables
    } else {
      console.log('✅ Health Lab tables accessible!')
    }
    
    // Test quit_habits table
    const { error: quitHabitsError } = await supabase
      .from('quit_habits')
      .select('id')
      .limit(1)
    
    if (quitHabitsError) {
      console.error('❌ Quit habits table error:', quitHabitsError)
    } else {
      console.log('✅ Quit habits table accessible!')
    }
    
    // If core tables work, consider connection successful even if health tables have issues
    console.log('✅ Core database tables exist and are accessible!')
    return true
    
  } catch (error) {
    console.error('❌ Supabase connection test failed:', error)
    return false
  }
}

export const showSetupInstructions = () => {
  console.log('🚨 DATABASE SETUP REQUIRED!')
  console.log('')
  console.log('It looks like your database tables are not set up yet.')
  console.log('Please follow these steps:')
  console.log('')
  console.log('1. Go to https://supabase.com/dashboard')
  console.log('2. Select your GM AI project')
  console.log('3. Go to SQL Editor (left sidebar)')
  console.log('4. Click "New Query"')
  console.log('5. Copy the SQL script from SUPABASE_SETUP.md')
  console.log('6. Paste and run the script')
  console.log('7. Refresh this page')
  console.log('')
  console.log('Need help? Check the SUPABASE_SETUP.md file for detailed instructions!')
} 