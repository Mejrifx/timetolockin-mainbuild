import { useState, useEffect } from 'react';
import { supabase } from './supabase';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  details?: {
    urlValid: boolean;
    keyValid: boolean;
    connectionValid: boolean;
  };
}

export const validateSupabaseConnection = async (): Promise<ValidationResult> => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Check if environment variables exist
  if (!supabaseUrl || !supabaseKey) {
    return {
      isValid: false,
      error: 'Missing environment variables',
      details: {
        urlValid: !!supabaseUrl,
        keyValid: !!supabaseKey,
        connectionValid: false,
      },
    };
  }

  // Validate URL format
  let urlValid = false;
  try {
    const url = new URL(supabaseUrl);
    urlValid = url.hostname.includes('supabase.co');
  } catch {
    return {
      isValid: false,
      error: 'Invalid Supabase URL format',
      details: {
        urlValid: false,
        keyValid: !!supabaseKey,
        connectionValid: false,
      },
    };
  }

  // Validate key format (should be a long string starting with 'eyJ')
  const keyValid = supabaseKey.length > 100 && supabaseKey.startsWith('eyJ');
  
  if (!keyValid) {
    return {
      isValid: false,
      error: 'Invalid Supabase key format - should be a JWT token starting with "eyJ"',
      details: {
        urlValid,
        keyValid: false,
        connectionValid: false,
      },
    };
  }

  // Test actual connection
  try {
    console.log('🔄 Testing Supabase connection...');
    
    // Try to get the session (this doesn't require authentication)
    const { data, error } = await supabase.auth.getSession();
    
    if (error && error.message.includes('Invalid API key')) {
      return {
        isValid: false,
        error: 'Invalid API key - please check your VITE_SUPABASE_ANON_KEY',
        details: {
          urlValid,
          keyValid: false,
          connectionValid: false,
        },
      };
    }

    // Try a simple query to test the connection
    const { error: healthError } = await supabase
      .from('profiles')
      .select('count')
      .limit(0);

    if (healthError && healthError.message.includes('relation "profiles" does not exist')) {
      return {
        isValid: false,
        error: 'Database tables not set up - please run the SQL setup script',
        details: {
          urlValid,
          keyValid,
          connectionValid: true,
        },
      };
    }

    console.log('✅ Supabase connection test successful');
    return {
      isValid: true,
      details: {
        urlValid,
        keyValid,
        connectionValid: true,
      },
    };

  } catch (error) {
    console.error('❌ Supabase connection test failed:', error);
    return {
      isValid: false,
      error: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: {
        urlValid,
        keyValid,
        connectionValid: false,
      },
    };
  }
};

// Hook to validate on app startup
export const useSupabaseValidation = () => {
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    validateSupabaseConnection()
      .then(setValidation)
      .finally(() => setIsValidating(false));
  }, []);

  return { validation, isValidating };
};
