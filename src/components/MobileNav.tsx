import { Link, useLocation } from "react-router-dom";
import {
  HomeIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  UsersIcon,
  SunIcon,
  MoonIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { useUser } from "../contexts/UserContext";
import { useTheme } from "../contexts/ThemeContext";
import { useState } from "react";

export default function MobileNav() {
  const location = useLocation();
  const { state: userState, dispatch } = useUser();
  const { theme, toggleTheme } = useTheme();
  const [showMore, setShowMore] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
    { name: "Groups", href: "/groups", icon: UsersIcon },
    { name: "Analytics", href: "/analytics", icon: ChartBarIcon },
    { name: "Settings", href: "/settings", icon: Cog6ToothIcon },
  ];

  const moreOptions = [
    {
      name: theme === "dark" ? "Light Mode" : "Dark Mode",
      icon: theme === "dark" ? SunIcon : MoonIcon,
      onClick: toggleTheme,
    },
    {
      name: "Logout",
      icon: ArrowRightOnRectangleIcon,
      onClick: () => dispatch({ type: "LOGOUT" }),
      className: "text-red-600 dark:text-red-400",
    },
  ];

  const isActive = (path: string) => {
    if (path === "/groups" && location.pathname.startsWith("/groups")) {
      return true;
    }
    return location.pathname === path;
  };

  if (!userState.isAuthenticated) return null;

  return (
    <>
      {/* More options menu */}
      {showMore && (
        <div 
          className="sm:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setShowMore(false)}
        >
          <div className="absolute bottom-20 left-4 right-4 rounded-2xl backdrop-blur-md bg-white/90 dark:bg-gray-900/90 shadow-xl border border-white/20 dark:border-gray-800/30">
            {moreOptions.map((option) => (
              <button
                key={option.name}
                onClick={(e) => {
                  e.stopPropagation();
                  option.onClick();
                  setShowMore(false);
                }}
                className={`flex items-center w-full px-4 py-3 text-sm font-medium transition-colors
                  ${option.className || "text-gray-700 dark:text-gray-200"}`}
              >
                <option.icon className="w-5 h-5 mr-3" />
                {option.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom navigation */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-md bg-white/90 dark:bg-gray-900/90 border-t border-white/20 dark:border-gray-800/30 py-1">
        <div className="flex justify-around items-center h-16">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                isActive(item.href)
                  ? "text-purple-600 dark:text-purple-400"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-xs mt-1">{item.name}</span>
            </Link>
          ))}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMore(!showMore);
            }}
            className="flex flex-col items-center justify-center w-full h-full transition-colors text-gray-600 dark:text-gray-400"
          >
            <div className="w-6 h-6 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-current" />
              <div className="w-1.5 h-1.5 rounded-full bg-current mx-1" />
              <div className="w-1.5 h-1.5 rounded-full bg-current" />
            </div>
            <span className="text-xs mt-1">More</span>
          </button>
        </div>
      </div>
    </>
  );
} 