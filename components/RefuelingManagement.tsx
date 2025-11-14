import React, { useState, useMemo, useRef } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
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
        vehicle_id: refueling?.vehicle_id || '',
        driver_id: refueling?.driver_id || '',
        contract_id: refueling?.contract_id || '',
        date: refueling?.date ? new Date(refueling.date).toISOString().substring(0, 16) : new Date().toISOString().substring(0, 16),
        invoice: refueling?.invoice || '',
        quantity_liters: refueling?.quantity_liters || 0,
        total_value: refueling?.total_value || 0,
        previous_odometer: refueling?.previous_odometer || 0,
        current_odometer: refueling?.current_odometer || 0,
        fuel_type: refueling?.fuel_type,
    });
    const [isScanning, setIsScanning] = useState(false);
    const [scanError, setScanError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const selectedVehicle = useMemo(() => 
        vehicles.find(v => v.id === formData.vehicle_id),
        [formData.vehicle_id, vehicles]
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const numericFields = ['quantity_liters', 'total_value', 'previous_odometer', 'current_odometer'];
        const processedValue = numericFields.includes(name) ? (parseFloat(value) || 0) : value;
        const newFormData = { ...formData, [name]: processedValue };
        
        if (name === 'vehicle_id') {
            const newSelectedVehicle = vehicles.find(v => v.id === value);
            if (newSelectedVehicle?.fuel_type !== FuelType.FLEX) {
                newFormData.fuel_type = undefined;
            }
        }

        setFormData(newFormData);
    };

    const handleScanReceipt = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsScanning(true);
        setScanError('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

            const fileToGenerativePart = async (file: File) => {
                const base64EncodedDataPromise = new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                    reader.readAsDataURL(file);
                });
                return {
                    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
                };
            };
            
            const imagePart = await fileToGenerativePart(file);

            const prompt = `Analise a imagem deste cupom fiscal de posto de combustível. Extraia as seguintes informações e retorne-as em formato JSON: a quantidade de litros abastecida, o valor total pago, a data do abastecimento (no formato AAAA-MM-DDTHH:mm), e o número do cupom fiscal (COO ou similar). Se uma informação não for encontrada, retorne null para o campo correspondente.`;

            const responseSchema = {
                type: Type.OBJECT,
                properties: {
                    quantity_liters: { type: Type.NUMBER, description: 'Quantidade de combustível em litros. Ex: 45.50' },
                    total_value: { type: Type.NUMBER, description: 'Valor total pago em reais. Ex: 250.30' },
                    date: { type: Type.STRING, description: 'Data e hora do abastecimento no formato AAAA-MM-DDTHH:mm. Ex: 2024-07-28T15:30' },
                    invoice: { type: Type.STRING, description: 'O número do cupom fiscal, COO, ou outro identificador da nota.' },
                },
            };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [imagePart, { text: prompt }] },
                config: {
                    responseMimeType: 'application/json',
                    responseSchema,
                },
            });

            const resultText = response.text.trim();
            const extractedData = JSON.parse(resultText);

            setFormData(prev => ({
                ...prev,
                quantity_liters: extractedData.quantity_liters || prev.quantity_liters,
                total_value: extractedData.total_value || prev.total_value,
                date: extractedData.date || prev.date,
                invoice: extractedData.invoice || prev.invoice,
            }));

        } catch (error) {
            console.error("Error scanning receipt:", error);
            setScanError('Não foi possível processar a imagem. Tente novamente com uma foto mais nítida.');
        } finally {
            setIsScanning(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
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
             <div className="p-4 bg-blue-50 border-b border-gray-200 rounded-t-lg -m-6 mb-4">
                <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-secondary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary disabled:opacity-50"
                    disabled={isScanning}
                    aria-label="Escanear Cupom Fiscal com Inteligência Artificial"
                >
                    {isScanning ? (
                        <>
                           <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                           </svg>
                           Analisando...
                        </>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Escanear Cupom Fiscal com IA
                        </>
                    )}
                </button>
                <input type="file" ref={fileInputRef} onChange={handleScanReceipt} accept="image/*" capture="environment" className="hidden" />
                {scanError && <p className="text-xs text-center text-danger mt-2">{scanError}</p>}
                {!scanError && !isScanning && <p className="text-xs text-center text-gray-500 mt-2">Envie uma foto do cupom para preencher os dados automaticamente.</p>}
            </div>
            
            <fieldset disabled={isScanning} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium">Veículo</label>
                        <select name="vehicle_id" value={formData.vehicle_id} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                            <option value="">Selecione...</option>
                            {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate} - {v.model}</option>)}
                        </select>
                    </div>
                    {selectedVehicle?.fuel_type === FuelType.FLEX && (
                        <div>
                            <label className="block text-sm font-medium">Tipo de Combustível (FLEX)</label>
                            <select name="fuel_type" value={formData.fuel_type || ''} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                                <option value="">Selecione...</option>
                                <option value={FuelType.GASOLINE}>Gasolina Comum</option>
                                <option value={FuelType.ETHANOL}>Etanol</option>
                            </select>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium">Motorista</label>
                        <select name="driver_id" value={formData.driver_id} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                            <option value="">Selecione...</option>
                            {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium">Contrato</label>
                        <select name="contract_id" value={formData.contract_id} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
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
                        <input type="number" name="previous_odometer" value={formData.previous_odometer} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Hodômetro Atual</label>
                        <input type="number" name="current_odometer" value={formData.current_odometer} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Quantidade (L)</label>
                        <input type="number" step="0.01" name="quantity_liters" value={formData.quantity_liters} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Valor Total (R$)</label>
                        <input type="number" step="0.01" name="total_value" value={formData.total_value} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                    </div>
                </div>
            </fieldset>
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onClose} disabled={isScanning} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50">Cancelar</button>
                <button type="submit" disabled={isScanning} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50">Salvar</button>
            </div>
        </form>
    );
};


