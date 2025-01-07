'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconVolume } from '@tabler/icons-react';
import { BackButton } from '@/components/ui/back-button';

const audioData = [
  { 
    sound: '/audio/a.mp3', 
    kana: 'あ',
    options: ['あ', 'い', 'う', 'え']
  },
  { 
    sound: '/audio/i.mp3', 
    kana: 'い',
    options: ['い', 'お', 'か', 'さ']
  },
  { 
    sound: '/audio/u.mp3', 
    kana: 'う',
    options: ['う', 'お', 'か', 'さ']
  },
  { 
    sound: '/audio/e.mp3', 
    kana: 'え',
    options: ['え', 'お', 'か', 'さ']
  },
  { 
    sound: '/audio/o.mp3', 
    kana: 'お',
    options: ['お', 'お', 'か', 'さ']
  },
  
  // Add more audio questions
];

export default function AudioQuiz() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || 'practice';
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(mode === 'challenge' ? 60 : null);
  const [gameOver, setGameOver] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  const currentQuestion = audioData[currentQuestionIndex];

  const playSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
  };

  const handleAnswer = (selectedAnswer: string) => {
    if (gameOver) return;

    if (selectedAnswer === currentQuestion.kana) {
      setScore((prev) => prev + 1);
    }

    if (currentQuestionIndex < audioData.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setGameOver(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setTimeLeft(mode === 'challenge' ? 60 : null);
    setGameOver(false);
  };

  return (
    <div className="flex-1 w-full flex flex-col gap-6 max-w-4xl mx-auto p-4">
      <BackButton />
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-center">Audio Quiz</h1>
        <audio ref={audioRef} src={currentQuestion.sound} />
        
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="text-lg font-medium">Score: {score}</div>
          {mode === 'challenge' && (
            <div className="text-lg font-medium">Time: {timeLeft}s</div>
          )}
        </div>

        {!gameOver ? (
          <Card className="max-w-2xl mx-auto p-8 shadow-lg">
            <div className="text-center mb-8">
              <Button
                onClick={playSound}
                className="text-lg py-8 px-8 mb-8 hover:scale-105 transition-transform duration-200"
                variant="outline"
              >
                <IconVolume className="w-8 h-8" />
                <span className="ml-2 font-medium">Play Sound</span>
              </Button>
              <p className="text-lg font-medium mb-4">Select the correct kana:</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {currentQuestion.options.map((option) => (
                <Button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  className="text-lg py-6 font-japanese hover:scale-105 transition-transform duration-200"
                  variant="outline"
                >
                  {option}
                </Button>
              ))}
            </div>
          </Card>
        ) : (
          <Card className="max-w-2xl mx-auto p-8 shadow-lg">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">Quiz Complete!</h2>
              <p className="text-xl mb-8">
                Final Score: <span className="font-bold">{score}</span> / {audioData.length}
              </p>
            </div>
            <Button 
              onClick={resetQuiz} 
              className="w-full text-lg bg-primary hover:bg-primary/90"
            >
              Try Again
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
} 