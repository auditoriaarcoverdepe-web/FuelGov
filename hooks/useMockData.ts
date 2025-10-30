import { useState, useCallback, Dispatch, SetStateAction } from 'react';
import { Role, FuelType } from '../types';
import type { PublicEntity, Department, User, Vehicle, Driver, Contract, Refueling, ContractAdditive } from '../types';

// Function to generate a random password
const generatePassword = () => {
    const length = 8;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let retVal = "";
    for (let i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
};

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
    { id: 'd1', name: 'Secretaria de Administração', entityId: '1' },
    { id: 'd2', name: 'Secretaria de Saúde', entityId: '1' },
    { id: 'd3', name: 'Secretaria de Educação', entityId: '1' },
    { id: 'd4', name: 'Gabinete do Vereador', entityId: '2' },
];

export const mockUsers: User[] = [
    { id: 'u1', name: 'Admin Geral', email: 'erinaldotelso.aud@gmail.com', role: Role.ADMIN, password: 'Admin123' },
    { id: 'u2', name: 'João Controlador', email: 'controlador.pm@cidadourada.gov', role: Role.CONTROLLER, entityId: '1', password: 'ControllerPassword123' },
    { id: 'u3', name: 'Maria Gestora', email: 'gestora.saude@cidadourada.gov', role: Role.USER, entityId: '1', departmentId: 'd2', password: 'UserPassword123' },
    { id: 'u4', name: 'Carlos Assessor', email: 'assessor.cm@rioclaro.gov', role: Role.USER, entityId: '2', departmentId: 'd4', password: 'UserPassword456' },
    { id: 'u5', name: 'Ana Controladora', email: 'controladora.cm@rioclaro.gov', role: Role.CONTROLLER, entityId: '2', password: 'ControllerPassword456' },
];

const mockVehicles: Vehicle[] = [
    { id: 'v1', plate: 'BRA2E19', model: 'Fiat Cronos', year: 2022, fuelType: FuelType.FLEX, departmentId: 'd1' },
    { id: 'v2', plate: 'RJZ1A23', model: 'VW Amarok', year: 2023, fuelType: FuelType.DIESEL, departmentId: 'd2' },
    { id: 'v3', plate: 'MER1C01', model: 'Chevrolet Onix', year: 2021, fuelType: FuelType.GASOLINE, departmentId: 'd4' },
];

const mockDrivers: Driver[] = [
    { id: 'dr1', name: 'José da Silva', licenseNumber: '123456789', cnhValidity: '2026-05-20', departmentId: 'd1' },
    { id: 'dr2', name: 'Fernanda Lima', licenseNumber: '987654321', cnhValidity: daysFromNow(20), departmentId: 'd2' },
    { id: 'dr3', name: 'Roberto Carlos', licenseNumber: '555444333', cnhValidity: daysFromNow(-15), departmentId: 'd4' },
];

const mockContracts: Contract[] = [
    {
        id: 'c1', supplier: 'Posto Central Ltda.',
        startDate: '2024-01-01', endDate: new Date(new Date().setDate(new Date().getDate() + 25)).toISOString().split('T')[0],
        departmentId: 'd2',
        items: [
            { fuelType: FuelType.DIESEL, quantityLiters: 5000, unitPrice: 5.89 },
        ],
        additives: [
            {
                id: 'ad1',
                description: 'Aditivo para aumento de demanda da Saúde',
                date: '2024-06-01',
                newEndDate: new Date(new Date().setDate(new Date().getDate() + 55)).toISOString().split('T')[0],
                items: [{ fuelType: FuelType.DIESEL, quantityLiters: 1500, unitPrice: 5.95 }],
            }
        ]
    },
    {
        id: 'c2', supplier: 'Posto Petrobras S/A',
        startDate: '2024-03-15', endDate: '2024-09-15',
        departmentId: 'd1',
        items: [
            { fuelType: FuelType.ETHANOL, quantityLiters: 10000, unitPrice: 3.79 },
            { fuelType: FuelType.GASOLINE, quantityLiters: 2000, unitPrice: 5.49 },
        ]
    },
     {
        id: 'c3', supplier: 'Auto Posto Confiança',
        startDate: '2024-05-01', endDate: new Date(new Date().setDate(new Date().getDate() + 80)).toISOString().split('T')[0],
        departmentId: 'd4',
        items: [
            { fuelType: FuelType.GASOLINE, quantityLiters: 1500, unitPrice: 5.55 },
        ]
    }
];

const mockRefuelings: Refueling[] = [
    { id: 'r1', vehicleId: 'v2', driverId: 'dr2', contractId: 'c1', date: '2024-07-10T10:00:00Z', invoice: '12345', quantityLiters: 50, totalValue: 294.50, previousOdometer: 15000, currentOdometer: 15600 },
    { id: 'r2', vehicleId: 'v1', driverId: 'dr1', contractId: 'c2', date: '2024-07-11T15:30:00Z', invoice: '12346', quantityLiters: 40, totalValue: 151.60, previousOdometer: 32100, currentOdometer: 32650, fuelType: FuelType.ETHANOL },
    { id: 'r3', vehicleId: 'v3', driverId: 'dr3', contractId: 'c3', date: '2024-07-12T08:00:00Z', invoice: '67890', quantityLiters: 35, totalValue: 194.25, previousOdometer: 54321, currentOdometer: 54800 },
    { id: 'r4', vehicleId: 'v2', driverId: 'dr2', contractId: 'c1', date: '2024-07-15T11:00:00Z', invoice: '12350', quantityLiters: 65, totalValue: 382.85, previousOdometer: 15600, currentOdometer: 16350 },
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
        let newItem: T;
        if (key === 'users') {
             const userItem = item as unknown as Omit<User, 'id'>;
             newItem = { ...userItem, id: new Date().getTime().toString(), password: generatePassword() } as unknown as T;
        } else {
            newItem = { ...item, id: new Date().getTime().toString() } as T;
        }
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