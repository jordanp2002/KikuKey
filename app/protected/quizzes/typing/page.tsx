'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { BackButton } from '@/components/ui/back-button';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';

// Base character data
const baseTypingData = [
  { character: 'あ', romanization: 'a' },
  { character: 'い', romanization: 'i' },
  { character: 'う', romanization: 'u' },
  { character: 'え', romanization: 'e' },
  { character: 'お', romanization: 'o' },
  { character: 'か', romanization: 'ka' },
  { character: 'き', romanization: 'ki' },
  { character: 'く', romanization: 'ku' },
  { character: 'け', romanization: 'ke' },
  { character: 'こ', romanization: 'ko' },
  { character: 'さ', romanization: 'sa' },
  { character: 'し', romanization: 'shi' },
  { character: 'す', romanization: 'su' },
  { character: 'せ', romanization: 'se' },
  { character: 'そ', romanization: 'so' },
  { character: 'た', romanization: 'ta' },
  { character: 'ち', romanization: 'chi' },
  { character: 'つ', romanization: 'tsu' },
  { character: 'て', romanization: 'te' },
  { character: 'と', romanization: 'to' },
  { character: 'な', romanization: 'na' },
  { character: 'に', romanization: 'ni' },
  { character: 'ぬ', romanization: 'nu' },
  { character: 'ね', romanization: 'ne' },
  { character: 'の', romanization: 'no' },
  { character: 'は', romanization: 'ha' },
  { character: 'ひ', romanization: 'hi' },
  { character: 'ふ', romanization: 'fu' },
  { character: 'へ', romanization: 'he' },
  { character: 'ほ', romanization: 'ho' },
  { character: 'ま', romanization: 'ma' },
  { character: 'み', romanization: 'mi' },
  { character: 'む', romanization: 'mu' },
  { character: 'め', romanization: 'me' },
  { character: 'も', romanization: 'mo' },
  { character: 'や', romanization: 'ya' },
  { character: 'ゆ', romanization: 'yu' },
  { character: 'よ', romanization: 'yo' },
  { character: 'ら', romanization: 'ra' },
  { character: 'り', romanization: 'ri' },
  { character: 'る', romanization: 'ru' },
  { character: 'れ', romanization: 're' },
  { character: 'ろ', romanization: 'ro' },
  { character: 'わ', romanization: 'wa' },
  { character: 'を', romanization: 'wo' },
  { character: 'ん', romanization: 'n' }
];

