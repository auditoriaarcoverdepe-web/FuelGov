// FIX: Import Dispatch and SetStateAction to be used for typing state setters.
import { useState, useEffect, useCallback, Dispatch, SetStateAction } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { useMockData } from './useMockData';
import type { PublicEntity, Department, User, Vehicle, Driver, Contract, Refueling } from '../types';

type TableName = 'entities' | 'departments' | 'users' | 'vehicles' | 'drivers' | 'contracts' | 'refuelings';

// Mapeamento de nomes de tabela para Setters de estado
const tableSetterMap = {
    entities: 'setEntities',
    departments: 'setDepartments',
    users: 'setUsers',
    vehicles: 'setVehicles',
    drivers: 'setDrivers',
    contracts: 'setContracts',
    refuelings: 'setRefuelings',
} as const;


export const useSupabaseData = () => {
    // Se o Supabase não estiver configurado, retorna os dados de mock.
    // Isso permite que o app rode offline ou em um ambiente de dev sem backend.
    const mockData = useMockData();
    if (!isSupabaseConfigured) {
        return { ...mockData, loading: false };
    }
    
    // Lógica original do hook para buscar dados do Supabase
    const [entities, setEntities] = useState<PublicEntity[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [refuelings, setRefuelings] = useState<Refueling[]>([]);
    const [loading, setLoading] = useState(true);

    const setters = {
        setEntities, setDepartments, setUsers, setVehicles, setDrivers, setContracts, setRefuelings
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [
                entitiesRes, departmentsRes, usersRes, vehiclesRes, driversRes, contractsRes, refuelingsRes
            ] = await Promise.all([
                supabase.from('entities').select('*'),
                supabase.from('departments').select('*'),
                supabase.from('users').select('*'),
                supabase.from('vehicles').select('*'),
                supabase.from('drivers').select('*'),
                supabase.from('contracts').select('*'),
                supabase.from('refuelings').select('*')
            ]);

            if (entitiesRes.error) throw entitiesRes.error;
            setEntities(entitiesRes.data || []);

            if (departmentsRes.error) throw departmentsRes.error;
            setDepartments(departmentsRes.data || []);

            if (usersRes.error) throw usersRes.error;
            setUsers(usersRes.data || []);

            if (vehiclesRes.error) throw vehiclesRes.error;
            setVehicles(vehiclesRes.data || []);
            
            if (driversRes.error) throw driversRes.error;
            setDrivers(driversRes.data || []);

            if (contractsRes.error) throw contractsRes.error;
            setContracts(contractsRes.data || []);

            if (refuelingsRes.error) throw refuelingsRes.error;
            setRefuelings(refuelingsRes.data || []);

        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const genericAdd = useCallback(async <T extends { id: string }>(item: Omit<T, 'id'>, tableName: TableName) => {
        // O Supabase irá gerar o ID (uuid) se não for fornecido
        const { data, error } = await supabase.from(tableName).insert([item]).select();
        if (error) {
            console.error(`Error adding to ${tableName}:`, error);
            return null;
        }
        if (data) {
            const setterName = tableSetterMap[tableName];
            // FIX: Use Dispatch and SetStateAction directly without React namespace.
            // FIX: Cast to `unknown` first to resolve the type mismatch between the union
            // of setters and the generic `Dispatch<SetStateAction<T[]>>`.
            const setter = setters[setterName] as unknown as Dispatch<SetStateAction<T[]>>;
            setter(prev => [...prev, ...data]);
            return data[0];
        }
        return null;
    }, [setters]);

    const genericUpdate = useCallback(async <T extends { id: string }>(updatedItem: T, tableName: TableName) => {
        const { data, error } = await supabase.from(tableName).update(updatedItem).eq('id', updatedItem.id).select();
        if (error) {
            console.error(`Error updating ${tableName}:`, error);
            return null;
        }
        if (data) {
             const setterName = tableSetterMap[tableName];
             // FIX: Use Dispatch and SetStateAction directly without React namespace.
             // FIX: Cast to `unknown` first to resolve the type mismatch between the union
             // of setters and the generic `Dispatch<SetStateAction<T[]>>`.
             const setter = setters[setterName] as unknown as Dispatch<SetStateAction<T[]>>;
             setter(prev => prev.map(item => item.id === updatedItem.id ? data[0] : item));
             return data[0];
        }
        return null;
    }, [setters]);

    const genericDelete = useCallback(async (id: string, tableName: TableName) => {
        const { error } = await supabase.from(tableName).delete().eq('id', id);
        if (error) {
            console.error(`Error deleting from ${tableName}:`, error);
            return;
        }
        const setterName = tableSetterMap[tableName];
        // FIX: Use Dispatch and SetStateAction directly without React namespace.
        const setter = setters[setterName] as Dispatch<SetStateAction<{id: string}[]>>;
        setter(prev => prev.filter(item => item.id !== id));
    }, [setters]);


    return {
        // Data
        entities, departments, users, vehicles, drivers, contracts, refuelings, loading,
        
        // Actions
        addEntity: (item: Omit<PublicEntity, 'id'>) => genericAdd(item, 'entities'),
        updateEntity: (item: PublicEntity) => genericUpdate(item, 'entities'),
        deleteEntity: (id: string) => genericDelete(id, 'entities'),

        addDepartment: (item: Omit<Department, 'id'>) => genericAdd(item, 'departments'),
        updateDepartment: (item: Department) => genericUpdate(item, 'departments'),
        deleteDepartment: (id: string) => genericDelete(id, 'departments'),

        addUser: (item: Omit<User, 'id'>) => genericAdd(item, 'users'),
        updateUser: (item: User) => genericUpdate(item, 'users'),
        deleteUser: (id: string) => genericDelete(id, 'users'),
        
        addVehicle: (item: Omit<Vehicle, 'id'>) => genericAdd(item, 'vehicles'),
        updateVehicle: (item: Vehicle) => genericUpdate(item, 'vehicles'),
        deleteVehicle: (id: string) => genericDelete(id, 'vehicles'),

        addDriver: (item: Omit<Driver, 'id'>) => genericAdd(item, 'drivers'),
        updateDriver: (item: Driver) => genericUpdate(item, 'drivers'),
        deleteDriver: (id: string) => genericDelete(id, 'drivers'),
        
        addContract: (item: Omit<Contract, 'id'>) => genericAdd(item, 'contracts'),
        updateContract: (item: Contract) => genericUpdate(item, 'contracts'),
        deleteContract: (id: string) => genericDelete(id, 'contracts'),

        addRefueling: (item: Omit<Refueling, 'id'>) => genericAdd(item, 'refuelings'),
        updateRefueling: (item: Refueling) => genericUpdate(item, 'refuelings'),
        deleteRefueling: (id: string) => genericDelete(id, 'refuelings'),
    };
};