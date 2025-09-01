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
  currentSection?: 'pages' | 'daily-tasks' | 'calendar' | 'finance' | 'health-lab';
  searchQuery: string;
  dailyTasks: Record<string, DailyTask>;
  financeData: FinanceData;
  healthData: HealthData;
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
  updatedAt: number;
  streak: number;
  category: string;
}

export interface FinanceData {
  wallets: Record<string, Wallet>;
  transactions: Record<string, Transaction>;
  categories: Record<string, Category>;
  budgets: Record<string, Budget>;
  goals: Record<string, FinanceGoal>;
  settings: FinanceSettings;
}

export interface Wallet {
  id: string;
  name: string;
  balance: number;
  currency: string;
  type: 'checking' | 'savings' | 'cash' | 'investment' | 'other';
  createdAt: number;
  updatedAt: number;
}

export interface Transaction {
  id: string;
  walletId: string;
  amount: number;
  type: 'income' | 'expense';
  categoryId: string;
  description: string;
  notes?: string;
  tags?: string[];
  date: number;
  isMindful?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Category {
  id: string;
  name: string;
  type: 'essential' | 'growth' | 'fun' | 'other';
  color: string;
  icon: string;
  isCustom: boolean;
  createdAt: number;
}

export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  period: 'weekly' | 'monthly';
  startDate: number;
  endDate: number;
  isActive: boolean;
  createdAt: number;
}

export interface FinanceGoal {
  id: string;
  title: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: number;
  category: 'savings' | 'debt' | 'investment' | 'purchase' | 'other';
  priority: 'high' | 'medium' | 'low';
  isCompleted: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface FinanceSettings {
  defaultCurrency: string;
  defaultWalletId?: string;
  reminderEnabled: boolean;
  weeklyReviewDay: number; // 0-6, Sunday = 0
  monthlyReviewDay: number; // 1-31
  mindfulSpendingEnabled: boolean;
  exportFormat: 'csv' | 'pdf';
}

export interface FinanceInsight {
  id: string;
  type: 'spending_pattern' | 'budget_alert' | 'goal_progress' | 'saving_opportunity';
  title: string;
  description: string;
  category?: string;
  severity: 'info' | 'warning' | 'critical';
  actionable: boolean;
  createdAt: number;
}

export interface HealthData {
  protocols: Record<string, HealthProtocol>;
  quitHabits: Record<string, QuitHabit>;
  settings: HealthSettings;
}

export interface HealthProtocol {
  id: string;
  title: string;
  description: string;
  content: string;
  category: 'fitness' | 'nutrition' | 'sleep' | 'mental' | 'habits' | 'other';
  isExpanded: boolean;
  isCompleted: boolean;
  completedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface QuitHabit {
  id: string;
  name: string;
  description?: string;
  quitDate: number;
  category: 'smoking' | 'alcohol' | 'sugar' | 'social_media' | 'caffeine' | 'other';
  customCategory?: string;
  isActive: boolean;
  milestones: QuitMilestone[];
  createdAt: number;
}

export interface QuitMilestone {
  id: string;
  days: number;
  title: string;
  description: string;
  isReached: boolean;
  reachedAt?: number;
}

export interface HealthSettings {
  reminderEnabled: boolean;
  dailyCheckInTime?: string; // HH:MM format
  weeklyReviewDay: number; // 0-6, Sunday = 0
  notificationEnabled: boolean;
}