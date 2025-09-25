'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

interface ReasoningStep {
  id: number;
  text: string;
  delay: number;
}

const reasoningSteps: ReasoningStep[] = [
  { id: 1, text: "Analyzing your brand identity...", delay: 0 },
  { id: 2, text: "Examining visual elements and color palette...", delay: 0 },
  { id: 3, text: "Understanding your target audience...", delay: 0 },
  { id: 4, text: "Generating personalized recommendations...", delay: 0 },
];

const experimentationQuotes = [
  {
    quote: "The only way to win is to learn faster than anyone else.",
    author: "Eric Ries"
  },
  {
    quote: "If you double the number of experiments you do per year, you're going to double your inventiveness.",
    author: "Jeff Bezos"
  },
  {
    quote: "Every experiment teaches you something. If it doesn't, it wasn't an experiment.",
    author: "Seth Godin"
  },
  {
    quote: "The biggest risk is not taking any risk. In a world that's changing quickly, the only strategy that is guaranteed to fail is not taking risks.",
    author: "Mark Zuckerberg"
  }
];

export default function BrandAnalysisLoading() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate progress bar over 40 seconds with very slow progression
    const startTime = Date.now();
    const duration = 80000; // 40 seconds

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progressPercent = Math.min((elapsed / duration) * 100, 100);

      // Very slow easing function - extremely gradual progression
      // Uses a logarithmic-like curve that's very slow at the start
      const easedProgress = Math.pow(progressPercent / 100, 0.3);
      const finalProgress = Math.min(easedProgress * 100, 100);

      setProgress(finalProgress);

      if (progressPercent >= 100) {
        clearInterval(progressInterval);
      }
    }, 1000); // Much slower update interval for smoother animation

    // Cycle through reasoning steps (10 seconds each = 40 seconds total)
    const stepInterval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev + 1) % reasoningSteps.length);
    }, 10000);

    // Rotate quotes (10 seconds each = 40 seconds total)
    const quoteInterval = setInterval(() => {
      setCurrentQuoteIndex((prev) => (prev + 1) % experimentationQuotes.length);
    }, 10000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
      clearInterval(quoteInterval);
    };
  }, []);

  const currentQuote = experimentationQuotes[currentQuoteIndex];

  return (
    <div className="fixed inset-0 bg-white flex flex-col overflow-hidden">
      {/* Main Content - Centered */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-2xl w-full space-y-8">
          {/* Breathing Logo with Reasoning Text */}
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="relative w-24 h-24 animate-breathing">
                <Image
                  src="/assets/logo.png"
                  alt="Omen Logo"
                  width={96}
                  height={96}
                  className="object-contain"
                  priority
                />
              </div>
            </div>


          </div>

          {/* Title and Loading Bar */}
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-semibold text-gray-900">
              {reasoningSteps[currentStepIndex].text}
            </h1>

            {/* Progress Bar */}
            <div className="w-full max-w-md mx-auto">
              <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300 ease-out"
                  style={{
                    width: `${progress}%`,
                    background: 'linear-gradient(to right, #478FD3, #F2B544, #D99A4E, #D9886A)'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Quotes/Education Section */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-center space-y-2">
              <div className="min-h-[40px] transition-opacity duration-500 flex items-center justify-center">
                <blockquote className="text-sm text-gray-600 italic">
                  "{currentQuote.quote}"
                </blockquote>
              </div>

              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500 leading-relaxed">
                  We're analyzing your brand to create data-driven experiments that will help you discover what resonates with your audience.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes breathing {
          0%, 100% {
            transform: scale(1);
            opacity: 0.7;
          }
          50% {
            transform: scale(1.15);
            opacity: 1;
          }
        }

        .animate-breathing {
          animation: breathing 2.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}