import React, { useState } from 'react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import Modal from './ui/Modal';
import type { PublicEntity } from '../types';
import Card from './ui/Card';

interface AdminHomeProps {
  onSelectEntity: (entityId: string) => void;
}

const NewEntityForm: React.FC<{
  onSave: (entity: Omit<PublicEntity, 'id'>) => void;
  onClose: () => void;
}> = ({ onSave, onClose }) => {
    const [municipality, setMunicipality] = useState('');
    const [type, setType] = useState<'Prefeitura' | 'Câmara Municipal'>('Prefeitura');
    const [cnpj, setCnpj] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const name = type === 'Prefeitura' 
            ? `Prefeitura de ${municipality}` 
            : `Câmara Municipal de ${municipality}`;
        
        onSave({ name, type, cnpj });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Tipo</label>
                <select value={type} onChange={e => setType(e.target.value as 'Prefeitura' | 'Câmara Municipal')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                    <option value="Prefeitura">Prefeitura</option>
                    <option value="Câmara Municipal">Câmara Municipal</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Nome do Município</label>
                <input type="text" value={municipality} onChange={e => setMunicipality(e.target.value)} required placeholder="Ex: Cida Dourada" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">CNPJ</label>
                <input type="text" value={cnpj} onChange={e => setCnpj(e.target.value)} required placeholder="00.000.000/0001-00" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">Salvar Entidade</button>
            </div>
        </form>
    );
};


const AdminHome: React.FC<AdminHomeProps> = ({ onSelectEntity }) => {
  const { entities, addEntity, loading } = useSupabaseData();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSaveEntity = (entity: Omit<PublicEntity, 'id'>) => {
      addEntity(entity);
      setIsModalOpen(false);
  };

  if (loading) {
      return <Card><p>Carregando entidades...</p></Card>;
  }

  return (
    <>
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-text-primary">Seleção de Entidade</h1>
                <p className="text-text-secondary">Escolha uma prefeitura ou câmara para gerenciar, ou cadastre uma nova.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {entities.map(entity => (
                <button
                    key={entity.id}
                    onClick={() => onSelectEntity(entity.id)}
                    className="text-left p-6 bg-surface rounded-lg shadow-sm hover:shadow-lg hover:border-primary border-2 border-transparent transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                    <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-lg bg-secondary text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-text-primary">{entity.name}</h2>
                        <p className="text-text-secondary font-mono">{entity.cnpj}</p>
                    </div>
                    </div>
                </button>
                ))}
                 <button
                    onClick={() => setIsModalOpen(true)}
                    className="text-left p-6 bg-surface rounded-lg shadow-sm hover:shadow-lg border-2 border-dashed border-gray-300 hover:border-primary transition-all duration-300 flex flex-col items-center justify-center text-gray-500 hover:text-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    aria-label="Cadastrar Nova Entidade"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span className="mt-2 font-semibold">Cadastrar Nova Entidade</span>
                </button>
            </div>
        </div>
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Cadastrar Nova Entidade">
            <NewEntityForm onSave={handleSaveEntity} onClose={() => setIsModalOpen(false)} />
        </Modal>
    </>
  );
};

export default AdminHome;