export interface Page {
  id: string;
  title: string;
  content: string;
  blocks: Block[];
  parentId?: string;
  children: string[];
  createdAt: number;
  updatedAt: number;
  isExpanded?: boolean;
  icon?: string; // New field for custom page icons
}

export interface Block {
  id: string;
  type: 'text' | 'header' | 'image' | 'video' | 'table';
  content: string;
  data?: any;
  order: number;
}

export interface WorkspaceState {
  pages: Record<string, Page>;
  rootPages: string[];
  currentPageId?: string;
  currentSection?: 'pages' | 'daily-tasks';
  searchQuery: string;
  dailyTasks: Record<string, DailyTask>;
}

export interface DailyTask {
  id: string;
  title: string;
  description?: string;
  timeAllocation: number; // minutes
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  completedAt?: number;
  createdAt: number;
  streak: number;
  category: string;
}