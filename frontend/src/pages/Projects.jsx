import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { Plus, Search, Folder, Calendar } from 'lucide-react';
import CreateProjectModal from '../components/CreateProjectModal';

const Projects = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/projects?search=${searchTerm}`);
            if (res.data.success) {
                setProjects(res.data.data.projects);
            }
        } catch (error) {
            console.error("Failed to fetch projects", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchProjects();
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const handleProjectCreated = (newProject) => {
        setProjects([newProject, ...projects]);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    New Project
                </button>
            </div>

            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="text-center py-10">Loading projects...</div>
            ) : projects.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-lg shadow">
                    <Folder className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No projects</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by creating a new project.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {projects.map((project) => (
                        <Link
                            key={project.id}
                            to={`/projects/${project.id}`}
                            className="block bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
                        >
                            <div className="px-4 py-5 sm:p-6">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-lg font-medium text-gray-900 truncate pr-4">{project.name}</h3>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${project.status === 'active' ? 'bg-green-100 text-green-800' :
                                            project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                                'bg-gray-100 text-gray-800'
                                        }`}>
                                        {project.status}
                                    </span>
                                </div>
                                <p className="mt-2 text-sm text-gray-500 line-clamp-2 h-10">
                                    {project.description || 'No description provided.'}
                                </p>
                                <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                                    <div className="flex items-center">
                                        <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                        <p>{new Date(project.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        {project.completedTaskCount} / {project.taskCount} tasks
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            <CreateProjectModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onProjectCreated={handleProjectCreated}
            />
        </div>
    );
};

export default Projects;
