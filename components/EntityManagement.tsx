
import React, { useState, useMemo } from 'react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import Card from './ui/Card';
import Modal from './ui/Modal';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import type { PublicEntity, Department } from '../types';

const EntityForm: React.FC<{
  entity: Partial<PublicEntity> | null;
  onSave: (entity: Omit<PublicEntity, 'id'> | PublicEntity) => void;
  onClose: () => void;
}> = ({ entity, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        name: entity?.name || '',
        type: entity?.type || 'Prefeitura',
        cnpj: entity?.cnpj || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...entity, ...formData } as Omit<PublicEntity, 'id'> | PublicEntity);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Nome da Entidade</label>
                <input type="text" name="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">CNPJ</label>
                <input type="text" name="cnpj" value={formData.cnpj} onChange={e => setFormData({...formData, cnpj: e.target.value})} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Tipo</label>
                <select name="type" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as 'Prefeitura' | 'Câmara Municipal'})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                    <option value="Prefeitura">Prefeitura</option>
                    <option value="Câmara Municipal">Câmara Municipal</option>
                </select>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">Salvar</button>
            </div>
        </form>
    );
};

const DepartmentForm: React.FC<{
  department: Partial<Department> | null;
  entityId: string;
  onSave: (department: Omit<Department, 'id'> | Department) => void;
  onClose: () => void;
}> = ({ department, entityId, onSave, onClose }) => {
    const [name, setName] = useState(department?.name || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...department, name, entityId } as Omit<Department, 'id'> | Department);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Nome do Órgão/Secretaria</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">Salvar</button>
            </div>
        </form>
    );
};

interface EntityManagementProps {
    entityId: string | null;
}

const EntityManagement: React.FC<EntityManagementProps> = ({ entityId }) => {
    const { entities, departments, addEntity, updateEntity, deleteEntity, addDepartment, updateDepartment, deleteDepartment } = useSupabaseData();
    const { currentUser } = useAuth();
    const [isEntityModalOpen, setIsEntityModalOpen] = useState(false);
    const [editingEntity, setEditingEntity] = useState<PublicEntity | null>(null);
    const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
    const [editingDept, setEditingDept] = useState<Department | null>(null);
    const [currentEntityForDept, setCurrentEntityForDept] = useState<string | null>(null);

    const canEdit = currentUser.role === Role.ADMIN;
    
    const filteredEntities = useMemo(() => {
        if (!currentUser) return [];
        if (currentUser.role === Role.ADMIN) {
            return entityId ? entities.filter(e => e.id === entityId) : [];
        }
        if (currentUser.role === Role.CONTROLLER) {
            return entities.filter(e => e.id === currentUser.entityId);
        }
        return [];
    }, [currentUser, entities, entityId]);

    // Entity handlers
    const handleSaveEntity = (entity: Omit<PublicEntity, 'id'> | PublicEntity) => {
        if ('id' in entity) updateEntity(entity);
        else addEntity(entity);
        setIsEntityModalOpen(false);
        setEditingEntity(null);
    };
    const handleEditEntity = (entity: PublicEntity) => { setEditingEntity(entity); setIsEntityModalOpen(true); };

    // Department handlers
    const handleSaveDept = (dept: Omit<Department, 'id'> | Department) => {
        if ('id' in dept) updateDepartment(dept);
        else addDepartment(dept);
        setIsDeptModalOpen(false);
        setEditingDept(null);
    };
    const handleEditDept = (dept: Department) => { setEditingDept(dept); setCurrentEntityForDept(dept.entityId); setIsDeptModalOpen(true); };
    const handleAddNewDept = (entityId: string) => { setEditingDept(null); setCurrentEntityForDept(entityId); setIsDeptModalOpen(true); };


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Gestão de Entidades e Órgãos</h1>
            </div>
            
            {filteredEntities.map(entity => (
                <Card key={entity.id}>
                    <div className="flex justify-between items-start mb-3">
                        <div>
                           <h2 className="text-xl font-semibold">{entity.name}</h2>
                           <p className="text-sm text-gray-500">{entity.type}</p>
                        </div>
                        {canEdit && (
                            <div className="space-x-2 flex-shrink-0">
                                <button onClick={() => handleEditEntity(entity)} className="text-indigo-600 hover:text-indigo-900 text-sm">Editar Entidade</button>
                                <button onClick={() => deleteEntity(entity.id)} className="text-danger hover:text-red-800 text-sm">Excluir Entidade</button>
                            </div>
                        )}
                    </div>
                    
                    <h3 className="text-md font-semibold text-gray-600 mt-4 mb-2">Órgãos / Secretarias</h3>
                    <div className="border-t pt-2">
                        {departments.filter(d => d.entityId === entity.id).map(dept => (
                            <div key={dept.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                                <span>{dept.name}</span>
                                {canEdit && (
                                    <div className="flex items-center space-x-3">
                                        <button onClick={() => handleEditDept(dept)} className="text-indigo-600 hover:text-indigo-900" title="Editar Órgão">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" />
                                            </svg>
                                        </button>
                                        <button onClick={() => deleteDepartment(dept.id)} className="text-danger hover:text-red-800" title="Excluir Órgão">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                     {canEdit && <button onClick={() => handleAddNewDept(entity.id)} className="mt-4 text-sm px-3 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Adicionar Órgão</button>}
                </Card>
            ))}

            <Modal isOpen={isEntityModalOpen} onClose={() => setIsEntityModalOpen(false)} title={editingEntity ? "Editar Entidade" : "Adicionar Entidade"}>
                <EntityForm entity={editingEntity} onSave={handleSaveEntity} onClose={() => setIsEntityModalOpen(false)} />
            </Modal>
            <Modal isOpen={isDeptModalOpen} onClose={() => setIsDeptModalOpen(false)} title={editingDept ? "Editar Órgão" : "Adicionar Órgão"}>
                {currentEntityForDept && <DepartmentForm department={editingDept} entityId={currentEntityForDept} onSave={handleSaveDept} onClose={() => setIsDeptModalOpen(false)} />}
            </Modal>
        </div>
    );
};

export default EntityManagement;
