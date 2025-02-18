"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Medal } from "lucide-react";
import { cn } from "@/lib/utils";
import { getLeaderboard, LeaderboardEntry, LeaderboardPeriod, LeaderboardType } from "@/app/actions";
import Image from "next/image";

export default function LeaderboardPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<LeaderboardPeriod>('daily');
  const [selectedType, setSelectedType] = useState<LeaderboardType>('total');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error } = await getLeaderboard(selectedPeriod, selectedType);
        if (error) {
          setError(error.message);
        } else {
          setLeaderboardData(data || []);
        }
      } catch (err) {
        setError('Failed to fetch leaderboard data');
      }
      setIsLoading(false);
    };

    fetchLeaderboard();
  }, [selectedPeriod, selectedType]);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getMedalColor = (index: number) => {
    switch (index) {
      case 0:
        return "text-yellow-400";
      case 1:
        return "text-gray-400";
      case 2:
        return "text-amber-600";
      default:
        return "text-gray-500";
    }
  };

  const LeaderboardList = ({ data }: { data: LeaderboardEntry[] }) => (
    <div className="space-y-2">
      {data.map((entry, index) => (
        <div
          key={entry.user_id}
          className={cn(
            "flex items-center justify-between p-4 rounded-lg border transition-colors",
            "dark:bg-[#0F1729] dark:border-slate-800 dark:hover:border-[#F87171]",
            "bg-white border-slate-200 hover:border-[#F87171]"
          )}
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-8">
              {index < 3 ? (
                <Medal className={`h-6 w-6 ${getMedalColor(index)}`} />
              ) : (
                <span className="text-gray-500 font-medium">{index + 1}</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Image
                src="/kita.jpg"
                alt="Profile picture"
                width={32}
                height={32}
                className="rounded-full object-cover"
              />
              <span className="font-medium dark:text-gray-200">{entry.username}</span>
            </div>
          </div>
          <span className="text-[#F87171] font-medium">
            {formatTime(selectedType === 'reading' ? entry.total_reading || 0 : 
                       selectedType === 'listening' ? entry.total_listening || 0 : 
                       entry.total_immersion)}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <div className={cn(
      "flex min-h-screen",
      "dark:bg-[#0B1221]",
      "bg-gray-50"
    )}>
      <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      <main className={cn(
        "flex-1 transition-all duration-300",
        "w-full"
      )}>
        <div className="container mx-auto p-4 md:p-8 space-y-8">
          <div className="flex flex-col items-center justify-center mb-8">
            <h1 className="scroll-m-20 text-3xl font-semibold tracking-tight dark:text-gray-200">
              Leaderboard
            </h1>
            <div className="h-1 w-8 bg-[#F87171] mt-2 rounded-full"></div>
          </div>

          <Tabs value={selectedType} defaultValue="total" className="w-full" onValueChange={(value) => setSelectedType(value as LeaderboardType)}>
            <div className="flex flex-col space-y-4">
              <TabsList className={cn(
                "grid w-full grid-cols-3 h-12 items-center rounded-lg border",
                "dark:bg-[#0F1729] dark:text-gray-400 dark:border-slate-800",
                "bg-white text-gray-500 border-slate-200"
              )}>
                <TabsTrigger 
                  value="total" 
                  className={cn(
                    "rounded-md transition-all h-9",
                    "data-[state=active]:text-[#F87171]",
                    "dark:data-[state=active]:bg-[#1A2333]",
                    "data-[state=active]:bg-gray-100"
                  )}
                >
                  Total Time
                </TabsTrigger>
                <TabsTrigger 
                  value="listening" 
                  className={cn(
                    "rounded-md transition-all h-9",
                    "data-[state=active]:text-[#F87171]",
                    "dark:data-[state=active]:bg-[#1A2333]",
                    "data-[state=active]:bg-gray-100"
                  )}
                >
                  Listening Time
                </TabsTrigger>
                <TabsTrigger 
                  value="reading" 
                  className={cn(
                    "rounded-md transition-all h-9",
                    "data-[state=active]:text-[#F87171]",
                    "dark:data-[state=active]:bg-[#1A2333]",
                    "data-[state=active]:bg-gray-100"
                  )}
                >
                  Reading Time
                </TabsTrigger>
              </TabsList>
            </div>
          </Tabs>

          <Tabs value={selectedPeriod} defaultValue="daily" onValueChange={(value) => setSelectedPeriod(value as LeaderboardPeriod)}>
            <TabsList className={cn(
              "grid w-full grid-cols-4 h-12 items-center rounded-lg border",
              "dark:bg-[#0F1729] dark:text-gray-400 dark:border-slate-800",
              "bg-white text-gray-500 border-slate-200"
            )}>
              <TabsTrigger 
                value="daily"
                className={cn(
                  "rounded-md transition-all h-9",
                  "data-[state=active]:text-[#F87171]",
                  "dark:data-[state=active]:bg-[#1A2333]",
                  "data-[state=active]:bg-gray-100"
                )}
              >
                Daily
              </TabsTrigger>
              <TabsTrigger 
                value="monthly"
                className={cn(
                  "rounded-md transition-all h-9",
                  "data-[state=active]:text-[#F87171]",
                  "dark:data-[state=active]:bg-[#1A2333]",
                  "data-[state=active]:bg-gray-100"
                )}
              >
                Monthly
              </TabsTrigger>
              <TabsTrigger 
                value="yearly"
                className={cn(
                  "rounded-md transition-all h-9",
                  "data-[state=active]:text-[#F87171]",
                  "dark:data-[state=active]:bg-[#1A2333]",
                  "data-[state=active]:bg-gray-100"
                )}
              >
                Yearly
              </TabsTrigger>
              <TabsTrigger 
                value="all-time"
                className={cn(
                  "rounded-md transition-all h-9",
                  "data-[state=active]:text-[#F87171]",
                  "dark:data-[state=active]:bg-[#1A2333]",
                  "data-[state=active]:bg-gray-100"
                )}
              >
                All Time
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="mt-6">
            <Card className={cn(
              "border",
              "dark:border-slate-800 dark:bg-[#0F1729]",
              "border-slate-200 bg-white"
            )}>
              <CardHeader>
                <CardTitle className="dark:text-gray-200">
                  {selectedType === 'total' ? 'Top Learners' :
                   selectedType === 'listening' ? 'Top Listeners' :
                   'Top Readers'} - {selectedPeriod === 'daily' ? 'Today' :
                                   selectedPeriod === 'monthly' ? 'This Month' :
                                   selectedPeriod === 'yearly' ? 'This Year' :
                                   'All Time'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F87171]"></div>
                  </div>
                ) : error ? (
                  <div className="text-center py-8 text-red-500">{error}</div>
                ) : leaderboardData.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No data available for this period</div>
                ) : (
                  <LeaderboardList data={leaderboardData} />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
} 