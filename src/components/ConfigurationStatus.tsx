import { AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';

export const ConfigurationStatus = () => {
  if (isSupabaseConfigured) {
    return null; // Don't show anything if properly configured
  }

  return (
    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-red-400 font-medium mb-2">Configuration Required</h3>
          <p className="text-sm text-gray-300 mb-3">
            The application is missing required environment variables. Please configure them in Netlify.
          </p>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              {import.meta.env.VITE_SUPABASE_URL ? (
                <CheckCircle className="h-4 w-4 text-green-400" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-400" />
              )}
              <span className="text-gray-300">VITE_SUPABASE_URL</span>
            </div>
            
            <div className="flex items-center gap-2">
              {import.meta.env.VITE_SUPABASE_ANON_KEY ? (
                <CheckCircle className="h-4 w-4 text-green-400" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-400" />
              )}
              <span className="text-gray-300">VITE_SUPABASE_ANON_KEY</span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-black/40 rounded border border-gray-600">
            <h4 className="text-white font-medium text-sm mb-2">Setup Instructions:</h4>
            <ol className="text-xs text-gray-300 space-y-1">
              <li>1. Go to Netlify Dashboard → Site Settings → Environment Variables</li>
              <li>2. Add VITE_SUPABASE_URL with your Supabase project URL</li>
              <li>3. Add VITE_SUPABASE_ANON_KEY with your Supabase anon key</li>
              <li>4. Redeploy the site</li>
            </ol>
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
