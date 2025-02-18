"use client";

import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, addDays, addMonths, addYears, subMonths, subYears } from "date-fns";
import { LineChart, Line as RechartsLine, XAxis, YAxis, CartesianGrid, ResponsiveContainer, 
  Tooltip as RechartsTooltip, PieChart, Pie, Sector } from 'recharts';
import { insertGoal, GoalPeriod, ContentType } from "@/app/actions";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Pencil, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import { Achievement, getUserAchievements } from "@/lib/achievements";

interface VideoLog {
  id: number;
  user_id: string;
  start_time: string;
  end_time: string;
  date_watched: string;
}

interface MangaLog {
  id: number;
  user_id: string;
  start_time: string;
  end_time: string;
  date_read: string;
}

interface Goal {
  id: number;
  content_type: ContentType;
  period: GoalPeriod;
  target_minutes: number;
}

type ViewPeriod = GoalPeriod;
type ChartType = 'line' | 'pie';

interface GoalProgress {
  current: number;
  target: number;
  percentage: number;
  currentHours: string;
  targetHours: string;
}

interface SelectedDataTypes {
  listening: boolean;
  reading: boolean;
  total: boolean;
}

type ChartView = 'sessions' | 'total';

export function TrackerContent() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [videoLogs, setVideoLogs] = useState<VideoLog[]>([]);
  const [mangaLogs, setMangaLogs] = useState<MangaLog[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [viewPeriod, setViewPeriod] = useState<ViewPeriod>('weekly');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [newGoal, setNewGoal] = useState<Partial<Goal>>({
    content_type: 'total',
    period: 'daily',
    target_minutes: 60
  });
  const [chartView, setChartView] = useState<ChartView>('sessions');
  const [editingGoalId, setEditingGoalId] = useState<number | null>(null);
  const [selectedDataTypes, setSelectedDataTypes] = useState<SelectedDataTypes>({
    listening: true,
    reading: true,
    total: true
  });
  const [chartType, setChartType] = useState<'line' | 'pie'>('line');
  const [selectedAchievementCategory, setSelectedAchievementCategory] = useState<'all' | 'reading' | 'listening' | 'total' | 'streak'>('all');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    all: false,
    reading: false,
    listening: false,
    total: false,
    streak: false
  });
  const [achievementsError, setAchievementsError] = useState<string | null>(null);
  const [achievementsLoading, setAchievementsLoading] = useState(true);

  useEffect(() => {
    if (chartView === 'sessions' && (viewPeriod === 'monthly' || viewPeriod === 'yearly')) {
      setViewPeriod('weekly');
    }
  }, [chartView]);

  // Convert timestamptz to local time and extract hours and minutes
  const timeToMinutes = (timeStr: string) => {
    const date = new Date(timeStr);
    return date.getHours() * 60 + date.getMinutes();
  };

  const calculateDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    return diffMinutes;
  };

  const cleanTimeForDisplay = (timeStr: string) => {
    const date = new Date(timeStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Calculate session position and height for a specific day
  const getSessionStyle = (startTime: string, endTime: string, isVideo: boolean, targetDate: Date) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const targetDateStart = new Date(targetDate);
    targetDateStart.setHours(0, 0, 0, 0);
    const targetDateEnd = new Date(targetDate);
    targetDateEnd.setHours(23, 59, 59, 999);

    if (end < targetDateStart || start > targetDateEnd) {
      return null;
    }

    const clampedStart = start < targetDateStart ? targetDateStart : start;
    const clampedEnd = end > targetDateEnd ? targetDateEnd : end;

    const dayStart = new Date(targetDate).setHours(0, 0, 0, 0);
    const top = ((clampedStart.getTime() - dayStart) / (24 * 60 * 60 * 1000)) * 100;
    const height = ((clampedEnd.getTime() - clampedStart.getTime()) / (24 * 60 * 60 * 1000)) * 100;

    return {
      top: `${top}%`,
      height: `${height}%`,
      position: 'absolute',
      left: '0',
      right: '0',
      margin: '0 0.5rem',
      backgroundColor: isVideo ? 'rgb(254 226 226)' : 'rgb(219 234 254)', 
      borderColor: isVideo ? '#F87171' : '#60A5FA', 
      borderWidth: '1px',
      borderStyle: 'solid',
      borderRadius: '0.375rem',
      transition: 'background-color 150ms',
      ':hover': {
        backgroundColor: isVideo ? 'rgb(254 202 202)' : 'rgb(191 219 254)' 
      }
    } as const;
  };

  const getDateRange = () => {
    switch (viewPeriod) {
      case 'daily':
        return {
          start: currentDate,
          end: currentDate
        };
      case 'weekly':
        return {
          start: startOfWeek(currentDate, { weekStartsOn: 1 }),
          end: endOfWeek(currentDate, { weekStartsOn: 1 })
        };
      case 'monthly':
        return {
          start: startOfMonth(currentDate),
          end: endOfMonth(currentDate)
        };
      case 'yearly':
        return {
          start: startOfYear(currentDate),
          end: endOfYear(currentDate)
        };
    }
  };

  const navigatePeriod = (direction: 'prev' | 'next') => {
    switch (viewPeriod) {
      case 'daily':
        setCurrentDate(prev => addDays(prev, direction === 'prev' ? -1 : 1));
        break;
      case 'weekly':
        setCurrentDate(prev => addDays(prev, direction === 'prev' ? -7 : 7));
        break;
      case 'monthly':
        setCurrentDate(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
        break;
      case 'yearly':
        setCurrentDate(prev => direction === 'prev' ? subYears(prev, 1) : addYears(prev, 1));
        break;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setAchievementsLoading(true);
      setAchievementsError(null);
      const supabase = createClient();

      try {
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('No user found');
        }

        // Fetch achievements using the server action
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            throw new Error('No user found');
          }
          const achievementsData = await getUserAchievements(user.id);
          setAchievements(achievementsData);
        } catch (error) {
          console.error('Error fetching achievements:', error);
          setAchievementsError('Failed to load achievements');
        }

        // Fetch goals - RLS will automatically use the session cookie
        const { data: goalData, error: goalError } = await supabase
          .from('goals')
          .select('*');

        if (goalError) {
          console.error('Error fetching goals:', goalError);
        } else {
          setGoals(goalData || []);
        }

        const dateRange = getDateRange();
        if (!dateRange) return;
        
        const startDateTime = new Date(dateRange.start);
        startDateTime.setHours(0, 0, 0, 0);
        const endDateTime = new Date(dateRange.end);
        endDateTime.setHours(23, 59, 59, 999);

        // Fetch video logs - RLS will automatically use the session cookie
        const { data: videoData, error: videoError } = await supabase
          .from('Logs')
          .select('*')
          .or(`start_time.gte.${startDateTime.toISOString()},end_time.gte.${startDateTime.toISOString()}`)
          .or(`start_time.lte.${endDateTime.toISOString()},end_time.lte.${endDateTime.toISOString()}`)
          .order('start_time', { ascending: true });

        if (videoError) {
          console.error('Error fetching video logs:', videoError);
        } else {
          setVideoLogs(videoData || []);
        }

        // Fetch manga logs - RLS will automatically use the session cookie
        const { data: mangaData, error: mangaError } = await supabase
          .from('MangaLogs')
          .select('*')
          .or(`start_time.gte.${startDateTime.toISOString()},end_time.gte.${startDateTime.toISOString()}`)
          .or(`start_time.lte.${endDateTime.toISOString()},end_time.lte.${endDateTime.toISOString()}`)
          .order('start_time', { ascending: true });

        if (mangaError) {
          console.error('Error fetching manga logs:', mangaError);
        } else {
          setMangaLogs(mangaData || []);
        }

      } catch (error) {
        console.error('Unexpected error:', error);
        setAchievementsError('An unexpected error occurred');
      } finally {
        setIsLoading(false);
        setAchievementsLoading(false);
      }
    };

    fetchData();
  }, [currentDate, viewPeriod]);

  const calculateDayTotal = (date: Date, type: ContentType) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    let total = 0;

    if (type === 'video' || type === 'total') {
      const relevantVideoLogs = videoLogs.filter(log => {
        const start = new Date(log.start_time);
        const end = new Date(log.end_time);
        return start <= dayEnd && end >= dayStart;
      });

      relevantVideoLogs.forEach(log => {
        const start = new Date(log.start_time);
        const end = new Date(log.end_time);
        const clampedStart = start < dayStart ? dayStart : start;
        const clampedEnd = end > dayEnd ? dayEnd : end;
        const duration = (clampedEnd.getTime() - clampedStart.getTime()) / (1000 * 60);
        
        total += duration;
      });
    }

    if (type === 'manga' || type === 'total') {
      const relevantMangaLogs = mangaLogs.filter(log => {
        const start = new Date(log.start_time);
        const end = new Date(log.end_time);
        return start <= dayEnd && end >= dayStart;
      });
      relevantMangaLogs.forEach(log => {
        const start = new Date(log.start_time);
        const end = new Date(log.end_time);
        const clampedStart = start < dayStart ? dayStart : start;
        const clampedEnd = end > dayEnd ? dayEnd : end;
        const duration = (clampedEnd.getTime() - clampedStart.getTime()) / (1000 * 60);

        total += duration;
      });
    }
    return Math.round(total);
  };

  const minutesToHours = (minutes: number) => {
    return (minutes / 60).toFixed(1);
  };

  const getGoalProgress = (type: ContentType, period: GoalPeriod): GoalProgress | null => {
    const goal = goals.find(g => g.content_type === type && g.period === period);
    if (!goal) {
      return null;
    }


    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let totalMinutes = 0;

    switch (goal.period) {
      case 'daily':
        totalMinutes = calculateDayTotal(today, type);
        break;
      case 'weekly': {
        const weekStart = startOfWeek(today, { weekStartsOn: 1 });
        let currentDate = weekStart;
        while (currentDate <= today) {
          const dayTotal = calculateDayTotal(currentDate, type);
          totalMinutes += dayTotal;
          currentDate = addDays(currentDate, 1);
        }
        break;
      }
      case 'monthly': {
        const monthStart = startOfMonth(today);
        let currentDate = monthStart;
        while (currentDate <= today) {
          const dayTotal = calculateDayTotal(currentDate, type);
          totalMinutes += dayTotal;
          currentDate = addDays(currentDate, 1);
        }
        break;
      }
      case 'yearly': {
        const yearStart = startOfYear(today);
        let currentDate = yearStart;
        while (currentDate <= today) {
          const dayTotal = calculateDayTotal(currentDate, type);
          totalMinutes += dayTotal;
          currentDate = addDays(currentDate, 1);
        }
        break;
      }
    }


    const percentage = (totalMinutes / goal.target_minutes) * 100;

    return {
      current: totalMinutes,
      target: goal.target_minutes,
      percentage: Math.min(Math.round(percentage * 10) / 10, 100),
      currentHours: formatMinutes(totalMinutes),
      targetHours: formatMinutes(goal.target_minutes)
    };
  };

  const getTotalHoursChartData = () => {
    const dateRange = getDateRange();
    if (!dateRange) return [];

    const data = [];
    let iterDate = dateRange.start;

    if (viewPeriod === 'yearly') {
      // For yearly view, aggregate by month
      const monthlyData = new Array(12).fill(0).map(() => ({
        videoMinutes: 0,
        mangaMinutes: 0,
        count: 0
      }));

      while (iterDate <= dateRange.end) {
        const monthIndex = iterDate.getMonth();
        const videoMinutes = calculateDayTotal(iterDate, 'video');
        const mangaMinutes = calculateDayTotal(iterDate, 'manga');
        
        monthlyData[monthIndex].videoMinutes += videoMinutes;
        monthlyData[monthIndex].mangaMinutes += mangaMinutes;
        monthlyData[monthIndex].count++;
        
        iterDate = addDays(iterDate, 1);
      }
      monthlyData.forEach((month, index) => {
        if (month.count > 0) {
          data.push({
            date: format(new Date(currentDate.getFullYear(), index), 'MMM'),
            listening: Number((month.videoMinutes / 60).toFixed(1)),
            reading: Number((month.mangaMinutes / 60).toFixed(1)),
            total: Number(((month.videoMinutes + month.mangaMinutes) / 60).toFixed(1))
          });
        }
      });
    } else {
      while (iterDate <= dateRange.end) {
        const videoMinutes = calculateDayTotal(iterDate, 'video');
        const mangaMinutes = calculateDayTotal(iterDate, 'manga');
        data.push({
          date: format(iterDate, 
            viewPeriod === 'monthly' ? 'MMM d' :
            viewPeriod === 'weekly' ? 'EEE' :
            'EEE'
          ),
          fullDate: format(iterDate, 'MMM d, yyyy'),
          listening: Number((videoMinutes / 60).toFixed(1)),
          reading: Number((mangaMinutes / 60).toFixed(1)),
          total: Number(((videoMinutes + mangaMinutes) / 60).toFixed(1))
        });
        iterDate = addDays(iterDate, 1);
      }
    }

    return data;
  };

  const getTotalHoursChartOptions = () => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      }
    };
  };

  const getSessionChartOptions = () => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
          labels: {
            color: isDarkMode ? 'rgb(255, 255, 255)' : 'rgb(0, 0, 0)'
          }
        },
        title: {
          display: true,
          text: `${getPeriodLabel(viewPeriod)} Immersion Sessions`,
          color: isDarkMode ? 'rgb(255, 255, 255)' : 'rgb(0, 0, 0)',
          font: {
            weight: 600,
            size: 14
          }
        },
        tooltip: {
          callbacks: {
            title: (items: any[]) => {
              const item = items[0];
              const dataset = item.dataset;
              const startHours = Math.floor(dataset.base);
              const startMinutes = Math.round((dataset.base % 1) * 60);
              const endHours = Math.floor(item.parsed.y);
              const endMinutes = Math.round((item.parsed.y % 1) * 60);
              return `${dataset.label}: ${startHours.toString().padStart(2, '0')}:${startMinutes.toString().padStart(2, '0')} - ${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
            },
            label: () => ''
          }
        }
      },
      layout: {
        padding: {
          left: 10,
          right: 30
        }
      },
      scales: {
        x: {
          type: 'category' as const,
          grid: {
            display: true,
            color: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)',
            lineWidth: 1.5,
            drawTicks: false,
            offset: true
          },
          border: {
            display: true,
            color: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)'
          },
          ticks: {
            color: isDarkMode ? 'rgb(255, 255, 255)' : 'rgb(0, 0, 0)',
            font: {
              weight: 600
            },
            padding: 8,
            maxRotation: 0,
            minRotation: 0,
            autoSkip: false
          },
          offset: true,
          stacked: true,
          afterFit: (scale: any) => {
            const chartWidth = scale.chart.width - 60;
            const tickCount = scale.ticks.length;
            const tickWidth = chartWidth / tickCount;
            scale.width = chartWidth;
            scale.paddingRight = 30;
            scale.paddingLeft = 30;
            scale.ticks.forEach((tick: any) => {
              tick.width = tickWidth;
            });
          }
        },
        y: {
          type: 'linear' as const,
          min: 0,
          max: 24,
          reverse: true,
          grid: {
            display: true,
            color: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)',
            lineWidth: 1.5,
            drawTicks: false
          },
          border: {
            display: true,
            color: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)'
          },
          ticks: {
            stepSize: 1,
            color: isDarkMode ? 'rgb(255, 255, 255)' : 'rgb(0, 0, 0)',
            font: {
              weight: 600
            },
            padding: 8,
            callback: (value: number | string) => {
              const numValue = typeof value === 'string' ? parseFloat(value) : value;
              const hours = Math.floor(numValue);
              const minutes = Math.round((numValue % 1) * 60);
              return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            }
          },
          stacked: true
        }
      }
    };
  };

  const formatHour = (hour: number) => {
    const hours = Math.floor(hour);
    const minutes = Math.floor((hour - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return `${hours}h ${remainingMinutes}m`;
  };
  const viewPeriodToDatabasePeriod = (period: ViewPeriod): string => {
    const mapping = {
      'daily': 'daily',
      'weekly': 'weekly',
      'monthly': 'monthly',
      'yearly': 'yearly'
    };
    return mapping[period];
  };
  const deleteGoal = async (goalId: number) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId);

      if (error) {
        toast.error('Failed to delete goal');
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      const { data: goalData } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user?.id);

      toast.success('Goal deleted successfully');
      setGoals(goalData || []);
    } catch (error) {
      toast.error('Failed to delete goal');
    }
  };
  const editGoal = (goal: Goal) => {
    setNewGoal({
      content_type: goal.content_type,
      period: goal.period,
      target_minutes: goal.target_minutes,
      id: goal.id
    });
  };
  const closeEditPopover = () => {
    setNewGoal({
      content_type: 'total',
      period: 'daily',
      target_minutes: 60
    });
  };
  const saveGoal = async () => {
    if (!newGoal.content_type || !newGoal.period || !newGoal.target_minutes) {
      return;
    }

    try {
      const supabase = createClient();
      const { data: existingGoals } = await supabase
        .from('goals')
        .select('*')
        .match({
          content_type: newGoal.content_type,
          period: newGoal.period
        });
      const hasConflict = existingGoals?.some(g => g.id !== newGoal.id);

      if (hasConflict) {
        toast.error('A goal with this content type and period already exists');
        return;
      }

      let result;
      if (newGoal.id) {
        // Update existing goal
        result = await supabase
          .from('goals')
          .update({
            content_type: newGoal.content_type,
            period: newGoal.period,
            target_minutes: newGoal.target_minutes,
            updated_at: new Date().toISOString()
          })
          .eq('id', newGoal.id);
      } else {
        // Insert new goal
        result = await insertGoal(
          newGoal.content_type,
          newGoal.period,
          newGoal.target_minutes
        );
      }

      if (result.error) {
        toast.error('Failed to save goal');
        return;
      }

      // Refresh goals
      const { data: { user } } = await supabase.auth.getUser();
      const { data: goalData, error: goalError } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user?.id);

      if (goalError) {
        return;
      }

      toast.success('Goal saved successfully');
      setGoals(goalData || []);
      closeEditPopover();
    } catch (error) {
      toast.error('Failed to save goal');
    }
  };
  const getGoalProgressDisplay = (type: ContentType, period: GoalPeriod) => {
    const progress = getGoalProgress(type, period);
    if (!progress) return null;

    return {
      current: formatMinutes(progress.current),
      target: formatMinutes(progress.target),
      percentage: progress.percentage
    };
  };
  const getPeriodDisplayText = () => {
    const dateRange = getDateRange();
    if (!dateRange) return '';

    switch (viewPeriod) {
      case 'weekly':
        return `Week of ${format(dateRange.start, 'MMMM d')} - ${format(dateRange.end, 'MMMM d, yyyy')}`;
      case 'monthly':
        return format(currentDate, 'MMMM yyyy');
      case 'yearly':
        return format(currentDate, 'yyyy');
      default:
        return '';
    }
  };
  const getChartData = () => {
    const dateRange = getDateRange();
    if (!dateRange) return null;

    const labels = [];
    const videoData = [];
    const mangaData = [];
    let currentDate = dateRange.start;

    while (currentDate <= dateRange.end) {
      labels.push(format(currentDate, viewPeriod === 'daily' ? 'HH:mm' : 'MM/dd'));
      videoData.push(calculateDayTotal(currentDate, 'video'));
      mangaData.push(calculateDayTotal(currentDate, 'manga'));
      currentDate = addDays(currentDate, 1);
    }

    return {
      labels,
      datasets: [
        {
          label: 'Video',
          data: videoData,
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          borderColor: 'rgb(239, 68, 68)',
          borderWidth: 1
        },
        {
          label: 'Reading',
          data: mangaData,
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1
        }
      ]
    };
  };
  const getChartOptions = () => {
    return {
      responsive: true,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        title: {
          display: true,
          text: getPeriodLabel(viewPeriod) + ' Activity'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Minutes'
          }
        }
      }
    };
  };
  const getPeriodLabel = (period: ViewPeriod) => {
    switch (period) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        return 'Weekly';
      case 'monthly':
        return 'Monthly';
      case 'yearly':
        return 'Yearly';
      default:
        return '';
    }
  };
  const periodOptions = [
    { value: 'weekly' as ViewPeriod, label: 'Weekly' },
    { value: 'monthly' as ViewPeriod, label: 'Monthly' },
    { value: 'yearly' as ViewPeriod, label: 'Yearly' }
  ];

  const contentTypeOptions = [
    { value: 'video' as ContentType, label: 'Listening' },
    { value: 'manga' as ContentType, label: 'Reading' },
    { value: 'total' as ContentType, label: 'Total' }
  ];

  const handlePeriodChange = (period: ViewPeriod) => {
    setNewGoal(prev => ({ ...prev, period }));
  };

  const handleContentTypeChange = (contentType: ContentType) => {
    setNewGoal(prev => ({ ...prev, content_type: contentType }));
  };

  const handleTargetMinutesChange = (minutes: number) => {
    setNewGoal(prev => ({ ...prev, target_minutes: minutes }));
  };
  const updatePeriod = (newPeriod: ViewPeriod) => {
    setViewPeriod(newPeriod);
  };

  const renderActiveShape = (props: any) => {
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
      fill, payload, percent, value } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';
  
    return (
      <g>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill={isDarkMode ? '#fff' : '#000'}>
          {payload.name}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none"/>
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none"/>
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill={isDarkMode ? '#fff' : '#000'}>
          {`${formatMinutes(value)}`}
        </text>
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill={isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'}>
          {`(${(percent * 100).toFixed(1)}%)`}
        </text>
      </g>
    );
  };

  const renderChart = () => {
    const data = getTotalHoursChartData();
    const dateRange = getDateRange();
    if (!dateRange) return null;

    const filteredData = data.map(item => {
      const newItem: any = { 
        date: item.date,
        fullDate: item.fullDate
      };
      if (selectedDataTypes.listening) newItem.listening = item.listening;
      if (selectedDataTypes.reading) newItem.reading = item.reading;
      if (selectedDataTypes.total) newItem.total = item.total;
      return newItem;
    });
    const totalData = data.reduce((acc, item) => {
      acc.listening += item.listening || 0;
      acc.reading += item.reading || 0;
      return acc;
    }, { listening: 0, reading: 0 });

    const pieData = [
      { name: 'Listening', value: totalData.listening * 60, fill: '#F87171' },
      { name: 'Reading', value: totalData.reading * 60, fill: '#60A5FA' }
    ];

    return (
      <div className="w-full h-[500px] p-4 rounded-lg border dark:border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-sm font-medium">
            {chartType === 'line' ? 'Time Distribution' : 'Activity Breakdown'}
          </h4>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="hover:border-[#F87171] border-slate-700 hover:text-white hover:bg-[#F87171] transition-colors">
                {chartType === 'line' ? 'Line Chart' : 'Pie Chart'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-background border-input">
              <DropdownMenuItem 
                onClick={() => setChartType('line')} 
                className="hover:text-[#F87171] cursor-pointer focus:bg-accent"
              >
                Line Chart
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setChartType('pie')} 
                className="hover:text-[#F87171] cursor-pointer focus:bg-accent"
              >
                Pie Chart
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <LineChart data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} />
              <XAxis 
                dataKey="date" 
                stroke={isDarkMode ? '#fff' : '#000'}
                interval={viewPeriod === 'monthly' ? 2 : 'preserveEnd'}
                angle={-20}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                stroke={isDarkMode ? '#fff' : '#000'}
                tickFormatter={(value) => `${value}h`}
              />
              <RechartsTooltip 
                formatter={(value: number, name: string) => {
                  const color = name === 'listening' ? '#F87171' : 
                               name === 'reading' ? '#60A5FA' : 
                               '#A78BFA';
                  return [
                    <span style={{ color }}>
                      {`${value}h`}
                    </span>,
                    <span style={{ color }}>
                      {name.charAt(0).toUpperCase() + name.slice(1)}
                    </span>
                  ];
                }}
                labelFormatter={(label: string, payload: any[]) => {
                  if (!payload || payload.length === 0) return label;
                  const dataPoint = payload[0].payload;
                  return dataPoint.fullDate || label;
                }}
                contentStyle={{
                  backgroundColor: isDarkMode ? 'rgb(30, 41, 59)' : 'white',
                  border: isDarkMode ? '1px solid rgb(51, 65, 85)' : '1px solid rgb(226, 232, 240)',
                  borderRadius: '0.375rem'
                }}
                itemStyle={{
                  color: isDarkMode ? 'rgb(226, 232, 240)' : 'rgb(15, 23, 42)'
                }}
                labelStyle={{
                  color: isDarkMode ? 'rgb(226, 232, 240)' : 'rgb(15, 23, 42)'
                }}
              />
              {selectedDataTypes.listening && (
                <RechartsLine 
                  type="monotone" 
                  dataKey="listening" 
                  stroke="#F87171" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#F87171' }}
                />
              )}
              {selectedDataTypes.reading && (
                <RechartsLine 
                  type="monotone" 
                  dataKey="reading" 
                  stroke="#60A5FA" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#60A5FA' }}
                />
              )}
              {selectedDataTypes.total && (
                <RechartsLine 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#A78BFA" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#A78BFA' }}
                />
              )}
            </LineChart>
          ) : (
            <PieChart>
              <Pie
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={100}
                outerRadius={120}
                dataKey="value"
                onMouseEnter={onPieEnter}
              />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    );
  };

  const getAchievementIcon = (category: string) => {
    switch (category) {
      case 'TotalTime':
        return '⭐';
      case 'ListeningTime':
        return '🎧';
      case 'ReadingTime':
        return '📚';
      case 'Streak':
        return '🔥';
      default:
        return '🌟';
    }
  };

  const formatAchievementProgress = (achievement: Achievement) => {
    const isTimeCategory = ['TotalTime', 'ListeningTime', 'ReadingTime'].includes(achievement.category);
    if (isTimeCategory) {
      return {
        current: formatMinutes(parseInt(achievement.current_progress)),
        total: formatMinutes(parseInt(achievement.target))
      };
    }
    return {
      current: parseInt(achievement.current_progress),
      total: parseInt(achievement.target)
    };
  };

  const getAchievementDescription = (achievement: Achievement) => {
    const { total } = formatAchievementProgress(achievement);
    switch (achievement.category) {
      case 'TotalTime':
        return `Spend ${total} learning Japanese`;
      case 'ListeningTime':
        return `Listen to Japanese content for ${total}`;
      case 'ReadingTime':
        return `Read Japanese content for ${total}`;
      case 'Streak':
        return `Maintain a ${total} day learning streak`;
      default:
        return achievement.name;
    }
  };

  const getAchievementsToShow = (category: string) => {
    let filteredAchievements = achievements;
    
    if (category !== 'all') {
      const categoryMapping = {
        'reading': 'ReadingTime',
        'listening': 'ListeningTime',
        'total': 'TotalTime',
        'streak': 'Streak'
      };
      const dbCategory = categoryMapping[category as keyof typeof categoryMapping];
      filteredAchievements = achievements.filter(a => a.category === dbCategory);
    }

    return expandedCategories[category] ? filteredAchievements : filteredAchievements.slice(0, 3);
  };

  const toggleExpand = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  return (
    <div className="flex-1 w-full max-w-[2400px] mx-auto p-4 md:p-8 space-y-8">
      {/* Statistics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Statistics */}
        <div className="p-8 rounded-xl border-2 bg-background border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">Statistics</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigatePeriod('prev')}
                  className="hover:border-[#F87171] hover:text-white border-slate-700 hover:bg-[#F87171] transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">
                  {getPeriodDisplayText()}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigatePeriod('next')}
                  className="hover:border-[#F87171] hover:text-white border-slate-700 hover:bg-[#F87171] transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="hover:border-[#F87171] hover:text-white border-slate-700 hover:bg-[#F87171] transition-colors">
                    {viewPeriod === 'weekly' ? 'Week' :
                     viewPeriod === 'monthly' ? 'Month' :
                     'Year'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-background border-input">
                  <DropdownMenuItem onSelect={() => setViewPeriod('weekly')} className="hover:text-[#F87171] cursor-pointer focus:bg-accent">
                    Week
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setViewPeriod('monthly')} className="hover:text-[#F87171] cursor-pointer focus:bg-accent">
                    Month
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setViewPeriod('yearly')} className="hover:text-[#F87171] cursor-pointer focus:bg-accent">
                    Year
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {renderChart()}
        </div>

        {/* Right Column - Goals Progress */}
        <div className="p-8 rounded-xl border-2 bg-background border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">Goals Progress</h3>
            <Popover onOpenChange={(open) => {
              if (!open) {
                closeEditPopover();
              }
            }}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 hover:border-[#F87171] border-slate-700 hover:text-white hover:bg-[#F87171] transition-colors">
                  <Plus className="h-4 w-4" /> Add Goal
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">New Goal</h4>
                    <p className="text-sm text-muted-foreground">
                      Set a new immersion goal.
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label>Type</Label>
                    <Select
                      value={newGoal.content_type}
                      onValueChange={(value) => setNewGoal(prev => ({ ...prev, content_type: value as ContentType }))}
                    >
                      <SelectTrigger className="hover:border-[#F87171] transition-colors">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border-input">
                        <SelectItem value="total" className="hover:text-[#F87171] cursor-pointer focus:bg-accent">Total</SelectItem>
                        <SelectItem value="video" className="hover:text-[#F87171] cursor-pointer focus:bg-accent">Listening</SelectItem>
                        <SelectItem value="manga" className="hover:text-[#F87171] cursor-pointer focus:bg-accent">Reading</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Period</Label>
                    <Select
                      value={newGoal.period}
                      onValueChange={(value) => setNewGoal(prev => ({ ...prev, period: value as GoalPeriod }))}
                    >
                      <SelectTrigger className="hover:border-[#F87171] transition-colors">
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border-input">
                        <SelectItem value="daily" className="hover:text-[#F87171] cursor-pointer focus:bg-accent">Daily</SelectItem>
                        <SelectItem value="weekly" className="hover:text-[#F87171] cursor-pointer focus:bg-accent">Weekly</SelectItem>
                        <SelectItem value="monthly" className="hover:text-[#F87171] cursor-pointer focus:bg-accent">Monthly</SelectItem>
                        <SelectItem value="yearly" className="hover:text-[#F87171] cursor-pointer focus:bg-accent">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Target Hours</Label>
                    <Input
                      type="number"
                      value={newGoal.target_minutes ? (newGoal.target_minutes / 60) : ''}
                      onChange={(e) => {
                        const hours = parseFloat(e.target.value);
                        if (!isNaN(hours)) {
                          setNewGoal(prev => ({ ...prev, target_minutes: Math.round(hours * 60) }));
                        }
                      }}
                      min="0.1"
                      step="0.1"
                      placeholder="Enter target hours"
                      className="hover:border-[#F87171] transition-colors focus-visible:ring-[#F87171]"
                    />
                  </div>
                  <Button 
                    onClick={saveGoal}
                    disabled={!newGoal.content_type || !newGoal.period || !newGoal.target_minutes}
                    className="bg-[#F87171] hover:bg-[#ef4444] transition-colors disabled:hover:bg-[#F87171]"
                  >
                    Save Goal
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-6">
            {/* Daily Goals */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Daily Goals</h4>
              <div className="space-y-4">
                {goals.filter(goal => goal.period === 'daily').map((goal) => {
                    const progress = getGoalProgress(goal.content_type, goal.period);
                    if (!progress) return null;
                    return (
                    <div key={goal.id} className="space-y-2 group">
                      <div className="flex justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              goal.content_type === 'video' ? 'bg-[#F87171]' : 
                              goal.content_type === 'manga' ? 'bg-[#60A5FA]' : 
                              'bg-[#A78BFA]'
                            }`} />
                          <span className="capitalize">
                              {goal.content_type === 'video' ? 'Listening' : 
                               goal.content_type === 'manga' ? 'Reading' : 
                               'Total'}
                            </span>
                          </div>
                        <div className="flex items-center gap-4">
                          <span>{progress.currentHours}/{progress.targetHours}</span>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <Popover onOpenChange={(open) => {
                              if (open) {
                                editGoal(goal);
                              } else {
                                closeEditPopover();
                              }
                            }}>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-blue-500 hover:text-white hover:bg-[#F87171] font-medium p-0 h-auto transition-colors">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80 animate-in fade-in-0 zoom-in-95">
                                <div className="grid gap-4">
                                  <div className="space-y-2">
                                    <h4 className="font-medium leading-none">Edit Goal</h4>
                                    <p className="text-sm text-muted-foreground">
                                      Modify your immersion goal.
                                    </p>
                                  </div>
                                  <div className="grid gap-2">
                                    <Label>Type</Label>
                                    <Select
                                      value={newGoal.content_type}
                                      onValueChange={(value) => setNewGoal(prev => ({ ...prev, content_type: value as ContentType }))}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                      </SelectTrigger>
                                      <SelectContent className="bg-background border-input">
                                        <SelectItem value="total">Total</SelectItem>
                                        <SelectItem value="video">Listening</SelectItem>
                                        <SelectItem value="manga">Reading</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="grid gap-2">
                                    <Label>Period</Label>
                                    <Select
                                      value={newGoal.period}
                                      onValueChange={(value) => setNewGoal(prev => ({ ...prev, period: value as GoalPeriod }))}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select period" />
                                      </SelectTrigger>
                                      <SelectContent className="bg-background border-input">
                                        <SelectItem value="daily">Daily</SelectItem>
                                        <SelectItem value="weekly">Weekly</SelectItem>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                        <SelectItem value="yearly">Yearly</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="grid gap-2">
                                    <Label>Target Hours</Label>
                                    <Input
                                      type="number"
                                      value={newGoal.target_minutes ? (newGoal.target_minutes / 60) : ''}
                                      onChange={(e) => {
                                        const hours = parseFloat(e.target.value);
                                        if (!isNaN(hours)) {
                                          setNewGoal(prev => ({ ...prev, target_minutes: Math.round(hours * 60) }));
                                        }
                                      }}
                                      min="0.1"
                                      step="0.1"
                                      placeholder="Enter target hours"
                                    />
                                  </div>
                                  <Button 
                                    onClick={saveGoal}
                                    disabled={!newGoal.content_type || !newGoal.period || !newGoal.target_minutes}
                                    className="bg-[#F87171] hover:bg-[#ef4444] transition-colors disabled:hover:bg-[#F87171]"
                                  >
                                    Save Changes
                                  </Button>
                                </div>
                              </PopoverContent>
                            </Popover>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-red-500 hover:text-white hover:bg-[#F87171] font-medium p-0 h-auto transition-colors">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="animate-in fade-in-0 zoom-in-95">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Goal</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this goal? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="hover:border-[#F87171] hover:text-[#F87171] transition-colors">Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteGoal(goal.id)} className="bg-[#F87171] hover:bg-[#ef4444] transition-colors">
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full transition-all duration-500 ease-out rounded-full"
                          style={{
                            width: `${progress.percentage}%`,
                            backgroundColor: goal.content_type === 'video' ? '#F87171' : 
                                           goal.content_type === 'manga' ? '#60A5FA' : 
                                           '#A78BFA'
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
                          </div>
                        </div>

            {/* Weekly Goals */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Weekly Goals</h4>
              <div className="space-y-4">
                {goals.filter(goal => goal.period === 'weekly').map((goal) => {
                  const progress = getGoalProgress(goal.content_type, goal.period);
                  if (!progress) return null;
                  return (
                    <div key={goal.id} className="space-y-2 group">
                      <div className="flex justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            goal.content_type === 'video' ? 'bg-[#F87171]' : 
                            goal.content_type === 'manga' ? 'bg-[#60A5FA]' : 
                            'bg-[#A78BFA]'
                          }`} />
                          <span className="capitalize">
                            {goal.content_type === 'video' ? 'Listening' : 
                             goal.content_type === 'manga' ? 'Reading' : 
                             'Total'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span>{progress.currentHours}/{progress.targetHours}</span>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <Popover onOpenChange={(open) => {
                              if (open) {
                                editGoal(goal);
                              } else {
                                closeEditPopover();
                              }
                            }}>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-blue-500 hover:text-white hover:bg-[#F87171] font-medium p-0 h-auto transition-colors">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80 animate-in fade-in-0 zoom-in-95">
                                <div className="grid gap-4">
                                  <div className="space-y-2">
                                    <h4 className="font-medium leading-none">Edit Goal</h4>
                                    <p className="text-sm text-muted-foreground">
                                      Modify your immersion goal.
                                    </p>
                                  </div>
                                  <div className="grid gap-2">
                                    <Label>Type</Label>
                                    <Select
                                      value={newGoal.content_type}
                                      onValueChange={(value) => setNewGoal(prev => ({ ...prev, content_type: value as ContentType }))}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                      </SelectTrigger>
                                      <SelectContent className="bg-background border-input">
                                        <SelectItem value="total">Total</SelectItem>
                                        <SelectItem value="video">Listening</SelectItem>
                                        <SelectItem value="manga">Reading</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="grid gap-2">
                                    <Label>Period</Label>
                                    <Select
                                      value={newGoal.period}
                                      onValueChange={(value) => setNewGoal(prev => ({ ...prev, period: value as GoalPeriod }))}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select period" />
                                      </SelectTrigger>
                                      <SelectContent className="bg-background border-input">
                                        <SelectItem value="daily">Daily</SelectItem>
                                        <SelectItem value="weekly">Weekly</SelectItem>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                        <SelectItem value="yearly">Yearly</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="grid gap-2">
                                    <Label>Target Hours</Label>
                                    <Input
                                      type="number"
                                      value={newGoal.target_minutes ? (newGoal.target_minutes / 60) : ''}
                                      onChange={(e) => {
                                        const hours = parseFloat(e.target.value);
                                        if (!isNaN(hours)) {
                                          setNewGoal(prev => ({ ...prev, target_minutes: Math.round(hours * 60) }));
                                        }
                                      }}
                                      min="0.1"
                                      step="0.1"
                                      placeholder="Enter target hours"
                                    />
                                  </div>
                                  <Button 
                                    onClick={saveGoal}
                                    disabled={!newGoal.content_type || !newGoal.period || !newGoal.target_minutes}
                                    className="bg-[#F87171] hover:bg-[#ef4444] transition-colors disabled:hover:bg-[#F87171]"
                                  >
                                    Save Changes
                                  </Button>
                                </div>
                              </PopoverContent>
                            </Popover>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-red-500 hover:text-white hover:bg-[#F87171] font-medium p-0 h-auto transition-colors">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="animate-in fade-in-0 zoom-in-95">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Goal</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this goal? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="hover:border-[#F87171] hover:text-[#F87171] transition-colors">Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteGoal(goal.id)} className="bg-[#F87171] hover:bg-[#ef4444] transition-colors">
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                          <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full transition-all duration-500 ease-out rounded-full"
                              style={{
                                width: `${progress.percentage}%`,
                                backgroundColor: goal.content_type === 'video' ? '#F87171' : 
                                               goal.content_type === 'manga' ? '#60A5FA' : 
                                               '#A78BFA'
                              }}
                            />
                          </div>
                    </div>
                  );
                })}
                          </div>
                        </div>

            {/* Monthly Goals */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Monthly Goals</h4>
              <div className="space-y-4">
                {goals.filter(goal => goal.period === 'monthly').map((goal) => {
                  const progress = getGoalProgress(goal.content_type, goal.period);
                  if (!progress) return null;
                  return (
                    <div key={goal.id} className="space-y-2 group">
                      <div className="flex justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            goal.content_type === 'video' ? 'bg-[#F87171]' : 
                            goal.content_type === 'manga' ? 'bg-[#60A5FA]' : 
                            'bg-[#A78BFA]'
                          }`} />
                          <span className="capitalize">
                            {goal.content_type === 'video' ? 'Listening' : 
                             goal.content_type === 'manga' ? 'Reading' : 
                             'Total'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span>{progress.currentHours}/{progress.targetHours}</span>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <Popover onOpenChange={(open) => {
                              if (open) {
                                editGoal(goal);
                              } else {
                                closeEditPopover();
                              }
                            }}>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-blue-500 hover:text-white hover:bg-[#F87171] font-medium p-0 h-auto transition-colors">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80 animate-in fade-in-0 zoom-in-95">
                                <div className="grid gap-4">
                                  <div className="space-y-2">
                                    <h4 className="font-medium leading-none">Edit Goal</h4>
                                    <p className="text-sm text-muted-foreground">
                                      Modify your immersion goal.
                                    </p>
                                  </div>
                                  <div className="grid gap-2">
                                    <Label>Type</Label>
                                    <Select
                                      value={newGoal.content_type}
                                      onValueChange={(value) => setNewGoal(prev => ({ ...prev, content_type: value as ContentType }))}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                      </SelectTrigger>
                                      <SelectContent className="bg-background border-input">
                                        <SelectItem value="total">Total</SelectItem>
                                        <SelectItem value="video">Listening</SelectItem>
                                        <SelectItem value="manga">Reading</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="grid gap-2">
                                    <Label>Period</Label>
                                    <Select
                                      value={newGoal.period}
                                      onValueChange={(value) => setNewGoal(prev => ({ ...prev, period: value as GoalPeriod }))}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select period" />
                                      </SelectTrigger>
                                      <SelectContent className="bg-background border-input">
                                        <SelectItem value="daily">Daily</SelectItem>
                                        <SelectItem value="weekly">Weekly</SelectItem>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                        <SelectItem value="yearly">Yearly</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="grid gap-2">
                                    <Label>Target Hours</Label>
                                    <Input
                                      type="number"
                                      value={newGoal.target_minutes ? (newGoal.target_minutes / 60) : ''}
                                      onChange={(e) => {
                                        const hours = parseFloat(e.target.value);
                                        if (!isNaN(hours)) {
                                          setNewGoal(prev => ({ ...prev, target_minutes: Math.round(hours * 60) }));
                                        }
                                      }}
                                      min="0.1"
                                      step="0.1"
                                      placeholder="Enter target hours"
                                    />
                                  </div>
                                  <Button 
                                    onClick={saveGoal}
                                    disabled={!newGoal.content_type || !newGoal.period || !newGoal.target_minutes}
                                    className="bg-[#F87171] hover:bg-[#ef4444] transition-colors disabled:hover:bg-[#F87171]"
                                  >
                                    Save Changes
                                  </Button>
                                </div>
                              </PopoverContent>
                            </Popover>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-red-500 hover:text-white hover:bg-[#F87171] font-medium p-0 h-auto transition-colors">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="animate-in fade-in-0 zoom-in-95">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Goal</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this goal? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="hover:border-[#F87171] hover:text-[#F87171] transition-colors">Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteGoal(goal.id)} className="bg-[#F87171] hover:bg-[#ef4444] transition-colors">
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full transition-all duration-500 ease-out rounded-full"
                          style={{
                            width: `${progress.percentage}%`,
                            backgroundColor: goal.content_type === 'video' ? '#F87171' : 
                                           goal.content_type === 'manga' ? '#60A5FA' : 
                                           '#A78BFA'
                          }}
                        />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Yearly Goals */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Yearly Goals</h4>
              <div className="space-y-4">
                {goals.filter(goal => goal.period === 'yearly').map((goal) => {
                  const progress = getGoalProgress(goal.content_type, goal.period);
                  if (!progress) return null;
                  return (
                    <div key={goal.id} className="space-y-2 group">
                      <div className="flex justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            goal.content_type === 'video' ? 'bg-[#F87171]' : 
                            goal.content_type === 'manga' ? 'bg-[#60A5FA]' : 
                            'bg-[#A78BFA]'
                          }`} />
                          <span className="capitalize">
                            {goal.content_type === 'video' ? 'Listening' : 
                             goal.content_type === 'manga' ? 'Reading' : 
                             'Total'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span>{progress.currentHours}/{progress.targetHours}</span>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <Popover onOpenChange={(open) => {
                              if (open) {
                                editGoal(goal);
                              } else {
                                closeEditPopover();
                              }
                            }}>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-blue-500 hover:text-white hover:bg-[#F87171] font-medium p-0 h-auto transition-colors">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80 animate-in fade-in-0 zoom-in-95">
                                <div className="grid gap-4">
                                  <div className="space-y-2">
                                    <h4 className="font-medium leading-none">Edit Goal</h4>
                                    <p className="text-sm text-muted-foreground">
                                      Modify your immersion goal.
                                    </p>
                                  </div>
                                  <div className="grid gap-2">
                                    <Label>Type</Label>
                                    <Select
                                      value={newGoal.content_type}
                                      onValueChange={(value) => setNewGoal(prev => ({ ...prev, content_type: value as ContentType }))}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                      </SelectTrigger>
                                      <SelectContent className="bg-background border-input">
                                        <SelectItem value="total">Total</SelectItem>
                                        <SelectItem value="video">Listening</SelectItem>
                                        <SelectItem value="manga">Reading</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="grid gap-2">
                                    <Label>Period</Label>
                                    <Select
                                      value={newGoal.period}
                                      onValueChange={(value) => setNewGoal(prev => ({ ...prev, period: value as GoalPeriod }))}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select period" />
                                      </SelectTrigger>
                                      <SelectContent className="bg-background border-input">
                                        <SelectItem value="daily">Daily</SelectItem>
                                        <SelectItem value="weekly">Weekly</SelectItem>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                        <SelectItem value="yearly">Yearly</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="grid gap-2">
                                    <Label>Target Hours</Label>
                                    <Input
                                      type="number"
                                      value={newGoal.target_minutes ? (newGoal.target_minutes / 60) : ''}
                                      onChange={(e) => {
                                        const hours = parseFloat(e.target.value);
                                        if (!isNaN(hours)) {
                                          setNewGoal(prev => ({ ...prev, target_minutes: Math.round(hours * 60) }));
                                        }
                                      }}
                                      min="0.1"
                                      step="0.1"
                                      placeholder="Enter target hours"
                                    />
                                  </div>
                                  <Button 
                                    onClick={saveGoal}
                                    disabled={!newGoal.content_type || !newGoal.period || !newGoal.target_minutes}
                                    className="bg-[#F87171] hover:bg-[#ef4444] transition-colors disabled:hover:bg-[#F87171]"
                                  >
                                    Save Changes
                                  </Button>
                                </div>
                              </PopoverContent>
                            </Popover>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-red-500 hover:text-white hover:bg-[#F87171] font-medium p-0 h-auto transition-colors">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="animate-in fade-in-0 zoom-in-95">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Goal</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this goal? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="hover:border-[#F87171] hover:text-[#F87171] transition-colors">Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteGoal(goal.id)} className="bg-[#F87171] hover:bg-[#ef4444] transition-colors">
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full transition-all duration-500 ease-out rounded-full"
                          style={{
                            width: `${progress.percentage}%`,
                            backgroundColor: goal.content_type === 'video' ? '#F87171' : 
                                           goal.content_type === 'manga' ? '#60A5FA' : 
                                           '#A78BFA'
                          }}
                        />
                </div>
              </div>
            );
          })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements Section */}
      <div className="p-8 rounded-xl border-2 bg-background border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-semibold">Achievements</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Track your learning milestones</p>
          </div>
          <div className="flex items-center gap-4">
            {!achievementsLoading && !achievementsError && (
              <>
                <div className="text-sm text-[#F87171]">
                  {achievements.filter(a => a.unlocked_at).length} Unlocked
                </div>
                <Select
                  value={selectedAchievementCategory}
                  onValueChange={(value) => setSelectedAchievementCategory(value as typeof selectedAchievementCategory)}
                >
                  <SelectTrigger className="w-[130px] border-slate-700 hover:text-white hover:bg-[#F87171]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="reading">Reading</SelectItem>
                    <SelectItem value="listening">Listening</SelectItem>
                    <SelectItem value="total">Total</SelectItem>
                    <SelectItem value="streak">Streak</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {achievementsLoading ? (
            <div className="text-center py-8">Loading achievements...</div>
          ) : achievementsError ? (
            <div className="text-center py-8 text-red-500">{achievementsError}</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {getAchievementsToShow(selectedAchievementCategory).map((achievement) => (
                  <div 
                    key={achievement.id} 
                    className={`p-8 rounded-lg border-2 bg-white dark:bg-gray-800 border-slate-200 dark:border-slate-700 ${
                      achievement.unlocked_at ? 'border-[#F87171]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-700">
                        <div className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-300">
                          {getAchievementIcon(achievement.category)}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold">{achievement.name}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {getAchievementDescription(achievement)}
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-[#F87171] h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${Math.min(achievement.progress_percentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatAchievementProgress(achievement).current} / {formatAchievementProgress(achievement).total}
                      </p>
                      {achievement.unlocked_at && (
                        <span className="text-xs text-[#F87171]">
                          Unlocked {new Date(achievement.unlocked_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {(() => {
                const allAchievements = selectedAchievementCategory === 'all' ? achievements : achievements.filter(a => {
                  const categoryMapping = {
                    'reading': 'ReadingTime',
                    'listening': 'ListeningTime',
                    'total': 'TotalTime',
                    'streak': 'Streak'
                  };
                  const dbCategory = categoryMapping[selectedAchievementCategory as keyof typeof categoryMapping];
                  return a.category === dbCategory;
                });
                
                return allAchievements.length > 3 && (
                  <div className="flex justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpand(selectedAchievementCategory)}
                      className="text-[#F87171] hover:text-white hover:bg-[#F87171] transition-colors"
                    >
                      {expandedCategories[selectedAchievementCategory] ? (
                        <>Show Less <ChevronUp className="ml-2 h-4 w-4" /></>
                      ) : (
                        <>Show More <ChevronDown className="ml-2 h-4 w-4" /></>
                      )}
                    </Button>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TrackerPage() {
  return <TrackerContent />;
}


