import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Trash2, User, Shield, ShieldAlert } from 'lucide-react';
import CreateUserModal from '../components/CreateUserModal';

const Users = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/tenants/${user.tenantId}/users?search=${searchTerm}`);
            if (res.data.success) {
                setUsers(res.data.data.users);
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.tenantId) {
            const delayDebounceFn = setTimeout(() => {
                fetchUsers();
            }, 500);
            return () => clearTimeout(delayDebounceFn);
        }
    }, [searchTerm, user?.tenantId]);

    const handleUserCreated = (newUser) => {
        setUsers([newUser, ...users]);
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;
        try {
            await api.delete(`/users/${userId}`);
            setUsers(users.filter(u => u.id !== userId));
        } catch (err) {
            alert('Failed to delete user');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add User
                </button>
            </div>

            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="bg-white shadow overflow-hidden rounded-md">
                <ul className="divide-y divide-gray-200">
                    {loading ? (
                        <li className="px-6 py-4 text-center text-sm text-gray-500">Loading users...</li>
                    ) : users.length === 0 ? (
                        <li className="px-6 py-4 text-center text-sm text-gray-500">No users found.</li>
                    ) : (
                        users.map((u) => (
                            <li key={u.id} className="px-6 py-4 hover:bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-blue-100">
                                                <span className="text-sm font-medium leading-none text-blue-700">
                                                    {u.full_name.charAt(0).toUpperCase()}
                                                </span>
                                            </span>
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">{u.full_name}</div>
                                            <div className="text-sm text-gray-500">{u.email}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${u.role === 'tenant_admin' ? 'bg-purple-100 text-purple-800' :
                                                u.role === 'super_admin' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {u.role === 'tenant_admin' && <ShieldAlert className="w-3 h-3 mr-1" />}
                                            {u.role === 'user' && <User className="w-3 h-3 mr-1" />}
                                            {u.role.replace('_', ' ')}
                                        </span>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {u.is_active ? 'Active' : 'Inactive'}
                                        </span>

                                        {u.id !== user.id && ( /* Cannot delete self */
                                            <button
                                                onClick={() => handleDeleteUser(u.id)}
                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                                title="Delete User"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </div>

            <CreateUserModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onUserCreated={handleUserCreated}
            />
        </div>
    );
};

export default Users;
