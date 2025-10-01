import { Search, Plus, Menu, LogOut, User, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/AuthContextSync';
import { cn } from '@/lib/utils';
import { useState, useEffect, memo, useCallback } from 'react';
import { profileService } from '@/lib/database';
import { OptimizedImage } from '@/components/OptimizedImage';

interface HeaderProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

const HeaderComponent = ({ 
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

  const handleSignOut = useCallback(async () => {
    await signOut();
  }, [signOut]);

  const handleUsernameEdit = useCallback(() => {
    setTempUsername(username);
    setIsEditingUsername(true);
  }, [username]);

  const handleUsernameSubmit = useCallback(async () => {
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
  }, [tempUsername, user?.id, username]);

  const handleUsernameCancel = useCallback(() => {
    setTempUsername(username);
    setIsEditingUsername(false);
  }, [username]);

  return (
    <header className="h-16 border-b border-green-500/20 bg-black/30 performance-blur sticky top-0 z-50 shadow-lg performance-critical gpu-accelerated">
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
          
          <div className="flex items-center ml-8">
            <OptimizedImage 
              src="/timetolockin MAIN LOGO NEW.png" 
              alt="timetolockin" 
              priority={true}
              className="h-12 w-auto object-contain hover-optimized drop-shadow-lg"
            />
          </div>
        </div>

        <div className={cn(
          "flex-1 flex items-center justify-center transition-all duration-500 ease-in-out",
          sidebarOpen ? "md:ml-[29rem]" : "md:ml-[14rem]"
        )}>
          {/* Text removed */}
        </div>

        <div className="flex items-center gap-4 min-w-fit">

          {/* User Menu */}
          <div className="flex items-center gap-2 px-3 py-2 bg-black/20 backdrop-blur-xl rounded-lg border border-green-500/30 w-40">
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
                  className="h-6 px-2 text-sm w-24 bg-black/40 border-green-500/50 text-white text-performance"
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

// Memoize the Header component for better performance
export const Header = memo(HeaderComponent);