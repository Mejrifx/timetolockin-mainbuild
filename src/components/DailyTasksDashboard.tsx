import { useState } from 'react';
import { 
  Plus, 
  Clock, 
  Flame, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  MoreHorizontal,
  TrendingUp,
  Target,
  Calendar,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DailyTask } from '@/types';
import { cn } from '@/lib/utils';

interface DailyTasksDashboardProps {
  dailyTasks: Record<string, DailyTask>;
  onCreateDailyTask: (title: string, timeAllocation: number, priority: DailyTask['priority'], category: string, description?: string) => void;
  onUpdateDailyTask: (taskId: string, updates: Partial<DailyTask>) => void;
  onToggleTaskCompletion: (taskId: string) => void;
  onDeleteDailyTask: (taskId: string) => void;
}

export const DailyTasksDashboard = ({
  dailyTasks,
  onCreateDailyTask,
  onUpdateDailyTask,
  onToggleTaskCompletion,
  onDeleteDailyTask,
}: DailyTasksDashboardProps) => {
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    timeAllocation: 30,
    priority: 'medium' as DailyTask['priority'],
    category: 'Personal',
  });

  const tasks = dailyTasks ? Object.values(dailyTasks) : [];
  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalTimeAllocated = tasks.reduce((sum, task) => sum + task.timeAllocation, 0);
  const averageStreak = tasks.length > 0 ? Math.round(tasks.reduce((sum, task) => sum + task.streak, 0) / tasks.length) : 0;

  const handleCreateTask = () => {
    if (newTask.title.trim()) {
      const timeAllocation = typeof newTask.timeAllocation === 'string' ? 30 : newTask.timeAllocation;
      onCreateDailyTask(
        newTask.title.trim(),
        timeAllocation,
        newTask.priority,
        newTask.category,
        newTask.description.trim() || undefined
      );
      setNewTask({
        title: '',
        description: '',
        timeAllocation: 30,
        priority: 'medium',
        category: 'Personal',
      });
      setShowTaskForm(false);
    }
  };

  const getPriorityColor = (priority: DailyTask['priority']) => {
    switch (priority) {
      case 'high': return 'text-red-400 border-red-400/30 bg-red-400/10';
      case 'medium': return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10';
      case 'low': return 'text-green-400 border-green-400/30 bg-green-400/10';
    }
  };

  const sortedTasks = tasks.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return b.createdAt - a.createdAt;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-black/10">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-12 py-12">
          <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Daily Non-Negotiables</h1>
                <p className="text-gray-300 text-lg">Level up your life with consistent daily habits</p>
              </div>
              <Button
                onClick={() => setShowTaskForm(!showTaskForm)}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Non-Negotiable
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-black/40 backdrop-blur-xl rounded-xl p-6 border border-green-500/20 shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Target className="h-6 w-6 text-green-400" />
                  <span className="text-sm font-medium text-gray-300">Completion Rate</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{completionRate}%</div>
                <div className="text-xs text-gray-400">{completedTasks}/{totalTasks} completed today</div>
              </div>

              <div className="bg-black/40 backdrop-blur-xl rounded-xl p-6 border border-green-500/20 shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="h-6 w-6 text-blue-400" />
                  <span className="text-sm font-medium text-gray-300">Time Allocated</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{totalTimeAllocated}m</div>
                <div className="text-xs text-gray-400">Total daily commitment</div>
              </div>

              <div className="bg-black/40 backdrop-blur-xl rounded-xl p-6 border border-green-500/20 shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Flame className="h-6 w-6 text-orange-400" />
                  <span className="text-sm font-medium text-gray-300">Average Streak</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{averageStreak}</div>
                <div className="text-xs text-gray-400">Days consistency</div>
              </div>

              <div className="bg-black/40 backdrop-blur-xl rounded-xl p-6 border border-green-500/20 shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Award className="h-6 w-6 text-green-400" />
                  <span className="text-sm font-medium text-gray-300">Total Tasks</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{totalTasks}</div>
                <div className="text-xs text-gray-400">Non-negotiables created</div>
              </div>
            </div>

            {/* Progress Overview */}
            {totalTasks > 0 && (
              <div className="bg-black/40 backdrop-blur-xl rounded-xl p-8 border border-green-500/20 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-white">Today's Progress</h2>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-400" />
                    <span className="text-lg font-medium text-green-400">{completionRate}%</span>
                  </div>
                </div>
                <div className="w-full h-4 bg-black/40 rounded-full overflow-hidden mb-4">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-1000 ease-out"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-400">
                  <span>{completedTasks} completed</span>
                  <span>{totalTasks - completedTasks} remaining</span>
                </div>
              </div>
            )}

            {/* Task Creation Form */}
            {showTaskForm && (
              <div className="bg-black/40 backdrop-blur-xl rounded-xl p-8 border border-green-500/20 shadow-lg">
                <h2 className="text-xl font-semibold text-white mb-6">Create New Non-Negotiable</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-300 mb-2 block">Task Title</label>
                      <Input
                        placeholder="e.g., Morning workout, Read 30 minutes..."
                        value={newTask.title}
                        onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                        className="bg-black/20 border-green-500/30 text-white placeholder:text-gray-400 focus-visible:ring-green-500/50"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-300 mb-2 block">Description (Optional)</label>
                      <Input
                        placeholder="Add more details about this task..."
                        value={newTask.description}
                        onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                        className="bg-black/20 border-green-500/30 text-white placeholder:text-gray-400 focus-visible:ring-green-500/50"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-300 mb-2 block">Time (minutes)</label>
                        <Input
                          type="number"
                          value={newTask.timeAllocation}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '') {
                              setNewTask(prev => ({ ...prev, timeAllocation: '' as any }));
                            } else {
                              const numValue = parseInt(value);
                              if (!isNaN(numValue)) {
                                setNewTask(prev => ({ ...prev, timeAllocation: numValue }));
                              }
                            }
                          }}
                          className="bg-black/20 border-green-500/30 text-white focus-visible:ring-green-500/50"
                          min="5"
                          max="480"
                          placeholder="30"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-300 mb-2 block">Priority</label>
                        <select
                          value={newTask.priority}
                          onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value as DailyTask['priority'] }))}
                          className="w-full h-10 px-3 bg-black/20 border border-green-500/30 rounded-md text-white text-sm focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50"
                        >
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-300 mb-2 block">Category</label>
                      <Input
                        placeholder="e.g., Health, Work, Personal, Learning..."
                        value={newTask.category}
                        onChange={(e) => setNewTask(prev => ({ ...prev, category: e.target.value }))}
                        className="bg-black/20 border-green-500/30 text-white placeholder:text-gray-400 focus-visible:ring-green-500/50"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 mt-6">
                  <Button
                    onClick={handleCreateTask}
                    className="bg-green-500 hover:bg-green-600 text-white px-8 py-2 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Create Task
                  </Button>
                  <Button
                    onClick={() => setShowTaskForm(false)}
                    variant="outline"
                    className="border-green-500/30 text-white hover:bg-green-500/10 hover:text-white px-8 py-2 bg-transparent"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Tasks List */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-white">Your Non-Negotiables</h2>
              {sortedTasks.length === 0 ? (
                <div className="bg-black/40 backdrop-blur-xl rounded-xl p-12 border border-green-500/20 shadow-lg text-center">
                  <Target className="h-16 w-16 mx-auto mb-4 text-gray-400 opacity-50" />
                  <h3 className="text-xl font-medium text-white mb-2">No non-negotiables yet</h3>
                  <p className="text-gray-400 mb-6">Create your first task to start building consistent daily habits</p>
                  <Button
                    onClick={() => setShowTaskForm(true)}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Create Your First Task
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {sortedTasks.map(task => (
                    <div
                      key={task.id}
                      className={cn(
                        "bg-black/40 backdrop-blur-xl rounded-xl p-6 border transition-all duration-300 group hover:bg-black/50 shadow-lg hover:shadow-xl",
                        task.completed 
                          ? "border-green-500/30 bg-green-500/5" 
                          : "border-green-500/20 hover:border-green-500/40"
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onToggleTaskCompletion(task.id)}
                          className="h-8 w-8 p-0 mt-1 hover:bg-green-500/20 transition-all duration-300 hover:scale-110 outline-none focus:outline-none hover:outline-none active:outline-none focus-visible:outline-none ring-0 focus:ring-0 hover:ring-0 active:ring-0 focus-visible:ring-0"
                        >
                          {task.completed ? (
                            <CheckCircle2 className="h-6 w-6 text-green-400" />
                          ) : (
                            <Circle className="h-6 w-6 text-gray-400 hover:text-green-400" />
                          )}
                        </Button>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className={cn(
                              "text-lg font-medium",
                              task.completed ? "text-gray-400 line-through" : "text-white"
                            )}>
                              {task.title}
                            </h3>
                            <div className={cn(
                              "px-3 py-1 rounded-full text-xs font-medium border",
                              getPriorityColor(task.priority)
                            )}>
                              {task.priority.toUpperCase()}
                            </div>
                          </div>
                          
                          {task.description && (
                            <p className="text-gray-400 mb-3 leading-relaxed">
                              {task.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-6 text-sm text-gray-400">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>{task.timeAllocation} minutes</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>{task.category}</span>
                            </div>
                            {task.streak > 0 && (
                              <div className="flex items-center gap-2 text-orange-400">
                                <Flame className="h-4 w-4" />
                                <span>{task.streak} day streak</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-green-500/20"
                            >
                              <MoreHorizontal className="h-5 w-5 text-gray-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-black/90 backdrop-blur-xl border-green-500/30 shadow-xl">
                            <DropdownMenuItem 
                              onClick={() => onDeleteDailyTask(task.id)}
                              className="text-red-400 focus:text-red-400 hover:bg-red-500/20"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Task
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Status bar removed */}
    </div>
  );
};