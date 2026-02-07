import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Plus, Calendar, User, ArrowLeft, Trash2, Edit2, AlertCircle } from 'lucide-react';
import CreateTaskModal from '../components/CreateTaskModal';

const ProjectDetails = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

    // Status filter
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchProjectData();
    }, [projectId]);

    const fetchProjectData = async () => {
        try {
            setLoading(true);
            const [projRes, tasksRes] = await Promise.all([
                api.get(`/projects/${projectId}`),
                api.get(`/projects/${projectId}/tasks`)
            ]);

            if (projRes.data.success) setProject(projRes.data.data);
            if (tasksRes.data.success) setTasks(tasksRes.data.data.tasks);

        } catch (error) {
            console.error("Failed to fetch data", error);
            // If 404/403 back to projects
            // navigate('/projects');
        } finally {
            setLoading(false);
        }
    };

    const handleTaskCreated = (newTask) => {
        setTasks([...tasks, newTask]);
    };

    const handleTaskStatusChange = async (taskId, newStatus) => {
        try {
            await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
            setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
        } catch (err) {
            console.error("Failed to update status", err);
        }
    };

    const handleDeleteProject = async () => {
        if (!window.confirm("Are you sure? This will delete all tasks within the project.")) return;
        try {
            await api.delete(`/projects/${projectId}`);
            navigate('/projects');
        } catch (err) {
            alert('Failed to delete project');
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm("Delete this task?")) return;
        try {
            await api.delete(`/tasks/${taskId}`);
            setTasks(tasks.filter(t => t.id !== taskId));
        } catch (err) {
            console.error(err);
        }
    };

    const filteredTasks = statusFilter === 'all'
        ? tasks
        : tasks.filter(t => t.status === statusFilter);

    if (loading) return <div className="p-10">Loading...</div>;
    if (!project) return <div className="p-10">Project not found</div>;

    const getPriorityColor = (p) => {
        switch (p) {
            case 'high': return 'bg-red-100 text-red-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'low': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white shadow rounded-lg p-6">
                <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                    <div>
                        <button onClick={() => navigate('/projects')} className="mb-2 flex items-center text-sm text-gray-500 hover:text-gray-700">
                            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Projects
                        </button>
                        <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
                        <p className="mt-1 text-gray-500">{project.description}</p>
                        <div className="mt-2 flex items-center text-sm text-gray-500 space-x-4">
                            <span>Created by {project.createdBy?.fullName}</span>
                            <span>•</span>
                            <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <button
                            onClick={() => setIsTaskModalOpen(true)}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Task
                        </button>
                        {(user.role === 'tenant_admin' || user.id === project.createdBy.id) && (
                            <button
                                onClick={handleDeleteProject}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Project
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Task Board / List */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Tasks</h2>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="block rounded-md border-gray-300 py-1.5 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                    >
                        <option value="all">All Tasks</option>
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>

                {filteredTasks.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-lg border border-dashed border-gray-300">
                        <p className="text-gray-500">No tasks found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredTasks.map(task => (
                            <div key={task.id} className="bg-white p-4 rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-semibold text-gray-900">{task.title}</h3>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                        {task.priority}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{task.description}</p>

                                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                                    <div className="flex items-center">
                                        <User className="h-3 w-3 mr-1" />
                                        {task.assignedTo ? task.assignedTo.fullName : 'Unassigned'}
                                    </div>
                                    <div className="flex items-center">
                                        <Calendar className="h-3 w-3 mr-1" />
                                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                                    </div>
                                </div>

                                <div className="border-t pt-2 flex justify-between items-center">
                                    <select
                                        value={task.status}
                                        onChange={(e) => handleTaskStatusChange(task.id, e.target.value)}
                                        className="text-xs border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="todo">To Do</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="completed">Completed</option>
                                    </select>

                                    <button
                                        onClick={() => handleDeleteTask(task.id)}
                                        className="text-gray-400 hover:text-red-500"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <CreateTaskModal
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
                projectId={projectId}
                tenantId={user.tenantId} // Pass tenantId for fetching users
                onTaskCreated={handleTaskCreated}
            />
        </div>
    );
};

export default ProjectDetails;
