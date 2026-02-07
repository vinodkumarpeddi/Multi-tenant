import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Building, User, Mail, Lock, Server, ArrowRight, Loader2 } from 'lucide-react';

const Register = () => {
    const { registerTenant } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        tenantName: '',
        subdomain: '',
        adminFullName: '',
        adminEmail: '',
        adminPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const res = await registerTenant(formData);

        if (res.success) {
            navigate('/login', { state: { message: 'Registration successful! Please sign in.' } });
        } else {
            setError(res.message);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute top-0 right-10 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
            </div>

            <div className="max-w-xl w-full space-y-8 relative z-10">
                <div className="text-center">
                    <div className="mx-auto h-16 w-16 bg-white rounded-2xl shadow-xl flex items-center justify-center mb-6 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                        <Building className="h-8 w-8 text-primary-600" />
                    </div>
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900 tracking-tight">
                        Register your Organization
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Get started with your multi-tenant workspace
                    </p>
                </div>

                <div className="bg-white/80 backdrop-blur-lg py-8 px-10 shadow-2xl rounded-2xl border border-white/50">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="rounded-lg bg-red-50 p-4 border border-red-200">
                                <div className="flex">
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-red-800">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-1 md:col-span-2">
                                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Organization Details</h3>
                            </div>

                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Organization Name</label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Building className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        className="input-field pl-10"
                                        placeholder="Acme Corp"
                                        value={formData.tenantName}
                                        onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Subdomain</label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Server className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        pattern="[a-z0-9-]+"
                                        title="Lowercase letters, numbers, and dashes only"
                                        className="input-field pl-10"
                                        placeholder="acme"
                                        value={formData.subdomain}
                                        onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
                                    />
                                </div>
                                <p className="mt-1 text-xs text-gray-500 font-mono">
                                    URL: <span className="text-primary-600 font-semibold">{formData.subdomain || 'company'}</span>.saas-platform.com
                                </p>
                            </div>

                            <div className="col-span-1 md:col-span-2 mt-2">
                                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Admin Account</h3>
                            </div>

                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        className="input-field pl-10"
                                        placeholder="John Doe"
                                        value={formData.adminFullName}
                                        onChange={(e) => setFormData({ ...formData, adminFullName: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email address</label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        className="input-field pl-10"
                                        placeholder="admin@acme.com"
                                        value={formData.adminEmail}
                                        onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Password</label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        className="input-field pl-10"
                                        placeholder="••••••••"
                                        value={formData.adminPassword}
                                        onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full btn-primary group relative flex justify-center py-2.5 px-4 text-lg"
                            >
                                {loading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        Get Started
                                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    <p className="mt-6 text-center text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500 hover:underline">
                            Sign in instead
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
