

import React, { useState, useMemo } from 'react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import Card from './ui/Card';
import Modal from './ui/Modal';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import type { Driver } from '../types';
import ExportButtons from './ui/ExportButtons';

const DriverForm: React.FC<{
  driver: Partial<Driver> | null;
  onSave: (driver: Omit<Driver, 'id'> | Driver) => void;
  onClose: () => void;
}> = ({ driver, onSave, onClose }) => {
    const { departments } = useSupabaseData();
    const { currentUser } = useAuth();
    
    const availableDepartments = useMemo(() => {
        if (currentUser.role === Role.ADMIN) return departments;
        if (currentUser.role === Role.CONTROLLER) return departments.filter(d => d.entityId === currentUser.entityId);
        if (currentUser.role === Role.USER) return departments.filter(d => d.id === currentUser.departmentId);
        return [];
    }, [departments, currentUser]);

    const [formData, setFormData] = useState({
        name: driver?.name || '',
        licenseNumber: driver?.licenseNumber || '',
        cnhValidity: driver?.cnhValidity || '',
        departmentId: driver?.departmentId || (availableDepartments.length > 0 ? availableDepartments[0].id : ''),
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...driver, ...formData } as Omit<Driver, 'id'> | Driver);
    };

    return (
         <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Nº da CNH</label>
                    <input type="text" name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Validade da CNH</label>
                    <input type="date" name="cnhValidity" value={formData.cnhValidity} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Órgão Vinculado</label>
                    <select name="departmentId" value={formData.departmentId} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                        {availableDepartments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">Salvar</button>
            </div>
        </form>
    );
};

const DriverManagement: React.FC = () => {
    const { drivers, departments, addDriver, updateDriver, deleteDriver } = useSupabaseData();
    const { currentUser } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

    const canEdit = currentUser.role === Role.ADMIN || currentUser.role === Role.USER;

    const filteredDrivers = useMemo(() => {
        if (currentUser.role === Role.ADMIN) return drivers;
        const userEntityDepartments = departments.filter(d => d.entityId === currentUser.entityId).map(d => d.id);
        if (currentUser.role === Role.CONTROLLER) return drivers.filter(d => userEntityDepartments.includes(d.departmentId));
        if (currentUser.role === Role.USER && currentUser.departmentId) return drivers.filter(d => d.departmentId === currentUser.departmentId);
        return [];
    }, [currentUser, drivers, departments]);

    const handleSave = (driver: Omit<Driver, 'id'> | Driver) => {
        if ('id' in driver) {
            updateDriver(driver);
        } else {
            addDriver(driver);
        }
        setIsModalOpen(false);
        setEditingDriver(null);
    };

    const handleEdit = (driver: Driver) => {
        setEditingDriver(driver);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setEditingDriver(null);
        setIsModalOpen(true);
    };

    const exportColumns = [
        { header: 'Nome', accessor: 'name' as const },
        { header: 'CNH', accessor: 'licenseNumber' as const },
        { header: 'Validade CNH', accessor: (d: Driver) => new Date(d.cnhValidity).toLocaleDateString() },
        { header: 'Órgão', accessor: (d: Driver) => departments.find(dep => dep.id === d.departmentId)?.name || 'N/A' },
    ];

    return (
        <Card>
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                <h1 className="text-2xl font-bold">Gestão de Motoristas</h1>
                <div className="flex items-center space-x-2">
                    <ExportButtons data={filteredDrivers} columns={exportColumns} filenamePrefix="Motoristas" />
                    {canEdit && <button onClick={handleAddNew} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">Adicionar Motorista</button>}
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CNH</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Validade CNH</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Órgão</th>
                            {canEdit && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredDrivers.map(d => (
                            <tr key={d.id}>
                                <td className="px-6 py-4 whitespace-nowrap">{d.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{d.licenseNumber}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{new Date(d.cnhValidity).toLocaleDateString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{departments.find(dep => dep.id === d.departmentId)?.name || 'N/A'}</td>
                                {canEdit && (
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end space-x-3">
                                            <button onClick={() => handleEdit(d)} className="text-indigo-600 hover:text-indigo-900" title="Editar Motorista">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" />
                                                </svg>
                                            </button>
                                            <button onClick={() => deleteDriver(d.id)} className="text-danger hover:text-red-800" title="Excluir Motorista">
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
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingDriver ? "Editar Motorista" : "Adicionar Motorista"}>
                <DriverForm 
                    driver={editingDriver}
                    onSave={handleSave}
                    onClose={() => setIsModalOpen(false)}
                />
            </Modal>
        </Card>
    );
};

export default DriverManagement;
