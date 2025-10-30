
import React, { useState, useEffect } from 'react';
import { useMockData } from '../hooks/useMockData';
import Card from './ui/Card';
import Modal from './ui/Modal';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import type { User } from '../types';
import ExportButtons from './ui/ExportButtons';

const UserForm: React.FC<{
  user: Partial<User> | null;
  onSave: (user: Omit<User, 'id'> | User) => void;
  onClose: () => void;
  entityId: string;
}> = ({ user, onSave, onClose, entityId }) => {
    const { departments } = useMockData();
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        role: user?.role || Role.USER,
        departmentId: user?.departmentId || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const newFormData = { ...formData, [name]: value };
        if (name === 'role' && value !== Role.USER) {
            newFormData.departmentId = '';
        }
        setFormData(newFormData);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...user, ...formData, entityId } as Omit<User, 'id'> | User);
    };

    const departmentsForSelectedEntity = entityId ? departments.filter(d => d.entityId === entityId) : [];

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
                        <select name="departmentId" value={formData.departmentId} onChange={handleChange} required={formData.role === Role.USER} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
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
    const { users, entities, departments, addUser, updateUser, deleteUser } = useMockData();
    const { currentUser } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                setNotification(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    if (currentUser.role !== Role.ADMIN) {
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

    const handleSendCredentials = async (user: User) => {
        try {
            // This promise simulates a network request to a backend API.
            // In a real application, this would be a fetch() call.
            await new Promise((resolve, reject) => {
                setTimeout(() => {
                    if (user.email && user.password) {
                        console.log(`[BACKEND SIMULATION] API call to send credentials to ${user.email}`);
                        // Example of what a real API call would look like:
                        // fetch('/api/send-credentials', {
                        //   method: 'POST',
                        //   headers: { 'Content-Type': 'application/json' },
                        //   body: JSON.stringify({ email: user.email, name: user.name, password: user.password })
                        // }).then(res => res.ok ? resolve(true) : reject(new Error('API Error')));
                        resolve(true);
                    } else {
                        reject(new Error('User email or password missing.'));
                    }
                }, 1500); // 1.5-second delay to mimic a real API call
            });
            
            setNotification({
                message: `E-mail de credenciais enviado para ${user.email} com sucesso!`,
                type: 'success'
            });

        } catch (error) {
            console.error("Failed to send credentials:", error);
            setNotification({
                message: 'Falha ao enviar e-mail. Verifique os dados do usuário.',
                type: 'error'
            });
        }
    };

    const handleEdit = (user: User) => { setEditingUser(user); setIsModalOpen(true); };
    const handleAddNew = () => { setEditingUser(null); setIsModalOpen(true); };

    const filteredUsers = users.filter(u => u.entityId === entityId && u.role !== Role.ADMIN);

    const exportColumns = [
        { header: 'Nome', accessor: 'name' as const },
        { header: 'Email', accessor: 'email' as const },
        { header: 'Perfil', accessor: 'role' as const },
        { header: 'Entidade', accessor: (u: User) => entities.find(e => e.id === u.entityId)?.name || 'N/A' },
        { header: 'Órgão', accessor: (u: User) => u.departmentId ? (departments.find(d => d.id === u.departmentId)?.name || '') : '' },
    ];

    return (
        <>
            {notification && (
                <div className={`fixed top-5 right-5 p-4 rounded-lg shadow-lg text-white z-50 ${notification.type === 'success' ? 'bg-success' : 'bg-danger'}`}>
                    <div className="flex items-center">
                        <span>{notification.message}</span>
                        <button onClick={() => setNotification(null)} className="ml-4 text-white font-bold">
                            &times;
                        </button>
                    </div>
                </div>
            )}
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
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Senha</th>
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
                                        <div className="text-sm text-gray-900">{entities.find(e => e.id === u.entityId)?.name}</div>
                                        {u.departmentId && <div className="text-sm text-gray-500">{departments.find(d => d.id === u.departmentId)?.name}</div>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{u.password}</td>
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
                                            <button onClick={() => handleSendCredentials(u)} className="text-green-600 hover:text-green-900" title="Enviar Credenciais">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
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
                    <UserForm user={editingUser} onSave={handleSave} onClose={() => setIsModalOpen(false)} entityId={entityId} />
                </Modal>
            </Card>
        </>
    );
};

export default UserManagement;
