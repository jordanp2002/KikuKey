"use client";

import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, addDays, addMonths, addYears, subMonths, subYears } from "date-fns";
import { Line, Bar, Scatter, Doughnut } from "react-chartjs-2";
import { insertGoal, GoalPeriod, ContentType } from "@/app/actions";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
  Scale,
  ScriptableContext,
  ArcElement,
} from 'chart.js';
import { Progress } from "@/components/ui/progress";
import { BackButton } from "@/components/ui/back-button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Pencil, ChevronLeft, ChevronRight } from "lucide-react";
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

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
type ChartView = 'sessions' | 'total-hours';

interface GoalProgress {
  current: number;
  target: number;
  percentage: number;
  currentHours: string;
  targetHours: string;
}

interface SessionDataPoint {
  x: number;
  y: number;
}

interface SessionDataset {
  label: string;
  data: number[];
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  barPercentage: number;
  categoryPercentage: number;
  base: number;
  barThickness?: 'flex' | number;
}

export function TrackerContent() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [videoLogs, setVideoLogs] = useState<VideoLog[]>([]);
  const [mangaLogs, setMangaLogs] = useState<MangaLog[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [viewPeriod, setViewPeriod] = useState<ViewPeriod>('weekly');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [newGoal, setNewGoal] = useState<Partial<Goal>>({
    content_type: 'total',
    period: 'daily',
    target_minutes: 60
  });
  const [chartView, setChartView] = useState<ChartView>('sessions');
  const [editingGoalId, setEditingGoalId] = useState<number | null>(null);

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
      const supabase = createClient();

      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error('Error getting user:', userError);
          return;
        }

        console.log('Fetching goals for user:', user.id);
        const { data: goalData, error: goalError } = await supabase
          .from('goals')
          .select('*')
          .eq('user_id', user.id);

        if (goalError) {
          console.error('Error fetching goals:', goalError);
        } else {
          console.log('Raw goals data from database:', goalData);
          setGoals(goalData || []);
        }

        const dateRange = getDateRange();
        if (!dateRange) return;
        
        const startDateTime = new Date(dateRange.start);
        startDateTime.setHours(0, 0, 0, 0);
        const endDateTime = new Date(dateRange.end);
        endDateTime.setHours(23, 59, 59, 999);

        const { data: videoData, error: videoError } = await supabase
          .from('Logs')
          .select('*')
          .or(`start_time.gte.${startDateTime.toISOString()},end_time.gte.${startDateTime.toISOString()}`)
          .or(`start_time.lte.${endDateTime.toISOString()},end_time.lte.${endDateTime.toISOString()}`)
          .eq('user_id', user.id)
          .order('start_time', { ascending: true });

        if (videoError) {
          console.error('Error fetching video logs:', videoError);
        } else {
          setVideoLogs(videoData || []);
        }
        const { data: mangaData, error: mangaError } = await supabase
          .from('MangaLogs')
          .select('*')
          .or(`start_time.gte.${startDateTime.toISOString()},end_time.gte.${startDateTime.toISOString()}`)
          .or(`start_time.lte.${endDateTime.toISOString()},end_time.lte.${endDateTime.toISOString()}`)
          .eq('user_id', user.id)
          .order('start_time', { ascending: true });

        if (mangaError) {
          console.error('Error fetching manga logs:', mangaError);
        } else {
          setMangaLogs(mangaData || []);
        }

      } catch (error) {
        console.error('Error in fetchData:', error);
      } finally {
        setIsLoading(false);
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

    console.log('Calculating total for:', {
      date: date.toISOString(),
      type,
      dayStart: dayStart.toISOString(),
      dayEnd: dayEnd.toISOString()
    });

    if (type === 'video' || type === 'total') {
      const relevantVideoLogs = videoLogs.filter(log => {
        const start = new Date(log.start_time);
        const end = new Date(log.end_time);
        return start <= dayEnd && end >= dayStart;
      });

      console.log('Video logs found:', relevantVideoLogs.length);

      relevantVideoLogs.forEach(log => {
        const start = new Date(log.start_time);
        const end = new Date(log.end_time);
        const clampedStart = start < dayStart ? dayStart : start;
        const clampedEnd = end > dayEnd ? dayEnd : end;
        const duration = (clampedEnd.getTime() - clampedStart.getTime()) / (1000 * 60);
        

        console.log('Video log duration:', {
          start: start.toISOString(),
          end: end.toISOString(),
          clampedStart: clampedStart.toISOString(),
          clampedEnd: clampedEnd.toISOString(),
          duration
        });
        
        total += duration;
      });
    }

    if (type === 'manga' || type === 'total') {
      const relevantMangaLogs = mangaLogs.filter(log => {
        const start = new Date(log.start_time);
        const end = new Date(log.end_time);
        return start <= dayEnd && end >= dayStart;
      });

      // For debugging
      console.log('Manga logs found:', relevantMangaLogs.length);

      relevantMangaLogs.forEach(log => {
        const start = new Date(log.start_time);
        const end = new Date(log.end_time);
        const clampedStart = start < dayStart ? dayStart : start;
        const clampedEnd = end > dayEnd ? dayEnd : end;
        const duration = (clampedEnd.getTime() - clampedStart.getTime()) / (1000 * 60);
        
        console.log('Manga log duration:', {
          start: start.toISOString(),
          end: end.toISOString(),
          clampedStart: clampedStart.toISOString(),
          clampedEnd: clampedEnd.toISOString(),
          duration
        });
        
        total += duration;
      });
    }

    // For debugging
    console.log('Final total:', {
      date: date.toISOString(),
      type,
      total
    });

    return Math.round(total);
  };

  const minutesToHours = (minutes: number) => {
    return (minutes / 60).toFixed(1);
  };

  const getGoalProgress = (type: ContentType, period: GoalPeriod): GoalProgress | null => {
    const goal = goals.find(g => g.content_type === type && g.period === period);
    if (!goal) {
      console.log('No goal found for:', { type, period });
      return null;
    }

    console.log('Found goal:', {
      id: goal.id,
      type: goal.content_type,
      period: goal.period,
      target_minutes: goal.target_minutes
    });

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

    console.log('Goal Progress:', {
      type,
      period: goal.period,
      totalMinutes,
      targetMinutes: goal.target_minutes,
      rawPercentage: (totalMinutes / goal.target_minutes) * 100
    });

    const percentage = (totalMinutes / goal.target_minutes) * 100;

    return {
      current: totalMinutes,
      target: goal.target_minutes,
      percentage: Math.min(Math.round(percentage * 10) / 10, 100), 
      currentHours: formatMinutes(totalMinutes),
      targetHours: formatMinutes(goal.target_minutes)
    };
  };

  const getSessionChartData = () => {
    const dateRange = getDateRange();
    if (!dateRange) return {
      labels: [],
      datasets: []
    };

    const days = viewPeriod === 'daily'
      ? [currentDate]
      : Array.from({ length: 7 }, (_, i) => addDays(dateRange.start, i));

    const datasets: SessionDataset[] = [];
    videoLogs.forEach((log, index) => {
      const start = new Date(log.start_time);
      const end = new Date(log.end_time);

      days.forEach((day, dayIndex) => {
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        const nextDayStart = new Date(dayStart);
        nextDayStart.setDate(nextDayStart.getDate() + 1);

        if (start < nextDayStart && end > dayStart) {
          let startHour = 0;
          let endHour = 24;
          if (start >= dayStart) {
            startHour = start.getHours() + start.getMinutes() / 60 + start.getSeconds() / 3600;
          }
          if (end < nextDayStart) {
            endHour = end.getHours() + end.getMinutes() / 60 + end.getSeconds() / 3600;
          }

          const data = Array(days.length).fill(null);
          data[dayIndex] = endHour;

          datasets.push({
            label: `Video ${index + 1}`,
            data,
            backgroundColor: isDarkMode ? 'rgba(248, 113, 113, 0.5)' : 'rgba(239, 68, 68, 0.5)',
            borderColor: isDarkMode ? 'rgb(248, 113, 113)' : 'rgb(239, 68, 68)',
            borderWidth: 1,
            barPercentage: 0.95,
            categoryPercentage: 0.95,
            base: startHour,
            barThickness: 'flex'
          });
        }
      });
    });

    mangaLogs.forEach((log, index) => {
      const start = new Date(log.start_time);
      const end = new Date(log.end_time);
      days.forEach((day, dayIndex) => {
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        const nextDayStart = new Date(dayStart);
        nextDayStart.setDate(nextDayStart.getDate() + 1);
        if (start < nextDayStart && end > dayStart) {
          let startHour = 0;
          let endHour = 24;
          if (start >= dayStart) {
            startHour = start.getHours() + start.getMinutes() / 60 + start.getSeconds() / 3600;
          }

          if (end < nextDayStart) {
            endHour = end.getHours() + end.getMinutes() / 60 + end.getSeconds() / 3600;
          }

          const data = Array(days.length).fill(null);
          data[dayIndex] = endHour;

          datasets.push({
            label: `Manga ${index + 1}`,
            data,
            backgroundColor: isDarkMode ? 'rgba(96, 165, 250, 0.5)' : 'rgba(59, 130, 246, 0.5)',
            borderColor: isDarkMode ? 'rgb(96, 165, 250)' : 'rgb(59, 130, 246)',
            borderWidth: 1,
            barPercentage: 0.95,
            categoryPercentage: 0.95,
            base: startHour,
            barThickness: 'flex'
          });
        }
      });
    });

    return {
      labels: days.map(day => format(day, viewPeriod === 'daily' ? 'MMM d' : 'EEE d')),
      datasets
    };
  };

  const getTotalHoursChartData = () => {
    const dateRange = getDateRange();
    if (!dateRange) return {
      labels: [],
      datasets: []
    };

    const labels: string[] = [];
    const videoData: number[] = [];
    const mangaData: number[] = [];
    let iterDate = dateRange.start;

    while (iterDate <= dateRange.end) {
      labels.push(format(iterDate, viewPeriod === 'yearly' ? 'MMM' : 'MMM d'));
      const videoMinutes = calculateDayTotal(iterDate, 'video');
      const mangaMinutes = calculateDayTotal(iterDate, 'manga');
      videoData.push(Number((videoMinutes / 60).toFixed(1)));
      mangaData.push(Number((mangaMinutes / 60).toFixed(1)));
      iterDate = addDays(iterDate, 1);
    }

    return {
      labels,
      datasets: [
        {
          type: 'bar' as const,
          label: 'Listening',
          data: videoData,
          backgroundColor: isDarkMode ? 'rgba(248, 113, 113, 0.8)' : 'rgba(239, 68, 68, 0.8)',
          borderColor: isDarkMode ? 'rgb(248, 113, 113)' : 'rgb(239, 68, 68)',
          borderWidth: 2,
          stack: 'stack1'
        },
        {
          type: 'bar' as const,
          label: 'Reading',
          data: mangaData,
          backgroundColor: isDarkMode ? 'rgba(96, 165, 250, 0.8)' : 'rgba(59, 130, 246, 0.8)',
          borderColor: isDarkMode ? 'rgb(96, 165, 250)' : 'rgb(59, 130, 246)',
          borderWidth: 2,
          stack: 'stack1'
        }
      ]
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
            color: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
            lineWidth: 1.5,
            drawTicks: false,
            offset: true
          },
          border: {
            display: true,
            color: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'
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
            color: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
            lineWidth: 1.5,
            drawTicks: false
          },
          border: {
            display: true,
            color: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'
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

  const getTotalHoursChartOptions = () => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
          position: 'top' as const,
          labels: {
            color: isDarkMode ? 'rgb(255, 255, 255)' : 'rgb(0, 0, 0)',
            font: {
              weight: 600
            }
          }
        },
        title: {
          display: true,
          text: `${getPeriodLabel(viewPeriod)} Total Hours`,
          color: isDarkMode ? 'rgb(255, 255, 255)' : 'rgb(0, 0, 0)',
          font: {
            weight: 600,
            size: 14
          }
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const hours = Math.floor(context.raw);
              const minutes = Math.round((context.raw % 1) * 60);
              return `${context.dataset.label}: ${hours}h ${minutes}m`;
            }
          }
        }
      },
      scales: {
        x: {
          type: 'category' as const,
          grid: {
            display: false,
            color: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
            lineWidth: 1.5
          },
          ticks: {
            color: isDarkMode ? 'rgb(255, 255, 255)' : 'rgb(0, 0, 0)',
            font: {
              weight: 600
            }
          }
        },
        y: {
          type: 'linear' as const,
          stacked: true,
          beginAtZero: true,
          max: 24,
          grid: {
            color: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
            lineWidth: 1.5
          },
          ticks: {
            color: isDarkMode ? 'rgb(255, 255, 255)' : 'rgb(0, 0, 0)',
            font: {
              weight: 600
            },
            stepSize: 2,
            callback: (value: number | string) => {
              const numValue = typeof value === 'string' ? parseFloat(value) : value;
              const hours = Math.floor(numValue);
              const minutes = Math.round((numValue % 1) * 60);
              return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
            }
          },
          title: {
            display: true,
            text: 'Hours',
            color: isDarkMode ? 'rgb(255, 255, 255)' : 'rgb(0, 0, 0)'
          }
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
        console.error('Error deleting goal:', error);
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
      console.error('Error in deleteGoal:', error);
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
    setEditingGoalId(goal.id);
  };
  const closeEditPopover = () => {
    setEditingGoalId(null);
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

      // Check if a goal with this content type and period already exists
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
        console.error('Error saving goal:', result.error);
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
        console.error('Error fetching updated goals:', goalError);
        return;
      }

      toast.success('Goal saved successfully');
      setGoals(goalData || []);
      closeEditPopover();
    } catch (error) {
      console.error('Error in saveGoal:', error);
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
      case 'daily':
        return format(currentDate, 'MMMM d, yyyy');
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
    { value: 'daily' as ViewPeriod, label: 'Daily' },
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

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-end">
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="hover:border-[#F87171] hover:text-white hover:bg-[#F87171] transition-colors">
                  {viewPeriod === 'daily' ? 'Day' :
                   viewPeriod === 'weekly' ? 'Week' :
                   viewPeriod === 'monthly' ? 'Month' :
                   'Year'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background border-input">
                {chartView === 'sessions' ? (
                  <>
                    <DropdownMenuItem onSelect={() => setViewPeriod('daily')} className="hover:text-[#F87171] cursor-pointer focus:bg-accent">
                      Day
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setViewPeriod('weekly')} className="hover:text-[#F87171] cursor-pointer focus:bg-accent">
                      Week
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem onSelect={() => setViewPeriod('daily')} className="hover:text-[#F87171] cursor-pointer focus:bg-accent">
                      Day
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setViewPeriod('weekly')} className="hover:text-[#F87171] cursor-pointer focus:bg-accent">
                      Week
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setViewPeriod('monthly')} className="hover:text-[#F87171] cursor-pointer focus:bg-accent">
                      Month
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setViewPeriod('yearly')} className="hover:text-[#F87171] cursor-pointer focus:bg-accent">
                      Year
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              onClick={() => navigatePeriod('prev')}
              variant="ghost"
              size="sm"
              className="p-0 hover:bg-transparent hover:text-[#F87171] transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium">
              {viewPeriod === 'weekly' ? (
                `${format(getDateRange()?.start || currentDate, 'MMM d')} - ${format(getDateRange()?.end || currentDate, 'MMM d, yyyy')}`
              ) : viewPeriod === 'yearly' ? (
                format(currentDate, 'yyyy')
              ) : (
                format(currentDate, 'MMMM d, yyyy')
              )}
            </span>
            <Button
              onClick={() => navigatePeriod('next')}
              variant="ghost"
              size="sm"
              className="p-0 hover:bg-transparent hover:text-[#F87171] transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        

        {/* Chart */}
        <div className="p-4 rounded-xl border bg-background space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Statistics</h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="hover:border-[#F87171] hover:text-white hover:bg-[#F87171] transition-colors">
                  {chartView === 'sessions' ? 'Immersion Sessions' : 'Total Hours'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background border-input">
                <DropdownMenuItem onSelect={() => setChartView('sessions')} className="hover:text-[#F87171] cursor-pointer focus:bg-accent">
                  Immersion Sessions
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setChartView('total-hours')} className="hover:text-[#F87171] cursor-pointer focus:bg-accent">
                  Total Hours
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="flex gap-4">
            <div className="w-[calc(100%-300px)] h-[400px]">
              {chartView === 'sessions' ? (
                <Bar 
                  data={getSessionChartData()}
                  options={getSessionChartOptions()}
                />
              ) : (
                <Bar 
                  data={getTotalHoursChartData()}
                  options={getTotalHoursChartOptions()}
                />
              )}
            </div>
            
            {/* Donut Chart */}
            <div className="w-[300px] h-[400px] flex-shrink-0 flex flex-col items-center justify-center">
              {(() => {
                const dateRange = getDateRange();
                if (!dateRange) return null;

                let totalVideoMinutes = 0;
                let totalMangaMinutes = 0;
                let currentDate = dateRange.start;

                while (currentDate <= dateRange.end) {
                  totalVideoMinutes += calculateDayTotal(currentDate, 'video');
                  totalMangaMinutes += calculateDayTotal(currentDate, 'manga');
                  currentDate = addDays(currentDate, 1);
                }

                if (totalVideoMinutes === 0 && totalMangaMinutes === 0) {
                  return (
                    <div className="text-center text-gray-500">
                      <div className="text-2xl font-semibold mb-2">N/A</div>
                      <div className="text-sm">No data for this period</div>
                    </div>
                  );
                }

                return (
                  <Doughnut
                    data={{
                      labels: ['Listening', 'Reading'],
                      datasets: [{
                        data: [
                          totalVideoMinutes / 60,
                          totalMangaMinutes / 60
                        ],
                        backgroundColor: ['#F87171', '#60A5FA'],
                        borderColor: ['#F87171', '#60A5FA'],
                        borderWidth: 1
                      }]
                    }}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: 'bottom' as const,
                          labels: {
                            color: isDarkMode ? 'rgb(255, 255, 255)' : 'rgb(0, 0, 0)',
                            font: {
                              weight: 600
                            }
                          }
                        },
                        title: {
                          display: true,
                          text: 'Total Hours Distribution',
                          color: isDarkMode ? 'rgb(255, 255, 255)' : 'rgb(0, 0, 0)',
                          font: {
                            weight: 600,
                            size: 14
                          }
                        },
                        tooltip: {
                          callbacks: {
                            label: (context) => {
                              const hours = Math.floor(context.raw as number);
                              const minutes = Math.round(((context.raw as number) % 1) * 60);
                              return `${context.label}: ${hours}h ${minutes}m`;
                            }
                          }
                        }
                      }
                    }}
                  />
                );
              })()}
            </div>
          </div>
        </div>

        {/* Goals Progress Section */}
        <div className="p-4 rounded-xl border bg-background space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Goals Progress</h3>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 hover:border-[#F87171] hover:text-white hover:bg-[#F87171] transition-colors">
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
          {(['daily', 'weekly', 'monthly', 'yearly'] as GoalPeriod[]).map(period => {
            const periodGoals = goals.filter(goal => goal.period === period);
            if (periodGoals.length === 0) return null;

            return (
              <div key={period} className="space-y-4">
                <h4 className="text-lg font-semibold capitalize border-b pb-2">
                  {getPeriodLabel(period)} Goals
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {periodGoals.map((goal) => {
                    const progress = getGoalProgress(goal.content_type, goal.period);
                    if (!progress) return null;

                    return (
                      <div 
                        key={goal.id} 
                        className="group flex flex-col items-center p-4 rounded-lg border bg-white dark:bg-gray-800 gap-3 hover:border-[#F87171] transition-all duration-300 hover:shadow-md hover:-translate-y-1"
                      >
                        <div className="relative w-28 h-28">
                          <svg className="absolute inset-0 w-full h-full transform transition-transform duration-500 group-hover:scale-105">
                            <circle
                              className="text-gray-100 dark:text-gray-700 transition-colors duration-300"
                              strokeWidth="8"
                              stroke="currentColor"
                              fill="transparent"
                              r="35"
                              cx="56"
                              cy="56"
                            />
                          </svg>
                          
                          <svg className="absolute inset-0 w-full h-full -rotate-90 transform transition-transform duration-500 group-hover:scale-105">
                            <circle
                              className="transition-all duration-500 ease-out"
                              style={{
                                stroke: goal.content_type === 'video' ? '#F87171' : 
                                       goal.content_type === 'manga' ? '#60A5FA' : 
                                       '#A78BFA',
                                strokeDasharray: 2 * Math.PI * 35,
                                strokeDashoffset: 2 * Math.PI * 35 * (1 - progress.percentage / 100)
                              }}
                              strokeWidth="8"
                              stroke="currentColor"
                              fill="transparent"
                              r="35"
                              cx="56"
                              cy="56"
                            />
                          </svg>
                        
                          <div className="absolute inset-0 flex items-center justify-center text-center">
                            <div className="text-2xl font-bold transition-all duration-300 group-hover:scale-110">
                              {Math.round(progress.percentage)}%
                            </div>
                          </div>
                        </div>

                        <div className="text-sm text-gray-600 dark:text-gray-400 font-medium transition-all duration-300 group-hover:text-[#F87171]">
                          {formatMinutes(progress.current)}/{formatMinutes(goal.target_minutes)}
                        </div>
                        
                        <div className="text-center space-y-1">
                          <div className="font-medium capitalize flex items-center gap-2 justify-center">
                            <div className={`w-2 h-2 rounded-full transition-transform duration-300 group-hover:scale-125 ${
                              goal.content_type === 'video' ? 'bg-[#F87171]' : 
                              goal.content_type === 'manga' ? 'bg-[#60A5FA]' : 
                              'bg-[#A78BFA]'
                            }`} />
                            <span className="transition-colors duration-300 group-hover:text-[#F87171]">
                              {goal.content_type}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <Popover open={editingGoalId === goal.id} onOpenChange={(open) => {
                            if (open) {
                              editGoal(goal);
                            } else {
                              closeEditPopover();
                            }
                          }}>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-blue-500 hover:text-[#F87171] font-medium p-0 transition-colors">
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
                              <Button variant="ghost" size="sm" className="text-red-500 hover:text-[#F87171] font-medium p-0 transition-colors">
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
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function TrackerPage() {
  return <TrackerContent />;
}


