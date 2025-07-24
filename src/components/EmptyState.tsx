import { FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  onCreatePage: () => void;
}

export const EmptyState = ({ onCreatePage }: EmptyStateProps) => {
  return (
    <div className="flex-1 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="text-center space-y-8 max-w-lg">
        <div className="w-20 h-20 mx-auto bg-black/40 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-green-500/30 shadow-lg">
          <FileText className="h-10 w-10 text-green-400" />
        </div>
        
        <div className="space-y-4">
          <h3 className="text-2xl font-semibold text-white">Welcome to GM AI</h3>
          <p className="text-gray-300 text-lg leading-relaxed">
            Your intelligent workspace for notes, documents, and ideas. 
            Get started by creating your first page and begin organizing your thoughts.
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