

import { useState, useCallback, Dispatch, SetStateAction } from 'react';
import { Role, FuelType } from '../types';
import type { PublicEntity, Department, User, Vehicle, Driver, Contract, Refueling, ContractAdditive } from '../types';

const daysFromNow = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
};


// Mock Data Initialization
const mockEntities: PublicEntity[] = [
    { id: '1', name: 'Prefeitura de Cida Dourada', type: 'Prefeitura', cnpj: '12.345.678/0001-91' },
    { id: '2', name: 'Câmara Municipal de Rio Claro', type: 'Câmara Municipal', cnpj: '98.765.432/0001-22' },
];

const mockDepartments: Department[] = [
    { id: 'd1', name: 'Secretaria de Administração', entity_id: '1' },
    { id: 'd2', name: 'Secretaria de Saúde', entity_id: '1' },
    { id: 'd3', name: 'Secretaria de Educação', entity_id: '1' },
    { id: 'd4', name: 'Gabinete do Vereador', entity_id: '2' },
];

const mockUsers: User[] = [
    { id: 'u1', name: 'Admin Geral', email: 'erinaldotelso.aud@gmail.com', role: Role.ADMIN },
    { id: 'u2', name: 'João Controlador', email: 'controlador.pm@cidadourada.gov', role: Role.CONTROLLER, entity_id: '1' },
    { id: 'u3', name: 'Maria Gestora', email: 'gestora.saude@cidadourada.gov', role: Role.USER, entity_id: '1', department_id: 'd2' },
    { id: 'u4', name: 'Carlos Assessor', email: 'assessor.cm@rioclaro.gov', role: Role.USER, entity_id: '2', department_id: 'd4' },
    { id: 'u5', name: 'Ana Controladora', email: 'controladora.cm@rioclaro.gov', role: Role.CONTROLLER, entity_id: '2' },
];

const mockVehicles: Vehicle[] = [
    { id: 'v1', plate: 'BRA2E19', model: 'Fiat Cronos', year: 2022, fuel_type: FuelType.FLEX, department_id: 'd1' },
    { id: 'v2', plate: 'RJZ1A23', model: 'VW Amarok', year: 2023, fuel_type: FuelType.DIESEL, department_id: 'd2' },
    { id: 'v3', plate: 'MER1C01', model: 'Chevrolet Onix', year: 2021, fuel_type: FuelType.GASOLINE, department_id: 'd4' },
];

const mockDrivers: Driver[] = [
    { id: 'dr1', name: 'José da Silva', license_number: '123456789', cnh_validity: '2026-05-20', department_id: 'd1' },
    { id: 'dr2', name: 'Fernanda Lima', license_number: '987654321', cnh_validity: daysFromNow(20), department_id: 'd2' },
    { id: 'dr3', name: 'Roberto Carlos', license_number: '555444333', cnh_validity: daysFromNow(-15), department_id: 'd4' },
];

const mockContracts: Contract[] = [
    {
        id: 'c1', supplier: 'Posto Central Ltda.',
        start_date: '2024-01-01', end_date: new Date(new Date().setDate(new Date().getDate() + 25)).toISOString().split('T')[0],
        department_id: 'd2',
        items: [
            { fuel_type: FuelType.DIESEL, quantity_liters: 5000, unit_price: 5.89 },
        ],
        additives: [
            {
                id: 'ad1',
                description: 'Aditivo para aumento de demanda da Saúde',
                date: '2024-06-01',
                new_end_date: new Date(new Date().setDate(new Date().getDate() + 55)).toISOString().split('T')[0],
                items: [{ fuel_type: FuelType.DIESEL, quantity_liters: 1500, unit_price: 5.95 }],
            }
        ]
    },
    {
        id: 'c2', supplier: 'Posto Petrobras S/A',
        start_date: '2024-03-15', end_date: '2024-09-15',
        department_id: 'd1',
        items: [
            { fuel_type: FuelType.ETHANOL, quantity_liters: 10000, unit_price: 3.79 },
            { fuel_type: FuelType.GASOLINE, quantity_liters: 2000, unit_price: 5.49 },
        ]
    },
     {
        id: 'c3', supplier: 'Auto Posto Confiança',
        start_date: '2024-05-01', end_date: new Date(new Date().setDate(new Date().getDate() + 80)).toISOString().split('T')[0],
        department_id: 'd4',
        items: [
            { fuel_type: FuelType.GASOLINE, quantity_liters: 1500, unit_price: 5.55 },
        ]
    }
];

const mockRefuelings: Refueling[] = [
    { id: 'r1', vehicle_id: 'v2', driver_id: 'dr2', contract_id: 'c1', date: '2024-07-10T10:00:00Z', invoice: '12345', quantity_liters: 50, total_value: 294.50, previous_odometer: 15000, current_odometer: 15600 },
    { id: 'r2', vehicle_id: 'v1', driver_id: 'dr1', contract_id: 'c2', date: '2024-07-11T15:30:00Z', invoice: '12346', quantity_liters: 40, total_value: 151.60, previous_odometer: 32100, current_odometer: 32650, fuel_type: FuelType.ETHANOL },
    { id: 'r3', vehicle_id: 'v3', driver_id: 'dr3', contract_id: 'c3', date: '2024-07-12T08:00:00Z', invoice: '67890', quantity_liters: 35, total_value: 194.25, previous_odometer: 54321, current_odometer: 54800 },
    { id: 'r4', vehicle_id: 'v2', driver_id: 'dr2', contract_id: 'c1', date: '2024-07-15T11:00:00Z', invoice: '12350', quantity_liters: 65, total_value: 382.85, previous_odometer: 15600, current_odometer: 16350 },
];