const RefuelingManagement: React.FC = () => {
    const { refuelings, vehicles, drivers, contracts, departments, addRefueling, updateRefueling, deleteRefueling, loading } = useSupabaseData();
    const { currentUser } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRefueling, setEditingRefueling] = useState<Refueling | null>(null);
    const [showFilters, setShowFilters] = useState(true);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        vehicle_id: '',
        driver_id: '',
        minLiters: '',
        maxLiters: '',
        minValue: '',
        maxValue: '',
        minKm: '',
        maxKm: '',
    });

    if (loading) {
        return <Card><p>Carregando dados...</p></Card>;
    }

    if (!currentUser) {
        return <Card><p>Carregando dados do usuário...</p></Card>;
    }

    const canEdit = currentUser.role === Role.ADMIN || currentUser.role === Role.USER;

    const userVisibleResources = useMemo(() => {
        if (!currentUser) return { vehicles: [], drivers: [], contracts: [] };

        if (currentUser.role === Role.ADMIN) {
            return { vehicles, drivers, contracts };
        }

        const userEntityDepts = departments.filter(d => d.entity_id === currentUser.entity_id).map(d => d.id);
        const entityVehicles = vehicles.filter(v => userEntityDepts.includes(v.department_id));
        const entityDrivers = drivers.filter(d => userEntityDepts.includes(d.department_id));
        const entityContracts = contracts.filter(c => userEntityDepts.includes(c.department_id));

        if (currentUser.role === Role.CONTROLLER) {
            return { vehicles: entityVehicles, drivers: entityDrivers, contracts: entityContracts };
        }

        if (currentUser.role === Role.USER && currentUser.department_id) {
            const deptId = currentUser.department_id;
            return {
                vehicles: vehicles.filter(v => v.department_id === deptId),
                drivers: drivers.filter(d => d.department_id === deptId),
                contracts: contracts.filter(c => c.department_id === deptId)
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
            data = refuelings.filter(r => visibleContractIds.includes(r.contract_id));
        }
        
        return data.filter(r => {
            const kmRodado = r.current_odometer - r.previous_odometer;
            if (filters.startDate && new Date(r.date) < new Date(filters.startDate)) return false;
            if (filters.endDate && new Date(r.date) > new Date(filters.endDate)) return false;
            if (filters.vehicle_id && r.vehicle_id !== filters.vehicle_id) return false;
            if (filters.driver_id && r.driver_id !== filters.driver_id) return false;
            if (filters.minLiters && r.quantity_liters < parseFloat(filters.minLiters)) return false;
            if (filters.maxLiters && r.quantity_liters > parseFloat(filters.maxLiters)) return false;
            if (filters.minValue && r.total_value < parseFloat(filters.minValue)) return false;
            if (filters.maxValue && r.total_value > parseFloat(filters.maxValue)) return false;
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
            startDate: '', endDate: '', vehicle_id: '', driver_id: '',
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
        { header: 'Veículo', accessor: (r: Refueling) => vehicles.find(v => v.id === r.vehicle_id)?.plate || 'N/A' },
        { header: 'Motorista', accessor: (r: Refueling) => drivers.find(d => d.id === r.driver_id)?.name || 'N/A' },
        { header: 'Km Rodado', accessor: (r: Refueling) => (r.current_odometer > 0 && r.previous_odometer > 0 ? r.current_odometer - r.previous_odometer : 0).toLocaleString('pt-BR') },
        { header: 'Qtd (L)', accessor: (r: Refueling) => r.quantity_liters.toFixed(2) },
        { header: 'Valor Abastecimento (R$)', accessor: (r: Refueling) => r.total_value.toFixed(2) },
        { header: 'Fornecedor Contrato', accessor: (r: Refueling) => contracts.find(c => c.id === r.contract_id)?.supplier || 'N/A' },
        { 
            header: 'Valor Total Contrato (R$)', 
            accessor: (r: Refueling) => {
                const contract = contracts.find(c => c.id === r.contract_id);
                if (!contract) return '0.00';
                const totalValue = contract.items.reduce((sum, item) => sum + (item.quantity_liters * item.unit_price), 0);
                return totalValue.toFixed(2);
            }
        },
        {
            header: 'Valor Gasto Contrato (R$)',
            accessor: (r: Refueling) => {
                const contract = contracts.find(c => c.id === r.contract_id);
                if (!contract) return '0.00';
                const totalSpent = refuelings
                    .filter(ref => ref.contract_id === contract.id)
                    .reduce((sum, ref) => sum + ref.total_value, 0);
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
                                <select name="vehicle_id" value={filters.vehicle_id} onChange={handleFilterChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"><option value="">Todos</option>{userVisibleResources.vehicles.map(v => <option key={v.id} value={v.id}>{v.plate} - {v.model}</option>)}</select>
                            </div>
                             <div>
                                <label className="text-sm font-medium">Motorista</label>
                                <select name="driver_id" value={filters.driver_id} onChange={handleFilterChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"><option value="">Todos</option>{userVisibleResources.drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
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
                                const vehicle = vehicles.find(v => v.id === r.vehicle_id);
                                const driver = drivers.find(d => d.id === r.driver_id);
                                const kmRodado = r.current_odometer > 0 && r.previous_odometer > 0 ? r.current_odometer - r.previous_odometer : 0;
                                return (
                                    <tr key={r.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">{new Date(r.date).toLocaleString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{vehicle?.plate || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{driver?.name || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{kmRodado > 0 ? kmRodado.toLocaleString('pt-BR') : 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{r.quantity_liters.toFixed(2)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{r.total_value.toFixed(2)}</td>
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