
export enum Role {
  ADMIN = 'Administrador Geral',
  CONTROLLER = 'Controlador',
  USER = 'Usuário do Sistema',
}

export enum FuelType {
  GASOLINE = 'Gasolina Comum',
  ETHANOL = 'Etanol',
  DIESEL = 'Diesel S10',
  PREMIUM_GASOLINE = 'Gasolina Aditivada',
  FLEX = 'Flex (Gasolina/Etanol)',
}

export type View = 'dashboard' | 'entities' | 'vehicles' | 'drivers' | 'contracts' | 'refuelings' | 'users';

export interface PublicEntity {
  id: string;
  name: string;
  type: 'Prefeitura' | 'Câmara Municipal';
  cnpj: string;
}

export interface Department {
  id: string;
  name: string;
  entity_id: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  entity_id?: string;
  department_id?: string;
}

export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  year: number;
  fuel_type: FuelType;
  department_id: string;
}

export interface Driver {
  id: string;
  name: string;
  license_number: string;
  cnh_validity: string;
  department_id: string;
}

export interface Contract {
  id:string;
  supplier: string;
  start_date: string;
  end_date: string;
  items: ContractItem[];
  department_id: string;
  additives?: ContractAdditive[];
}

export interface ContractItem {
  fuel_type: FuelType;
  quantity_liters: number;
  unit_price: number;
}

export interface ContractAdditive {
  id: string;
  description: string;
  date: string;
  new_end_date?: string;
  items: ContractItem[];
}

export interface Refueling {
  id: string;
  vehicle_id: string;
  driver_id: string;
  contract_id: string;
  date: string;
  invoice: string;
  quantity_liters: number;
  total_value: number;
  previous_odometer: number;
  current_odometer: number;
  fuel_type?: FuelType; // Specific fuel used, crucial for FLEX vehicles
}