// Singleton data store
const dataStore = {
    entities: mockEntities,
    departments: mockDepartments,
    users: mockUsers,
    vehicles: mockVehicles,
    drivers: mockDrivers,
    contracts: mockContracts,
    refuelings: mockRefuelings,
};

// Custom hook to interact with the data
export const useMockData = () => {
    const [entities, setEntities] = useState<PublicEntity[]>(dataStore.entities);
    const [departments, setDepartments] = useState<Department[]>(dataStore.departments);
    const [users, setUsers] = useState<User[]>(dataStore.users);
    const [vehicles, setVehicles] = useState<Vehicle[]>(dataStore.vehicles);
    const [drivers, setDrivers] = useState<Driver[]>(dataStore.drivers);
    const [contracts, setContracts] = useState<Contract[]>(dataStore.contracts);
    const [refuelings, setRefuelings] = useState<Refueling[]>(dataStore.refuelings);

    const saveData = useCallback(<T,>(setter: Dispatch<SetStateAction<T[]>>, data: T[], key: keyof typeof dataStore) => {
        (dataStore[key] as T[]) = data;
        setter(data);
    }, []);

    const genericAdd = useCallback(<T extends { id: string }>(setter: Dispatch<SetStateAction<T[]>>, item: Omit<T, 'id'>, key: keyof typeof dataStore) => {
        const newItem = { ...item, id: new Date().getTime().toString() } as T;
        const currentData = dataStore[key] as unknown as T[];
        saveData(setter, [...currentData, newItem], key);
        return newItem;
    }, [saveData]);

    const genericUpdate = useCallback(<T extends { id: string }>(setter: Dispatch<SetStateAction<T[]>>, updatedItem: T, key: keyof typeof dataStore) => {
        const currentData = dataStore[key] as unknown as T[];
        const updatedData = currentData.map(item => item.id === updatedItem.id ? updatedItem : item);
        saveData(setter, updatedData, key);
        return updatedItem;
    }, [saveData]);
    
    const genericDelete = useCallback(<T extends { id: string }>(setter: Dispatch<SetStateAction<T[]>>, id: string, key: keyof typeof dataStore) => {
        const currentData = dataStore[key] as unknown as T[];
        const updatedData = currentData.filter(item => item.id !== id);
        saveData(setter, updatedData, key);
    }, [saveData]);


    return {
        // Data
        entities, departments, users, vehicles, drivers, contracts, refuelings,
        
        // Actions
        addEntity: (item: Omit<PublicEntity, 'id'>) => genericAdd(setEntities, item, 'entities'),
        updateEntity: (item: PublicEntity) => genericUpdate(setEntities, item, 'entities'),
        deleteEntity: (id: string) => genericDelete(setEntities, id, 'entities'),

        addDepartment: (item: Omit<Department, 'id'>) => genericAdd(setDepartments, item, 'departments'),
        updateDepartment: (item: Department) => genericUpdate(setDepartments, item, 'departments'),
        deleteDepartment: (id: string) => genericDelete(setDepartments, id, 'departments'),

        addUser: (item: Omit<User, 'id'>) => genericAdd(setUsers, item, 'users'),
        updateUser: (item: User) => genericUpdate(setUsers, item, 'users'),
        deleteUser: (id: string) => genericDelete(setUsers, id, 'users'),
        
        addVehicle: (item: Omit<Vehicle, 'id'>) => genericAdd(setVehicles, item, 'vehicles'),
        updateVehicle: (item: Vehicle) => genericUpdate(setVehicles, item, 'vehicles'),
        deleteVehicle: (id: string) => genericDelete(setVehicles, id, 'vehicles'),

        addDriver: (item: Omit<Driver, 'id'>) => genericAdd(setDrivers, item, 'drivers'),
        updateDriver: (item: Driver) => genericUpdate(setDrivers, item, 'drivers'),
        deleteDriver: (id: string) => genericDelete(setDrivers, id, 'drivers'),
        
        addContract: (item: Omit<Contract, 'id'>) => genericAdd(setContracts, item, 'contracts'),
        updateContract: (item: Contract) => genericUpdate(setContracts, item, 'contracts'),
        deleteContract: (id: string) => genericDelete(setContracts, id, 'contracts'),

        addRefueling: (item: Omit<Refueling, 'id'>) => genericAdd(setRefuelings, item, 'refuelings'),
        updateRefueling: (item: Refueling) => genericUpdate(setRefuelings, item, 'refuelings'),
        deleteRefueling: (id: string) => genericDelete(setRefuelings, id, 'refuelings'),
    };
};