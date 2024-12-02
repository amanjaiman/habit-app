import { Link } from 'react-router-dom';
import {
  ChartBarIcon,
  CheckCircleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import appScreenshot from '../images/dashboard.png'; // Import an image of the app

export default function Landing() {
  return (
    <div className="bg-transparent">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
        <h1 className="text-6xl font-black bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text mb-8">
          Build Better Habits
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-12">
          Track, analyze, and improve your daily habits with powerful insights and proven techniques.
        </p>
        <div className="flex justify-center gap-4 mb-12">
          <Link
            to="/signup"
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl 
                     shadow-lg hover:shadow-xl transition-all duration-200 font-medium transform hover:scale-105"
          >
            Get Started Free
          </Link>
          <Link
            to="/login"
            className="px-8 py-4 bg-white/50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300 
                     rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-medium transform hover:scale-105"
          >
            Login
          </Link>
        </div>
        <img src={appScreenshot} alt="App Screenshot" className="mx-auto mb-12 rounded-lg shadow-lg" />
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon={CheckCircleIcon}
            title="Track Daily Progress"
            description="Build consistency with easy habit tracking and streaks"
          />
          <FeatureCard
            icon={ChartBarIcon}
            title="Detailed Analytics"
            description="Gain insights into your habits with comprehensive analytics"
          />
          <FeatureCard
            icon={SparklesIcon}
            title="Premium Features"
            description="Access advanced features and deeper insights with Premium"
          />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: {
  icon: any;
  title: string;
  description: string;
}) {
  return (
    <div className="backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 rounded-2xl p-8 
                  border border-white/20 dark:border-gray-800 shadow-xl transform hover:scale-105 transition-transform duration-200">
      <Icon className="w-12 h-12 text-purple-600 mb-4" />
      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );
} 