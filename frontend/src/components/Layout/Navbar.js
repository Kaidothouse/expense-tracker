import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HomeIcon, CreditCardIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { HomeIcon as HomeIconSolid, CreditCardIcon as CreditCardIconSolid, ChartBarIcon as ChartBarIconSolid } from '@heroicons/react/24/solid';

const Navbar = () => {
  const location = useLocation();

  const navItems = [
    {
      name: 'Dashboard',
      path: '/',
      icon: HomeIcon,
      activeIcon: HomeIconSolid,
    },
    {
      name: 'Expenses',
      path: '/expenses',
      icon: CreditCardIcon,
      activeIcon: CreditCardIconSolid,
    },
    {
      name: 'Budget',
      path: '/budget',
      icon: ChartBarIcon,
      activeIcon: ChartBarIconSolid,
    },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-navy-800 border-t border-navy-700 md:static md:border-t-0 md:border-r">
      <div className="flex md:flex-col justify-around md:justify-start md:h-full md:w-64">
        <div className="hidden md:block p-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
            ExpenseTracker
          </h1>
        </div>

        {navItems.map((item) => {
          const Icon = isActive(item.path) ? item.activeIcon : item.icon;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`
                flex flex-col md:flex-row items-center justify-center md:justify-start
                px-2 py-3 md:px-6 md:py-3 text-sm md:text-base
                transition-all duration-200
                ${isActive(item.path)
                  ? 'text-purple-400 bg-purple-600/10 md:border-r-4 md:border-purple-400'
                  : 'text-navy-400 hover:text-white hover:bg-navy-700'
                }
              `}
            >
              <Icon className="h-6 w-6 md:mr-3 mb-1 md:mb-0" />
              <span className="text-xs md:text-base">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default Navbar;