// Function to shuffle array
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export default function TypingQuiz() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || 'practice';
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(mode === 'challenge' ? 300 : null);
  const [gameOver, setGameOver] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [quizData, setQuizData] = useState(() => shuffleArray(baseTypingData));
  const [answerHistory, setAnswerHistory] = useState<Array<{
    character: string;
    romanization: string;
    userAnswer: string;
    isCorrect: boolean;
  }>>([]);
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (mode === 'challenge' && timeLeft !== null) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === null) return null;
          if (prev <= 1) {
            setGameOver(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [mode, timeLeft]);

  const currentQuestion = quizData[currentQuestionIndex];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (gameOver) return;

    const isAnswerCorrect = userInput.toLowerCase() === currentQuestion.romanization;
    setIsCorrect(isAnswerCorrect);
    setShowFeedback(true);

    setAnswerHistory(prev => [...prev, {
      character: currentQuestion.character,
      romanization: currentQuestion.romanization,
      userAnswer: userInput.toLowerCase(),
      isCorrect: isAnswerCorrect
    }]);

    if (isAnswerCorrect) {
      setScore((prev) => prev + 1);
    }

    setTimeout(() => {
      setShowFeedback(false);
      setUserInput('');
      
      if (currentQuestionIndex < quizData.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
      } else {
        setGameOver(true);
      }
    }, 1000);
  };

  const resetQuiz = () => {
    setQuizData(shuffleArray(baseTypingData));
    setCurrentQuestionIndex(0);
    setScore(0);
    setTimeLeft(mode === 'challenge' ? 300 : null);
    setGameOver(false);
    setUserInput('');
    setShowFeedback(false);
    setAnswerHistory([]);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <div className="flex-1 w-full flex flex-col gap-6 max-w-4xl mx-auto p-4">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-center">Typing Quiz</h1>
            <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <p className="text-muted-foreground">
                  {mode === 'practice' ? 'Practice Mode' : 'Challenge Mode'}
                </p>
              </div>
              <div className="bg-card dark:bg-slate-800/50 rounded-lg p-3 border shadow-sm">
                <div className="text-lg">
                  <span className="text-muted-foreground mr-2">Score:</span>
                  <span className="font-bold">{score}</span>
                </div>
                {mode === 'challenge' && (
                  <>
                    <div className="w-px h-6 bg-border" />
                    <div className="text-lg">
                      <span className="text-muted-foreground mr-2">Time:</span>
                      <span className="font-bold">{timeLeft}s</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {!gameOver ? (
              <Card className="max-w-2xl mx-auto p-8 shadow-lg border bg-card dark:bg-slate-800/50">
                <div className="text-center mb-8">
                  <div className="text-8xl mb-8 font-japanese animate-fade-in transform transition-all duration-300 hover:scale-110">
                    {currentQuestion.character}
                  </div>
                  <p className="text-xl font-medium mb-2">Type the romanization:</p>
                  <p className="text-muted-foreground text-sm">Enter the correct romanization for this character</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    className={`text-center text-lg transition-colors duration-200 ${
                      showFeedback
                        ? isCorrect
                          ? 'border-2 border-green-500 dark:border-green-400 text-green-500 dark:text-green-400 bg-transparent'
                          : 'border-2 border-red-500 dark:border-red-400 text-red-500 dark:text-red-400 bg-transparent'
                        : 'bg-white dark:bg-slate-700 hover:border-[#F87171] dark:hover:border-[#F87171] border-slate-200 dark:border-slate-600'
                    }`}
                    placeholder="Type your answer..."
                    autoFocus
                  />
                  <Button 
                    type="submit" 
                    className="w-full text-lg bg-white dark:bg-slate-700 hover:bg-[#F87171] dark:hover:bg-[#F87171] hover:text-white dark:hover:text-white border-slate-200 dark:border-slate-600"
                    variant="outline"
                  >
                    Submit
                  </Button>
                </form>

                {showFeedback && (
                  <div className={`mt-8 text-center text-lg font-medium animate-fade-in ${
                    isCorrect ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'
                  }`}>
                    {isCorrect ? '✨ Correct!' : `Incorrect. The answer was: ${currentQuestion.romanization}`}
                  </div>
                )}
              </Card>
            ) : (
              <Card className="max-w-2xl mx-auto p-8 shadow-lg border bg-card dark:bg-slate-800/50">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-2">Quiz Complete!</h2>
                  <div className="inline-flex items-center justify-center bg-primary/10 rounded-full px-4 py-2 mb-6">
                    <p className="text-xl">
                      Final Score: <span className="font-bold text-primary">{score}</span> / {quizData.length}
                    </p>
                  </div>
                </div>

                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">Answer Review</h3>
                    <div className="text-sm text-muted-foreground">
                      Accuracy: {Math.round((score / quizData.length) * 100)}%
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {answerHistory.map((answer, index) => (
                      <div 
                        key={index} 
                        className={`p-4 rounded-lg transition-all ${
                          answer.isCorrect 
                            ? 'bg-blue-600/10 dark:bg-blue-500/20' 
                            : 'bg-red-600/10 dark:bg-red-500/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-japanese">{answer.character}</span>
                            <span className="text-muted-foreground">→</span>
                            <span className="font-mono text-lg">
                              {answer.userAnswer}
                              {!answer.isCorrect && (
                                <span className="text-destructive ml-2">
                                  (correct: {answer.romanization})
                                </span>
                              )}
                            </span>
                          </div>
                          <div className={`text-xl ${
                            answer.isCorrect 
                              ? 'text-blue-500 dark:text-blue-400' 
                              : 'text-red-500 dark:text-red-400'
                          }`}>
                            {answer.isCorrect ? '✓' : '✗'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    onClick={resetQuiz} 
                    className="flex-1 text-lg bg-primary hover:bg-primary/90"
                  >
                    Try Again
                  </Button>
                  <Button 
                    onClick={() => router.push('/protected/quizzes')}
                    variant="outline"
                    className="flex-1 text-lg"
                  >
                    Back to Quizzes
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 