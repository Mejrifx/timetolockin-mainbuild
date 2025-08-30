import { FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  onCreatePage: () => void;
}

export const EmptyState = ({ onCreatePage }: EmptyStateProps) => {
  return (
    <div className="flex-1 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="text-center space-y-8 max-w-lg">
        <div className="mx-auto flex items-center justify-center mb-4">
          <img 
            src="/timetolockin HEADER LOGO - nobg.png" 
            alt="timetolockin Logo" 
            className="h-24 w-auto object-contain"
          />
        </div>
        
        <div className="space-y-4">
          <h3 className="text-2xl font-semibold text-white">Welcome, it's time for you to lock in...</h3>
          <p className="text-gray-300 text-lg leading-relaxed">
            This is your private and intelligent workspace for notes, documents, and ideas. 
            Get started by creating your first page and begin organizing your thoughts and much more. (Coming Soon)
          </p>
        </div>

        <Button 
          onClick={onCreatePage} 
          size="lg"
          className="bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 px-8 py-3 text-base shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
        >
          <Plus className="h-5 w-5 mr-3" />
          Create Your First Page
        </Button>
      </div>
    </div>
  );
};