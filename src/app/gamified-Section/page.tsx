'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

// Interfaces for the prediction data structure
interface PredictionResults {
  heartAttack: {
    predictedOutcome: string;
    probabilityOfHighRisk: number;
    modelAccuracy: number;
  };
  personalizedRecommendations: {
    disclaimer: string;
    tasks: string[];
  };
}

// Daily task structure
interface DailyTask {
  id: string;
  category: 'diet' | 'exercise' | 'lifestyle' | 'monitoring' | 'medical';
  title: string;
  description: string;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  completed: boolean;
  icon: string;
  timeEstimate: string;
  streak: number;
}

// User progress and stats
interface UserStats {
  totalPoints: number;
  currentLevel: number;
  dailyStreak: number;
  weeklyGoals: number;
  completedTasks: number;
  badges: string[];
}

export default function GameifiedHealthPage() {
  const [user, loading] = useAuthState(auth);
  const [predictionData, setPredictionData] = useState<PredictionResults | null>(null);
  const [userStats, setUserStats] = useState<UserStats>({
    totalPoints: 0,
    currentLevel: 1,
    dailyStreak: 0,
    weeklyGoals: 0,
    completedTasks: 0,
    badges: []
  });
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCelebration, setShowCelebration] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Load health analysis results from localStorage and handle success message
  useEffect(() => {
    // Check URL parameters for success message
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('from') === 'extraction' && urlParams.get('success') === 'true') {
      setShowSuccessMessage(true);
      // Auto-hide success message after 5 seconds
      setTimeout(() => setShowSuccessMessage(false), 5000);
      // Clean up URL
      window.history.replaceState({}, '', '/gamified-Section');
    }

    // Load ML results from localStorage
    const storedResults = localStorage.getItem('healthAnalysisResults');
    if (storedResults) {
      try {
        const parsedResults = JSON.parse(storedResults);
        
        if (parsedResults.mlPredictions && !parsedResults.mlError) {
          // Convert ML predictions to gamified format
          interface MLPrediction {
            illness: string;
            is_high_risk: boolean;
            risk_probability: number;
            model_accuracy: number;
          }
          const heartAttackPrediction = parsedResults.mlPredictions.ml_predictions?.find(
            (pred: MLPrediction) => pred.illness.toLowerCase().includes('heart')
          );
          
          if (heartAttackPrediction) {
            const gamifiedData: PredictionResults = {
              heartAttack: {
                predictedOutcome: heartAttackPrediction.is_high_risk ? 
                  `High Risk of ${heartAttackPrediction.illness}` : 
                  `Low Risk of ${heartAttackPrediction.illness}`,
                probabilityOfHighRisk: heartAttackPrediction.risk_probability,
                modelAccuracy: heartAttackPrediction.model_accuracy
              },
              personalizedRecommendations: {
                disclaimer: "These recommendations are based on your extracted health data and AI analysis. Please consult a healthcare provider.",
                tasks: generateRecommendationsFromMLData(parsedResults)
              }
            };
            
            setPredictionData(gamifiedData);
            generateDailyTasks();
            return;
          }
        }
      } catch (error) {
        console.error('Error parsing stored results:', error);
      }
    }

    // Fallback to mock data if no real data available
    loadMockData();
    generateDailyTasks();
  }, []);

  // Generate recommendations based on ML data
  interface MLResults {
    extractedData?: {
      smoking?: number;
      diabetes?: number;
      total_cholesterol?: number;
      systolic_bp?: number;
    };
    mlPredictions?: {
      ml_predictions?: {
        illness: string;
        is_high_risk: boolean;
        risk_probability: number;
        model_accuracy: number;
      }[];
      rule_based_assessments?: {
        potential_illness: string;
        details: string;
      }[];
      mlError?: string;
    };
  }

  const generateRecommendationsFromMLData = (results: MLResults) => {
    const recommendations = [
      "Improve Your Diet and Stay Active: These are fundamental for lowering risk for many lifestyle diseases."
    ];

    const extractedData = results.extractedData;
    
    if (extractedData?.smoking === 1) {
      recommendations.push("Quit Smoking: Your inputs indicate you smoke. Quitting is a critical step to lower your risk.");
    }
    
    if (extractedData?.diabetes === 1) {
      recommendations.push("Manage Diabetes: Careful management of your blood sugar is crucial for reducing complication risks.");
    }

    if (extractedData?.total_cholesterol && extractedData.total_cholesterol > 200) {
      recommendations.push("Monitor Cholesterol: Your cholesterol levels may need attention. Consider dietary changes and regular monitoring.");
    }

    if (extractedData?.systolic_bp && extractedData.systolic_bp > 130) {
      recommendations.push("Blood Pressure Management: Your blood pressure readings suggest the need for lifestyle modifications.");
    }

    // Add rule-based assessments if available
    if (results.mlPredictions?.rule_based_assessments) {
      results.mlPredictions.rule_based_assessments.forEach((assessment: { potential_illness: string; details: string }) => {
        recommendations.push(`${assessment.potential_illness}: ${assessment.details}`);
      });
    }

    return recommendations;
  };

  // Fallback mock data function
  const loadMockData = () => {
    const mockPredictionData: PredictionResults = {
      heartAttack: {
        predictedOutcome: "High Risk of Heart Attack",
        probabilityOfHighRisk: 71.0,
        modelAccuracy: 90.33
      },
      personalizedRecommendations: {
        disclaimer: "These recommendations are generated based on general health guidelines. Please consult a healthcare provider.",
        tasks: [
          "Improve Your Diet and Stay Active: These are fundamental for lowering risk for many lifestyle diseases.",
          "Quit Smoking: Your inputs indicate you smoke. Quitting is a critical step to lower your risk.",
          "Manage Blood Pressure: Your blood pressure appears elevated. Please monitor it and consult a doctor.",
          "Lower Your Cholesterol: Your cholesterol levels seem high. Discuss management strategies with your doctor.",
          "Manage Diabetes: Careful management of your blood sugar is crucial for reducing complication risks."
        ]
      }
    };
    
    setPredictionData(mockPredictionData);
  };

  // Generate personalized daily tasks based on prediction results
  const generateDailyTasks = () => {
    const tasks: DailyTask[] = [];
    let taskId = 1;

    // Diet-related tasks
    tasks.push({
      id: `task-${taskId++}`,
      category: 'diet',
      title: 'Eat Heart-Healthy Breakfast',
      description: 'Include oats, berries, or nuts in your breakfast to improve cholesterol levels',
      points: 50,
      difficulty: 'easy',
      completed: false,
      icon: '🥗',
      timeEstimate: '15 min',
      streak: 0
    });

    tasks.push({
      id: `task-${taskId++}`,
      category: 'diet',
      title: 'Reduce Salt Intake',
      description: 'Keep sodium under 2,300mg today to help manage blood pressure',
      points: 40,
      difficulty: 'medium',
      completed: false,
      icon: '🧂',
      timeEstimate: 'All day',
      streak: 0
    });

    // Exercise tasks
    tasks.push({
      id: `task-${taskId++}`,
      category: 'exercise',
      title: 'Take 8,000 Steps',
      description: 'Walking helps improve cardiovascular health and manage weight',
      points: 60,
      difficulty: 'medium',
      completed: false,
      icon: '🚶‍♂️',
      timeEstimate: '45 min',
      streak: 0
    });

    tasks.push({
      id: `task-${taskId++}`,
      category: 'exercise',
      title: '10-Minute Cardio',
      description: 'Light cardio exercise to strengthen your heart',
      points: 70,
      difficulty: 'medium',
      completed: false,
      icon: '❤️',
      timeEstimate: '10 min',
      streak: 0
    });

    // Lifestyle tasks
    tasks.push({
      id: `task-${taskId++}`,
      category: 'lifestyle',
      title: 'Quit Smoking Progress',
      description: 'Go smoke-free for the entire day - your heart will thank you!',
      points: 100,
      difficulty: 'hard',
      completed: false,
      icon: '🚭',
      timeEstimate: 'All day',
      streak: 0
    });

    tasks.push({
      id: `task-${taskId++}`,
      category: 'lifestyle',
      title: 'Stress Management',
      description: 'Practice 10 minutes of deep breathing or meditation',
      points: 50,
      difficulty: 'easy',
      completed: false,
      icon: '🧘‍♂️',
      timeEstimate: '10 min',
      streak: 0
    });

    // Monitoring tasks
    tasks.push({
      id: `task-${taskId++}`,
      category: 'monitoring',
      title: 'Check Blood Pressure',
      description: 'Monitor your BP and log the reading',
      points: 30,
      difficulty: 'easy',
      completed: false,
      icon: '🩺',
      timeEstimate: '5 min',
      streak: 0
    });

    tasks.push({
      id: `task-${taskId++}`,
      category: 'monitoring',
      title: 'Blood Sugar Check',
      description: 'Monitor glucose levels and track in your health log',
      points: 30,
      difficulty: 'easy',
      completed: false,
      icon: '📊',
      timeEstimate: '5 min',
      streak: 0
    });

    // Medical tasks
    tasks.push({
      id: `task-${taskId++}`,
      category: 'medical',
      title: 'Schedule Doctor Visit',
      description: 'Book an appointment to discuss your cardiovascular risk factors',
      points: 80,
      difficulty: 'medium',
      completed: false,
      icon: '👨‍⚕️',
      timeEstimate: '10 min',
      streak: 0
    });

    setDailyTasks(tasks);
  };

  // Complete a task
  const completeTask = (taskId: string) => {
    setDailyTasks(prevTasks => 
      prevTasks.map(task => {
        if (task.id === taskId && !task.completed) {
          const updatedTask = { ...task, completed: true, streak: task.streak + 1 };
          
          // Update user stats
          setUserStats(prevStats => {
            const newTotalPoints = prevStats.totalPoints + task.points;
            const newLevel = Math.floor(newTotalPoints / 500) + 1;
            const newCompletedTasks = prevStats.completedTasks + 1;
            
            return {
              ...prevStats,
              totalPoints: newTotalPoints,
              currentLevel: newLevel,
              completedTasks: newCompletedTasks,
              dailyStreak: prevStats.dailyStreak + (newCompletedTasks % 5 === 0 ? 1 : 0)
            };
          });
          
          // Show celebration for high-point tasks
          if (task.points >= 70) {
            setShowCelebration(true);
            setTimeout(() => setShowCelebration(false), 2000);
          }
          
          return updatedTask;
        }
        return task;
      })
    );
  };

  // Get level progress
  const getLevelProgress = () => {
    const pointsInCurrentLevel = userStats.totalPoints % 500;
    return (pointsInCurrentLevel / 500) * 100;
  };

  // Get risk level color
  const getRiskColor = (probability: number) => {
    if (probability >= 70) return 'text-red-500 bg-red-500/10 border-red-500/20';
    if (probability >= 40) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
    return 'text-green-500 bg-green-500/10 border-green-500/20';
  };

  // Filter tasks by category
  const filteredTasks = selectedCategory === 'all' 
    ? dailyTasks 
    : dailyTasks.filter(task => task.category === selectedCategory);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p>Loading your health journey...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Celebration Animation */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="text-6xl animate-bounce">🎉</div>
        </div>
      )}

      {/* Success Message Banner */}
      {showSuccessMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40 max-w-md">
          <div className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg border border-green-500 flex items-center gap-3 animate-slide-down">
            <div className="text-xl">✅</div>
            <div>
              <div className="font-semibold">Analysis Complete!</div>
              <div className="text-sm text-green-100">Your health data has been processed and personalized recommendations are ready.</div>
            </div>
            <button 
              onClick={() => setShowSuccessMessage(false)}
              className="ml-2 text-green-200 hover:text-white transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        
        {/* Header with User Stats */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Your Health Journey</h1>
              <p className="text-slate-400">Welcome back, {user?.email?.split('@')[0]}! Let&apos;s improve your health today.</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-purple-400">{userStats.totalPoints} pts</div>
              <div className="text-sm text-slate-400">Level {userStats.currentLevel}</div>
            </div>
          </div>
          
          {/* Level Progress Bar */}
          <div className="bg-slate-800 rounded-full h-3 mb-4">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${getLevelProgress()}%` }}
            ></div>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-400">{userStats.dailyStreak}</div>
              <div className="text-sm text-slate-400">Daily Streak</div>
            </div>
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-400">{userStats.completedTasks}</div>
              <div className="text-sm text-slate-400">Tasks Done</div>
            </div>
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-400">{userStats.weeklyGoals}</div>
              <div className="text-sm text-slate-400">Weekly Goals</div>
            </div>
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-400">{userStats.badges.length}</div>
              <div className="text-sm text-slate-400">Badges Earned</div>
            </div>
          </div>
        </div>

        {/* Risk Assessment Summary */}
        {predictionData && (
          <div className={`rounded-lg p-6 mb-8 border ${getRiskColor(predictionData.heartAttack.probabilityOfHighRisk)}`}>
            <div className="flex items-center gap-4 mb-4">
              <div className="text-4xl">⚠️</div>
              <div>
                <h2 className="text-xl font-bold">Health Risk Assessment</h2>
                <p className="text-sm opacity-80">{predictionData.heartAttack.predictedOutcome}</p>
              </div>
              <div className="ml-auto text-right">
                <div className="text-2xl font-bold">{predictionData.heartAttack.probabilityOfHighRisk}%</div>
                <div className="text-xs opacity-70">Risk Probability</div>
              </div>
            </div>
            <div className="text-sm opacity-70 mb-4">
              Model Accuracy: {predictionData.heartAttack.modelAccuracy}% • {predictionData.personalizedRecommendations.disclaimer}
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <h3 className="font-medium mb-2">Key Focus Areas:</h3>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-sm">High Blood Pressure</span>
                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-sm">High Cholesterol</span>
                <span className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded-full text-sm">Smoking</span>
                <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">Diabetes Management</span>
              </div>
            </div>
          </div>
        )}

        {/* Task Categories Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {['all', 'diet', 'exercise', 'lifestyle', 'monitoring', 'medical'].map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                  selectedCategory === category
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {category === 'all' ? 'All Tasks' : category}
              </button>
            ))}
          </div>
        </div>

        {/* Daily Tasks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map(task => (
            <div
              key={task.id}
              className={`bg-slate-800 rounded-lg p-6 transition-all duration-300 ${
                task.completed 
                  ? 'opacity-75 border-2 border-green-500/20 bg-green-500/10' 
                  : 'hover:bg-slate-700 hover:scale-105'
              }`}
            >
              {/* Task Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{task.icon}</span>
                  <div>
                    <h3 className="font-bold text-white">{task.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <span>{task.timeEstimate}</span>
                      <span>•</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        task.difficulty === 'easy' ? 'bg-green-500/20 text-green-300' :
                        task.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-red-500/20 text-red-300'
                      }`}>
                        {task.difficulty}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-purple-400">+{task.points}</div>
                  <div className="text-xs text-slate-400">points</div>
                </div>
              </div>

              {/* Task Description */}
              <p className="text-slate-300 text-sm mb-4 line-clamp-2">{task.description}</p>

              {/* Task Actions */}
              <div className="flex items-center justify-between">
                {task.streak > 0 && (
                  <div className="flex items-center gap-1 text-orange-400 text-sm">
                    <span>🔥</span>
                    <span>{task.streak} day streak</span>
                  </div>
                )}
                
                <button
                  onClick={() => completeTask(task.id)}
                  disabled={task.completed}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ml-auto ${
                    task.completed
                      ? 'bg-green-500/20 text-green-300 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-700 text-white hover:scale-105'
                  }`}
                >
                  {task.completed ? '✓ Completed' : 'Complete Task'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Daily Progress Summary */}
        <div className="mt-8 bg-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Today&apos;s Progress</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">
                {dailyTasks.filter(task => task.completed).length}
              </div>
              <div className="text-slate-400">Tasks Completed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400">
                {dailyTasks.filter(task => task.completed).reduce((sum, task) => sum + task.points, 0)}
              </div>
              <div className="text-slate-400">Points Earned Today</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">
                {Math.round((dailyTasks.filter(task => task.completed).length / dailyTasks.length) * 100)}%
              </div>
              <div className="text-slate-400">Daily Goal Progress</div>
            </div>
          </div>
        </div>

        {/* Motivational Message */}
        <div className="mt-8 text-center">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-2">Keep Going! 💪</h3>
            <p className="text-slate-200">
              Every small step counts towards a healthier you. Complete more tasks to unlock new badges and improve your health score!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}