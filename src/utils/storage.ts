import { WorkspaceState, Page, Block } from '@/types';
import { financeService } from '@/lib/database';

const STORAGE_KEY = 'gm-ai-workspace';

export const storage = {
  save: (state: WorkspaceState) => {
    try {
      // Create a deep copy of the state to avoid mutating the original
      const stateToSave = JSON.parse(JSON.stringify(state));
      
      // Remove large base64 encoded media data from blocks to prevent quota exceeded error
      Object.keys(stateToSave.pages || {}).forEach(pageId => {
        const page = stateToSave.pages[pageId];
        if (page.blocks) {
          page.blocks.forEach((block: Block) => {
            if ((block.type === 'image' || block.type === 'video') && block.data?.url) {
              // Remove the url property which contains large base64 data
              delete block.data.url;
            }
          });
        }
      });
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Failed to save workspace:', error);
    }
  },

  load: (): WorkspaceState => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Migrate old pages to include blocks array and icon field
        Object.keys(parsed.pages || {}).forEach(pageId => {
          if (!parsed.pages[pageId].blocks) {
            parsed.pages[pageId].blocks = [];
          }
          if (!parsed.pages[pageId].icon) {
            parsed.pages[pageId].icon = 'document'; // Default icon
          }
        });
        // Ensure dailyTasks exists
        if (!parsed.dailyTasks) {
          parsed.dailyTasks = {};
        }
        // Ensure financeData exists
        if (!parsed.financeData) {
          parsed.financeData = financeService.getDefaultFinanceData();
        }
        // Ensure currentSection exists
        if (!parsed.currentSection) {
          parsed.currentSection = 'pages';
        }
        return parsed;
      }
    } catch (error) {
      console.error('Failed to load workspace:', error);
    }
    
      return {
    pages: {},
    rootPages: [],
    searchQuery: '',
    dailyTasks: {},
    calendarEvents: {},
    financeData: financeService.getDefaultFinanceData(),
    healthData: {
      protocols: {},
      quitHabits: {},
      settings: {
        reminderEnabled: true,
        weeklyReviewDay: 0,
        notificationEnabled: true,
      },
    },
    currentSection: 'pages' as 'pages' | 'daily-tasks' | 'calendar' | 'finance' | 'health-lab',
  };
  },

  createPage: (title: string, parentId?: string): Page => {
    const id = `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      id,
      title: title || 'Untitled',
      content: '',
      blocks: [],
      parentId,
      children: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isExpanded: true,
      icon: 'document', // Default icon for new pages
    };
  },
};