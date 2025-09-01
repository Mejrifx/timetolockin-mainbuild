import { useState, useCallback, useMemo, memo, useEffect } from 'react';
import { 
  Heart, 
  Plus, 
  ChevronDown,
  ChevronRight,
  Target,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Trash2,
  Edit3,
  Activity,
  Brain,
  Moon,
  Apple,
  Dumbbell,
  Cigarette,
  Wine,
  Coffee,
  Smartphone,
  MoreHorizontal,
  FlaskConical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { HealthData, HealthProtocol, QuitHabit } from '@/types';
import { healthService } from '@/lib/database';

interface HealthLabDashboardProps {
  healthData: HealthData;
  onUpdateHealthData: (data: Partial<HealthData>) => void;
  onCreateDailyTask?: (title: string, timeAllocation: number, priority: 'high' | 'medium' | 'low', category: string, description?: string) => void;
  onAddToCalendar?: (event: { title: string; date: Date; description?: string }) => void;
  onExportToWorkspace?: (content: string, title: string) => void;
}

const protocolIcons: Record<string, any> = {
  fitness: Dumbbell,
  nutrition: Apple,
  sleep: Moon,
  mental: Brain,
  habits: Target,
  other: Activity,
};

const habitIcons: Record<string, any> = {
  smoking: Cigarette,
  alcohol: Wine,
  sugar: Apple,
  social_media: Smartphone,
  caffeine: Coffee,
  other: Circle,
};

const defaultProtocols = [
  {
    title: "How to Fix Posture",
    description: "Comprehensive guide to improving posture for health and confidence",
    content: `# How to Fix Posture

## Why Posture Matters
- Reduces back and neck pain
- Improves breathing and circulation
- Boosts confidence and energy
- Prevents long-term spinal issues

## Daily Exercises (10-15 minutes)
1. **Wall Angels** - 2 sets of 15 reps
2. **Cat-Cow Stretch** - 10 slow movements
3. **Doorway Chest Stretch** - Hold for 30 seconds each arm
4. **Chin Tucks** - 3 sets of 10 reps
5. **Hip Flexor Stretch** - 30 seconds each leg

## Workspace Setup
- Monitor at eye level
- Feet flat on floor
- Shoulders relaxed
- Frequent movement breaks every 30 minutes

## Daily Reminders
- Set hourly posture check alarms
- Practice wall standing for 2 minutes daily
- Strengthen core with planks (build up gradually)`,
    category: 'fitness' as const
  },
  {
    title: "Optimize Sleep for Longevity",
    description: "Science-based sleep optimization for better health and longevity",
    content: `# Optimize Sleep for Longevity

## Sleep Foundation (7-9 hours)
- Consistent sleep/wake times (even weekends)
- Cool room temperature (65-68°F)
- Complete darkness (blackout curtains, eye mask)
- No screens 1 hour before bed

## Evening Routine (90 minutes before bed)
1. **Dim lights** throughout house
2. **No caffeine** after 2 PM
3. **Light stretching** or meditation
4. **Warm bath** or shower
5. **Read fiction** or journal

## Morning Optimization
- **Natural light** within 30 minutes of waking
- **Consistent wake time** (± 30 minutes max)
- **Hydrate immediately** (16-20 oz water)
- **Movement** within first hour

## Sleep Tracking
- Monitor sleep quality
- Track deep sleep phases
- Note how diet affects sleep
- Adjust routine based on data`,
    category: 'sleep' as const
  },
  {
    title: "Daily Hydration Protocol",
    description: "Optimal hydration strategy for energy and health",
    content: `# Daily Hydration Protocol

## Target: Body Weight (lbs) ÷ 2 = Minimum ounces per day

## Timing Strategy
**Upon Waking**: 16-20 oz (rehydrate from sleep)
**Pre-meals**: 8 oz (30 minutes before eating)
**Exercise**: 6-8 oz every 15-20 minutes during activity
**Evening**: Stop 2 hours before bed to avoid sleep disruption

## Quality Matters
- **Filtered water** (remove chlorine, fluoride)
- **Add electrolytes** if sweating heavily
- **Room temperature** for better absorption
- **Glass containers** when possible

## Hydration Boosters
- **Lemon water** in morning (vitamin C, alkalizing)
- **Green tea** (antioxidants, gentle caffeine)
- **Coconut water** post-workout (natural electrolytes)
- **Herbal teas** for variety

## Signs of Proper Hydration
- Light yellow urine
- Consistent energy levels
- Healthy skin elasticity
- Rare headaches`,
    category: 'nutrition' as const
  },
  {
    title: "Stress Reduction Meditation",
    description: "Simple meditation techniques for stress management and focus",
    content: `# Stress Reduction Meditation

## 5-Minute Daily Practice

### Box Breathing (2 minutes)
1. Inhale for 4 counts
2. Hold for 4 counts
3. Exhale for 4 counts
4. Hold empty for 4 counts
5. Repeat 5-8 cycles

### Body Scan (3 minutes)
1. Sit comfortably, close eyes
2. Start at top of head
3. Slowly move attention down body
4. Notice tension, breathe into those areas
5. End at toes, take 3 deep breaths

## Advanced Techniques
- **Mindful walking** (10 minutes outdoors)
- **Loving-kindness** meditation
- **Visualization** for goal achievement
- **Progressive muscle relaxation**

## Stress Response Toolkit
- **4-7-8 breathing** for acute stress
- **Cold water** on wrists/face
- **5-4-3-2-1 grounding** (5 things you see, 4 you hear, etc.)
- **Gratitude listing** (3 things daily)`,
    category: 'mental' as const
  },
  {
    title: "Intermittent Fasting Guide",
    description: "Safe and effective intermittent fasting for health optimization",
    content: `# Intermittent Fasting Guide

## Popular Protocols
**16:8** - Fast 16 hours, eat in 8-hour window (easiest to start)
**18:6** - Fast 18 hours, eat in 6-hour window
**OMAD** - One meal a day (advanced)
**5:2** - Normal eating 5 days, restricted calories 2 days

## Beginner's Approach (16:8)
- **Week 1-2**: 12-hour fast (8 PM to 8 AM)
- **Week 3-4**: 14-hour fast (8 PM to 10 AM)
- **Week 5+**: 16-hour fast (8 PM to 12 PM)

## Eating Window Optimization
- **Break fast gently** (not with large meal)
- **Protein priority** in first meal
- **Nutrient-dense foods** only
- **Stop eating 3 hours** before sleep

## What Breaks a Fast
❌ **Calories**: Food, cream, sugar
❌ **Artificial sweeteners** (may trigger insulin)
✅ **Black coffee**, plain tea, water
✅ **Electrolytes** (salt, magnesium)

## Benefits Timeline
- **12 hours**: Glycogen depletion begins
- **16 hours**: Fat burning increases
- **24 hours**: Autophagy (cellular cleanup)
- **72 hours**: Growth hormone peaks`,
    category: 'nutrition' as const
  }
];

const HealthLabDashboard = memo(({
  healthData,
  onUpdateHealthData,
  onCreateDailyTask,
  onAddToCalendar,
  onExportToWorkspace,
}: HealthLabDashboardProps) => {
  const [showProtocolForm, setShowProtocolForm] = useState(false);
  const [showQuitHabitForm, setShowQuitHabitForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<string | null>(null);
  const [editHabitDescription, setEditHabitDescription] = useState('');
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [newProtocol, setNewProtocol] = useState({
    title: '',
    description: '',
    content: '',
    category: 'other' as HealthProtocol['category'],
  });
  const [newQuitHabit, setNewQuitHabit] = useState({
    name: '',
    description: '',
    quitDate: new Date().toISOString().split('T')[0],
    quitTime: new Date().toTimeString().slice(0, 5), // HH:MM format
    category: 'other' as QuitHabit['category'],
    customCategory: '',
  });

  // Update time every second for live counters
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Initialize with default protocols if empty
  const protocols = useMemo(() => {
    const currentProtocols = Object.values(healthData.protocols || {});
    if (currentProtocols.length === 0) {
      const defaultProtos: Record<string, HealthProtocol> = {};
      defaultProtocols.forEach((proto, index) => {
        const id = `protocol_${Date.now()}_${index}`;
        defaultProtos[id] = {
          id,
          ...proto,
          isExpanded: false,
          isCompleted: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
      });
      return defaultProtos;
    }
    return healthData.protocols || {};
  }, [healthData.protocols]);

  const quitHabits = useMemo(() => healthData.quitHabits || {}, [healthData.quitHabits]);

  const handleCreateProtocol = useCallback(() => {
    if (newProtocol.title.trim()) {
      const id = `protocol_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const protocol: HealthProtocol = {
        id,
        title: newProtocol.title.trim(),
        description: newProtocol.description.trim(),
        content: newProtocol.content.trim(),
        category: newProtocol.category,
        isExpanded: false,
        isCompleted: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      onUpdateHealthData({
        protocols: {
          ...protocols,
          [id]: protocol,
        },
      });

      setNewProtocol({
        title: '',
        description: '',
        content: '',
        category: 'other',
      });
      setShowProtocolForm(false);
    }
  }, [newProtocol, protocols, onUpdateHealthData]);

  const handleCreateQuitHabit = useCallback(() => {
    if (newQuitHabit.name.trim()) {
      const id = `quit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      // Combine date and time for accurate timestamp
      const quitDateTime = new Date(`${newQuitHabit.quitDate}T${newQuitHabit.quitTime}`);
      const quitDate = quitDateTime.getTime();
      
      const quitHabit: QuitHabit = {
        id,
        name: newQuitHabit.name.trim(),
        description: newQuitHabit.description.trim(),
        quitDate,
        category: newQuitHabit.category,
        customCategory: newQuitHabit.customCategory.trim() || undefined,
        isActive: true,
        milestones: [
          { id: '1_day', days: 1, title: '24 Hours', description: 'First day complete!', isReached: false },
          { id: '3_days', days: 3, title: '3 Days', description: 'Breaking the initial habit', isReached: false },
          { id: '1_week', days: 7, title: '1 Week', description: 'First week milestone', isReached: false },
          { id: '1_month', days: 30, title: '1 Month', description: 'Major milestone reached!', isReached: false },
          { id: '3_months', days: 90, title: '3 Months', description: 'Habit likely broken', isReached: false },
          { id: '1_year', days: 365, title: '1 Year', description: 'Life transformation complete!', isReached: false },
        ],
        createdAt: Date.now(),
      };

      onUpdateHealthData({
        quitHabits: {
          ...quitHabits,
          [id]: quitHabit,
        },
      });

      setNewQuitHabit({
        name: '',
        description: '',
        quitDate: new Date().toISOString().split('T')[0],
        quitTime: new Date().toTimeString().slice(0, 5),
        category: 'other',
        customCategory: '',
      });
      setShowQuitHabitForm(false);
    }
  }, [newQuitHabit, quitHabits, onUpdateHealthData]);

  const toggleProtocolExpansion = useCallback((protocolId: string) => {
    const protocol = protocols[protocolId];
    if (protocol) {
      onUpdateHealthData({
        protocols: {
          ...protocols,
          [protocolId]: {
            ...protocol,
            isExpanded: !protocol.isExpanded,
            updatedAt: Date.now(),
          },
        },
      });
    }
  }, [protocols, onUpdateHealthData]);

  const toggleProtocolCompletion = useCallback((protocolId: string) => {
    const protocol = protocols[protocolId];
    if (protocol) {
      onUpdateHealthData({
        protocols: {
          ...protocols,
          [protocolId]: {
            ...protocol,
            isCompleted: !protocol.isCompleted,
            completedAt: !protocol.isCompleted ? Date.now() : undefined,
            updatedAt: Date.now(),
          },
        },
      });
    }
  }, [protocols, onUpdateHealthData]);

  const deleteProtocol = useCallback(async (protocolId: string) => {
    try {
      const success = await healthService.deleteProtocol(protocolId);
      if (success) {
        const newProtocols = { ...protocols };
        delete newProtocols[protocolId];
        onUpdateHealthData({
          protocols: newProtocols,
        });
      }
    } catch (error) {
      console.error('Error deleting protocol:', error);
    }
  }, [protocols, onUpdateHealthData]);

  const deleteQuitHabit = useCallback(async (habitId: string) => {
    try {
      const success = await healthService.deleteQuitHabit(habitId);
      if (success) {
        const newQuitHabits = { ...quitHabits };
        delete newQuitHabits[habitId];
        onUpdateHealthData({
          quitHabits: newQuitHabits,
        });
      }
    } catch (error) {
      console.error('Error deleting quit habit:', error);
    }
  }, [quitHabits, onUpdateHealthData]);

  const startEditingHabit = useCallback((habitId: string) => {
    const habit = quitHabits[habitId];
    if (habit) {
      setEditingHabit(habitId);
      setEditHabitDescription(habit.description);
    }
  }, [quitHabits]);

  const saveHabitDescription = useCallback(async () => {
    if (!editingHabit) return;
    
    const habit = quitHabits[editingHabit];
    if (habit) {
      const updatedHabit = {
        ...habit,
        description: editHabitDescription.trim(),
        updatedAt: Date.now(),
      };
      
      onUpdateHealthData({
        quitHabits: {
          ...quitHabits,
          [editingHabit]: updatedHabit,
        },
      });
      
      setEditingHabit(null);
      setEditHabitDescription('');
    }
  }, [editingHabit, editHabitDescription, quitHabits, onUpdateHealthData]);

  const cancelEditingHabit = useCallback(() => {
    setEditingHabit(null);
    setEditHabitDescription('');
  }, []);

  const getTimeSinceQuit = useCallback((quitDate: number) => {
    const diff = currentTime - quitDate;
    
    if (diff < 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return { days, hours, minutes, seconds };
  }, [currentTime]);

  return (
    <div className="h-full flex flex-col bg-black/20 backdrop-blur-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-green-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Heart className="h-6 w-6 text-green-400" />
            <h1 className="text-2xl font-bold text-white">Health Lab</h1>
          </div>
          <div className="text-xs text-gray-400">
            Your personal health optimization dashboard
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Health Protocols Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-green-400" />
              Health Protocols
            </h2>
            <Button
              onClick={() => setShowProtocolForm(true)}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Protocol
            </Button>
          </div>

          {/* Protocol Form */}
          {showProtocolForm && (
            <div className="bg-black/40 backdrop-blur-xl border border-green-500/30 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-medium text-white">Create New Protocol</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="Protocol title..."
                  value={newProtocol.title}
                  onChange={(e) => setNewProtocol({ ...newProtocol, title: e.target.value })}
                  className="bg-black/20 border-green-500/30 text-white"
                />
                <Select value={newProtocol.category} onValueChange={(value) => setNewProtocol({ ...newProtocol, category: value as HealthProtocol['category'] })}>
                  <SelectTrigger className="bg-black/20 border-green-500/30 text-white">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-black/90 border-green-500/30">
                    <SelectItem value="fitness" className="text-white hover:bg-green-500/20 focus:bg-green-500/20 focus:text-white">Fitness</SelectItem>
                    <SelectItem value="nutrition" className="text-white hover:bg-green-500/20 focus:bg-green-500/20 focus:text-white">Nutrition</SelectItem>
                    <SelectItem value="sleep" className="text-white hover:bg-green-500/20 focus:bg-green-500/20 focus:text-white">Sleep</SelectItem>
                    <SelectItem value="mental" className="text-white hover:bg-green-500/20 focus:bg-green-500/20 focus:text-white">Mental Health</SelectItem>
                    <SelectItem value="habits" className="text-white hover:bg-green-500/20 focus:bg-green-500/20 focus:text-white">Habits</SelectItem>
                    <SelectItem value="other" className="text-white hover:bg-green-500/20 focus:bg-green-500/20 focus:text-white">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input
                placeholder="Brief description..."
                value={newProtocol.description}
                onChange={(e) => setNewProtocol({ ...newProtocol, description: e.target.value })}
                className="bg-black/20 border-green-500/30 text-white"
              />
              <Textarea
                placeholder="Protocol content (markdown supported)..."
                value={newProtocol.content}
                onChange={(e) => setNewProtocol({ ...newProtocol, content: e.target.value })}
                className="bg-black/20 border-green-500/30 text-white min-h-[200px]"
              />
                             <div className="flex gap-2">
                 <Button onClick={handleCreateProtocol} className="bg-green-500 hover:bg-green-600 text-white">
                   Create Protocol
                 </Button>
                 <Button onClick={() => setShowProtocolForm(false)} variant="outline" className="border-gray-500 text-black hover:bg-gray-100">
                   Cancel
                 </Button>
               </div>
            </div>
          )}

          {/* Protocols List */}
          <div className="space-y-3">
            {Object.values(protocols).map((protocol) => {
              const IconComponent = protocolIcons[protocol.category];
              return (
                <div key={protocol.id} className="bg-black/40 backdrop-blur-xl border border-green-500/30 rounded-lg overflow-hidden">
                  <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-green-500/10 transition-colors" onClick={() => toggleProtocolExpansion(protocol.id)}>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-green-500/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleProtocolExpansion(protocol.id);
                        }}
                      >
                        {protocol.isExpanded ? <ChevronDown className="h-4 w-4 text-green-400" /> : <ChevronRight className="h-4 w-4 text-green-400" />}
                      </Button>
                      <IconComponent className="h-5 w-5 text-green-400" />
                      <div>
                        <h3 className="font-medium text-white">{protocol.title}</h3>
                        <p className="text-sm text-gray-400">{protocol.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleProtocolCompletion(protocol.id);
                        }}
                        className={cn(
                          "h-8 w-8 p-0 transition-colors",
                          protocol.isCompleted 
                            ? "text-green-400 hover:bg-green-500/20" 
                            : "text-gray-400 hover:bg-gray-500/20"
                        )}
                      >
                        {protocol.isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:bg-gray-500/20" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-black/90 border-green-500/30">
                          {onCreateDailyTask && (
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              onCreateDailyTask(protocol.title, 30, 'medium', 'Health');
                            }} className="text-white hover:bg-green-500/20">
                              Add to Daily Tasks
                            </DropdownMenuItem>
                          )}
                          {onExportToWorkspace && (
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              onExportToWorkspace(protocol.content, protocol.title);
                            }} className="text-white hover:bg-green-500/20">
                              Export to Workspace
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            deleteProtocol(protocol.id);
                          }} className="text-red-400 hover:bg-red-500/20">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  {protocol.isExpanded && (
                    <div className="border-t border-green-500/20 p-4 bg-black/20">
                      <div className="prose prose-invert prose-green max-w-none">
                        <pre className="whitespace-pre-wrap text-sm text-gray-300 leading-relaxed">
                          {protocol.content}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Quit Bad Habits Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-400" />
              Quit Bad Habits
            </h2>
            <Button
              onClick={() => setShowQuitHabitForm(true)}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Track New Habit
            </Button>
          </div>

          {/* Quit Habit Form */}
          {showQuitHabitForm && (
            <div className="bg-black/40 backdrop-blur-xl border border-green-500/30 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-medium text-white">Track Quitting a Habit</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="Habit name (e.g., smoking, sugar, etc.)..."
                  value={newQuitHabit.name}
                  onChange={(e) => setNewQuitHabit({ ...newQuitHabit, name: e.target.value })}
                  className="bg-black/20 border-green-500/30 text-white"
                />
                <Select value={newQuitHabit.category} onValueChange={(value) => setNewQuitHabit({ ...newQuitHabit, category: value as QuitHabit['category'] })}>
                  <SelectTrigger className="bg-black/20 border-green-500/30 text-white">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-black/90 border-green-500/30">
                    <SelectItem value="smoking" className="text-white hover:bg-green-500/20 focus:bg-green-500/20 focus:text-white">Smoking</SelectItem>
                    <SelectItem value="alcohol" className="text-white hover:bg-green-500/20 focus:bg-green-500/20 focus:text-white">Alcohol</SelectItem>
                    <SelectItem value="sugar" className="text-white hover:bg-green-500/20 focus:bg-green-500/20 focus:text-white">Sugar</SelectItem>
                    <SelectItem value="social_media" className="text-white hover:bg-green-500/20 focus:bg-green-500/20 focus:text-white">Social Media</SelectItem>
                    <SelectItem value="caffeine" className="text-white hover:bg-green-500/20 focus:bg-green-500/20 focus:text-white">Caffeine</SelectItem>
                    <SelectItem value="other" className="text-white hover:bg-green-500/20 focus:bg-green-500/20 focus:text-white">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  type="date"
                  value={newQuitHabit.quitDate}
                  onChange={(e) => setNewQuitHabit({ ...newQuitHabit, quitDate: e.target.value })}
                  className="bg-black/20 border-green-500/30 text-white"
                />
                <Input
                  type="time"
                  value={newQuitHabit.quitTime}
                  onChange={(e) => setNewQuitHabit({ ...newQuitHabit, quitTime: e.target.value })}
                  className="bg-black/20 border-green-500/30 text-white"
                />
                {newQuitHabit.category === 'other' && (
                  <Input
                    placeholder="Custom category..."
                    value={newQuitHabit.customCategory}
                    onChange={(e) => setNewQuitHabit({ ...newQuitHabit, customCategory: e.target.value })}
                    className="bg-black/20 border-green-500/30 text-white"
                  />
                )}
              </div>
              <Textarea
                placeholder="Optional description or motivation..."
                value={newQuitHabit.description}
                onChange={(e) => setNewQuitHabit({ ...newQuitHabit, description: e.target.value })}
                className="bg-black/20 border-green-500/30 text-white"
              />
                             <div className="flex gap-2">
                 <Button onClick={handleCreateQuitHabit} className="bg-green-500 hover:bg-green-600 text-white">
                   Start Tracking
                 </Button>
                 <Button onClick={() => setShowQuitHabitForm(false)} variant="outline" className="border-gray-500 text-black hover:bg-gray-100">
                   Cancel
                 </Button>
               </div>
            </div>
          )}

          {/* Quit Habits List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Object.values(quitHabits).filter(habit => habit.isActive).map((habit) => {
              const IconComponent = habitIcons[habit.category];
              const timeStats = getTimeSinceQuit(habit.quitDate);
              const displayCategory = habit.category === 'other' ? habit.customCategory : habit.category.replace('_', ' ');
              
              return (
                <div key={habit.id} className="bg-black/40 backdrop-blur-xl border border-green-500/30 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <IconComponent className="h-6 w-6 text-red-400" />
                      <div>
                        <h3 className="font-medium text-white">{habit.name}</h3>
                        <p className="text-sm text-gray-400 capitalize">{displayCategory}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:bg-gray-500/20">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-black/90 border-green-500/30">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          deleteQuitHabit(habit.id);
                        }} className="text-red-400 hover:bg-red-500/20">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Stop Tracking
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  {/* Live Counter */}
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">{timeStats.days}</div>
                      <div className="text-xs text-gray-400">Days</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">{timeStats.hours}</div>
                      <div className="text-xs text-gray-400">Hours</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">{timeStats.minutes}</div>
                      <div className="text-xs text-gray-400">Minutes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">{timeStats.seconds}</div>
                      <div className="text-xs text-gray-400">Seconds</div>
                    </div>
                  </div>

                  {/* Milestones */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-300">Milestones</div>
                    <div className="space-y-1">
                      {habit.milestones.slice(0, 3).map((milestone) => {
                        const isReached = timeStats.days >= milestone.days;
                        return (
                          <div key={milestone.id} className={cn(
                            "flex items-center gap-2 text-xs",
                            isReached ? "text-green-400" : "text-gray-500"
                          )}>
                            {isReached ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
                            <span>{milestone.title}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {habit.description && (
                    <div className="mt-4 pt-4 border-t border-green-500/20">
                      <p className="text-sm text-gray-400">{habit.description}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {Object.values(quitHabits).filter(habit => habit.isActive).length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Activity className="h-12 w-12 mx-auto mb-4 text-gray-600" />
              <p>No habits being tracked yet.</p>
              <p className="text-sm">Add a habit you want to quit to start your journey!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

HealthLabDashboard.displayName = 'HealthLabDashboard';

export { HealthLabDashboard };
