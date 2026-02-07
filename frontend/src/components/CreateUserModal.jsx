import React, { useState } from 'react';
import api from '../api/axios';
import { X } from 'lucide-react';

const CreateUserModal = ({ isOpen, onClose, onUserCreated }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState('user');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Need tenantId? The API endpoint for adding user is /api/tenants/:tenantId/users
            // But we can also access it if we know the tenantId from context or if the backend supports /api/users (which I didn't implement for creation, only nested).
            // Let's check AuthContext or just rely on the user object in localStorage/Context.
            // Actually, I can get tenantId from the current user's context. 
            // BUT wait, in `userController.js`, `addUser` is mounted at `POST /api/tenants/:tenantId/users`.
            // So we need the tenantId.
            // Let's assume the parent component passes it or we get it from auth.

            // However, looking at my `api/axios.js` and `AuthContext`, I have the user object.
            // I'll grab it from localStorage if needed, or better, use the endpoint that might not require ID if I changed it?
            // No, strictly following my backend implementation: `router.post('/:tenantId/users', ...)`

            // I need to get the current user's tenantId. 
            // Since this modal is inside `Users` page, and `Users` page is protected, I can assume `useAuth` is available.
            // But `CreateUserModal` is a pure component here. I'll pass tenantId as prop or use hook.
            // I'll use the prop approach for purity or just useAuth inside.
            // Let's use useAuth.
        } catch (err) {
            // ...
        }
    };

    // distinct implementation below
    return <CreateUserModalContent isOpen={isOpen} onClose={onClose} onUserCreated={onUserCreated} />;
};

// Real implementation
import { useAuth } from '../context/AuthContext';

const CreateUserModalContent = ({ isOpen, onClose, onUserCreated }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        role: 'user'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await api.post(`/tenants/${user.tenantId}/users`, formData);
            if (res.data.success) {
                onUserCreated(res.data.data);
                onClose();
                setFormData({ email: '', password: '', fullName: '', role: 'user' });
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-xl font-semibold text-gray-900">Add New User</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-400 p-4 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                            type="text"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            required
                            minLength={8}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                        <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        >
                            <option value="user">Regular User</option>
                            <option value="tenant_admin">Tenant Admin</option>
                        </select>
                    </div>

                    <div className="flex justify-end space-x-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateUserModalContent;
