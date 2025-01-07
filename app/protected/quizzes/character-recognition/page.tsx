'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { Toggle } from '@/components/ui/toggle';
import { BackButton } from '@/components/ui/back-button';

// All possible readings for generating random options
const allReadings = Array.from(new Set([
  'a', 'i', 'u', 'e', 'o',
  'ka', 'ki', 'ku', 'ke', 'ko',
  'sa', 'shi', 'su', 'se', 'so',
  'ta', 'chi', 'tsu', 'te', 'to',
  'na', 'ni', 'nu', 'ne', 'no',
  'ha', 'hi', 'fu', 'he', 'ho',
  'ma', 'mi', 'mu', 'me', 'mo',
  'ya', 'yu', 'yo',
  'ra', 'ri', 'ru', 're', 'ro',
  'wa', 'wo', 'n',
  // Dakuten and Handakuten readings
  'ga', 'gi', 'gu', 'ge', 'go',
  'za', 'ji', 'zu', 'ze', 'zo',
  'da', 'de', 'do',
  'ba', 'bi', 'bu', 'be', 'bo',
  'pa', 'pi', 'pu', 'pe', 'po'
]));

// Base character data
const baseCharacterData = [
  { character: 'あ', reading: 'a' },
  { character: 'い', reading: 'i' },
  { character: 'う', reading: 'u' },
  { character: 'え', reading: 'e' },
  { character: 'お', reading: 'o' },
  { character: 'か', reading: 'ka' },
  { character: 'き', reading: 'ki' },
  { character: 'く', reading: 'ku' },
  { character: 'け', reading: 'ke' },
  { character: 'こ', reading: 'ko' },
  { character: 'さ', reading: 'sa' },
  { character: 'し', reading: 'shi' },
  { character: 'す', reading: 'su' },
  { character: 'せ', reading: 'se' },
  { character: 'そ', reading: 'so' },
  { character: 'た', reading: 'ta' },
  { character: 'ち', reading: 'chi' },
  { character: 'つ', reading: 'tsu' },
  { character: 'て', reading: 'te' },
  { character: 'と', reading: 'to' },
  { character: 'な', reading: 'na' },
  { character: 'に', reading: 'ni' },
  { character: 'ぬ', reading: 'nu' },
  { character: 'ね', reading: 'ne' },
  { character: 'の', reading: 'no' },
  { character: 'は', reading: 'ha' },
  { character: 'ひ', reading: 'hi' },
  { character: 'ふ', reading: 'fu' },
  { character: 'へ', reading: 'he' },
  { character: 'ほ', reading: 'ho' },
  { character: 'ま', reading: 'ma' },
  { character: 'み', reading: 'mi' },
  { character: 'む', reading: 'mu' },
  { character: 'め', reading: 'me' },
  { character: 'も', reading: 'mo' },
  { character: 'や', reading: 'ya' },
  { character: 'ゆ', reading: 'yu' },
  { character: 'よ', reading: 'yo' },
  { character: 'ら', reading: 'ra' },
  { character: 'り', reading: 'ri' },
  { character: 'る', reading: 'ru' },
  { character: 'れ', reading: 're' },
  { character: 'ろ', reading: 'ro' },
  { character: 'わ', reading: 'wa' },
  { character: 'を', reading: 'wo' },
  { character: 'ん', reading: 'n' }
];

