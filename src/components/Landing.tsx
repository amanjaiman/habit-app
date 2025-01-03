import { Link } from 'react-router-dom';
import { useState } from 'react';
import {
  ChartBarIcon,
  CheckCircleIcon,
  SparklesIcon,
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  LightBulbIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { useTheme } from '../contexts/ThemeContext';

export default function Landing() {
  const [currentSlides, setCurrentSlides] = useState([0, 0, 0]);
  const { theme } = useTheme();

  const weekViewScreenshot = theme === 'light' ? 'https://habitsense.ai/static/media/app_hero.2a80d9f25a76a9cee376.png' : 'https://habitsense.ai/static/media/app_hero.b4dd264653d1ed13a972.png';

  const advancedAggAnalyticsScreenshot = theme === 'light' ? 'https://habitsense.ai/static/media/ind_analytics.9fd5fae1bb3230924ad8.png' : 'https://habitsense.ai/static/media/ind_analytics.7a556b4cdab39b0fb733.png';
  const keyInsightsIndivdualScreenshot = theme === 'light' ? 'https://habitsense.ai/static/media/analytics_bottom.d3ec70c1d9bea21a25fe.png' : 'https://habitsense.ai/static/media/analytics_bottom.c3b08330235ba69e7643.png';
  const keyInsightsScreenshot = theme === 'light' ? 'https://habitsense.ai/static/media/insights.423978c22f2abf15de83.png' : 'https://habitsense.ai/static/media/insights.0313328d53df8eba402f.png';
  const actionableRecommendedScreenshot = theme === 'light' ? 'https://habitsense.ai/static/media/recommendations.0780680b338099844077.png' : 'https://habitsense.ai/static/media/recommendations.f7b2a3afbaff557040dd.png';
  const habitCorrelationsScreenshot = theme === 'light' ? 'https://habitsense.ai/static/media/ind_correlations.2e2efa8fd93f856cca26.png' : 'https://habitsense.ai/static/media/ind_correlations.c28b8a72d25e423a2f35.png';
  const habitPatternsScreenshot = theme === 'light' ? 'https://habitsense.ai/static/media/behavior_analysis.ed65d1286283854fa4bb.png' : 'https://habitsense.ai/static/media/behavior_analysis.113dddca5524a94c79a3.png';

  const features = [
    {
      title: "Advanced Aggregated and Per-Habit Analytics",
      description: "Discover trends and understand your habit patterns at a deeper level.",
      images: [advancedAggAnalyticsScreenshot, keyInsightsIndivdualScreenshot],
    },
    {
      title: "AI Insights and Recommendations",
      description: "Our AI analyzes your habits and provides personalized recommendations to improve your success rate.",
      images: [keyInsightsScreenshot, actionableRecommendedScreenshot],
    },
    {
      title: "Habit Correlations and Behavior Patterns",
      description: "Learn how your habits influence each other and optimize your daily routine for maximum impact.",
      images: [habitCorrelationsScreenshot, habitPatternsScreenshot],
    }
  ];

  const comparisonFeatures = [
    { name: "Daily habit tracking", free: true, premium: false },
    { name: "Group habits", free: true, premium: false },
    { name: "Basic analytics", free: true, premium: false },
    { name: "Everything in Free", free: false, premium: true },
    { name: "Weekly and monthly tracking", free: false, premium: true },
    { name: "Advanced analytics", free: false, premium: true },
    { name: "Key insights using AI", free: false, premium: true, ai: true },
    { name: "Cross-habit correlations", free: false, premium: true },
    { name: "Personalized recommendations", free: false, premium: true },
    { name: "Behavior analysis", free: false, premium: true },
    { name: "Advanced data visualizations", free: false, premium: true },
  ];

  return (
    <div className="bg-transparent">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-950 dark:to-pink-950 opacity-50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Left Column - Text Content */}
            <div className="text-left">
              <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight text-purple-900 dark:text-white">
                Build Your <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">Habit Sense</span>,<br />One Day at a Time
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Track, analyze, and improve your daily habits with AI-powered insights and beautiful visualizations.
              </p>
              <div className="flex gap-4">
                <Link
                  to="/signup"
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl 
                           shadow-lg hover:shadow-xl transition-all duration-200 font-medium transform hover:scale-105"
                >
                  Get Started Free
                </Link>
                <Link
                  to="/login" 
                  className="px-8 py-4 bg-white/80 dark:bg-gray-800/80 text-purple-600 dark:text-purple-400 rounded-xl 
                           shadow-lg hover:shadow-xl transition-all duration-200 font-medium transform hover:scale-105"
                >
                  Login
                </Link>
              </div>
            </div>

            {/* Right Column - Image */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl blur-xl" />
              <img 
                src={weekViewScreenshot} 
                alt="App Screenshot" 
                className="relative rounded-xl shadow-2xl border border-purple-200 dark:border-purple-800 w-full transform hover:scale-[1.02] transition-transform duration-300"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Plan Comparison */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-purple-900 dark:text-white">Choose Your Plan</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Start with our free plan or unlock premium features
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <div className="backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 rounded-2xl p-8">
            <h3 className="text-2xl font-bold mb-4 dark:text-white">Free Plan</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Perfect for getting started</p>
            <div className="text-4xl font-bold mb-8 md:mb-[60px] dark:text-white">$0</div>
            <Link
              to="/signup"
              className="block text-center px-6 py-3 bg-gray-200 dark:bg-gray-700 rounded-xl font-medium mb-8 dark:text-white transform hover:scale-105 transition-transform"
            >
              Get Started Free
            </Link>
            <ul className="space-y-4">
              {comparisonFeatures.map((feature, index) => {
                if (feature.free) {
                  return (
                    <li key={index} className="flex items-center gap-2">
                      {feature.free === true ? (
                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                      ) : feature.free === false ? (
                        <XMarkIcon className="w-5 h-5 text-gray-300" />
                      ) : null}
                      <span className="text-gray-600 dark:text-gray-300">
                        {feature.name}
                      </span>
                    </li>
                  );
                }
              })}
            </ul>
          </div>

          {/* Premium Plan */}
          <div className="backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 rounded-2xl p-8 border-2 border-purple-500 relative">
            {/*<div className="absolute -top-4 right-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-sm">
              Most Popular
            </div>*/}
            <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
              Premium Plan
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">For serious habit builders</p>
            <div className="text-4xl font-bold mb-2 dark:text-white">
              $1.99<span className="text-base font-normal text-gray-600 dark:text-gray-300">/month</span>
            </div>
            <div className="mb-8 text-sm text-gray-600 dark:text-gray-300">
              or $19.99/year <span className="text-emerald-500 font-semibold">(save 16%)</span>
            </div>
            <Link
              to="/signup"
              className="block text-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium mb-8 transform hover:scale-105 transition-transform"
            >
              Upgrade after sign up
            </Link>
            <ul className="space-y-4">
              {comparisonFeatures.map((feature, index) => {
                if (feature.premium) {
                  return (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircleIcon className="w-5 h-5 text-purple-500" />
                      <span className={`flex items-center gap-1 ${feature.ai ? 'font-semibold text-purple-600 dark:text-purple-400' : 'text-gray-600 dark:text-gray-300'}`}>
                        {feature.name} {feature.ai ? <SparklesIcon className="w-4 h-4 text-fuchsia-500 dark:text-fuchsia-400" /> : ''}
                      </span>
                    </li>
                  );
                }
              })}
            </ul>
          </div>
        </div>
      </div>

      {/* "Why Choose Us" Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center text-white">
            <div>
              <div className="text-4xl font-bold mb-2">
                <UserGroupIcon className="w-12 h-12 mx-auto mb-4" />
              </div>
              <h3 className="font-medium mb-2">Individual and Group Habits</h3>
              <div className="text-purple-100">Track your habits with family and friends</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">
                <LightBulbIcon className="w-12 h-12 mx-auto mb-4" />
              </div>
              <h3 className="font-medium mb-2">Powerful AI Insights</h3>
              <div className="text-purple-100">Personalized recommendations powered by AI</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">
                <SparklesIcon className="w-12 h-12 mx-auto mb-4" />
              </div>
              <h3 className="font-medium mb-2">Advanced Metrics and Analytics</h3>
              <div className="text-purple-100">Detailed analytics to understand your behavior</div>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-500 to-pink-500 text-transparent bg-clip-text">
            Premium Features
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Supercharge your habit-building journey with our premium features
          </p>
        </div>

        {features.map((feature, index) => (
          <div key={index} className={`flex flex-col md:flex-row gap-12 items-center mb-20 ${
            index % 2 === 1 ? 'md:flex-row-reverse' : ''
          }`}>
            <div className="flex-1 max-w-md">
              <h3 className="text-3xl font-bold mb-4 dark:text-white">{feature.title}</h3>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                {feature.description}
              </p>
            </div>
            <div className="flex-[1.5]">
              <div className="relative">
                <img 
                  src={feature.images[currentSlides[index]]} 
                  alt={feature.title}
                  className="rounded-xl shadow-2xl border border-purple-200 dark:border-purple-800 transition-opacity duration-500 w-full"
                />
                
                {/* Navigation buttons */}
                <div className="absolute inset-0 flex items-center justify-between p-4">
                  <button
                    onClick={() => {
                      const newSlides = [...currentSlides];
                      newSlides[index] = currentSlides[index] === 0 ? 1 : 0;
                      setCurrentSlides(newSlides);
                    }}
                    className="bg-black/30 hover:bg-black/50 text-white rounded-full p-1 backdrop-blur-sm transition-colors"
                  >
                    <ChevronLeftIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      const newSlides = [...currentSlides];
                      newSlides[index] = currentSlides[index] === 0 ? 1 : 0;
                      setCurrentSlides(newSlides);
                    }}
                    className="bg-black/30 hover:bg-black/50 text-white rounded-full p-1 backdrop-blur-sm transition-colors"
                  >
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Dots indicator */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {[0, 1].map((slideIndex) => (
                    <button
                      key={slideIndex}
                      onClick={() => {
                        const newSlides = [...currentSlides];
                        newSlides[index] = slideIndex;
                        setCurrentSlides(newSlides);
                      }}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        currentSlides[index] === slideIndex 
                          ? 'bg-white' 
                          : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-8">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-purple-100 mb-12 max-w-2xl mx-auto">
            Begin with our free plan and upgrade whenever you're ready. No credit card required.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/signup"
              className="inline-flex items-center px-8 py-4 bg-white/80 dark:bg-gray-800/80 text-purple-600 dark:text-purple-400 rounded-xl 
                       shadow-lg hover:shadow-xl transition-all duration-200 font-medium transform hover:scale-105"
            >
              Get Started Free <ArrowRightIcon className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 