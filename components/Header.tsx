
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
    onBackToEntitySelection?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onBackToEntitySelection }) => {
  const { currentUser, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (!currentUser) {
    return null;
  }

  return (
    <header className="bg-surface shadow-md p-4 flex justify-between items-center">
      <h1 className="text-2xl font-bold text-primary">Gestão de Combustível</h1>
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition"
        >
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-white font-bold">
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <div className="font-semibold text-left text-text-primary">{currentUser.name}</div>
            <div className="text-xs text-text-secondary">{currentUser.role}</div>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-surface rounded-md shadow-lg z-20">
            <ul className="py-1">
               {onBackToEntitySelection && (
                <li>
                  <button
                    onClick={onBackToEntitySelection}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Trocar Entidade
                  </button>
                </li>
              )}
              <li>
                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sair
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