const dakutenHandakutenData = [
  { character: 'が', reading: 'ga' },
  { character: 'ぎ', reading: 'gi' },
  { character: 'ぐ', reading: 'gu' },
  { character: 'げ', reading: 'ge' },
  { character: 'ご', reading: 'go' },
  { character: 'ざ', reading: 'za' },
  { character: 'じ', reading: 'ji' },
  { character: 'ず', reading: 'zu' },
  { character: 'ぜ', reading: 'ze' },
  { character: 'ぞ', reading: 'zo' },
  { character: 'だ', reading: 'da' },
  { character: 'ぢ', reading: 'ji' },
  { character: 'づ', reading: 'zu' },
  { character: 'で', reading: 'de' },
  { character: 'ど', reading: 'do' },
  { character: 'ば', reading: 'ba' },
  { character: 'び', reading: 'bi' },
  { character: 'ぶ', reading: 'bu' },
  { character: 'べ', reading: 'be' },
  { character: 'ぼ', reading: 'bo' },
  { character: 'ぱ', reading: 'pa' },
  { character: 'ぴ', reading: 'pi' },
  { character: 'ぷ', reading: 'pu' },
  { character: 'ぺ', reading: 'pe' },
  { character: 'ぽ', reading: 'po' }
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

// Function to generate random options including the correct answer
const generateOptions = (correctReading: string): string[] => {
  const otherReadings = allReadings.filter(r => r !== correctReading);
  const randomReadings = shuffleArray(otherReadings).slice(0, 3);
  return shuffleArray([...randomReadings, correctReading]);
};

export default function CharacterRecognitionQuiz() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || 'practice';
  const includeDakuten = searchParams.get('dakuten') === 'true';
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(mode === 'challenge' ? 300 : null);
  const [gameOver, setGameOver] = useState(false);
  const [quizData, setQuizData] = useState(() => {
    const characters = includeDakuten 
      ? [...baseCharacterData, ...dakutenHandakutenData]
      : baseCharacterData;
    
    return shuffleArray(characters.map(char => ({
      ...char,
      options: generateOptions(char.reading)
    })));
  });
  const [answerHistory, setAnswerHistory] = useState<Array<{
    character: string;
    reading: string;
    userAnswer: string;
    isCorrect: boolean;
  }>>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const router = useRouter();

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

  const handleAnswer = (selected: string) => {
    if (gameOver || showFeedback) return;

    setSelectedAnswer(selected);
    setShowFeedback(true);
    const isCorrect = selected === currentQuestion.reading;
    
    setAnswerHistory(prev => [...prev, {
      character: currentQuestion.character,
      reading: currentQuestion.reading,
      userAnswer: selected,
      isCorrect
    }]);

    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    setTimeout(() => {
      setShowFeedback(false);
      setSelectedAnswer(null);
      
      if (currentQuestionIndex < quizData.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
      } else {
        setGameOver(true);
      }
    }, 1000);
  };

  const resetQuiz = () => {
    const characters = includeDakuten 
      ? [...baseCharacterData, ...dakutenHandakutenData]
      : baseCharacterData;
    
    setQuizData(shuffleArray(characters.map(char => ({
      ...char,
      options: generateOptions(char.reading)
    }))));
    setCurrentQuestionIndex(0);
    setScore(0);
    setTimeLeft(mode === 'challenge' ? 300 : null);
    setGameOver(false);
    setAnswerHistory([]);
  };

  useEffect(() => {
    resetQuiz();
  }, [includeDakuten]);

  return (
    <div className="flex-1 w-full flex flex-col gap-6 max-w-4xl mx-auto p-4">
      <BackButton />
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-center">Character Recognition Quiz</h1>
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="text-muted-foreground">
              {mode === 'practice' ? 'Practice Mode' : 'Challenge Mode'}
              {includeDakuten && ' • Including Dakuten & Handakuten'}
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
          <Card className="max-w-3xl mx-auto p-8 shadow-lg border bg-card dark:bg-slate-800/50">
            <div className="text-center mb-12">
              <div className="text-9xl mb-8 font-japanese animate-fade-in transform transition-all duration-300 hover:scale-110">
                {currentQuestion.character}
              </div>
              <p className="text-xl font-medium mb-2">Select the correct reading</p>
              <p className="text-muted-foreground text-sm">Click on the correct romanization for this character</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {currentQuestion.options.map((option) => (
                <Button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  disabled={showFeedback}
                  className={`text-lg py-8 hover:scale-105 transition-all duration-200 ${
                    showFeedback
                      ? option === currentQuestion.reading
                        ? 'border-2 border-green-500 dark:border-green-400 text-green-500 dark:text-green-400 bg-transparent'
                        : option === selectedAnswer
                        ? 'bg-red-600 hover:bg-red-600 dark:bg-red-500 dark:hover:bg-red-500 text-white'
                        : 'opacity-50'
                      : 'bg-white dark:bg-slate-700 hover:bg-[#F87171] dark:hover:bg-[#F87171] hover:text-white dark:hover:text-white border-slate-200 dark:border-slate-600'
                  }`}
                  variant={showFeedback ? 'ghost' : 'outline'}
                >
                  {option}
                </Button>
              ))}
            </div>

            {showFeedback && (
              <div className="mt-8 text-center animate-fade-in">
                <p className={`text-lg font-medium ${
                  selectedAnswer === currentQuestion.reading
                    ? 'text-green-500 dark:text-green-400'
                    : 'text-red-500 dark:text-red-400'
                }`}>
                  {selectedAnswer === currentQuestion.reading
                    ? '✨ Correct!'
                    : `Incorrect. The correct answer is: ${currentQuestion.reading}`}
                </p>
              </div>
            )}
          </Card>
        ) : (
          <Card className="max-w-3xl mx-auto p-8 shadow-lg border">
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
                              (correct: {answer.reading})
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
  );
} 