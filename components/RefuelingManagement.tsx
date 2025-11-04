

import React, { useState, useMemo } from 'react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import Card from './ui/Card';
import Modal from './ui/Modal';
import { useAuth } from '../context/AuthContext';
import { Role, FuelType } from '../types';
import type { Refueling, Vehicle, Contract, Driver } from '../types';
import ExportButtons from './ui/ExportButtons';
import ConsumptionAnalytics from './ui/ConsumptionAnalytics';

const RefuelingForm: React.FC<{
  refueling: Partial<Refueling> | null;
  onSave: (refueling: Omit<Refueling, 'id'> | Refueling) => void;
  onClose: () => void;
  vehicles: Vehicle[];
  drivers: Driver[];
  contracts: Contract[];
}> = ({ refueling, onSave, onClose, vehicles, drivers, contracts }) => {
    const [formData, setFormData] = useState({
        vehicleId: refueling?.vehicleId || '',
        driverId: refueling?.driverId || '',
        contractId: refueling?.contractId || '',
        date: refueling?.date ? new Date(refueling.date).toISOString().substring(0, 16) : new Date().toISOString().substring(0, 16),
        invoice: refueling?.invoice || '',
        quantityLiters: refueling?.quantityLiters || 0,
        totalValue: refueling?.totalValue || 0,
        previousOdometer: refueling?.previousOdometer || 0,
        currentOdometer: refueling?.currentOdometer || 0,
        fuelType: refueling?.fuelType,
    });
    
    const selectedVehicle = useMemo(() => 
        vehicles.find(v => v.id === formData.vehicleId),
        [formData.vehicleId, vehicles]
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const numericFields = ['quantityLiters', 'totalValue', 'previousOdometer', 'currentOdometer'];
        const processedValue = numericFields.includes(name) ? (parseFloat(value) || 0) : value;
        const newFormData = { ...formData, [name]: processedValue };
        
        if (name === 'vehicleId') {
            const newSelectedVehicle = vehicles.find(v => v.id === value);
            if (newSelectedVehicle?.fuelType !== FuelType.FLEX) {
                newFormData.fuelType = undefined;
            }
        }

        setFormData(newFormData);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const submissionData = {
            ...formData,
            date: new Date(formData.date).toISOString()
        };
        onSave({ ...refueling, ...submissionData } as Omit<Refueling, 'id'> | Refueling);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium">Veículo</label>
                    <select name="vehicleId" value={formData.vehicleId} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                        <option value="">Selecione...</option>
                        {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate} - {v.model}</option>)}
                    </select>
                </div>
                {selectedVehicle?.fuelType === FuelType.FLEX && (
                     <div>
                        <label className="block text-sm font-medium">Tipo de Combustível (FLEX)</label>
                        <select name="fuelType" value={formData.fuelType || ''} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                            <option value="">Selecione...</option>
                            <option value={FuelType.GASOLINE}>Gasolina Comum</option>
                            <option value={FuelType.ETHANOL}>Etanol</option>
                        </select>
                    </div>
                )}
                 <div>
                    <label className="block text-sm font-medium">Motorista</label>
                    <select name="driverId" value={formData.driverId} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                        <option value="">Selecione...</option>
                        {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                </div>
                 <div className="md:col-span-2">
                    <label className="block text-sm font-medium">Contrato</label>
                    <select name="contractId" value={formData.contractId} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                        <option value="">Selecione...</option>
                        {contracts.map(c => <option key={c.id} value={c.id}>{c.supplier}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium">Data e Hora</label>
                    <input type="datetime-local" name="date" value={formData.date} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                </div>
                <div>
                    <label className="block text-sm font-medium">Cupom Fiscal</label>
                    <input type="text" name="invoice" value={formData.invoice} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                </div>
                <div>
                    <label className="block text-sm font-medium">Hodômetro Anterior</label>
                    <input type="number" name="previousOdometer" value={formData.previousOdometer} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                </div>
                <div>
                    <label className="block text-sm font-medium">Hodômetro Atual</label>
                    <input type="number" name="currentOdometer" value={formData.currentOdometer} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                </div>
                <div>
                    <label className="block text-sm font-medium">Quantidade (L)</label>
                    <input type="number" step="0.01" name="quantityLiters" value={formData.quantityLiters} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                </div>
                <div>
                    <label className="block text-sm font-medium">Valor Total (R$)</label>
                    <input type="number" step="0.01" name="totalValue" value={formData.totalValue} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">Salvar</button>
            </div>
        </form>
    );
};


const RefuelingManagement: React.FC = () => {
    const { refuelings, vehicles, drivers, contracts, departments, addRefueling, updateRefueling, deleteRefueling } = useSupabaseData();
    const { currentUser } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRefueling, setEditingRefueling] = useState<Refueling | null>(null);
    const [showFilters, setShowFilters] = useState(true);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        vehicleId: '',
        driverId: '',
        minLiters: '',
        maxLiters: '',
        minValue: '',
        maxValue: '',
        minKm: '',
        maxKm: '',
    });

    const canEdit = currentUser.role === Role.ADMIN || currentUser.role === Role.USER;

    const userVisibleResources = useMemo(() => {
        if (!currentUser) return { vehicles: [], drivers: [], contracts: [] };

        if (currentUser.role === Role.ADMIN) {
            return { vehicles, drivers, contracts };
        }

        const userEntityDepts = departments.filter(d => d.entityId === currentUser.entityId).map(d => d.id);
        const entityVehicles = vehicles.filter(v => userEntityDepts.includes(v.departmentId));
        const entityDrivers = drivers.filter(d => userEntityDepts.includes(d.departmentId));
        const entityContracts = contracts.filter(c => userEntityDepts.includes(c.departmentId));

        if (currentUser.role === Role.CONTROLLER) {
            return { vehicles: entityVehicles, drivers: entityDrivers, contracts: entityContracts };
        }

        if (currentUser.role === Role.USER && currentUser.departmentId) {
            const deptId = currentUser.departmentId;
            return {
                vehicles: vehicles.filter(v => v.departmentId === deptId),
                drivers: drivers.filter(d => d.departmentId === deptId),
                contracts: contracts.filter(c => c.departmentId === deptId)
            };
        }
        return { vehicles: [], drivers: [], contracts: [] };
    }, [currentUser, vehicles, drivers, contracts, departments]);


    const filteredRefuelings = useMemo(() => {
        let data: Refueling[];

        if (!currentUser) return [];

        if (currentUser.role === Role.ADMIN) {
            data = refuelings;
        } else {
            const visibleContractIds = userVisibleResources.contracts.map(c => c.id);
            data = refuelings.filter(r => visibleContractIds.includes(r.contractId));
        }
        
        return data.filter(r => {
            const kmRodado = r.currentOdometer - r.previousOdometer;
            if (filters.startDate && new Date(r.date) < new Date(filters.startDate)) return false;
            if (filters.endDate && new Date(r.date) > new Date(filters.endDate)) return false;
            if (filters.vehicleId && r.vehicleId !== filters.vehicleId) return false;
            if (filters.driverId && r.driverId !== filters.driverId) return false;
            if (filters.minLiters && r.quantityLiters < parseFloat(filters.minLiters)) return false;
            if (filters.maxLiters && r.quantityLiters > parseFloat(filters.maxLiters)) return false;
            if (filters.minValue && r.totalValue < parseFloat(filters.minValue)) return false;
            if (filters.maxValue && r.totalValue > parseFloat(filters.maxValue)) return false;
            if (filters.minKm && kmRodado < parseFloat(filters.minKm)) return false;
            if (filters.maxKm && kmRodado > parseFloat(filters.maxKm)) return false;
            return true;
        });

    }, [currentUser, refuelings, userVisibleResources.contracts, filters]);
    
    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const clearFilters = () => {
        setFilters({
            startDate: '', endDate: '', vehicleId: '', driverId: '',
            minLiters: '', maxLiters: '', minValue: '', maxValue: '', minKm: '', maxKm: '',
        });
    };

    const handleSave = (refueling: Omit<Refueling, 'id'> | Refueling) => {
        if ('id' in refueling) updateRefueling(refueling);
        else addRefueling(refueling);
        setIsModalOpen(false);
        setEditingRefueling(null);
    };

    const handleEdit = (refueling: Refueling) => { setEditingRefueling(refueling); setIsModalOpen(true); };
    const handleAddNew = () => { setEditingRefueling(null); setIsModalOpen(true); };

    const exportColumns = [
        { header: 'Data', accessor: (r: Refueling) => new Date(r.date).toLocaleString() },
        { header: 'Veículo', accessor: (r: Refueling) => vehicles.find(v => v.id === r.vehicleId)?.plate || 'N/A' },
        { header: 'Motorista', accessor: (r: Refueling) => drivers.find(d => d.id === r.driverId)?.name || 'N/A' },
        { header: 'Km Rodado', accessor: (r: Refueling) => (r.currentOdometer > 0 && r.previousOdometer > 0 ? r.currentOdometer - r.previousOdometer : 0).toLocaleString('pt-BR') },
        { header: 'Qtd (L)', accessor: (r: Refueling) => r.quantityLiters.toFixed(2) },
        { header: 'Valor Abastecimento (R$)', accessor: (r: Refueling) => r.totalValue.toFixed(2) },
        { header: 'Fornecedor Contrato', accessor: (r: Refueling) => contracts.find(c => c.id === r.contractId)?.supplier || 'N/A' },
        { 
            header: 'Valor Total Contrato (R$)', 
            accessor: (r: Refueling) => {
                const contract = contracts.find(c => c.id === r.contractId);
                if (!contract) return '0.00';
                const totalValue = contract.items.reduce((sum, item) => sum + (item.quantityLiters * item.unitPrice), 0);
                return totalValue.toFixed(2);
            }
        },
        {
            header: 'Valor Gasto Contrato (R$)',
            accessor: (r: Refueling) => {
                const contract = contracts.find(c => c.id === r.contractId);
                if (!contract) return '0.00';
                const totalSpent = refuelings
                    .filter(ref => ref.contractId === contract.id)
                    .reduce((sum, ref) => sum + ref.totalValue, 0);
                return totalSpent.toFixed(2);
            }
        }
    ];

    return (
        <div className="space-y-6">
            <Card>
                <div className="flex justify-between items-center cursor-pointer" onClick={() => setShowFilters(!showFilters)}>
                    <h2 className="text-xl font-semibold">Filtros e Relatórios</h2>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-transform ${showFilters ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
                 {showFilters && (
                    <div className="mt-4 pt-4 border-t">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="text-sm font-medium">Período</label>
                                <div className="flex items-center space-x-2 mt-1">
                                    <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="w-full rounded-md border-gray-300 shadow-sm text-sm" />
                                    <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="w-full rounded-md border-gray-300 shadow-sm text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Veículo</label>
                                <select name="vehicleId" value={filters.vehicleId} onChange={handleFilterChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"><option value="">Todos</option>{userVisibleResources.vehicles.map(v => <option key={v.id} value={v.id}>{v.plate} - {v.model}</option>)}</select>
                            </div>
                             <div>
                                <label className="text-sm font-medium">Motorista</label>
                                <select name="driverId" value={filters.driverId} onChange={handleFilterChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"><option value="">Todos</option>{userVisibleResources.drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
                            </div>
                             <div>
                                <label className="text-sm font-medium">Km Rodado</label>
                                <div className="flex items-center space-x-2 mt-1">
                                    <input type="number" name="minKm" placeholder="Min" value={filters.minKm} onChange={handleFilterChange} className="w-full rounded-md border-gray-300 shadow-sm text-sm" />
                                    <input type="number" name="maxKm" placeholder="Max" value={filters.maxKm} onChange={handleFilterChange} className="w-full rounded-md border-gray-300 shadow-sm text-sm" />
                                </div>
                            </div>
                             <div>
                                <label className="text-sm font-medium">Qtd (L)</label>
                                <div className="flex items-center space-x-2 mt-1">
                                    <input type="number" name="minLiters" placeholder="Min" value={filters.minLiters} onChange={handleFilterChange} className="w-full rounded-md border-gray-300 shadow-sm text-sm" />
                                    <input type="number" name="maxLiters" placeholder="Max" value={filters.maxLiters} onChange={handleFilterChange} className="w-full rounded-md border-gray-300 shadow-sm text-sm" />
                                </div>
                            </div>
                             <div>
                                <label className="text-sm font-medium">Valor (R$)</label>
                                <div className="flex items-center space-x-2 mt-1">
                                    <input type="number" name="minValue" placeholder="Min" value={filters.minValue} onChange={handleFilterChange} className="w-full rounded-md border-gray-300 shadow-sm text-sm" />
                                    <input type="number" name="maxValue" placeholder="Max" value={filters.maxValue} onChange={handleFilterChange} className="w-full rounded-md border-gray-300 shadow-sm text-sm" />
                                </div>
                            </div>
                             <div className="col-span-full md:col-span-2 lg:col-span-4 flex justify-end">
                                <button onClick={clearFilters} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Limpar Filtros</button>
                            </div>
                        </div>
                    </div>
                )}
            </Card>

            <ConsumptionAnalytics refuelings={filteredRefuelings} vehicles={vehicles} />

            <Card>
                <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                    <h1 className="text-2xl font-bold">Lançamentos de Abastecimentos</h1>
                    <div className="flex items-center space-x-2">
                        <ExportButtons data={filteredRefuelings} columns={exportColumns} filenamePrefix="Abastecimentos_Filtrados" />
                        {canEdit && <button onClick={handleAddNew} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">Adicionar Lançamento</button>}
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Data</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Veículo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Motorista</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Km Rodado</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Qtd (L)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Valor (R$)</th>
                                {canEdit && <th className="px-6 py-3 text-right text-xs font-medium uppercase">Ações</th>}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredRefuelings.map(r => {
                                const vehicle = vehicles.find(v => v.id === r.vehicleId);
                                const driver = drivers.find(d => d.id === r.driverId);
                                const kmRodado = r.currentOdometer > 0 && r.previousOdometer > 0 ? r.currentOdometer - r.previousOdometer : 0;
                                return (
                                    <tr key={r.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">{new Date(r.date).toLocaleString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{vehicle?.plate || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{driver?.name || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{kmRodado > 0 ? kmRodado.toLocaleString('pt-BR') : 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{r.quantityLiters.toFixed(2)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{r.totalValue.toFixed(2)}</td>
                                        {canEdit && (
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end space-x-3">
                                                    <button onClick={() => handleEdit(r)} className="text-indigo-600 hover:text-indigo-900" title="Editar Lançamento">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" />
                                                        </svg>
                                                    </button>
                                                    <button onClick={() => deleteRefueling(r.id)} className="text-danger hover:text-red-800" title="Excluir Lançamento">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingRefueling ? "Editar Abastecimento" : "Adicionar Abastecimento"}>
                <RefuelingForm 
                  refueling={editingRefueling} 
                  onSave={handleSave} 
                  onClose={() => setIsModalOpen(false)}
                  vehicles={userVisibleResources.vehicles}
                  drivers={userVisibleResources.drivers}
                  contracts={userVisibleResources.contracts}
                />
            </Modal>
        </div>
    );
};

export default RefuelingManagement;
