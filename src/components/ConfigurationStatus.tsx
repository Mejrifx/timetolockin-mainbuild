import { AlertCircle, CheckCircle, ExternalLink, Loader2 } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useSupabaseValidation } from '@/lib/supabaseValidator';

export const ConfigurationStatus = () => {
  const { validation, isValidating } = useSupabaseValidation();

  // Always show validation results, even if env vars are present but invalid
  if (isValidating) {
    return (
      <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
          <span className="text-blue-400">Validating Supabase connection...</span>
        </div>
      </div>
    );
  }

  if (validation?.isValid) {
    return null; // Don't show anything if properly configured and working
  }

  return (
    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-red-400 font-medium mb-2">
            {validation?.error?.includes('Invalid API key') ? 'Invalid API Key' : 'Configuration Required'}
          </h3>
          <p className="text-sm text-gray-300 mb-3">
            {validation?.error || 'The application is missing required environment variables. Please configure them in Netlify.'}
          </p>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              {validation?.details?.urlValid ? (
                <CheckCircle className="h-4 w-4 text-green-400" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-400" />
              )}
              <span className="text-gray-300">VITE_SUPABASE_URL</span>
              {validation?.details?.urlValid === false && import.meta.env.VITE_SUPABASE_URL && (
                <span className="text-xs text-yellow-400">(Invalid format)</span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {validation?.details?.keyValid ? (
                <CheckCircle className="h-4 w-4 text-green-400" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-400" />
              )}
              <span className="text-gray-300">VITE_SUPABASE_ANON_KEY</span>
              {validation?.details?.keyValid === false && import.meta.env.VITE_SUPABASE_ANON_KEY && (
                <span className="text-xs text-yellow-400">(Invalid format)</span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {validation?.details?.connectionValid ? (
                <CheckCircle className="h-4 w-4 text-green-400" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-400" />
              )}
              <span className="text-gray-300">Connection Test</span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-black/40 rounded border border-gray-600">
            <h4 className="text-white font-medium text-sm mb-2">
              {validation?.error?.includes('Invalid API key') ? 'Fix Instructions:' : 'Setup Instructions:'}
            </h4>
            {validation?.error?.includes('Invalid API key') ? (
              <ol className="text-xs text-gray-300 space-y-1">
                <li>1. Go to your Supabase Dashboard → Settings → API</li>
                <li>2. Copy the correct "anon public" key (starts with "eyJ")</li>
                <li>3. Update VITE_SUPABASE_ANON_KEY in Netlify environment variables</li>
                <li>4. Make sure the URL matches your Supabase project URL</li>
                <li>5. Redeploy the site</li>
              </ol>
            ) : validation?.error?.includes('Database tables not set up') ? (
              <ol className="text-xs text-gray-300 space-y-1">
                <li>1. Go to your Supabase Dashboard → SQL Editor</li>
                <li>2. Run the database setup script (SAFE_SUPABASE_SETUP.sql)</li>
                <li>3. Refresh this page</li>
              </ol>
            ) : (
              <ol className="text-xs text-gray-300 space-y-1">
                <li>1. Go to Netlify Dashboard → Site Settings → Environment Variables</li>
                <li>2. Add VITE_SUPABASE_URL with your Supabase project URL</li>
                <li>3. Add VITE_SUPABASE_ANON_KEY with your Supabase anon key</li>
                <li>4. Redeploy the site</li>
              </ol>
            )}
          </div>

          <a
            href="https://app.netlify.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-3 text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            Open Netlify Dashboard
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
