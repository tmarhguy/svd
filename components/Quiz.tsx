"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, CheckCircle, XCircle } from "lucide-react";

interface Question {
  id: number;
  question: string;
  answer: boolean;
  explanation: string;
}

const questions: Question[] = [
  {
    id: 1,
    question: "SVD can compress any matrix, not just images.",
    answer: true,
    explanation: "SVD is a general matrix decomposition technique that works on any matrix, making it versatile for various applications beyond image compression."
  },
  {
    id: 2,
    question: "Higher rank-k approximation always means better image quality.",
    answer: true,
    explanation: "Keeping more singular values (higher k) preserves more information from the original image, resulting in better quality but larger file size."
  },
  {
    id: 3,
    question: "SVD compression is lossless (no quality loss).",
    answer: false,
    explanation: "SVD compression is lossy - it discards some information to achieve compression. The goal is to discard the least important information."
  },
  {
    id: 4,
    question: "Color images require three separate SVD operations.",
    answer: true,
    explanation: "Color images have three channels (RGB), and each channel is processed separately using SVD for optimal compression."
  }
];

export default function Quiz() {
  const [answers, setAnswers] = useState<{ [key: number]: boolean | null }>({});
  const [showResults, setShowResults] = useState(false);

  const handleAnswer = (questionId: number, answer: boolean) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const calculateScore = () => {
    const answeredQuestions = Object.keys(answers).length;
    if (answeredQuestions === 0) return 0;
    
    const correctAnswers = questions.filter(q => answers[q.id] === q.answer).length;
    return Math.round((correctAnswers / answeredQuestions) * 100);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-blue-400";
    return "text-red-400";
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="flex items-center justify-center space-x-3 mb-3 sm:mb-4">
          <div className="p-2.5 sm:p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
            <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-blue-400">Test Your Knowledge</h3>
        </div>
        <p className="text-gray-300 text-sm sm:text-base">
          Answer these questions to test your understanding of SVD and image compression.
        </p>
      </div>

      <div className="space-y-6">
        {questions.map((question) => (
          <motion.div
            key={question.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-br from-space-800 to-space-700 p-5 sm:p-6 rounded-xl border border-space-600"
          >
            <h4 className="text-base sm:text-lg font-semibold text-blue-400 mb-3 sm:mb-4">
              Question {question.id}
            </h4>
            <p className="text-gray-300 mb-3 sm:mb-4 text-sm sm:text-base">{question.question}</p>
            
            <div className="flex space-x-3 sm:space-x-4 mb-3 sm:mb-4">
              <button
                onClick={() => handleAnswer(question.id, true)}
                className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                  answers[question.id] === true
                    ? "bg-blue-500 text-white shadow-lg"
                    : "bg-space-800 text-gray-300 hover:bg-space-700"
                }`}
              >
                True
              </button>
              <button
                onClick={() => handleAnswer(question.id, false)}
                className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                  answers[question.id] === false
                    ? "bg-purple-500 text-white shadow-lg"
                    : "bg-space-800 text-gray-300 hover:bg-space-700"
                }`}
              >
                False
              </button>
            </div>

            {showResults && answers[question.id] !== null && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-3 sm:mt-4 p-3 sm:p-4 rounded-lg bg-space-800/50"
              >
                <div className="flex items-center space-x-2 mb-2">
                  {answers[question.id] === question.answer ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400" />
                  )}
                  <span className={`font-semibold ${
                    answers[question.id] === question.answer ? "text-green-400" : "text-red-400"
                  }`}>
                    {answers[question.id] === question.answer ? "Correct!" : "Incorrect"}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-gray-400">{question.explanation}</p>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="text-center space-y-4">
        <button
          onClick={() => setShowResults(true)}
          className="plasma-button"
          disabled={Object.keys(answers).length === 0}
        >
          Check Answers
        </button>

        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="hologram-card p-5 sm:p-6 rounded-xl max-w-md mx-auto"
          >
            <h4 className="text-lg sm:text-xl font-semibold neon-text mb-2">Your Score</h4>
            <div className={`text-2xl sm:text-3xl font-bold ${getScoreColor(calculateScore())}`}>
              {calculateScore()}%
            </div>
            <p className="text-xs sm:text-sm text-gray-400 mt-2">
              {calculateScore() >= 80 
                ? "Excellent! You have a strong understanding of SVD."
                : calculateScore() >= 60
                ? "Good job! Review the explanations to improve your knowledge."
                : "Keep learning! Review the material and try again."
              }
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
