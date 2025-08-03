import { Search, Plus, Menu, LogOut, User, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/AuthContext';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { profileService } from '@/lib/database';

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
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [username, setUsername] = useState('');
  const [tempUsername, setTempUsername] = useState('');
  const [loading, setLoading] = useState(false);

  // Load user profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      if (user?.id) {
        try {
          const profile = await profileService.getProfile(user.id);
          if (profile?.username) {
            setUsername(profile.username);
          } else {
            // Default to email prefix if no username set
            const defaultUsername = user.email?.split('@')[0] || 'User';
            setUsername(defaultUsername);
          }
        } catch (error) {
          console.error('Failed to load profile in Header:', error);
          // Fallback to email prefix on error
          const defaultUsername = user.email?.split('@')[0] || 'User';
          setUsername(defaultUsername);
        }
      }
    };

    loadProfile();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleUsernameEdit = () => {
    setTempUsername(username);
    setIsEditingUsername(true);
  };

  const handleUsernameSubmit = async () => {
    if (tempUsername.trim() && user?.id) {
      setLoading(true);
      try {
        const { error } = await profileService.updateProfile(user.id, {
          username: tempUsername.trim()
        });
        
        if (!error) {
          setUsername(tempUsername.trim());
        } else {
          console.error('Failed to update username:', error);
          // Reset to previous username on error
          setTempUsername(username);
        }
      } catch (error) {
        console.error('Username update failed:', error);
        // Reset to previous username on error
        setTempUsername(username);
      }
      
      setLoading(false);
      setIsEditingUsername(false);
    }
  };

  const handleUsernameCancel = () => {
    setTempUsername(username);
    setIsEditingUsername(false);
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
                src="/images/gm-ai-logo.png" 
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
            {isEditingUsername ? (
              <div className="flex items-center gap-2">
                <Input
                  value={tempUsername}
                  onChange={(e) => setTempUsername(e.target.value)}
                  onBlur={handleUsernameSubmit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleUsernameSubmit();
                    if (e.key === 'Escape') handleUsernameCancel();
                  }}
                  className="h-6 px-2 text-sm w-24 bg-black/40 border-green-500/50 text-white"
                  autoFocus
                  disabled={loading}
                />
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <span className="text-sm text-white max-w-32 truncate">
                  {username || 'User'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleUsernameEdit}
                  className="h-5 w-5 p-0 hover:bg-green-500/20 text-gray-400 hover:text-green-400 transition-all duration-300"
                  title="Edit username"
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="h-6 w-6 p-0 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all duration-300"
              title="Sign out"
            >
              <LogOut className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};