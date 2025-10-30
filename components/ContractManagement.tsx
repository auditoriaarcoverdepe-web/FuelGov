

import React, { useState, useMemo } from 'react';
import { useMockData } from '../hooks/useMockData';
import Card from './ui/Card';
import Modal from './ui/Modal';
import { useAuth } from '../context/AuthContext';
import { Role, FuelType } from '../types';
import type { Contract, ContractItem, Refueling, Vehicle, ContractAdditive } from '../types';
import ExportButtons from './ui/ExportButtons';

const AdditiveForm: React.FC<{
    additive: Partial<ContractAdditive> | null;
    onSave: (additive: Omit<ContractAdditive, 'id'> | ContractAdditive) => void;
    onClose: () => void;
}> = ({ additive, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        description: additive?.description || '',
        date: additive?.date || '',
        newEndDate: additive?.newEndDate || '',
        items: additive?.items || [{ fuelType: FuelType.GASOLINE, quantityLiters: 0, unitPrice: 0 }],
    });

    const handleItemChange = (index: number, field: keyof ContractItem, value: string | number) => {
        const newItems = [...formData.items];
        const currentItem = { ...newItems[index] };
        
        if (field === 'fuelType') {
            currentItem.fuelType = value as FuelType;
        } else {
            currentItem[field] = Number(value);
        }
        
        newItems[index] = currentItem;
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const addItem = () => {
        setFormData(prev => ({ ...prev, items: [...prev.items, { fuelType: FuelType.GASOLINE, quantityLiters: 0, unitPrice: 0 }] }));
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
                    <input type="date" value={formData.newEndDate} onChange={e => setFormData(p => ({...p, newEndDate: e.target.value}))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                </div>
            </div>

            <h3 className="text-md font-medium border-t pt-4">Itens do Aditivo</h3>
             {formData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end p-2 border rounded-md">
                    <div className="md:col-span-2">
                        <label className="text-xs font-medium">Combustível</label>
                        <select value={item.fuelType} onChange={e => handleItemChange(index, 'fuelType', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm">
                            {Object.values(FuelType).map(ft => <option key={ft} value={ft}>{ft}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium">Qtd (Litros)</label>
                        <input type="number" step="0.01" value={item.quantityLiters} onChange={e => handleItemChange(index, 'quantityLiters', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm" />
                    </div>
                     <div>
                        <label className="text-xs font-medium">Preço Unit.</label>
                        <input type="number" step="0.01" value={item.unitPrice} onChange={e => handleItemChange(index, 'unitPrice', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm" />
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
    const { departments } = useMockData();
    const { currentUser } = useAuth();
    
    const availableDepartments = useMemo(() => {
        if (currentUser.role === Role.ADMIN) return departments;
        if (currentUser.role === Role.CONTROLLER) return departments.filter(d => d.entityId === currentUser.entityId);
        if (currentUser.role === Role.USER) return departments.filter(d => d.id === currentUser.departmentId);
        return [];
    }, [departments, currentUser]);

    const [formData, setFormData] = useState({
        supplier: contract?.supplier || '',
        startDate: contract?.startDate || '',
        endDate: contract?.endDate || '',
        departmentId: contract?.departmentId || (availableDepartments.length > 0 ? availableDepartments[0].id : ''),
        items: contract?.items || [{ fuelType: FuelType.GASOLINE, quantityLiters: 0, unitPrice: 0 }],
        additives: contract?.additives || [],
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
        
        if (field === 'fuelType') {
            currentItem.fuelType = value as FuelType;
        } else {
            currentItem[field] = Number(value);
        }
        
        newItems[index] = currentItem;
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { fuelType: FuelType.GASOLINE, quantityLiters: 0, unitPrice: 0 }]
        }));
    };

    const removeItem = (index: number) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const handleSaveAdditive = (additive: ContractAdditive) => {
        const newAdditives = [...formData.additives];
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
        setFormData(prev => ({ ...prev, additives: prev.additives.filter((_, i) => i !== index) }));
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
                        <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Data Fim</label>
                        <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium">Órgão Vinculado</label>
                        <select name="departmentId" value={formData.departmentId} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                            {availableDepartments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                </div>
                
                <h3 className="text-lg font-medium border-t pt-4 mt-4">Itens Iniciais do Contrato</h3>
                {formData.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end p-2 border rounded-md">
                        <div className="md:col-span-2">
                            <label className="text-xs font-medium">Combustível</label>
                            <select value={item.fuelType} onChange={e => handleItemChange(index, 'fuelType', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm">
                                {Object.values(FuelType).map(ft => <option key={ft} value={ft}>{ft}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium">Qtd (Litros)</label>
                            <input type="number" step="0.01" value={item.quantityLiters} onChange={e => handleItemChange(index, 'quantityLiters', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm" />
                        </div>
                        <div>
                            <label className="text-xs font-medium">Preço Unit.</label>
                            <input type="number" step="0.01" value={item.unitPrice} onChange={e => handleItemChange(index, 'unitPrice', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm" />
                        </div>
                        {formData.items.length > 1 && (
                            <button type="button" onClick={() => removeItem(index)} className="text-danger hover:text-red-800 text-sm md:col-start-5">Remover</button>
                        )}
                    </div>
                ))}
                <button type="button" onClick={addItem} className="text-sm px-3 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Adicionar Item</button>

                <h3 className="text-lg font-medium border-t pt-4 mt-4">Aditivos do Contrato</h3>
                <div className="space-y-2">
                    {formData.additives.map((additive, index) => (
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

const ProgressBar: React.FC<{
    value: number;
    max: number;
    label: string;
    format: 'currency' | 'liters';
}> = ({ value, max, label, format }) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    const formattedValue = format === 'currency' ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : `${value.toLocaleString('pt-BR')} L`;
    const formattedMax = format === 'currency' ? max.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : `${max.toLocaleString('pt-BR')} L`;

    return (
        <div className="my-2">
            <div className="flex justify-between items-center mb-1 text-sm">
                <span className="font-medium text-text-secondary">{label}</span>
                <span className="text-text-primary font-mono">{percentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-secondary h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
            </div>
            <div className="text-xs text-right text-text-secondary mt-1 font-mono">
                {formattedValue} / {formattedMax}
            </div>
        </div>
    );
}

const ContractInfoCard: React.FC<{
    contract: Contract;
    refuelings: Refueling[];
    vehicles: Vehicle[];
    canEdit: boolean;
    onEdit: () => void;
    onDelete: () => void;
}> = ({ contract, refuelings, vehicles, canEdit, onEdit, onDelete }) => {
    const { departments } = useMockData();

    const contractBalances = useMemo(() => {
        const allItems = [...contract.items, ...(contract.additives?.flatMap(a => a.items) || [])];
        const totalContractValue = allItems.reduce((sum, item) => sum + (item.quantityLiters * item.unitPrice), 0);
        
        const refuelingsForContract = refuelings.filter(r => r.contractId === contract.id);
        const totalSpentValue = refuelingsForContract.reduce((sum, r) => sum + r.totalValue, 0);

        const vehiclesById = new Map<string, Vehicle>(vehicles.map(v => [v.id, v]));
        
        const aggregatedItems = allItems.reduce((acc, item) => {
            if (!acc[item.fuelType]) {
                acc[item.fuelType] = { fuelType: item.fuelType, quantityLiters: 0 };
            }
            acc[item.fuelType].quantityLiters += item.quantityLiters;
            return acc;
        }, {} as Record<FuelType, { fuelType: FuelType; quantityLiters: number }>);
        

        const itemsWithUsage = Object.values(aggregatedItems).map((aggItem: { fuelType: FuelType; quantityLiters: number }) => {
            const usedLiters = refuelingsForContract
                .filter(r => {
                    const fuelUsed = r.fuelType || vehiclesById.get(r.vehicleId)?.fuelType;
                    return fuelUsed === aggItem.fuelType;
                })
                .reduce((sum, r) => sum + r.quantityLiters, 0);
            return { ...aggItem, usedLiters };
        });

        const latestEndDate = contract.additives?.reduce((latest, ad) => ad.newEndDate && new Date(ad.newEndDate) > new Date(latest) ? ad.newEndDate : latest, contract.endDate) || contract.endDate;

        return { totalContractValue, totalSpentValue, itemsWithUsage, latestEndDate };

    }, [contract, refuelings, vehicles]);

    return (
        <Card className="flex flex-col">
            <div className="flex-grow">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-bold text-primary">{contract.supplier}</h3>
                        <p className="text-sm text-text-secondary">{departments.find(d => d.id === contract.departmentId)?.name}</p>
                        <p className="text-xs text-text-secondary font-mono mt-1">
                            {new Date(contract.startDate).toLocaleDateString()} - {new Date(contractBalances.latestEndDate).toLocaleDateString()}
                        </p>
                    </div>
                    {canEdit && (
                        <div className="flex-shrink-0 flex items-center space-x-3">
                             <button onClick={onEdit} className="text-indigo-600 hover:text-indigo-900" title="Editar Contrato">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" />
                                </svg>
                             </button>
                             <button onClick={onDelete} className="text-danger hover:text-red-800" title="Excluir Contrato">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                             </button>
                        </div>
                    )}
                </div>
                <div className="mt-4 border-t pt-2">
                    <h4 className="font-semibold text-text-primary mb-2">Saldos Consolidados do Contrato</h4>
                    {contractBalances.itemsWithUsage.map(item => (
                        <ProgressBar
                            key={item.fuelType}
                            label={item.fuelType}
                            value={item.usedLiters}
                            max={item.quantityLiters}
                            format="liters"
                        />
                    ))}
                     <div className="border-t mt-3 pt-3">
                        <ProgressBar
                            label="Valor Total Consumido"
                            value={contractBalances.totalSpentValue}
                            max={contractBalances.totalContractValue}
                            format="currency"
                        />
                    </div>
                </div>
                {contract.additives && contract.additives.length > 0 && (
                    <div className="mt-4 border-t pt-2">
                        <h4 className="font-semibold text-text-primary mb-2">Aditivos</h4>
                        <ul className="list-disc list-inside text-sm text-text-secondary space-y-1">
                            {contract.additives.map(ad => (
                                <li key={ad.id}>{ad.description} ({new Date(ad.date).toLocaleDateString()})</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </Card>
    )
}

const ContractManagement: React.FC = () => {
    const { contracts, departments, addContract, updateContract, deleteContract, refuelings, vehicles } = useMockData();
    const { currentUser } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingContract, setEditingContract] = useState<Contract | null>(null);

    const canEdit = currentUser.role === Role.ADMIN || currentUser.role === Role.USER;

    const filteredContracts = useMemo(() => {
        if (currentUser.role === Role.ADMIN) return contracts;
        const userEntityDepartments = departments.filter(d => d.entityId === currentUser.entityId).map(d => d.id);
        if (currentUser.role === Role.CONTROLLER) return contracts.filter(c => userEntityDepartments.includes(c.departmentId));
        if (currentUser.role === Role.USER && currentUser.departmentId) return contracts.filter(c => c.departmentId === currentUser.departmentId);
        return [];
    }, [currentUser, contracts, departments]);

    const handleSave = (contract: Omit<Contract, 'id'> | Contract) => {
        if ('id' in contract) updateContract(contract);
        else addContract(contract);
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

    const exportColumns = [
        { header: 'Fornecedor', accessor: 'supplier' as const },
        { header: 'Data Início', accessor: (c: Contract) => new Date(c.startDate).toLocaleDateString() },
        { header: 'Data Fim', accessor: (c: Contract) => new Date(c.endDate).toLocaleDateString() },
        { header: 'Órgão', accessor: (c: Contract) => departments.find(d => d.id === c.departmentId)?.name || 'N/A' },
        { header: 'Itens', accessor: (c: Contract) => c.items.map(item => `${item.quantityLiters}L de ${item.fuelType} @ R$${item.unitPrice}`).join('; ') },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h1 className="text-2xl font-bold">Gestão de Contratos</h1>
                <div className="flex items-center space-x-2">
                    <ExportButtons data={filteredContracts} columns={exportColumns} filenamePrefix="Contratos" />
                    {canEdit && <button onClick={handleAddNew} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">Adicionar Contrato</button>}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredContracts.map(c => (
                    <ContractInfoCard 
                        key={c.id}
                        contract={c}
                        refuelings={refuelings}
                        vehicles={vehicles}
                        canEdit={canEdit}
                        onEdit={() => handleEdit(c)}
                        onDelete={() => deleteContract(c.id)}
                    />
                ))}
            </div>

             <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingContract ? "Editar Contrato" : "Adicionar Contrato"}>
                <ContractForm contract={editingContract} onSave={handleSave} onClose={() => setIsModalOpen(false)} />
            </Modal>
        </div>
    );
};

export default ContractManagement;