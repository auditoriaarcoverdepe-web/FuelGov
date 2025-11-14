import React, { useState, useMemo } from 'react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import Card from './ui/Card';
import Modal from './ui/Modal';
import { useAuth } from '../context/AuthContext';
import { FuelType, Role } from '../types';
import type { Vehicle } from '../types';
import ExportButtons from './ui/ExportButtons';

const VehicleForm: React.FC<{
  vehicle: Partial<Vehicle> | null;
  onSave: (vehicle: Omit<Vehicle, 'id'> | Vehicle) => void;
  onClose: () => void;
}> = ({ vehicle, onSave, onClose }) => {
    const { departments } = useSupabaseData();
    const { currentUser } = useAuth();

    const availableDepartments = useMemo(() => {
         if (!currentUser) return [];
         if (currentUser.role === Role.ADMIN) return departments;
         if (currentUser.role === Role.CONTROLLER) return departments.filter(d => d.entity_id === currentUser.entity_id);
         if (currentUser.role === Role.USER) return departments.filter(d => d.id === currentUser.department_id);
         return [];
    }, [departments, currentUser]);

    const [formData, setFormData] = useState({
        plate: vehicle?.plate || '',
        model: vehicle?.model || '',
        year: vehicle?.year || new Date().getFullYear(),
        fuel_type: vehicle?.fuel_type || FuelType.GASOLINE,
        department_id: vehicle?.department_id || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'year' ? (parseInt(value) || new Date().getFullYear()) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...vehicle, ...formData } as Omit<Vehicle, 'id'> | Vehicle);
    };

    return (
         <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Placa</label>
                    <input type="text" name="plate" value={formData.plate} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Modelo</label>
                    <input type="text" name="model" value={formData.model} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Ano</label>
                    <input type="number" name="year" value={formData.year} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo de Combustível</label>
                    <select name="fuel_type" value={formData.fuel_type} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                        {Object.values(FuelType).map(ft => <option key={ft} value={ft}>{ft}</option>)}
                    </select>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Órgão Vinculado</label>
                    <select name="department_id" value={formData.department_id} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" disabled={availableDepartments.length === 0}>
                        <option value="" disabled>-- Selecione um órgão --</option>
                        {availableDepartments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    {availableDepartments.length === 0 && (
                        <p className="mt-2 text-sm text-danger">Nenhum órgão disponível. Verifique o cadastro de órgãos ou as permissões do usuário.</p>
                    )}
                </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed" disabled={!formData.department_id}>Salvar</button>
            </div>
        </form>
    );
};


const VehicleManagement: React.FC = () => {
    const { vehicles, departments, addVehicle, updateVehicle, deleteVehicle, loading } = useSupabaseData();
    const { currentUser } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

    if (loading) {
        return <Card><p>Carregando dados...</p></Card>;
    }

    if (!currentUser) {
        return <Card><p>Carregando dados do usuário...</p></Card>;
    }

    const canEdit = currentUser.role === Role.ADMIN || currentUser.role === Role.USER;

    const filteredVehicles = useMemo(() => {
        if (currentUser.role === Role.ADMIN) return vehicles;

        const userEntityDepartments = departments.filter(d => d.entity_id === currentUser.entity_id).map(d => d.id);
        
        if (currentUser.role === Role.CONTROLLER) {
            return vehicles.filter(v => userEntityDepartments.includes(v.department_id));
        }
        
        if (currentUser.role === Role.USER && currentUser.department_id) {
            return vehicles.filter(v => v.department_id === currentUser.department_id);
        }

        return [];
    }, [currentUser, vehicles, departments]);
    
    const handleSave = (vehicle: Omit<Vehicle, 'id'> | Vehicle) => {
        if ('id' in vehicle) {
            updateVehicle(vehicle);
        } else {
            addVehicle(vehicle);
        }
        setIsModalOpen(false);
        setEditingVehicle(null);
    };

    const handleEdit = (vehicle: Vehicle) => {
        setEditingVehicle(vehicle);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setEditingVehicle(null);
        setIsModalOpen(true);
    };

    const exportColumns = [
        { header: 'Placa', accessor: 'plate' as const },
        { header: 'Modelo', accessor: 'model' as const },
        { header: 'Ano', accessor: 'year' as const },
        { header: 'Combustível', accessor: 'fuel_type' as const },
        { header: 'Órgão', accessor: (v: Vehicle) => departments.find(d => d.id === v.department_id)?.name || 'N/A' }
    ];
    
    return (
        <Card>
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                <h1 className="text-2xl font-bold">Gestão de Veículos</h1>
                <div className="flex items-center space-x-2">
                    <ExportButtons data={filteredVehicles} columns={exportColumns} filenamePrefix="Veiculos" />
                    {canEdit && <button onClick={handleAddNew} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">Adicionar Veículo</button>}
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Placa</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modelo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Combustível</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Órgão</th>
                             {canEdit && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredVehicles.map(v => (
                            <tr key={v.id}>
                                <td className="px-6 py-4 whitespace-nowrap">{v.plate}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{v.model} ({v.year})</td>
                                <td className="px-6 py-4 whitespace-nowrap">{v.fuel_type}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{departments.find(d => d.id === v.department_id)?.name || 'N/A'}</td>
                                {canEdit && (
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end space-x-3">
                                            <button onClick={() => handleEdit(v)} className="text-indigo-600 hover:text-indigo-900" title="Editar Veículo">
                                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" />
                                                </svg>
                                            </button>
                                            <button onClick={() => deleteVehicle(v.id)} className="text-danger hover:text-red-800" title="Excluir Veículo">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingVehicle ? "Editar Veículo" : "Adicionar Veículo"}>
                <VehicleForm 
                    vehicle={editingVehicle}
                    onSave={handleSave}
                    onClose={() => setIsModalOpen(false)}
                />
            </Modal>
        </Card>
    );
};

export default VehicleManagement;