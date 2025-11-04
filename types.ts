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

export interface PublicEntity {
  id: string;
  name: string;
  type: 'Prefeitura' | 'Câmara Municipal';
  cnpj: string;
}

export interface Department {
  id: string;
  name: string;
  entityId: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  entityId?: string;
  departmentId?: string;
}

export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  year: number;
  fuelType: FuelType;
  departmentId: string;
}

export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  cnhValidity: string;
  departmentId: string;
}

export interface Contract {
  id:string;
  supplier: string;
  startDate: string;
  endDate: string;
  items: ContractItem[];
  departmentId: string;
  additives?: ContractAdditive[];
}

export interface ContractItem {
  fuelType: FuelType;
  quantityLiters: number;
  unitPrice: number;
}

export interface ContractAdditive {
  id: string;
  description: string;
  date: string;
  newEndDate?: string;
  items: ContractItem[];
}

export interface Refueling {
  id: string;
  vehicleId: string;
  driverId: string;
  contractId: string;
  date: string;
  invoice: string;
  quantityLiters: number;
  totalValue: number;
  previousOdometer: number;
  currentOdometer: number;
  fuelType?: FuelType; // Specific fuel used, crucial for FLEX vehicles
}