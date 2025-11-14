
import React, { useState, useMemo, useCallback } from 'react';
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
import type { User, View } from './types';
import { useMockData } from './hooks/useMockData';

const App: React.FC = () => {
    const [view, setView] = useState<View>('dashboard');
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
    const { users: mockUsers } = useMockData();

    // Com a remoção do Supabase, não há mais verificação de sessão assíncrona.
    // O estado inicial da aplicação é sempre com o usuário deslogado.

    const login = useCallback(async (email: string, password: string): Promise<boolean> => {
        // Lógica de autenticação utiliza apenas os dados fictícios (mock)
        const user = mockUsers.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
        if (user) {
            setCurrentUser(user);
            if (user.role !== Role.ADMIN) {
                setSelectedEntityId(user.entity_id || null);
            } else {
                setSelectedEntityId(null);
            }
            setView('dashboard');
            return true;
        }
        return false;
    }, [mockUsers]);

    const logout = useCallback(async () => {
        // Lógica de logout para o modo de dados fictícios
        setCurrentUser(null);
        setSelectedEntityId(null);
        setView('dashboard');
    }, []);
    
    const selectEntity = (entityId: string) => {
        setSelectedEntityId(entityId);
        setView('dashboard');
    };

    const authContextValue = useMemo(() => ({
        currentUser,
        login,
        logout,
    }), [currentUser, login, logout]);

    const entityIdForView = currentUser?.role === Role.ADMIN ? selectedEntityId : currentUser?.entity_id;

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
