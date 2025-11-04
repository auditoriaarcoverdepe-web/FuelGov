
import React, { useState, useMemo } from 'react';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import VehicleManagement from './components/VehicleManagement';
import DriverManagement from './components/DriverManagement';
import EntityManagement from './components/EntityManagement';
import ContractManagement from './components/ContractManagement';
import RefuelingManagement from './components/RefuelingManagement';
import UserManagement from './components/UserManagement';
import Login from './components/Login';
import AdminHome from './components/AdminHome';
import { Role } from './types';
import type { User } from './types';
import { useMockData } from './hooks/useMockData';

export type View = 'dashboard' | 'entities' | 'vehicles' | 'drivers' | 'contracts' | 'refuelings' | 'users';

const App: React.FC = () => {
    const [view, setView] = useState<View>('dashboard');
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
    const { users } = useMockData();

    const login = (email: string, password: string): boolean => {
      // A verificação de senha é ignorada para restaurar o acesso.
      // Qualquer senha funcionará desde que o e-mail esteja correto.
      const user = users.find(u => u.email === email);
      if (user) {
        setCurrentUser(user);
        if (user.role !== Role.ADMIN) {
            setSelectedEntityId(user.entityId || null);
        } else {
            setSelectedEntityId(null);
        }
        setView('dashboard');
        return true;
      }
      return false;
    };

    const logout = () => {
        setCurrentUser(null);
        setSelectedEntityId(null);
        setView('dashboard');
    };
    
    const selectEntity = (entityId: string) => {
        setSelectedEntityId(entityId);
        setView('dashboard');
    };

    const authContextValue = useMemo(() => ({
        currentUser,
        login,
        logout,
    }), [currentUser]);

    const entityIdForView = currentUser?.role === Role.ADMIN ? selectedEntityId : currentUser?.entityId;

    const renderView = () => {
        switch (view) {
            case 'dashboard':
                return <Dashboard entityId={entityIdForView} />;
            case 'entities':
                return <EntityManagement entityId={entityIdForView} />;
            case 'vehicles':
                return <VehicleManagement />;
            case 'drivers':
                return <DriverManagement />;
            case 'contracts':
                return <ContractManagement />;
            case 'refuelings':
                return <RefuelingManagement />;
            case 'users':
                return <UserManagement entityId={entityIdForView} />;
            default:
                return <Dashboard entityId={entityIdForView}/>;
        }
    };
    
    return (
        <AuthProvider value={authContextValue}>
            {!currentUser ? (
                <Login />
            ) : currentUser.role === Role.ADMIN && !selectedEntityId ? (
                <div className="flex-1 flex flex-col overflow-hidden h-screen bg-background">
                   <Header onBackToEntitySelection={undefined} />
                   <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 lg:p-8">
                        <AdminHome onSelectEntity={selectEntity} />
                   </main>
               </div>
            ) : (
                <div className="flex h-screen bg-background">
                    <Sidebar setView={setView} currentView={view} />
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <Header 
                            onBackToEntitySelection={
                                currentUser.role === Role.ADMIN && selectedEntityId
                                ? () => setSelectedEntityId(null)
                                : undefined
                            }
                        />
                        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-6 lg:p-8">
                            {renderView()}
                        </main>
                    </div>
                </div>
            )}
        </AuthProvider>
    );
};

export default App;