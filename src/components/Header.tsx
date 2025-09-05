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
    <header className="h-14 md:h-16 border-b border-green-500/20 bg-black/60 backdrop-blur-xl sticky top-0 z-50 shadow-lg transform-gpu contain-layout mobile-optimized">
      <div className="flex items-center justify-between h-full px-4 md:px-8">
        <div className="flex items-center gap-2 md:gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            className="md:hidden hover:bg-green-500/10 text-white h-10 w-10 p-0 rounded-lg transition-all duration-300"
          >
            <div className="flex flex-col justify-center items-center w-5 h-5">
              <div className={`w-4 h-0.5 bg-white rounded hamburger-line ${sidebarOpen ? 'rotate-45 translate-y-1' : ''}`}></div>
              <div className={`w-4 h-0.5 bg-white rounded mt-1 hamburger-line ${sidebarOpen ? 'opacity-0' : ''}`}></div>
              <div className={`w-4 h-0.5 bg-white rounded mt-1 hamburger-line ${sidebarOpen ? '-rotate-45 -translate-y-1' : ''}`}></div>
            </div>
          </Button>
          
          {/* Desktop Logo - Slides with sidebar */}
          <div className="hidden md:flex items-center md:ml-20">
            <div 
              className="flex items-center justify-center ml-0 md:ml-[-35px] logo-slide critical-gpu"
              style={{
                transform: sidebarOpen ? 'translateX(0px)' : 'translateX(25px)'
              }}
            >
              <img 
                src="/timetolockin MAIN LOGO NEW.png" 
                alt="timetolockin" 
                className="h-12 w-auto object-contain hover:scale-110 transition-transform duration-300 ease-in-out drop-shadow-lg"
              />
            </div>
          </div>
        </div>

        {/* Mobile Logo - Left Positioned */}
        <div className="md:hidden flex-1 flex justify-start pl-2">
          <img 
            src="/timetolockin MAIN LOGO NEW.png" 
            alt="timetolockin" 
            className="h-7 w-auto object-contain drop-shadow-lg"
          />
        </div>

        {/* Desktop - No Title (Clean Look) */}
        <div className="hidden md:flex flex-1"></div>

        <div className="flex items-center gap-1 md:gap-4 min-w-fit pr-2 md:pr-0">
          <Button
            onClick={onCreatePage}
            size="sm"
            className="hidden md:flex bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transition-all duration-300 px-3 md:px-6 shadow-lg hover:shadow-xl hover:scale-105"
          >
            <Plus className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">New Page</span>
          </Button>

          {/* User Menu */}
          <div className="flex items-center gap-1 md:gap-2 px-1 md:px-3 py-1 md:py-2 bg-black/20 backdrop-blur-xl rounded-lg border border-green-500/30 w-24 md:w-40 mobile-optimized">
            <User className="h-3 w-3 md:h-4 md:w-4 text-green-400" />
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
                <span className="text-xs md:text-sm text-white max-w-12 md:max-w-32 truncate">
                  {username || 'User'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleUsernameEdit}
                  className="h-3 w-3 md:h-5 md:w-5 p-0 hover:bg-green-500/20 text-gray-400 hover:text-green-400 transition-all duration-300"
                  title="Edit username"
                >
                  <Edit3 className="h-2 w-2 md:h-3 md:w-3" />
                </Button>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="h-4 w-4 md:h-6 md:w-6 p-0 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all duration-300"
              title="Sign out"
            >
              <LogOut className="h-2 w-2 md:h-3 md:w-3" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};