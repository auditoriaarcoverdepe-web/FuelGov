
import React, { useState, useMemo, useEffect } from 'react';
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
import { supabase, isSupabaseConfigured } from './lib/supabaseClient'; 
import { useMockData } from './hooks/useMockData';

export type View = 'dashboard' | 'entities' | 'vehicles' | 'drivers' | 'contracts' | 'refuelings' | 'users';

const App: React.FC = () => {
    const [view, setView] = useState<View>('dashboard');
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
    const [loadingSession, setLoadingSession] = useState(true);
    const { users: mockUsers } = useMockData();

    useEffect(() => {
        // Se o Supabase não estiver configurado, não tentamos buscar a sessão.
        if (!isSupabaseConfigured) {
            setLoadingSession(false);
            return;
        }

        const getSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    const { data: userProfile, error } = await supabase
                        .from('users')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();

                    if (error) {
                        console.error("Error fetching user profile:", error);
                    } else if (userProfile) {
                        setCurrentUser(userProfile as User);
                        if ((userProfile as User).role !== Role.ADMIN) {
                            setSelectedEntityId((userProfile as User).entityId || null);
                        }
                    }
                }
            } catch (error) {
                console.error("Error during session check:", error);
            } finally {
                setLoadingSession(false);
            }
        };
        getSession();
        
        const { data: authListener } = supabase.auth.onAuthStateChange(
          async (_event, session) => {
            if (session?.user) {
                const { data: userProfile, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (error) {
                    console.error("Auth listener error fetching profile:", error);
                    // If profile doesn't exist, might be a partial signup. Log out.
                    await supabase.auth.signOut();
                    setCurrentUser(null);
                } else {
                    setCurrentUser(userProfile as User | null);
                }
            } else {
                setCurrentUser(null);
            }
          }
        );

        return () => {
          authListener?.subscription.unsubscribe();
        };

    }, []);

    const login = async (email: string, password: string): Promise<boolean> => {
      if (!isSupabaseConfigured) {
          // Lógica de login mock
          const user = mockUsers.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
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
      }

      // Lógica de login com Supabase
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (signInError) {
        console.error('Supabase sign in error:', signInError.message);
        return false;
      }
      
      if (data.user) {
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.error('Error fetching user profile after login:', profileError.message);
          await supabase.auth.signOut();
          return false;
        }

        if (userProfile) {
          setCurrentUser(userProfile as User);
          if ((userProfile as User).role !== Role.ADMIN) {
              setSelectedEntityId((userProfile as User).entityId || null);
          } else {
              setSelectedEntityId(null);
          }
          setView('dashboard');
          return true;
        }
      }
      
      return false;
    };

    const logout = async () => {
        if (!isSupabaseConfigured) {
            // Lógica de logout mock
            setCurrentUser(null);
            setSelectedEntityId(null);
            setView('dashboard');
            return;
        }

        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Error logging out:", error.message);
        }
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

    if (loadingSession) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="text-xl font-semibold text-text-secondary">Carregando...</div>
            </div>
        );
    }
    
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
