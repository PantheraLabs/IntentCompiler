"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Question } from "@/lib/intelligentQuestioner";

interface IntelligentQuestionsModalProps {
  isOpen: boolean;
  questions: Question[];
  onAnswers: (answers: Record<string, any>) => void;
  onClose: () => void;
}

export default function IntelligentQuestionsModal({
  isOpen,
  questions,
  onAnswers,
  onClose
}: IntelligentQuestionsModalProps) {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [followUpAnswer, setFollowUpAnswer] = useState("");

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const hasFollowUp = currentQuestion?.followUp && answers[currentQuestion.id];

  const handleAnswer = (value: any) => {
    const newAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(newAnswers);

    // Check if this answer triggers a follow-up
    if (currentQuestion.followUp && currentQuestion.followUp[value]) {
      setFollowUpAnswer("");
    } else if (!hasFollowUp) {
      // Move to next question or submit
      if (isLastQuestion) {
        onAnswers(newAnswers);
      } else {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }
    }
  };

  const handleFollowUpSubmit = () => {
    const newAnswers = { ...answers, [currentQuestion.id]: followUpAnswer };
    setAnswers(newAnswers);
    setFollowUpAnswer("");

    if (isLastQuestion) {
      onAnswers(newAnswers);
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="bg-surface border border-border rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl"
        >
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text">Perfect Your Workflow</h3>
              <span className="text-sm text-muted">
                {currentQuestionIndex + 1} of {questions.length}
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-surfaceAlt rounded-full h-2">
              <motion.div
                className="bg-accent h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Question */}
          <div className="mb-6">
            <p className="text-text mb-4">{currentQuestion.question}</p>
            
            {currentQuestion.required && (
              <p className="text-xs text-muted mb-4">* Required</p>
            )}

            {/* Input Types */}
            {!hasFollowUp && (
              <>
                {currentQuestion.type === 'input' && (
                  <input
                    type="text"
                    placeholder={currentQuestion.placeholder}
                    value={answers[currentQuestion.id] || ""}
                    onChange={(e) => handleAnswer(e.target.value)}
                    className="w-full px-4 py-3 bg-surfaceAlt border border-border rounded-lg text-text placeholder-muted focus:border-accent focus:outline-none transition"
                    autoFocus
                  />
                )}

                {currentQuestion.type === 'textarea' && (
                  <textarea
                    placeholder={currentQuestion.placeholder}
                    value={answers[currentQuestion.id] || ""}
                    onChange={(e) => handleAnswer(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-surfaceAlt border border-border rounded-lg text-text placeholder-muted focus:border-accent focus:outline-none transition resize-none"
                    autoFocus
                  />
                )}

                {currentQuestion.type === 'select' && (
                  <div className="space-y-2">
                    {currentQuestion.options?.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleAnswer(option.value)}
                        className={`w-full text-left px-4 py-3 rounded-lg border transition ${
                          answers[currentQuestion.id] === option.value
                            ? "bg-accent/20 border-accent text-text"
                            : "bg-surfaceAlt border-border text-text hover:border-accent/50"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}

                {currentQuestion.type === 'multiselect' && (
                  <div className="space-y-2">
                    {currentQuestion.options?.map((option) => {
                      const isSelected = answers[currentQuestion.id]?.includes(option.value);
                      return (
                        <button
                          key={option.value}
                          onClick={() => {
                            const current = answers[currentQuestion.id] || [];
                            const newSelection = isSelected
                              ? current.filter((v: string) => v !== option.value)
                              : [...current, option.value];
                            handleAnswer(newSelection);
                          }}
                          className={`w-full text-left px-4 py-3 rounded-lg border transition ${
                            isSelected
                              ? "bg-accent/20 border-accent text-text"
                              : "bg-surfaceAlt border-border text-text hover:border-accent/50"
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                )}

                {currentQuestion.type === 'confirmation' && (
                  <div className="space-y-2">
                    {currentQuestion.options?.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleAnswer(option.value)}
                        className={`w-full text-left px-4 py-3 rounded-lg border transition ${
                          answers[currentQuestion.id] === option.value
                            ? "bg-accent/20 border-accent text-text"
                            : "bg-surfaceAlt border-border text-text hover:border-accent/50"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Follow-up Input */}
            {hasFollowUp && currentQuestion.followUp && (
              <div className="mt-4">
                <p className="text-sm text-muted mb-2">
                  {currentQuestion.followUp[answers[currentQuestion.id]]}
                </p>
                <input
                  type="text"
                  placeholder="Type your answer..."
                  value={followUpAnswer}
                  onChange={(e) => setFollowUpAnswer(e.target.value)}
                  className="w-full px-4 py-3 bg-surfaceAlt border border-border rounded-lg text-text placeholder-muted focus:border-accent focus:outline-none transition"
                  autoFocus
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {!hasFollowUp && currentQuestionIndex > 0 && (
              <button
                onClick={() => {
                  setCurrentQuestionIndex(currentQuestionIndex - 1);
                  setFollowUpAnswer("");
                }}
                className="px-4 py-2 bg-surfaceAlt border border-border rounded-lg text-text hover:border-accent transition"
              >
                Back
              </button>
            )}

            {hasFollowUp ? (
              <button
                onClick={handleFollowUpSubmit}
                disabled={!followUpAnswer.trim()}
                className="flex-1 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLastQuestion ? "Complete Setup" : "Next"}
              </button>
            ) : (
              <button
                onClick={() => {
                  if (isLastQuestion) {
                    onAnswers(answers);
                  } else {
                    setCurrentQuestionIndex(currentQuestionIndex + 1);
                  }
                }}
                disabled={currentQuestion.required && !answers[currentQuestion.id]}
                className="flex-1 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLastQuestion ? "Complete Setup" : "Next"}
              </button>
            )}
          </div>

          {/* Skip for optional questions */}
          {!currentQuestion.required && !hasFollowUp && (
            <button
              onClick={() => {
                if (isLastQuestion) {
                  onAnswers(answers);
                } else {
                  setCurrentQuestionIndex(currentQuestionIndex + 1);
                }
              }}
              className="w-full mt-3 px-4 py-2 text-muted hover:text-text transition text-sm"
            >
              Skip this question
            </button>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
