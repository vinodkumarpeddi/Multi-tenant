import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    FolderKanban,
    Users,
    Building,
    LogOut,
    Menu,
    X,
    Server,
    Bell,
    ChevronDown,
    Search
} from 'lucide-react';

const SidebarLink = ({ to, icon: Icon, children, active }) => (
    <Link
        to={to}
        className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${active
                ? 'bg-primary-50 text-primary-700'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
    >
        <Icon
            className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-200 ${active ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'
                }`}
        />
        {children}
    </Link>
);

const Layout = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/projects', label: 'Projects', icon: FolderKanban },
        { path: '/users', label: 'Team', icon: Users },
    ];

    if (user && user.role === 'super_admin') {
        navItems.push({ path: '/tenants', label: 'Tenants', icon: Building });
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                ></div>
            )}

            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 flex w-64 flex-col bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                }`}>
                <div className="flex h-16 flex-shrink-0 items-center px-4 border-b border-gray-100">
                    <Server className="h-8 w-8 text-primary-600" />
                    <span className="ml-2 text-xl font-bold text-gray-900 tracking-tight">SaaS Cloud</span>
                </div>

                <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
                    <nav className="mt-1 flex-1 space-y-1 px-3">
                        <div className="mb-6 px-3">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                {user?.role === 'super_admin' ? 'System Admin' : user?.tenantName || 'Workspace'}
                            </p>
                        </div>

                        {navItems.map((item) => (
                            <SidebarLink
                                key={item.path}
                                to={item.path}
                                icon={item.icon}
                                active={location.pathname.startsWith(item.path)}
                            >
                                {item.label}
                            </SidebarLink>
                        ))}
                    </nav>
                </div>

                <div className="flex flex-shrink-0 border-t border-gray-200 p-4">
                    <div className="group block w-full flex-shrink-0">
                        <div className="flex items-center">
                            <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-bold">
                                {user?.fullName?.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                                    {user?.fullName}
                                </p>
                                <button
                                    onClick={logout}
                                    className="text-xs font-medium text-gray-500 hover:text-red-600 flex items-center mt-1 transition-colors"
                                >
                                    <LogOut className="h-3 w-3 mr-1" />
                                    Sign out
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-1 flex-col overflow-hidden">
                <header className="bg-white border-b border-gray-200 shadow-sm h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
                    <button
                        className="md:hidden text-gray-500 hover:text-gray-700 focus:outline-none"
                        onClick={() => setIsMobileMenuOpen(true)}
                    >
                        <Menu className="h-6 w-6" />
                    </button>

                    <div className="flex-1 flex justify-between items-center ml-4 md:ml-0">
                        <div className="flex-1 flex max-w-lg ml-0 md:ml-4">
                            <div className="relative w-full text-gray-400 focus-within:text-gray-600">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center">
                                    <Search className="h-5 w-5" aria-hidden="true" />
                                </div>
                                <input
                                    name="search"
                                    id="search"
                                    className="block h-full w-full border-transparent py-2 pl-8 pr-3 text-gray-900 placeholder-gray-500 focus:border-transparent focus:placeholder-gray-400 focus:outline-none focus:ring-0 sm:text-sm"
                                    placeholder="Search..."
                                    type="search"
                                />
                            </div>
                        </div>
                        <div className="ml-4 flex items-center md:ml-6 space-x-4">
                            <button className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                                <span className="sr-only">View notifications</span>
                                <Bell className="h-6 w-6" />
                            </button>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
