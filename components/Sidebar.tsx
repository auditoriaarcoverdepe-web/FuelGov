import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import type { View } from '../App';

interface SidebarProps {
  setView: (view: View) => void;
  currentView: View;
}

const NavItem: React.FC<{
  label: string;
  icon: React.ReactElement;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full px-4 py-3 text-sm font-medium transition-colors duration-150 ${
      isActive
        ? 'text-white bg-secondary'
        : 'text-gray-200 hover:text-white hover:bg-primary-dark'
    }`}
  >
    {React.cloneElement(icon, { className: "w-5 h-5 mr-3"})}
    <span>{label}</span>
  </button>
);

const icons = {
  dashboard: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  entities: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  vehicles: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  drivers: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  contracts: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  refuelings: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M12 6V5M12 20v-1M12 16a4 4 0 100-8 4 4 0 000 8z"></path></svg>,
  users: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m0 0A5.975 5.975 0 0112 13a5.975 5.975 0 013 5.197" /></svg>,
};


const Sidebar: React.FC<SidebarProps> = ({ setView, currentView }) => {
  const { currentUser } = useAuth();
  const { role } = currentUser;

  const navLinks: { view: View; label: string; icon: React.ReactElement; roles: Role[] }[] = [
    { view: 'dashboard', label: 'Dashboard', icon: icons.dashboard, roles: [Role.ADMIN, Role.CONTROLLER, Role.USER] },
    { view: 'refuelings', label: 'Abastecimentos', icon: icons.refuelings, roles: [Role.ADMIN, Role.CONTROLLER, Role.USER] },
    { view: 'vehicles', label: 'Veículos', icon: icons.vehicles, roles: [Role.ADMIN, Role.CONTROLLER, Role.USER] },
    { view: 'drivers', label: 'Motoristas', icon: icons.drivers, roles: [Role.ADMIN, Role.CONTROLLER, Role.USER] },
    { view: 'contracts', label: 'Contratos', icon: icons.contracts, roles: [Role.ADMIN, Role.CONTROLLER, Role.USER] },
    { view: 'entities', label: 'Entidades & Órgãos', icon: icons.entities, roles: [Role.ADMIN, Role.CONTROLLER] },
    { view: 'users', label: 'Usuários do Sistema', icon: icons.users, roles: [Role.ADMIN] },
  ];

  return (
    <aside className="w-64 bg-primary text-white flex-shrink-0 flex flex-col">
      <div className="h-[73px] flex items-center justify-center text-2xl font-semibold border-b border-primary-dark">
        <span className="text-accent">Fuel</span><span className="text-white">Gov</span>
      </div>
      <nav className="flex-1 py-4">
        <ul>
          {navLinks
            .filter(link => link.roles.includes(role))
            .map(link => (
              <li key={link.view}>
                <NavItem 
                  label={link.label}
                  icon={link.icon}
                  isActive={currentView === link.view}
                  onClick={() => setView(link.view)}
                />
              </li>
            ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;