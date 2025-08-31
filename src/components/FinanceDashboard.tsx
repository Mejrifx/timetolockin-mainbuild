import { useState, useCallback, useMemo, memo, useEffect, useRef } from 'react';
import { 
  DollarSign, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  Target, 
  Calendar,
  Download,
  Eye,
  EyeOff,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  AlertCircle,
  CheckCircle,
  Coffee,
  Home,
  BookOpen,
  ShoppingCart,
  Car,
  Heart,
  MoreHorizontal,
  Edit3,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { 
  FinanceData, 
  Wallet as WalletType, 
  Transaction, 
  Category, 
  Budget, 
  FinanceGoal,
  FinanceInsight 
} from '@/types';

interface FinanceDashboardProps {
  financeData: FinanceData;
  onUpdateFinanceData: (data: Partial<FinanceData>) => void;
  onCreateDailyTask?: (title: string, timeAllocation: number, priority: 'high' | 'medium' | 'low', category: string, description?: string) => void;
  onAddToCalendar?: (event: { title: string; date: Date; description?: string }) => void;
  onExportToWorkspace?: (content: string, title: string) => void;
}

const categoryIcons: Record<string, any> = {
  food: Coffee,
  housing: Home,
  education: BookOpen,
  shopping: ShoppingCart,
  transport: Car,
  health: Heart,
  other: MoreHorizontal,
};

const defaultCategories: Category[] = [
  { id: 'food', name: 'Food & Dining', type: 'essential', color: '#ef4444', icon: 'food', isCustom: false, createdAt: Date.now() },
  { id: 'housing', name: 'Housing & Rent', type: 'essential', color: '#3b82f6', icon: 'housing', isCustom: false, createdAt: Date.now() },
  { id: 'education', name: 'Books & Courses', type: 'growth', color: '#10b981', icon: 'education', isCustom: false, createdAt: Date.now() },
  { id: 'shopping', name: 'Shopping', type: 'fun', color: '#f59e0b', icon: 'shopping', isCustom: false, createdAt: Date.now() },
  { id: 'transport', name: 'Transportation', type: 'essential', color: '#8b5cf6', icon: 'transport', isCustom: false, createdAt: Date.now() },
  { id: 'health', name: 'Health & Fitness', type: 'growth', color: '#06b6d4', icon: 'health', isCustom: false, createdAt: Date.now() },
];

export const FinanceDashboard = memo(({
  financeData,
  onUpdateFinanceData,
  onCreateDailyTask,
  onAddToCalendar,
  onExportToWorkspace,
}: FinanceDashboardProps) => {
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [showCurrencySelector, setShowCurrencySelector] = useState(false);
  const currencySelectorRef = useRef<HTMLDivElement>(null);
  
  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    type: 'expense' as 'income' | 'expense',
    categoryId: 'food',
    description: '',
    notes: '',
    walletId: '',
    date: new Date().toISOString().split('T')[0],
  });

  // Get current currency from finance settings first
  const currentCurrency = financeData.settings?.defaultCurrency || 'USD';

  const [newWallet, setNewWallet] = useState({
    name: '',
    balance: '',
    currency: currentCurrency,
    type: 'checking' as WalletType['type'],
  });

  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    targetAmount: '',
    deadline: '',
    category: 'savings' as FinanceGoal['category'],
    priority: 'medium' as FinanceGoal['priority'],
  });

  const [newCategory, setNewCategory] = useState({
    name: '',
    type: 'other' as Category['type'],
    color: '#10b981',
    icon: 'other',
  });

  // Initialize default data if empty
  const categories = useMemo(() => {
    const existing = Object.values(financeData.categories || {});
    if (existing.length === 0) {
      const defaultCats: Record<string, Category> = {};
      defaultCategories.forEach(cat => {
        defaultCats[cat.id] = cat;
      });
      return defaultCats;
    }
    return financeData.categories || {};
  }, [financeData.categories]);

  const wallets = useMemo(() => financeData.wallets || {}, [financeData.wallets]);
  const transactions = useMemo(() => financeData.transactions || {}, [financeData.transactions]);
  const goals = useMemo(() => financeData.goals || {}, [financeData.goals]);

  // Calculate total balance
  const totalBalance = useMemo(() => {
    return Object.values(wallets).reduce((sum, wallet) => sum + wallet.balance, 0);
  }, [wallets]);

  // Get recent transactions
  const recentTransactions = useMemo(() => {
    return Object.values(transactions)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 10);
  }, [transactions]);

  // Calculate spending by category for current period
  const spendingByCategory = useMemo(() => {
    const now = Date.now();
    const periodStart = selectedPeriod === 'week' 
      ? now - (7 * 24 * 60 * 60 * 1000)
      : selectedPeriod === 'month'
      ? now - (30 * 24 * 60 * 60 * 1000)
      : now - (365 * 24 * 60 * 60 * 1000);

    const spending: Record<string, number> = {};
    
    Object.values(transactions)
      .filter(t => t.type === 'expense' && t.date >= periodStart)
      .forEach(t => {
        spending[t.categoryId] = (spending[t.categoryId] || 0) + t.amount;
      });

    return spending;
  }, [transactions, selectedPeriod]);

  // Generate insights
  const insights = useMemo((): FinanceInsight[] => {
    const insights: FinanceInsight[] = [];
    const totalSpending = Object.values(spendingByCategory).reduce((sum, amount) => sum + amount, 0);

    // Check for high spending categories
    Object.entries(spendingByCategory).forEach(([categoryId, amount]) => {
      const percentage = (amount / totalSpending) * 100;
      const category = categories[categoryId];
      
      if (percentage > 30 && category) {
        insights.push({
          id: `high-spending-${categoryId}`,
          type: 'spending_pattern',
          title: `High ${category.name} Spending`,
          description: `You're spending ${percentage.toFixed(0)}% on ${category.name}. Consider setting a budget limit.`,
          category: categoryId,
          severity: 'warning',
          actionable: true,
          createdAt: Date.now(),
        });
      }
    });

    // Check goal progress
    Object.values(goals).forEach(goal => {
      const progress = (goal.currentAmount / goal.targetAmount) * 100;
      if (progress >= 80 && !goal.isCompleted) {
        insights.push({
          id: `goal-progress-${goal.id}`,
          type: 'goal_progress',
          title: `Almost There!`,
          description: `You're ${progress.toFixed(0)}% towards "${goal.title}". Keep it up!`,
          severity: 'info',
          actionable: false,
          createdAt: Date.now(),
        });
      }
    });

    return insights;
  }, [spendingByCategory, categories, goals]);

  // Event handlers
  const handleAddTransaction = useCallback(() => {
    if (!newTransaction.amount || !newTransaction.description) return;

    const transaction: Transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      walletId: newTransaction.walletId || Object.keys(wallets)[0] || '',
      amount: parseFloat(newTransaction.amount),
      type: newTransaction.type,
      categoryId: newTransaction.categoryId,
      description: newTransaction.description,
      notes: newTransaction.notes || undefined,
      date: new Date(newTransaction.date).getTime(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Update wallet balance
    const wallet = wallets[transaction.walletId];
    if (wallet) {
      const balanceChange = transaction.type === 'income' 
        ? transaction.amount 
        : -transaction.amount;
      
      const updatedWallet = {
        ...wallet,
        balance: wallet.balance + balanceChange,
        updatedAt: Date.now(),
      };

      onUpdateFinanceData({
        transactions: { ...transactions, [transaction.id]: transaction },
        wallets: { ...wallets, [transaction.walletId]: updatedWallet },
      });
    }

    // Reset form
    setNewTransaction({
      amount: '',
      type: 'expense',
      categoryId: 'food',
      description: '',
      notes: '',
      walletId: '',
      date: new Date().toISOString().split('T')[0],
    });
    setShowAddTransaction(false);
  }, [newTransaction, wallets, transactions, onUpdateFinanceData]);

  const handleAddWallet = useCallback(() => {
    if (!newWallet.name || !newWallet.balance) return;

    const wallet: WalletType = {
      id: `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: newWallet.name,
      balance: parseFloat(newWallet.balance),
      currency: newWallet.currency,
      type: newWallet.type,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    onUpdateFinanceData({
      wallets: { ...wallets, [wallet.id]: wallet },
    });

    setNewWallet({
      name: '',
      balance: '',
      currency: currentCurrency,
      type: 'checking',
    });
    setShowAddWallet(false);
  }, [newWallet, wallets, onUpdateFinanceData, currentCurrency]);

  const handleAddGoal = useCallback(() => {
    if (!newGoal.title || !newGoal.targetAmount) return;

    const goal: FinanceGoal = {
      id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: newGoal.title,
      description: newGoal.description || undefined,
      targetAmount: parseFloat(newGoal.targetAmount),
      currentAmount: 0,
      deadline: newGoal.deadline ? new Date(newGoal.deadline).getTime() : undefined,
      category: newGoal.category,
      priority: newGoal.priority,
      isCompleted: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    onUpdateFinanceData({
      goals: { ...goals, [goal.id]: goal },
    });

    // Add to daily tasks if callback provided
    if (onCreateDailyTask) {
      onCreateDailyTask(
        `Save towards: ${goal.title}`,
        15,
        goal.priority,
        'Finance',
        `Track progress on your ${goal.title} goal`
      );
    }

    setNewGoal({
      title: '',
      description: '',
      targetAmount: '',
      deadline: '',
      category: 'savings',
      priority: 'medium',
    });
    setShowAddGoal(false);
  }, [newGoal, goals, onUpdateFinanceData, onCreateDailyTask]);

  const handleAddCategory = useCallback(() => {
    if (!newCategory.name) return;

    const categoryId = newCategory.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const category: Category = {
      id: categoryId,
      name: newCategory.name,
      type: newCategory.type,
      color: newCategory.color,
      icon: newCategory.icon,
      isCustom: true,
      createdAt: Date.now(),
    };

    onUpdateFinanceData({
      categories: { ...categories, [categoryId]: category },
    });

    setNewCategory({
      name: '',
      type: 'other',
      color: '#10b981',
      icon: 'other',
    });
    setShowAddCategory(false);
  }, [newCategory, categories, onUpdateFinanceData]);

  const handleExportData = useCallback(() => {
    const csvData = [
      ['Date', 'Type', 'Amount', 'Category', 'Description', 'Wallet'],
      ...recentTransactions.map(t => [
        new Date(t.date).toLocaleDateString(),
        t.type,
        t.amount.toString(),
        categories[t.categoryId]?.name || 'Unknown',
        t.description,
        wallets[t.walletId]?.name || 'Unknown'
      ])
    ].map(row => row.join(',')).join('\n');

    if (onExportToWorkspace) {
      onExportToWorkspace(csvData, 'Finance Export');
    }
  }, [recentTransactions, categories, wallets, onExportToWorkspace]);

  const formatCurrency = useCallback((amount: number) => {
    const currencyConfig = {
      'USD': { locale: 'en-US', currency: 'USD' },
      'GBP': { locale: 'en-GB', currency: 'GBP' },
      'EUR': { locale: 'en-EU', currency: 'EUR' }
    };
    
    const config = currencyConfig[currentCurrency as keyof typeof currencyConfig] || currencyConfig.USD;
    
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.currency,
    }).format(amount);
  }, [currentCurrency]);

  const handleCurrencyChange = useCallback((currency: string) => {
    onUpdateFinanceData({
      settings: {
        ...financeData.settings,
        defaultCurrency: currency,
      }
    });
    setShowCurrencySelector(false);
  }, [financeData.settings, onUpdateFinanceData]);

  // Close currency selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (currencySelectorRef.current && !currencySelectorRef.current.contains(event.target as Node)) {
        setShowCurrencySelector(false);
      }
    };

    if (showCurrencySelector) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCurrencySelector]);

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-black/10 smooth-scroll">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Finance Tracker</h1>
              <p className="text-gray-300">
                Master your money mindfully and build lasting wealth habits
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative" ref={currencySelectorRef}>
                <Button
                  onClick={() => setShowCurrencySelector(!showCurrencySelector)}
                  variant="ghost"
                  className="border border-green-500/30 text-white hover:bg-green-500/10 bg-black/20"
                >
                  {currentCurrency}
                </Button>
                {showCurrencySelector && (
                  <div className="absolute top-full mt-2 right-0 bg-black/80 backdrop-blur-xl rounded-lg border border-green-500/30 p-2 z-50 min-w-[100px]">
                    {['USD', 'GBP', 'EUR'].map(currency => (
                      <button
                        key={currency}
                        onClick={() => handleCurrencyChange(currency)}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded text-sm transition-colors duration-200",
                          currency === currentCurrency 
                            ? "bg-green-500/20 text-green-300" 
                            : "text-white hover:bg-green-500/10"
                        )}
                      >
                        {currency}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button
                onClick={() => setBalanceVisible(!balanceVisible)}
                variant="ghost"
                className="border border-green-500/30 text-white hover:bg-green-500/10 bg-black/20"
              >
                {balanceVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
              <Button
                onClick={handleExportData}
                variant="ghost"
                className="border border-green-500/30 text-white hover:bg-green-500/10 bg-black/20"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                onClick={() => setShowAddTransaction(true)}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Transaction
              </Button>
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Balance */}
          <div className="bg-black/40 backdrop-blur-sm rounded-2xl border border-green-500/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-500/20 rounded-xl">
                  <Wallet className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Total Balance</p>
                  <p className="text-2xl font-bold text-white">
                    {balanceVisible ? formatCurrency(totalBalance) : '••••••'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={() => setShowAddWallet(true)}
                size="sm"
                variant="ghost"
                className="border border-green-500/30 text-green-400 hover:bg-green-500/10 bg-black/20"
              >
                <Plus className="h-3 w-3 mr-1" />
                Wallet
              </Button>
            </div>
          </div>

          {/* This Month's Spending */}
          <div className="bg-black/40 backdrop-blur-sm rounded-2xl border border-green-500/20 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-500/20 rounded-xl">
                <TrendingDown className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">This Month</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(Object.values(spendingByCategory).reduce((sum, amount) => sum + amount, 0))}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-400">
              {Object.keys(spendingByCategory).length} categories
            </p>
          </div>

          {/* Active Goals */}
          <div className="bg-black/40 backdrop-blur-sm rounded-2xl border border-green-500/20 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-green-500/20 rounded-xl">
                <Target className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Active Goals</p>
                <p className="text-2xl font-bold text-white">
                  {Object.values(goals).filter(g => !g.isCompleted).length}
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowAddGoal(true)}
              size="sm"
              variant="ghost"
              className="border border-green-500/30 text-green-400 hover:bg-green-500/10 bg-black/20"
            >
              <Plus className="h-3 w-3 mr-1" />
              Goal
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="xl:col-span-2 space-y-8">
            {/* Insights */}
            {insights.length > 0 && (
              <div className="bg-black/40 backdrop-blur-sm rounded-2xl border border-green-500/20 p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Insights & Tips</h3>
                <div className="space-y-4">
                  {insights.map(insight => (
                    <div
                      key={insight.id}
                      className={cn(
                        "p-4 rounded-lg border",
                        insight.severity === 'critical' && "bg-red-500/10 border-red-500/30",
                        insight.severity === 'warning' && "bg-yellow-500/10 border-yellow-500/30",
                        insight.severity === 'info' && "bg-blue-500/10 border-blue-500/30"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <AlertCircle className={cn(
                          "h-5 w-5 mt-0.5",
                          insight.severity === 'critical' && "text-red-400",
                          insight.severity === 'warning' && "text-yellow-400",
                          insight.severity === 'info' && "text-blue-400"
                        )} />
                        <div>
                          <h4 className="font-medium text-white">{insight.title}</h4>
                          <p className="text-gray-300 text-sm mt-1">{insight.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Transactions */}
            <div className="bg-black/40 backdrop-blur-sm rounded-2xl border border-green-500/20 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Recent Transactions</h3>
                <div className="flex items-center gap-2">
                  {['week', 'month', 'year'].map(period => (
                    <Button
                      key={period}
                      onClick={() => setSelectedPeriod(period as any)}
                      size="sm"
                      variant="ghost"
                      className={cn(
                        "border",
                        selectedPeriod === period 
                          ? "bg-green-500/20 border-green-500/50 text-green-300 hover:bg-green-500/30" 
                          : "border-green-500/30 text-green-400 hover:bg-green-500/10 bg-black/20"
                      )}
                    >
                      {period.charAt(0).toUpperCase() + period.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-3">
                {recentTransactions.length === 0 ? (
                  <div className="text-center py-8">
                    <DollarSign className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-400">No transactions yet</p>
                    <p className="text-sm text-gray-500">Start tracking your spending to see insights</p>
                  </div>
                ) : (
                  recentTransactions.map(transaction => {
                    const category = categories[transaction.categoryId];
                    const wallet = wallets[transaction.walletId];
                    const IconComponent = categoryIcons[category?.icon] || MoreHorizontal;
                    
                    return (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-black/20 border border-green-500/10"
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2 rounded-lg",
                            transaction.type === 'income' ? "bg-green-500/20" : "bg-red-500/20"
                          )}>
                            {transaction.type === 'income' ? (
                              <ArrowUpCircle className="h-4 w-4 text-green-400" />
                            ) : (
                              <ArrowDownCircle className="h-4 w-4 text-red-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-white">{transaction.description}</p>
                            <p className="text-sm text-gray-400">
                              {category?.name} • {wallet?.name} • {new Date(transaction.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={cn(
                            "font-semibold",
                            transaction.type === 'income' ? "text-green-400" : "text-red-400"
                          )}>
                            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Goals & Categories */}
          <div className="space-y-8">
            {/* Active Goals */}
            <div className="bg-black/40 backdrop-blur-sm rounded-2xl border border-green-500/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Goals</h3>
              <div className="space-y-4">
                {Object.values(goals).filter(g => !g.isCompleted).slice(0, 3).map(goal => {
                  const progress = (goal.currentAmount / goal.targetAmount) * 100;
                  return (
                    <div key={goal.id} className="p-4 rounded-lg bg-black/20 border border-green-500/10">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-white">{goal.title}</h4>
                        <span className="text-sm text-gray-400">{progress.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-400">
                        {formatCurrency(goal.currentAmount)} of {formatCurrency(goal.targetAmount)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Spending Categories */}
            <div className="bg-black/40 backdrop-blur-sm rounded-2xl border border-green-500/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Top Categories</h3>
              <div className="space-y-3">
                {Object.entries(spendingByCategory)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([categoryId, amount]) => {
                    const category = categories[categoryId];
                    const IconComponent = categoryIcons[category?.icon] || MoreHorizontal;
                    const total = Object.values(spendingByCategory).reduce((sum, a) => sum + a, 0);
                    const percentage = total > 0 ? (amount / total) * 100 : 0;
                    
                    return (
                      <div key={categoryId} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: `${category?.color}20` }}
                          >
                            <IconComponent className="h-4 w-4" style={{ color: category?.color }} />
                          </div>
                          <span className="text-white text-sm">{category?.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-medium">{formatCurrency(amount)}</p>
                          <p className="text-gray-400 text-xs">{percentage.toFixed(0)}%</p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>

        {/* Add Transaction Modal */}
        {showAddTransaction && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-black/80 backdrop-blur-xl rounded-2xl border border-green-500/30 p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold text-white mb-4">Add Transaction</h3>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    onClick={() => setNewTransaction(prev => ({ ...prev, type: 'expense' }))}
                    variant="ghost"
                    className={cn(
                      "flex-1 border",
                      newTransaction.type === 'expense' 
                        ? "bg-red-500/20 border-red-500/50 text-red-300 hover:bg-red-500/30" 
                        : "border-red-500/30 text-red-400 hover:bg-red-500/10 bg-black/20"
                    )}
                  >
                    <ArrowDownCircle className="h-4 w-4 mr-2" />
                    Expense
                  </Button>
                  <Button
                    onClick={() => setNewTransaction(prev => ({ ...prev, type: 'income' }))}
                    variant="ghost"
                    className={cn(
                      "flex-1 border",
                      newTransaction.type === 'income' 
                        ? "bg-green-500/20 border-green-500/50 text-green-300 hover:bg-green-500/30" 
                        : "border-green-500/30 text-green-400 hover:bg-green-500/10 bg-black/20"
                    )}
                  >
                    <ArrowUpCircle className="h-4 w-4 mr-2" />
                    Income
                  </Button>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Amount</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={newTransaction.amount}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
                    className="bg-black/20 border-green-500/30 text-white placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-300">Category</label>
                    <Button
                      onClick={() => setShowAddCategory(true)}
                      size="sm"
                      variant="ghost"
                      className="text-xs border border-green-500/30 text-green-400 hover:bg-green-500/10 bg-black/20 h-6 px-2"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </div>
                  <select
                    value={newTransaction.categoryId}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, categoryId: e.target.value }))}
                    className="w-full h-10 px-3 bg-black/20 border border-green-500/30 rounded-md text-white text-sm focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50"
                  >
                    {Object.values(categories).map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Wallet</label>
                  <select
                    value={newTransaction.walletId}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, walletId: e.target.value }))}
                    className="w-full h-10 px-3 bg-black/20 border border-green-500/30 rounded-md text-white text-sm focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50"
                  >
                    <option value="">Select Wallet</option>
                    {Object.values(wallets).map(wallet => (
                      <option key={wallet.id} value={wallet.id}>{wallet.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Description</label>
                  <Input
                    placeholder="What was this for?"
                    value={newTransaction.description}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
                    className="bg-black/20 border-green-500/30 text-white placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Date</label>
                  <Input
                    type="date"
                    value={newTransaction.date}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, date: e.target.value }))}
                    className="bg-black/20 border-green-500/30 text-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Notes (Optional)</label>
                  <Input
                    placeholder="Additional notes..."
                    value={newTransaction.notes}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, notes: e.target.value }))}
                    className="bg-black/20 border-green-500/30 text-white placeholder:text-gray-400"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={handleAddTransaction}
                  variant="ghost"
                  className="bg-green-500/20 border border-green-500/50 text-green-300 hover:bg-green-500/30 flex-1"
                >
                  Add Transaction
                </Button>
                <Button
                  onClick={() => setShowAddTransaction(false)}
                  variant="ghost"
                  className="border border-green-500/30 text-white hover:bg-green-500/10 bg-black/20"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Add Wallet Modal */}
        {showAddWallet && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-black/80 backdrop-blur-xl rounded-2xl border border-green-500/30 p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold text-white mb-4">Add Wallet</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Wallet Name</label>
                  <Input
                    placeholder="e.g., Main Checking"
                    value={newWallet.name}
                    onChange={(e) => setNewWallet(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-black/20 border-green-500/30 text-white placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Current Balance</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={newWallet.balance}
                    onChange={(e) => setNewWallet(prev => ({ ...prev, balance: e.target.value }))}
                    className="bg-black/20 border-green-500/30 text-white placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Type</label>
                  <select
                    value={newWallet.type}
                    onChange={(e) => setNewWallet(prev => ({ ...prev, type: e.target.value as WalletType['type'] }))}
                    className="w-full h-10 px-3 bg-black/20 border border-green-500/30 rounded-md text-white text-sm focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50"
                  >
                    <option value="checking">Checking</option>
                    <option value="savings">Savings</option>
                    <option value="cash">Cash</option>
                    <option value="investment">Investment</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={handleAddWallet}
                  variant="ghost"
                  className="bg-green-500/20 border border-green-500/50 text-green-300 hover:bg-green-500/30 flex-1"
                >
                  Add Wallet
                </Button>
                <Button
                  onClick={() => setShowAddWallet(false)}
                  variant="ghost"
                  className="border border-green-500/30 text-white hover:bg-green-500/10 bg-black/20"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Add Goal Modal */}
        {showAddGoal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-black/80 backdrop-blur-xl rounded-2xl border border-green-500/30 p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold text-white mb-4">Add Financial Goal</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Goal Title</label>
                  <Input
                    placeholder="e.g., Emergency Fund"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                    className="bg-black/20 border-green-500/30 text-white placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Target Amount</label>
                  <Input
                    type="number"
                    placeholder="1000.00"
                    value={newGoal.targetAmount}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, targetAmount: e.target.value }))}
                    className="bg-black/20 border-green-500/30 text-white placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Category</label>
                  <select
                    value={newGoal.category}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, category: e.target.value as FinanceGoal['category'] }))}
                    className="w-full h-10 px-3 bg-black/20 border border-green-500/30 rounded-md text-white text-sm focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50"
                  >
                    <option value="savings">Savings</option>
                    <option value="debt">Debt Payoff</option>
                    <option value="investment">Investment</option>
                    <option value="purchase">Purchase</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Target Date (Optional)</label>
                  <Input
                    type="date"
                    value={newGoal.deadline}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, deadline: e.target.value }))}
                    className="bg-black/20 border-green-500/30 text-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Description (Optional)</label>
                  <Input
                    placeholder="Why is this goal important to you?"
                    value={newGoal.description}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                    className="bg-black/20 border-green-500/30 text-white placeholder:text-gray-400"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={handleAddGoal}
                  variant="ghost"
                  className="bg-green-500/20 border border-green-500/50 text-green-300 hover:bg-green-500/30 flex-1"
                >
                  Add Goal
                </Button>
                <Button
                  onClick={() => setShowAddGoal(false)}
                  variant="ghost"
                  className="border border-green-500/30 text-white hover:bg-green-500/10 bg-black/20"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Add Category Modal */}
        {showAddCategory && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-black/80 backdrop-blur-xl rounded-2xl border border-green-500/30 p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold text-white mb-4">Add Custom Category</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Category Name</label>
                  <Input
                    placeholder="e.g., Gaming, Subscriptions"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-black/20 border-green-500/30 text-white placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Type</label>
                  <select
                    value={newCategory.type}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, type: e.target.value as Category['type'] }))}
                    className="w-full h-10 px-3 bg-black/20 border border-green-500/30 rounded-md text-white text-sm focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50"
                  >
                    <option value="essential">Essential</option>
                    <option value="growth">Growth</option>
                    <option value="fun">Fun</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Color</label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="color"
                      value={newCategory.color}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
                      className="w-16 h-10 bg-black/20 border-green-500/30 rounded cursor-pointer"
                    />
                    <Input
                      value={newCategory.color}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
                      className="flex-1 bg-black/20 border-green-500/30 text-white placeholder:text-gray-400"
                      placeholder="#10b981"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Icon</label>
                  <select
                    value={newCategory.icon}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, icon: e.target.value }))}
                    className="w-full h-10 px-3 bg-black/20 border border-green-500/30 rounded-md text-white text-sm focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50"
                  >
                    <option value="food">Food</option>
                    <option value="housing">Housing</option>
                    <option value="education">Education</option>
                    <option value="shopping">Shopping</option>
                    <option value="transport">Transport</option>
                    <option value="health">Health</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={handleAddCategory}
                  variant="ghost"
                  className="bg-green-500/20 border border-green-500/50 text-green-300 hover:bg-green-500/30 flex-1"
                >
                  Add Category
                </Button>
                <Button
                  onClick={() => setShowAddCategory(false)}
                  variant="ghost"
                  className="border border-green-500/30 text-white hover:bg-green-500/10 bg-black/20"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
