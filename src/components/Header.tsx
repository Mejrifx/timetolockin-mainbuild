import { Search, Plus, Menu, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/AuthContext';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onCreatePage: () => void;
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export const Header = ({ 
  onCreatePage, 
  onToggleSidebar,
  sidebarOpen 
}: HeaderProps) => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="h-16 border-b border-green-500/20 bg-black/60 backdrop-blur-xl sticky top-0 z-50 shadow-lg">
      <div className="flex items-center justify-between h-full px-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            className="md:hidden hover:bg-green-500/10 text-white"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center">
              <img 
                src="/src/assets/GM_AI_Logo_2-removebg-preview (1).png" 
                alt="GM AI Logo" 
                className="h-8 w-auto object-contain"
              />
            </div>
            <span className="font-normal text-sm text-gray-300 tracking-normal opacity-80 hover:opacity-100 transition-opacity duration-300">
            <span className="font-normal text-sm text-green-400/80 tracking-normal hover:text-green-400 transition-all duration-300 px-3 py-1 rounded-md border border-green-500/30 bg-black/20 backdrop-blur-xl">
              The Private Platform To Lock In...
            </span>
          </span>
          </div>
        </div>

        <div className="flex-1 max-w-lg mx-8">
          {/* Search moved to sidebar */}
        </div>

        <div className="flex items-center gap-4">
          <Button
            onClick={onCreatePage}
            size="default"
            className="bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transition-all duration-300 px-6 shadow-lg hover:shadow-xl hover:scale-105"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Page
          </Button>

          {/* User Menu */}
          <div className="flex items-center gap-2 px-3 py-2 bg-black/20 backdrop-blur-xl rounded-lg border border-green-500/30">
            <User className="h-4 w-4 text-green-400" />
            <span className="text-sm text-white max-w-32 truncate">
              {user?.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="h-8 w-8 p-0 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all duration-300"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};