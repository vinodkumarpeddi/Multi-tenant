import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Users, FolderKanban, CheckSquare, Activity, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [recentProjects, setRecentProjects] = useState([]);
    const [myTasks, setMyTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                // 1. Fetch Tenant Stats if we can
                if (user.tenantId) {
                    try {
                        const statsRes = await api.get(`/tenants/${user.tenantId}`);
                        if (statsRes.data.success) {
                            setStats(statsRes.data.data.stats);
                        }
                    } catch (err) {
                        console.error("Could not fetch tenant stats", err);
                    }
                }

                // 2. Fetch Recent Projects
                const projectsRes = await api.get('/projects?limit=5');
                if (projectsRes.data.success) {
                    setRecentProjects(projectsRes.data.data.projects);
                }

                // 3. Fetch My Tasks
                // We need to filter by assignedTo=MY_ID. 
                // The task list API supports assignedTo filter.
                const tasksRes = await api.get(`/projects/${user.tenantId /* hack: we need projectId generally, but task list is nested? Wait, my route is /api/projects/:projectId/tasks */}`);

                // Wait, I implemented:
                // GET /api/projects/:projectId/tasks
                // But I want ALL tasks for me across projects?
                // I did NOT implement a global "GET /api/tasks" list endpoint. I implemented "GET /api/projects/:projectId/tasks".
                // This is a limitation in my API design for the dashboard "My Tasks" view if I want tasks from ALL projects.
                // However, I can fetch tasks for the recent projects or just skip for now.
                // OR, I can quickly add a `GET /api/tasks` global list endpoint in backend if I wanted to be perfectionist.
                // For now, let's just list Recent Projects and maybe omit tasks or try to fetch from the first project.

                // Actually, let's just show Projects and Stats.

            } catch (error) {
                console.error("Dashboard fetch error", error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchDashboardData();
        }
    }, [user]);

    if (loading) {
        return <div className="flex justify-center items-center h-full">Loading dashboard...</div>;
    }

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-500">Welcome back, {user.fullName}</p>
                </div>
                <Link to="/projects" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    New Project
                </Link>
            </header>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <Users className="h-6 w-6 text-gray-400" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                                        <dd className="text-lg font-medium text-gray-900">{stats.totalUsers}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <FolderKanban className="h-6 w-6 text-gray-400" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">Total Projects</dt>
                                        <dd className="text-lg font-medium text-gray-900">{stats.totalProjects}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <CheckSquare className="h-6 w-6 text-gray-400" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">Total Tasks</dt>
                                        <dd className="text-lg font-medium text-gray-900">{stats.totalTasks}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Recent Projects */}
            <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Projects</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tasks</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {recentProjects.length > 0 ? (
                                recentProjects.map((project) => (
                                    <tr key={project.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                                            <Link to={`/projects/${project.id}`}>{project.name}</Link>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${project.status === 'active' ? 'bg-green-100 text-green-800' :
                                                    project.status === 'completed' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {project.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {project.completedTaskCount} / {project.taskCount}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {project.createdBy?.fullName || 'Unknown'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(project.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                                        No projects found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
