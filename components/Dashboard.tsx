
import React, { useMemo } from 'react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import Card from './ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Contract, Refueling } from '../types';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactElement }> = ({ title, value, icon }) => (
    <Card className="flex items-center p-4">
        <div className="p-3 rounded-full bg-secondary text-white mr-4">
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-text-secondary">{title}</p>
            <p className="text-2xl font-bold text-text-primary">{value}</p>
        </div>
    </Card>
);

const AlertCard: React.FC<{ title: string; message: string; type: 'warning' | 'danger' }> = ({ title, message, type }) => {
    const isWarning = type === 'warning';
    return (
        <div className={`p-4 rounded-lg flex items-start space-x-3 ${isWarning ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger'}`}>
            <div className={`mt-1 flex-shrink-0 w-6 h-6 ${isWarning ? 'text-warning' : 'text-danger'}`}>
                {isWarning ? <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                : <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>}
            </div>
            <div>
                <p className="font-semibold">{title}</p>
                <p className="text-sm">{message}</p>
            </div>
        </div>
    );
};


interface DashboardProps {
    entityId: string | null;
}

const Dashboard: React.FC<DashboardProps> = ({ entityId }) => {
    const { contracts, refuelings, departments, entities, drivers, loading } = useSupabaseData();
    const { currentUser } = useAuth();

    const filteredData = useMemo(() => {
        if (!entityId || !currentUser) return { contracts: [], refuelings: [] };

        const entityDepartments = departments.filter(d => d.entityId === entityId).map(d => d.id);
        const entityContracts = contracts.filter(c => entityDepartments.includes(c.departmentId));
        const entityContractIds = entityContracts.map(c => c.id);
        const entityRefuelings = refuelings.filter(r => entityContractIds.includes(r.contractId));
        
        if (currentUser.role === Role.USER && currentUser.departmentId) {
            const userContracts = entityContracts.filter(c => c.departmentId === currentUser.departmentId);
            const userContractIds = userContracts.map(c => c.id);
            const userRefuelings = entityRefuelings.filter(r => userContractIds.includes(r.contractId));
            return { contracts: userContracts, refuelings: userRefuelings };
        }
        
        return { contracts: entityContracts, refuelings: entityRefuelings };

    }, [entityId, currentUser, contracts, refuelings, departments]);

     const filteredDrivers = useMemo(() => {
        if (!entityId || !currentUser) return [];
        const entityDepartments = departments.filter(d => d.entityId === entityId).map(d => d.id);
        
        if (currentUser.role === Role.USER && currentUser.departmentId) {
            return drivers.filter(d => d.departmentId === currentUser.departmentId);
        }
        
        const userVisibleDrivers = drivers.filter(d => entityDepartments.includes(d.departmentId));

        if (currentUser.role === Role.CONTROLLER) {
            return userVisibleDrivers;
        }

        if (currentUser.role === Role.ADMIN) {
            return userVisibleDrivers;
        }

        return [];
    }, [entityId, currentUser, drivers, departments]);

    const totalSpent = useMemo(() => {
        return filteredData.refuelings.reduce((sum, r) => sum + r.totalValue, 0);
    }, [filteredData.refuelings]);

    const totalLiters = useMemo(() => {
        return filteredData.refuelings.reduce((sum, r) => sum + r.quantityLiters, 0);
    }, [filteredData.refuelings]);

    const consumptionByMonth = useMemo(() => {
        const data: { [key: string]: number } = {};
        filteredData.refuelings.forEach(r => {
            const month = new Date(r.date).toLocaleString('default', { month: 'short', year: '2-digit' });
            if (!data[month]) data[month] = 0;
            data[month] += r.quantityLiters;
        });
        return Object.entries(data).map(([name, value]) => ({ name, Litros: value })).slice(-6); // Last 6 months
    }, [filteredData.refuelings]);

    const allAlerts = useMemo(() => {
        const alerts: { id: string; title: string; message: string; type: 'warning' | 'danger' }[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Contract Alerts
        filteredData.contracts.forEach(contract => {
            const endDate = new Date(contract.endDate);
            const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
            
            if (daysRemaining <= 30 && daysRemaining >= 0) {
                alerts.push({ id: `c-days-${contract.id}`, title: contract.supplier, message: `Contrato expira em ${daysRemaining} dia(s).`, type: 'warning' });
            }

            const contractTotalLiters = (contract.items || []).reduce((sum, item) => sum + item.quantityLiters, 0);
            const usedLiters = filteredData.refuelings
                .filter(r => r.contractId === contract.id)
                .reduce((sum, r) => sum + r.quantityLiters, 0);
            
            const usagePercent = (usedLiters / contractTotalLiters) * 100;
            if (usagePercent >= 85) {
                alerts.push({ id: `c-usage-${contract.id}`, title: contract.supplier, message: `Uso do contrato em ${usagePercent.toFixed(1)}%.`, type: 'danger' });
            }
        });
        
        // Driver CNH Alerts
        filteredDrivers.forEach(driver => {
            const validityDate = new Date(driver.cnhValidity);
            const daysRemaining = Math.ceil((validityDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

            if (daysRemaining < 0) {
                 alerts.push({ id: `d-exp-${driver.id}`, title: driver.name, message: `CNH vencida há ${Math.abs(daysRemaining)} dia(s).`, type: 'danger' });
            } else if (daysRemaining <= 30) {
                 alerts.push({ id: `d-warn-${driver.id}`, title: driver.name, message: `CNH vence em ${daysRemaining} dia(s).`, type: 'warning' });
            }
        });


        return alerts.sort((a, b) => {
            if (a.type === 'danger' && b.type !== 'danger') return -1;
            if (a.type !== 'danger' && b.type === 'danger') return 1;
            return 0;
        });
    }, [filteredData.contracts, filteredData.refuelings, filteredDrivers]);


    const entityName = entities.find(e => e.id === entityId)?.name || 'Nenhuma entidade selecionada';
    const departmentName = departments.find(d => d.id === currentUser?.departmentId)?.name;
    
    if (loading) {
        return <Card><p>Carregando dados do dashboard...</p></Card>;
    }

    if (!entityId || !currentUser) {
        return <Card><p>Por favor, selecione uma entidade para visualizar o dashboard.</p></Card>;
    }

    return (
        <div className="space-y-6">
            <div>
                 <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
                 <p className="text-text-secondary">
                    {currentUser.role === Role.USER && departmentName ? `${entityName} / ${departmentName}` : entityName}
                 </p>
            </div>
           
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Total Gasto (R$)" value={totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>} />
                <StatCard title="Total Consumido (Litros)" value={totalLiters.toLocaleString('pt-BR')} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M12 6V5M12 20v-1M12 16a4 4 0 100-8 4 4 0 000 8z" /></svg>} />
                <StatCard title="Contratos Ativos" value={filteredData.contracts.length.toString()} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <h2 className="text-xl font-semibold mb-4 text-text-primary">Consumo Mensal (Últimos 6 meses)</h2>
                    <div className="h-80">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={consumptionByMonth}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(value: number) => `${value.toLocaleString('pt-BR')} L`} />
                                <Legend />
                                <Bar dataKey="Litros" fill="#1E88E5" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
                <Card>
                    <h2 className="text-xl font-semibold mb-4 text-text-primary">Alertas</h2>
                    <div className="space-y-4 max-h-80 overflow-y-auto">
                        {allAlerts.length > 0 ? (
                           allAlerts.map(alert => (
                                <AlertCard key={alert.id} title={alert.title} message={alert.message} type={alert.type} />
                            ))
                        ) : (
                            <div className="text-center text-text-secondary py-10">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <p className="mt-2">Nenhum alerta no momento.</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;
