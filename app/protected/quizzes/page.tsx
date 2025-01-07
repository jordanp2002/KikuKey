'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Toggle } from '@/components/ui/toggle';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { IconBook, IconHeadphones, IconKeyboard, IconClock, IconInfinity, IconLetterCase } from '@tabler/icons-react';
import { BackButton } from '@/components/ui/back-button';

type QuizStats = {
  bestScore: string;
  bestTime: string;
  totalAttempts: number;
};

type Quiz = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  supportsDakuten: boolean;
  stats: {
    regular: QuizStats;
    withDakuten?: QuizStats;
  };
};

export default function QuizzesPage() {
  const router = useRouter();
  const [gameMode, setGameMode] = useState<'practice' | 'challenge'>('practice');
  const [includeDakuten, setIncludeDakuten] = useState(false);

  const quizTypes: Quiz[] = [
    {
      id: 'character-recognition',
      title: 'Character Recognition',
      description: 'Test your ability to read Japanese characters',
      icon: <IconBook className="w-8 h-8" />,
      color: 'bg-primary',
      supportsDakuten: true,
      stats: {
        regular: {
          bestScore: '46/46',
          bestTime: '2:30',
          totalAttempts: 12
        },
        withDakuten: {
          bestScore: '71/71',
          bestTime: '3:45',
          totalAttempts: 8
        }
      }
    },
    {
      id: 'audio',
      title: 'Audio Quiz',
      description: 'Listen and identify the correct kana',
      icon: <IconHeadphones className="w-8 h-8" />,
      color: 'bg-primary',
      supportsDakuten: false,
      stats: {
        regular: {
          bestScore: '5/5',
          bestTime: '0:30',
          totalAttempts: 8
        }
      }
    },
    {
      id: 'typing',
      title: 'Typing Quiz',
      description: 'Practice typing romanization of Japanese characters',
      icon: <IconKeyboard className="w-8 h-8" />,
      color: 'bg-primary',
      supportsDakuten: true,
      stats: {
        regular: {
          bestScore: '46/46',
          bestTime: '2:45',
          totalAttempts: 15
        },
        withDakuten: {
          bestScore: '71/71',
          bestTime: '4:15',
          totalAttempts: 10
        }
      }
    },
  ];

  const handleQuizSelect = (quizId: string, supportsDakuten: boolean) => {
    const params = new URLSearchParams({
      mode: gameMode,
      ...(supportsDakuten && { dakuten: includeDakuten.toString() })
    });
    router.push(`/protected/quizzes/${quizId}?${params.toString()}`);
  };

  return (
    <div className="flex-1 w-full flex flex-col gap-6 max-w-7xl mx-auto p-4">
      <BackButton />
      <div className="space-y-4">
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-4xl font-bold tracking-tight">Hiragana & Katakana Quizzes</h1>
          <div className="h-1 w-12 rounded-full bg-[#F87171]" />
        </div>
        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div>
                <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">Select Game Mode</h2>
                <p className="text-slate-600 dark:text-slate-300 text-sm mb-4 sm:mb-0">Choose how you want to practice</p>
              </div>
              <div className="flex gap-3">
                <Toggle
                  pressed={gameMode === 'practice'}
                  onPressedChange={() => setGameMode('practice')}
                  className="data-[state=on]:bg-[#F87171] data-[state=on]:text-white flex-1 sm:flex-none h-20 sm:h-auto flex-col gap-1 px-6 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <IconInfinity className="w-5 h-5" />
                  <span>Practice Mode</span>
                </Toggle>
                <Toggle
                  pressed={gameMode === 'challenge'}
                  onPressedChange={() => setGameMode('challenge')}
                  className="data-[state=on]:bg-destructive data-[state=on]:text-white flex-1 sm:flex-none h-20 sm:h-auto flex-col gap-1 px-6 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <IconClock className="w-5 h-5" />
                  <span>Challenge Mode</span>
                </Toggle>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">Character Options</h2>
                  <p className="text-slate-600 dark:text-slate-300 text-sm mb-4 sm:mb-0">Customize the characters included in your quizzes</p>
                </div>
                <Toggle
                  pressed={includeDakuten}
                  onPressedChange={setIncludeDakuten}
                  className="data-[state=on]:bg-[#F87171] data-[state=on]:text-white h-20 sm:h-auto flex-col gap-1 px-6 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <IconLetterCase className="w-5 h-5" />
                  <span>Include Dakuten & Handakuten</span>
                </Toggle>
              </div>
            </div>
          </div>

          <p className="text-slate-600 dark:text-slate-300 text-sm mt-6">
            {gameMode === 'practice' 
              ? 'Take your time and learn at your own pace. No time limits, just focused learning.'
              : 'Race against the clock to test your skills and compete for high scores!'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizTypes.map((quiz) => (
            <Card
              key={quiz.id}
              className="group relative overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:border-[#F87171] dark:hover:border-[#F87171]"
              onClick={() => handleQuizSelect(quiz.id, quiz.supportsDakuten)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className={`bg-[#F87171] w-16 h-16 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300`}>
                    {quiz.icon}
                  </div>
                  {quiz.supportsDakuten ? (
                    <div className="text-right">
                      <div className="text-sm text-slate-600 dark:text-slate-300">Best Scores</div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{quiz.stats.regular.bestScore}</div>
                      {quiz.stats.withDakuten && (
                        <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                          With Dakuten: {quiz.stats.withDakuten.bestScore}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-right">
                      <div className="text-sm text-slate-600 dark:text-slate-300">Best Score</div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{quiz.stats.regular.bestScore}</div>
                    </div>
                  )}
                </div>
                <h2 className="text-2xl font-semibold mb-2 text-slate-900 dark:text-slate-100">{quiz.title}</h2>
                <p className="text-slate-600 dark:text-slate-300 text-sm mb-6">{quiz.description}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3">
                    <div className="text-slate-600 dark:text-slate-300">Best Time</div>
                    <div className="font-medium text-slate-900 dark:text-slate-100">
                      {quiz.supportsDakuten && includeDakuten && quiz.stats.withDakuten
                        ? quiz.stats.withDakuten.bestTime 
                        : quiz.stats.regular.bestTime}
                    </div>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3">
                    <div className="text-slate-600 dark:text-slate-300">Total Attempts</div>
                    <div className="font-medium text-slate-900 dark:text-slate-100">
                      {quiz.supportsDakuten && includeDakuten && quiz.stats.withDakuten
                        ? quiz.stats.withDakuten.totalAttempts 
                        : quiz.stats.regular.totalAttempts}
                    </div>
                  </div>
                </div>
                
                <Button className="w-full bg-[#F87171] hover:bg-[#F87171]/90 text-white">
                  Start {gameMode === 'challenge' ? 'Challenge' : 'Practice'}
                  {quiz.supportsDakuten && includeDakuten && (
                    <span className="ml-2 text-xs bg-white/20 px-2 py-1 rounded">+Dakuten</span>
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
