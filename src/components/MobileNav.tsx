import { Link, useLocation } from "react-router-dom";
import {
  HomeIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { useUser } from "../contexts/UserContext";

export default function MobileNav() {
  const location = useLocation();
  const { state: userState } = useUser();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
    { name: "Groups", href: "/groups", icon: UsersIcon },
    { name: "Analytics", href: "/analytics", icon: ChartBarIcon },
    { name: "Settings", href: "/settings", icon: Cog6ToothIcon },
  ];

  const isActive = (path: string) => {
    if (path === "/groups" && location.pathname.startsWith("/groups")) {
      return true;
    }
    return location.pathname === path;
  };

  if (!userState.isAuthenticated) return null;

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-t border-white/20 dark:border-gray-800/30">
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
      </div>
    </div>
  );
} 