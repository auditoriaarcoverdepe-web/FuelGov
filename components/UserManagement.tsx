import React, { useState } from 'react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import Card from './ui/Card';
import Modal from './ui/Modal';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import type { User, Department } from '../types';
import ExportButtons from './ui/ExportButtons';

const UserForm: React.FC<{
  user: Partial<User> | null;
  onSave: (user: Omit<User, 'id'> | User) => void;
  onClose: () => void;
  entityId: string;
  departments: Department[];
}> = ({ user, onSave, onClose, entityId, departments }) => {
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        role: user?.role || Role.USER,
        department_id: user?.department_id || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const newFormData = { ...formData, [name]: value };
        if (name === 'role' && value !== Role.USER) {
            newFormData.department_id = '';
        }
        setFormData(newFormData);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...user, ...formData, entity_id: entityId } as Omit<User, 'id'> | User);
    };

    const departmentsForSelectedEntity = entityId ? departments.filter(d => d.entity_id === entityId) : [];

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium">Nome</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium">Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium">Perfil</label>
                    <select name="role" value={formData.role} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                        {Object.values(Role)
                            .filter(r => r === Role.CONTROLLER || r === Role.USER)
                            .map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
                {formData.role === Role.USER && (
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium">Órgão/Secretaria</label>
                        <select name="department_id" value={formData.department_id} onChange={handleChange} required={formData.role === Role.USER} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                             <option value="">Selecione...</option>
                             {departmentsForSelectedEntity.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                )}
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">Salvar</button>
            </div>
        </form>
    );
};

interface UserManagementProps {
    entityId: string | null;
}

const UserManagement: React.FC<UserManagementProps> = ({ entityId }) => {
    const { users, entities, departments, addUser, updateUser, deleteUser, loading } = useSupabaseData();
    const { currentUser } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    
    if (loading) {
        return <Card><p>Carregando dados...</p></Card>;
    }

    if (!currentUser || currentUser.role !== Role.ADMIN) {
        return <Card><p>Acesso negado.</p></Card>;
    }
    
    if (!entityId) {
        return <Card><p>Nenhuma entidade selecionada para gerenciar usuários.</p></Card>;
    }

    const handleSave = (user: Omit<User, 'id'> | User) => {
        if ('id' in user) updateUser(user);
        else addUser(user);
        setIsModalOpen(false);
        setEditingUser(null);
    };

    const handleEdit = (user: User) => { setEditingUser(user); setIsModalOpen(true); };
    const handleAddNew = () => { setEditingUser(null); setIsModalOpen(true); };

    const filteredUsers = users.filter(u => u.entity_id === entityId && u.role !== Role.ADMIN);

    const exportColumns = [
        { header: 'Nome', accessor: 'name' as const },
        { header: 'Email', accessor: 'email' as const },
        { header: 'Perfil', accessor: 'role' as const },
        { header: 'Entidade', accessor: (u: User) => entities.find(e => e.id === u.entity_id)?.name || 'N/A' },
        { header: 'Órgão', accessor: (u: User) => u.department_id ? (departments.find(d => d.id === u.department_id)?.name || '') : '' },
    ];

    return (
        <Card>
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                <h1 className="text-2xl font-bold">Gestão de Usuários</h1>
                <div className="flex items-center space-x-2">
                    <ExportButtons data={filteredUsers} columns={exportColumns} filenamePrefix="Usuarios" />
                    <button onClick={handleAddNew} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">Adicionar Usuário</button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase">Nome</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase">Perfil</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase">Entidade / Órgão</th>
                            <th className="px-6 py-3 text-right text-xs font-medium uppercase">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredUsers.map(u => (
                            <tr key={u.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{u.name}</div>
                                    <div className="text-sm text-gray-500">{u.email}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">{u.role}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{entities.find(e => e.id === u.entity_id)?.name}</div>
                                    {u.department_id && <div className="text-sm text-gray-500">{departments.find(d => d.id === u.department_id)?.name}</div>}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end space-x-3">
                                        <button onClick={() => handleEdit(u)} className="text-indigo-600 hover:text-indigo-900" title="Editar Usuário">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" />
                                            </svg>
                                        </button>
                                        <button onClick={() => deleteUser(u.id)} className="text-danger hover:text-red-800" title="Excluir Usuário">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser ? "Editar Usuário" : "Adicionar Usuário"}>
                <UserForm 
                  user={editingUser} 
                  onSave={handleSave} 
                  onClose={() => setIsModalOpen(false)} 
                  entityId={entityId}
                  departments={departments}
                />
            </Modal>
        </Card>
    );
};

export default UserManagement;