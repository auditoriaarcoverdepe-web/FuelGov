import React, { useState, useMemo } from 'react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import Card from './ui/Card';
import Modal from './ui/Modal';
import { useAuth } from '../context/AuthContext';
import { Role, FuelType } from '../types';
import type { Contract, ContractItem, ContractAdditive } from '../types';
import ExportButtons from './ui/ExportButtons';

const AdditiveForm: React.FC<{
    additive: Partial<ContractAdditive> | null;
    onSave: (additive: Omit<ContractAdditive, 'id'> | ContractAdditive) => void;
    onClose: () => void;
}> = ({ additive, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        description: additive?.description || '',
        date: additive?.date || '',
        new_end_date: additive?.new_end_date || '',
        items: Array.isArray(additive?.items) ? additive.items : [{ fuel_type: FuelType.GASOLINE, quantity_liters: 0, unit_price: 0 }],
    });

    const handleItemChange = (index: number, field: keyof ContractItem, value: string | number) => {
        const newItems = [...formData.items];
        const currentItem = { ...newItems[index] };
        
        if (field === 'fuel_type') {
            currentItem.fuel_type = value as FuelType;
        } else {
            (currentItem as any)[field] = Number(value);
        }
        
        newItems[index] = currentItem;
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const addItem = () => {
        setFormData(prev => ({ ...prev, items: [...prev.items, { fuel_type: FuelType.GASOLINE, quantity_liters: 0, unit_price: 0 }] }));
    };
    
    const removeItem = (index: number) => {
        setFormData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...additive, ...formData, id: additive?.id || new Date().toISOString() } as ContractAdditive);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium">Descrição</label>
                <input type="text" value={formData.description} onChange={e => setFormData(p => ({...p, description: e.target.value}))} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium">Data do Aditivo</label>
                    <input type="date" value={formData.date} onChange={e => setFormData(p => ({...p, date: e.target.value}))} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                </div>
                <div>
                    <label className="block text-sm font-medium">Nova Data de Fim (Opcional)</label>
                    <input type="date" value={formData.new_end_date} onChange={e => setFormData(p => ({...p, new_end_date: e.target.value}))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                </div>
            </div>

            <h3 className="text-md font-medium border-t pt-4">Itens do Aditivo</h3>
             {formData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end p-2 border rounded-md">
                    <div className="md:col-span-2">
                        <label className="text-xs font-medium">Combustível</label>
                        <select value={item.fuel_type} onChange={e => handleItemChange(index, 'fuel_type', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm">
                            {Object.values(FuelType).map(ft => <option key={ft} value={ft}>{ft}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium">Qtd (Litros)</label>
                        <input type="number" step="0.01" value={item.quantity_liters} onChange={e => handleItemChange(index, 'quantity_liters', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm" />
                    </div>
                     <div>
                        <label className="text-xs font-medium">Preço Unit.</label>
                        <input type="number" step="0.01" value={item.unit_price} onChange={e => handleItemChange(index, 'unit_price', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm" />
                    </div>
                    {formData.items.length > 1 && (
                         <button type="button" onClick={() => removeItem(index)} className="text-danger hover:text-red-800 text-sm md:col-start-5">Remover</button>
                    )}
                </div>
            ))}
            <button type="button" onClick={addItem} className="text-sm px-3 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Adicionar Item</button>

            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">Salvar Aditivo</button>
            </div>
        </form>
    )
}

const ContractForm: React.FC<{
  contract: Partial<Contract> | null;
  onSave: (contract: Omit<Contract, 'id'> | Contract) => void;
  onClose: () => void;
}> = ({ contract, onSave, onClose }) => {
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
        supplier: contract?.supplier || '',
        start_date: contract?.start_date || '',
        end_date: contract?.end_date || '',
        department_id: contract?.department_id || (availableDepartments.length > 0 ? availableDepartments[0].id : ''),
        items: Array.isArray(contract?.items) ? contract.items : [{ fuel_type: FuelType.GASOLINE, quantity_liters: 0, unit_price: 0 }],
        additives: Array.isArray(contract?.additives) ? contract.additives : [],
    });

    const [isAdditiveModalOpen, setIsAdditiveModalOpen] = useState(false);
    const [editingAdditive, setEditingAdditive] = useState<{ additive: Partial<ContractAdditive>; index: number } | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleItemChange = (index: number, field: keyof ContractItem, value: string | number) => {
        const newItems = [...formData.items];
        const currentItem = { ...newItems[index] };
        
        if (field === 'fuel_type') {
            currentItem.fuel_type = value as FuelType;
        } else {
            (currentItem as any)[field] = Number(value);
        }
        
        newItems[index] = currentItem;
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { fuel_type: FuelType.GASOLINE, quantity_liters: 0, unit_price: 0 }]
        }));
    };

    const removeItem = (index: number) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const handleSaveAdditive = (additive: ContractAdditive) => {
        const newAdditives = [...(formData.additives || [])];
        if (editingAdditive !== null) {
            newAdditives[editingAdditive.index] = additive;
        } else {
            newAdditives.push(additive);
        }
        setFormData(prev => ({ ...prev, additives: newAdditives }));
        setIsAdditiveModalOpen(false);
        setEditingAdditive(null);
    };

    const handleEditAdditive = (additive: ContractAdditive, index: number) => {
        setEditingAdditive({ additive, index });
        setIsAdditiveModalOpen(true);
    };

    const handleRemoveAdditive = (index: number) => {
        setFormData(prev => ({ ...prev, additives: (prev.additives || []).filter((_, i) => i !== index) }));
    };

    const handleAddNewAdditive = () => {
        setEditingAdditive(null);
        setIsAdditiveModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...contract, ...formData } as Omit<Contract, 'id'> | Contract);
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium">Fornecedor</label>
                        <input type="text" name="supplier" value={formData.supplier} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Data Início</label>
                        <input type="date" name="start_date" value={formData.start_date} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Data Fim</label>
                        <input type="date" name="end_date" value={formData.end_date} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium">Órgão Vinculado</label>
                        <select name="department_id" value={formData.department_id} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                            {availableDepartments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                </div>
                
                <h3 className="text-lg font-medium border-t pt-4 mt-4">Itens Iniciais do Contrato</h3>
                {formData.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end p-2 border rounded-md">
                        <div className="md:col-span-2">
                            <label className="text-xs font-medium">Combustível</label>
                            <select value={item.fuel_type} onChange={e => handleItemChange(index, 'fuel_type', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm">
                                {Object.values(FuelType).map(ft => <option key={ft} value={ft}>{ft}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium">Qtd (Litros)</label>
                            <input type="number" step="0.01" value={item.quantity_liters} onChange={e => handleItemChange(index, 'quantity_liters', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm" />
                        </div>
                        <div>
                            <label className="text-xs font-medium">Preço Unit.</label>
                            <input type="number" step="0.01" value={item.unit_price} onChange={e => handleItemChange(index, 'unit_price', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm" />
                        </div>
                        {formData.items.length > 1 && (
                            <button type="button" onClick={() => removeItem(index)} className="text-danger hover:text-red-800 text-sm md:col-start-5">Remover</button>
                        )}
                    </div>
                ))}
                <button type="button" onClick={addItem} className="text-sm px-3 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Adicionar Item</button>

                <h3 className="text-lg font-medium border-t pt-4 mt-4">Aditivos do Contrato</h3>
                <div className="space-y-2">
                    {formData.additives && formData.additives.map((additive, index) => (
                         <div key={additive.id} className="flex justify-between items-center p-2 border rounded-md bg-gray-50">
                            <div>
                                <p className="font-semibold text-sm">{additive.description}</p>
                                <p className="text-xs text-gray-500">Data: {new Date(additive.date).toLocaleDateString()}</p>
                            </div>
                            <div className="space-x-2">
                                <button type="button" onClick={() => handleEditAdditive(additive, index)} className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">Editar</button>
                                <button type="button" onClick={() => handleRemoveAdditive(index)} className="text-danger hover:text-red-800 text-sm font-medium">Remover</button>
                            </div>
                         </div>
                    ))}
                </div>
                <button type="button" onClick={handleAddNewAdditive} className="text-sm px-3 py-1 bg-secondary text-white rounded-md hover:bg-secondary/90">Adicionar Aditivo</button>


                <div className="flex justify-end space-x-2 pt-4 border-t mt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">Salvar Contrato</button>
                </div>
            </form>
            <Modal isOpen={isAdditiveModalOpen} onClose={() => setIsAdditiveModalOpen(false)} title={editingAdditive ? "Editar Aditivo" : "Adicionar Aditivo"}>
                <AdditiveForm
                    additive={editingAdditive?.additive || null}
                    onSave={handleSaveAdditive}
                    onClose={() => setIsAdditiveModalOpen(false)}
                />
            </Modal>
        </>
    );
};

const ContractManagement: React.FC = () => {
    const { contracts, departments, addContract, updateContract, deleteContract, loading } = useSupabaseData();
    const { currentUser } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingContract, setEditingContract] = useState<Contract | null>(null);

    if (loading) {
        return <Card><p>Carregando dados...</p></Card>;
    }

    if (!currentUser) {
        return <Card><p>Carregando dados do usuário...</p></Card>;
    }

    const canEdit = currentUser.role === Role.ADMIN || currentUser.role === Role.USER;

    const filteredContracts = useMemo(() => {
        if (!currentUser) return [];
        if (currentUser.role === Role.ADMIN) return contracts;
        const userEntityDepartments = departments.filter(d => d.entity_id === currentUser.entity_id).map(d => d.id);
        if (currentUser.role === Role.CONTROLLER) return contracts.filter(c => userEntityDepartments.includes(c.department_id));
        if (currentUser.role === Role.USER && currentUser.department_id) return contracts.filter(c => c.department_id === currentUser.department_id);
        return [];
    }, [currentUser, contracts, departments]);

    const handleSave = (contract: Omit<Contract, 'id'> | Contract) => {
        if ('id' in contract) {
            updateContract(contract);
        } else {
            addContract(contract);
        }
        setIsModalOpen(false);
        setEditingContract(null);
    };

    const handleEdit = (contract: Contract) => {
        setEditingContract(contract);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setEditingContract(null);
        setIsModalOpen(true);
    };

    const getStatus = (endDate: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        const daysRemaining = Math.ceil((end.getTime() - today.getTime()) / (1000 * 3600 * 24));
        if (daysRemaining < 0) return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-danger/20 text-danger">Expirado</span>;
        if (daysRemaining <= 30) return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-warning/20 text-warning">Expira em {daysRemaining}d</span>;
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-success/20 text-success">Ativo</span>;
    };

    const exportColumns = [
        { header: 'Fornecedor', accessor: 'supplier' as const },
        { header: 'Início', accessor: (c: Contract) => new Date(c.start_date).toLocaleDateString() },
        { header: 'Fim', accessor: (c: Contract) => new Date(c.end_date).toLocaleDateString() },
        { header: 'Órgão', accessor: (c: Contract) => departments.find(d => d.id === c.department_id)?.name || 'N/A' },
    ];

    return (
        <Card>
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                <h1 className="text-2xl font-bold">Gestão de Contratos</h1>
                <div className="flex items-center space-x-2">
                    <ExportButtons data={filteredContracts} columns={exportColumns} filenamePrefix="Contratos" />
                    {canEdit && <button onClick={handleAddNew} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">Adicionar Contrato</button>}
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fornecedor</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vigência</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Órgão</th>
                            {canEdit && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredContracts.map(c => (
                            <tr key={c.id}>
                                <td className="px-6 py-4 whitespace-nowrap">{c.supplier}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{new Date(c.start_date).toLocaleDateString()} - {new Date(c.end_date).toLocaleDateString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{getStatus(c.end_date)}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{departments.find(d => d.id === c.department_id)?.name || 'N/A'}</td>
                                {canEdit && (
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end space-x-3">
                                            <button onClick={() => handleEdit(c)} className="text-indigo-600 hover:text-indigo-900" title="Editar Contrato">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" />
                                                </svg>
                                            </button>
                                            <button onClick={() => deleteContract(c.id)} className="text-danger hover:text-red-800" title="Excluir Contrato">
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
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingContract ? "Editar Contrato" : "Adicionar Contrato"}>
                <ContractForm
                    contract={editingContract}
                    onSave={handleSave}
                    onClose={() => setIsModalOpen(false)}
                />
            </Modal>
        </Card>
    );
};

export default ContractManagement;