/**
 * Enhanced accessible navigation components with comprehensive accessibility features
 * Provides skip links, breadcrumbs, and improved keyboard navigation
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  enhancedScreenReader, 
  keyboardNavigation,
  enhancedFocusManagement 
} from '../utils/accessibilityEnhancements';
import { KEYS } from '../utils/accessibility';

// Skip links component for keyboard navigation
export const SkipLinks = ({ links = [] }) => {
  const defaultLinks = [
    { href: '#main-content', label: 'Skip to main content' },
    { href: '#navigation', label: 'Skip to navigation' },
    { href: '#footer', label: 'Skip to footer' }
  ];

  const allLinks = links.length > 0 ? links : defaultLinks;

  return (
    <div className="skip-links">
      {allLinks.map((link, index) => (
        <a
          key={index}
          href={link.href}
          className="
            sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
            focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white 
            focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 
            focus:ring-blue-500 focus:ring-offset-2
          "
          onClick={(e) => {
            e.preventDefault();
            const target = document.querySelector(link.href);
            if (target) {
              target.focus();
              target.scrollIntoView({ behavior: 'smooth', block: 'start' });
              enhancedScreenReader.announceWithDelay(
                `Skipped to ${link.label.toLowerCase()}`,
                'polite',
                100
              );
            }
          }}
        >
          {link.label}
        </a>
      ))}
    </div>
  );
};

// Enhanced breadcrumb navigation
export const AccessibleBreadcrumb = ({ 
  items = [], 
  separator = '/', 
  className = '',
  maxItems = 5,
  showHome = true 
}) => {
  const location = useLocation();
  
  // Auto-generate breadcrumbs from current path if items not provided
  const breadcrumbItems = items.length > 0 ? items : generateBreadcrumbsFromPath(location.pathname);
  
  // Truncate items if too many
  const displayItems = breadcrumbItems.length > maxItems 
    ? [
        ...breadcrumbItems.slice(0, 1),
        { label: '...', href: null, isEllipsis: true },
        ...breadcrumbItems.slice(-maxItems + 2)
      ]
    : breadcrumbItems;

  if (displayItems.length <= 1 && !showHome) {
    return null;
  }

  return (
    <nav 
      aria-label="Breadcrumb navigation"
      className={`flex items-center space-x-2 text-sm ${className}`}
    >
      <ol className="flex items-center space-x-2">
        {showHome && displayItems[0]?.href !== '/' && (
          <li>
            <Link
              to="/"
              className="
                text-gray-500 hover:text-gray-700 dark:text-gray-400 
                dark:hover:text-gray-200 focus:outline-none focus:ring-2 
                focus:ring-blue-500 focus:ring-offset-1 rounded
              "
              aria-label="Go to home page"
            >
              <svg
                className="h-4 w-4"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
            </Link>
            <span className="mx-2 text-gray-400" aria-hidden="true">{separator}</span>
          </li>
        )}
        
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1;
          const isEllipsis = item.isEllipsis;
          
          return (
            <li key={index} className="flex items-center">
              {isEllipsis ? (
                <span 
                  className="text-gray-400 dark:text-gray-500"
                  aria-label="More breadcrumb items"
                >
                  {item.label}
                </span>
              ) : isLast ? (
                <span 
                  className="font-medium text-gray-900 dark:text-white"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.href}
                  className="
                    text-gray-500 hover:text-gray-700 dark:text-gray-400 
                    dark:hover:text-gray-200 focus:outline-none focus:ring-2 
                    focus:ring-blue-500 focus:ring-offset-1 rounded px-1
                  "
                  aria-label={`Go to ${item.label}`}
                >
                  {item.label}
                </Link>
              )}
              
              {!isLast && (
                <span className="mx-2 text-gray-400" aria-hidden="true">
                  {separator}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

// Enhanced main navigation with keyboard support
export const AccessibleMainNav = ({ 
  items = [], 
  className = '',
  orientation = 'horizontal',
  currentPath = '',
  onNavigate
}) => {
  const navRef = useRef(null);
  const itemRefs = useRef([]);
  const rovingTabindexRef = useRef(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // Setup roving tabindex for keyboard navigation
  useEffect(() => {
    if (itemRefs.current.length > 0) {
      rovingTabindexRef.current = keyboardNavigation.createRovingTabindex(
        itemRefs.current,
        {
          orientation,
          wrap: true,
          homeEndKeys: true
        }
      );
    }

    return () => {
      if (rovingTabindexRef.current) {
        rovingTabindexRef.current.destroy();
      }
    };
  }, [items.length, orientation]);

  const handleItemClick = useCallback((item, index) => {
    setFocusedIndex(index);
    onNavigate?.(item);
    
    // Announce navigation
    enhancedScreenReader.announceNavigation(
      'navigation menu',
      item.label
    );
  }, [onNavigate]);

  const handleKeyDown = useCallback((event, item, index) => {
    if (event.key === KEYS.ENTER || event.key === KEYS.SPACE) {
      event.preventDefault();
      handleItemClick(item, index);
    }
  }, [handleItemClick]);

  const orientationClasses = {
    horizontal: 'flex space-x-1',
    vertical: 'flex flex-col space-y-1'
  };

  return (
    <nav 
      ref={navRef}
      role="navigation"
      aria-label="Main navigation"
      className={className}
    >
      <ul className={orientationClasses[orientation]} role="menubar">
        {items.map((item, index) => {
          const isActive = currentPath === item.href || 
                          (item.activePattern && new RegExp(item.activePattern).test(currentPath));
          const isFocused = focusedIndex === index;
          
          return (
            <li key={item.href || index} role="none">
              {item.href ? (
                <Link
                  ref={(el) => {
                    if (el) {
                      itemRefs.current[index] = el;
                    }
                  }}
                  to={item.href}
                  role="menuitem"
                  tabIndex={index === 0 ? 0 : -1}
                  className={`
                    block px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 relative overflow-hidden group
                    focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1
                    ${isActive 
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg transform scale-105' 
                      : 'text-gray-700 hover:text-white hover:bg-gradient-to-r hover:from-blue-400 hover:to-indigo-500 hover:shadow-md hover:scale-105 dark:text-gray-300 dark:hover:text-white'
                    }
                    ${isFocused ? 'ring-2 ring-blue-400 shadow-lg' : ''}
                  `}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => handleItemClick(item, index)}
                  onKeyDown={(e) => handleKeyDown(e, item, index)}
                  onFocus={() => setFocusedIndex(index)}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {item.icon && (
                      <span className="text-lg" aria-hidden="true">
                        {item.icon}
                      </span>
                    )}
                    <span>{item.label}</span>
                  </span>
                  {!isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  )}
                  {item.badge && (
                    <span 
                      className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      aria-label={`${item.badge} notifications`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              ) : (
                <button
                  ref={(el) => {
                    if (el) {
                      itemRefs.current[index] = el;
                    }
                  }}
                  type="button"
                  role="menuitem"
                  tabIndex={index === 0 ? 0 : -1}
                  className={`
                    block w-full text-left px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 relative overflow-hidden group
                    focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1
                    text-gray-700 hover:text-white hover:bg-gradient-to-r hover:from-blue-400 hover:to-indigo-500 hover:shadow-md hover:scale-105
                    dark:text-gray-300 dark:hover:text-white
                    ${isFocused ? 'ring-2 ring-blue-400 shadow-lg' : ''}
                  `}
                  onClick={() => handleItemClick(item, index)}
                  onKeyDown={(e) => handleKeyDown(e, item, index)}
                  onFocus={() => setFocusedIndex(index)}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {item.icon && (
                      <span className="text-lg" aria-hidden="true">
                        {item.icon}
                      </span>
                    )}
                    <span>{item.label}</span>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  {item.badge && (
                    <span 
                      className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      aria-label={`${item.badge} notifications`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

// Enhanced mobile menu with accessibility
export const AccessibleMobileMenu = ({ 
  isOpen, 
  onClose, 
  items = [], 
  className = '' 
}) => {
  const menuRef = useRef(null);
  const focusTrapRef = useRef(null);
  const [focusedIndex, setFocusedIndex] = useState(0);

  // Setup focus trap when menu opens
  useEffect(() => {
    if (isOpen && menuRef.current) {
      focusTrapRef.current = enhancedFocusManagement.createFocusTrap(
        menuRef.current,
        {
          initialFocus: menuRef.current.querySelector('[role="menuitem"]'),
          returnFocus: true,
          escapeDeactivates: true
        }
      );

      // Announce menu opening
      enhancedScreenReader.announceWithDelay(
        'Mobile menu opened. Use arrow keys to navigate.',
        'polite',
        200
      );
    }

    return () => {
      if (focusTrapRef.current) {
        focusTrapRef.current();
      }
    };
  }, [isOpen]);

  const handleKeyDown = useCallback((event) => {
    const menuItems = menuRef.current?.querySelectorAll('[role="menuitem"]');
    if (!menuItems || menuItems.length === 0) return;

    let newIndex = focusedIndex;

    switch (event.key) {
      case KEYS.ARROW_DOWN:
        event.preventDefault();
        newIndex = (focusedIndex + 1) % menuItems.length;
        break;
      case KEYS.ARROW_UP:
        event.preventDefault();
        newIndex = focusedIndex === 0 ? menuItems.length - 1 : focusedIndex - 1;
        break;
      case KEYS.HOME:
        event.preventDefault();
        newIndex = 0;
        break;
      case KEYS.END:
        event.preventDefault();
        newIndex = menuItems.length - 1;
        break;
      case KEYS.ESCAPE:
        event.preventDefault();
        onClose();
        return;
      default:
        return;
    }

    if (newIndex !== focusedIndex) {
      setFocusedIndex(newIndex);
      menuItems[newIndex].focus();
    }
  }, [focusedIndex, onClose]);

  const handleItemClick = useCallback((item) => {
    onClose();
    
    // Announce navigation
    enhancedScreenReader.announceWithDelay(
      `Navigating to ${item.label}`,
      'polite',
      100
    );
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Menu panel */}
      <div className="fixed inset-y-0 right-0 flex max-w-sm w-full">
        <div 
          ref={menuRef}
          className={`
            relative flex flex-col w-full bg-white/95 backdrop-blur-lg shadow-2xl
            border-l border-white/20 transform transition-transform duration-300 ease-out
            ${className}
          `}
          role="menu"
          aria-orientation="vertical"
          aria-label="Mobile navigation menu"
          onKeyDown={handleKeyDown}
        >
          {/* Header with close button */}
          <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-b border-white/20">
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              🧭 Navigation
            </h2>
            <button
              type="button"
              className="
                flex h-10 w-10 items-center justify-center rounded-full 
                bg-gradient-to-r from-red-400 to-pink-500 text-white shadow-lg
                hover:shadow-xl hover:scale-110 focus:outline-none 
                focus:ring-2 focus:ring-red-400 focus:ring-offset-2
                transition-all duration-200
              "
              onClick={onClose}
              aria-label="Close menu"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          
          {/* Menu items */}
          <nav className="flex-1 px-6 py-6 space-y-3 overflow-y-auto">
            {items.map((item, index) => (
              <Link
                key={item.href || index}
                to={item.href}
                role="menuitem"
                tabIndex={index === 0 ? 0 : -1}
                className="
                  group relative flex items-center px-4 py-3 rounded-xl text-base font-semibold
                  text-gray-700 hover:text-white transition-all duration-300
                  focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
                  hover:shadow-lg hover:scale-105 transform
                  bg-white/50 hover:bg-gradient-to-r hover:from-blue-500 hover:to-indigo-600
                  border border-white/30 hover:border-transparent
                "
                onClick={() => handleItemClick(item)}
                onFocus={() => setFocusedIndex(index)}
              >
                {/* Background gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-indigo-600/0 group-hover:from-blue-500 group-hover:to-indigo-600 rounded-xl transition-all duration-300 opacity-0 group-hover:opacity-100" />
                
                <div className="relative z-10 flex items-center">
                  {item.icon && (
                    <span className="mr-3 text-xl group-hover:scale-110 transition-transform duration-200" aria-hidden="true">
                      {item.icon}
                    </span>
                  )}
                  <span className="group-hover:translate-x-1 transition-transform duration-200">
                    {item.label}
                  </span>
                </div>
                
                {/* Arrow indicator */}
                <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </nav>
          
          {/* Footer */}
          <div className="p-6 bg-gradient-to-r from-gray-50/50 to-blue-50/50 border-t border-white/20">
            <div className="text-center text-sm text-gray-500">
              <span className="font-medium">Interview Master</span>
              <br />
              <span className="text-xs">Navigate with confidence ✨</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to generate breadcrumbs from path
function generateBreadcrumbsFromPath(pathname) {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs = [{ label: 'Home', href: '/' }];
  
  let currentPath = '';
  segments.forEach((segment) => {
    currentPath += `/${segment}`;
    const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
    breadcrumbs.push({ label, href: currentPath });
  });
  
  return breadcrumbs;
}

const AccessibleNavigationComponents = {
  SkipLinks,
  AccessibleBreadcrumb,
  AccessibleMainNav,
  AccessibleMobileMenu
};

export default AccessibleNavigationComponents;