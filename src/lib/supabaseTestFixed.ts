import { supabase } from './supabase'

export const testSupabaseConnection = async () => {
  console.log('🔧 Testing Supabase connection...')
  
  try {
    // Test 1: Check if Supabase client is working (with timeout)
    console.log('1️⃣ Testing Supabase client...')
    
    const authPromise = supabase.auth.getUser()
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Auth timeout')), 3000)
    )
    
    const { data: { user }, error: authError } = await Promise.race([authPromise, timeoutPromise]) as any
    
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
    
    // Test 2: Quick database connectivity test (with timeout)
    console.log('2️⃣ Testing database connectivity...')
    
    const dbPromise = supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .limit(1)
    
    const dbTimeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database timeout')), 2000)
    )
    
    const { error: dbError } = await Promise.race([dbPromise, dbTimeoutPromise]) as any
    
    if (dbError) {
      console.error('❌ Database error:', dbError)
      
      // If it's a table doesn't exist error, that's the issue
      if (dbError.code === 'PGRST116' || dbError.message?.includes('relation') || dbError.message?.includes('does not exist')) {
        console.log('💡 Database tables not found - setup required')
        return false
      }
      
      // Other database errors might be temporary
      console.log('⚠️ Database connectivity issue, but continuing...')
    } else {
      console.log('✅ Database connectivity confirmed')
    }
    
    // Test 3: Quick table existence check (parallel, with timeout)
    console.log('3️⃣ Testing core tables...')
    
    const tableTests = [
      supabase.from('pages').select('id').limit(1),
      supabase.from('daily_tasks').select('id').limit(1),
      supabase.from('finance_data').select('id').limit(1)
    ]
    
    const tableTimeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Table test timeout')), 3000)
    )
    
    try {
      const results = await Promise.race([
        Promise.allSettled(tableTests),
        tableTimeoutPromise
      ]) as PromiseSettledResult<any>[]
      
      let coreTablesWorking = 0
      results.forEach((result, index) => {
        const tableNames = ['pages', 'daily_tasks', 'finance_data']
        if (result.status === 'fulfilled' && !result.value.error) {
          console.log(`✅ ${tableNames[index]} table accessible`)
          coreTablesWorking++
        } else {
          console.log(`❌ ${tableNames[index]} table error:`, result.status === 'rejected' ? result.reason : result.value.error)
        }
      })
      
      if (coreTablesWorking === 0) {
        console.log('❌ No core tables accessible - database setup required')
        return false
      }
      
      console.log(`✅ ${coreTablesWorking}/3 core tables accessible`)
      
    } catch (error) {
      console.error('❌ Table test failed:', error)
      // Don't fail completely - maybe some tables work
      console.log('⚠️ Table test timeout, but continuing...')
    }
    
    console.log('✅ Supabase connection test completed successfully!')
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
  console.log('5. Copy and run the PERFECT_DATABASE_FINAL.sql script')
  console.log('6. Refresh this page')
  console.log('')
  console.log('This will set up all required tables with proper user isolation!')
}
