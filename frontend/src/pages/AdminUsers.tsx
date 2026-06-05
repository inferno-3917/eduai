import React, { useEffect, useState } from 'react';
import { useAppSelector } from '../store';
import api from '../utils/api';
import { Users, UserPlus, Edit2, Trash2, X, AlertTriangle, Key } from 'lucide-react';

export default function AdminUsers() {
  const authUser = useAppSelector((state) => state.auth.user);
  
  // Data State
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null); // null means adding a new user

  // Form Field State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/stats');
      setUsersList(res.data.users);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to retrieve user accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openAddModal = () => {
    setSelectedUser(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('student');
    setFormError('');
    setIsFormModalOpen(true);
  };

  const openEditModal = (usr: any) => {
    setSelectedUser(usr);
    setName(usr.name);
    setEmail(usr.email);
    setPassword(''); // leave blank by default (only update if filled)
    setRole(usr.role);
    setFormError('');
    setIsFormModalOpen(true);
  };

  const openDeleteModal = (usr: any) => {
    setSelectedUser(usr);
    setFormError('');
    setIsDeleteModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      if (selectedUser) {
        // Edit Mode
        const payload: any = { name, email, role };
        if (password.trim() !== '') {
          payload.password = password;
        }
        await api.put(`/admin/users/${selectedUser.id}`, payload);
      } else {
        // Add Mode
        if (password.trim() === '') {
          setFormError('Password is required for new accounts.');
          setIsSubmitting(false);
          return;
        }
        await api.post('/admin/users', { name, email, password, role });
      }

      setIsFormModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      console.error('User save error:', err);
      setFormError(err.response?.data?.message || 'Failed to save user details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;
    setFormError('');
    setIsSubmitting(true);

    try {
      await api.delete(`/admin/users/${selectedUser.id}`);
      setIsDeleteModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      console.error('Delete error:', err);
      setFormError(err.response?.data?.message || 'Failed to delete user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && usersList.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Users className="w-8 h-8 text-violet-400" />
            Manage Platform Users
          </h2>
          <p className="text-slate-400 mt-2">View, create, edit, or delete registered platform accounts.</p>
        </div>
        <button
          onClick={openAddModal}
          className="btn-primary flex items-center gap-2 text-sm font-semibold py-2.5 px-4 cursor-pointer"
        >
          <UserPlus className="w-4.5 h-4.5" />
          Add User Account
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-500/15 border border-red-500/25 rounded-lg text-red-400 text-sm">
          {errorMessage}
        </div>
      )}

      {/* Users table */}
      <div className="glass-panel p-6 rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400 border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-200 font-semibold">
                <th className="py-3 px-4">User ID</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Privilege Role</th>
                <th className="py-3 px-4">Joined Date</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersList.map((usr) => (
                <tr key={usr.id} className="border-b border-slate-800/40 hover:bg-slate-900/20 transition-colors">
                  <td className="py-3 px-4 text-violet-400 font-mono">#{usr.id}</td>
                  <td className="py-3 px-4 text-slate-200 font-semibold">{usr.name}</td>
                  <td className="py-3 px-4">{usr.email}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                      usr.role === 'admin' 
                        ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20' 
                        : usr.role === 'teacher' 
                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                        : 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                    }`}>
                      {usr.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs">{new Date(usr.created_at).toLocaleDateString()}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => openEditModal(usr)}
                        className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                        title="Edit User"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(usr)}
                        disabled={usr.id === authUser?.id}
                        className={`p-1.5 rounded transition-colors cursor-pointer ${
                          usr.id === authUser?.id
                            ? 'bg-slate-900/40 text-slate-600 cursor-not-allowed'
                            : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300'
                        }`}
                        title={usr.id === authUser?.id ? 'You cannot delete your own account' : 'Delete User'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ----------------- ADD / EDIT USER DIALOG MODAL ----------------- */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-md glass-panel p-8 rounded-2xl glass-panel-glow relative">
            <button
              onClick={() => setIsFormModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
              {selectedUser ? 'Edit User Credentials' : 'Create New Account'}
            </h3>
            <p className="text-slate-400 text-xs mb-6">
              {selectedUser 
                ? `Modifying credentials for User ID #${selectedUser.id}` 
                : 'Registers a new credential set onto the database platform.'}
            </p>

            {formError && (
              <div className="mb-6 p-4 bg-red-500/15 border border-red-500/25 rounded-lg text-red-400 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter user's name"
                  className="w-full text-sm py-2 px-3 bg-slate-900 border border-slate-800 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@eduai.com"
                  className="w-full text-sm py-2 px-3 bg-slate-900 border border-slate-800 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Password</span>
                  {selectedUser && <span className="text-[10px] text-slate-500 font-normal lowercase">(leave blank to keep unchanged)</span>}
                </label>
                <input
                  type="password"
                  required={!selectedUser}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={selectedUser ? '••••••••' : 'Minimum 6 characters'}
                  className="w-full text-sm py-2 px-3 bg-slate-900 border border-slate-800 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Privilege Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full text-sm py-2.5 px-3 bg-slate-900 border border-slate-800 rounded-lg text-white capitalize cursor-pointer focus:ring-1 focus:ring-violet-500"
                >
                  <option value="student">Student (Learner)</option>
                  <option value="teacher">Teacher (Instructor)</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="btn-secondary flex-1 py-2.5 text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary flex-1 py-2.5 text-sm cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- DELETE CONFIRMATION DIALOG MODAL ----------------- */}
      {isDeleteModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-sm glass-panel p-6 rounded-2xl glass-panel-glow border-red-500/20 relative">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Delete User Account?</h3>
                <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                  Are you sure you want to permanently delete user **{selectedUser.name}** (`{selectedUser.email}`)?
                </p>
                <p className="text-red-400/80 text-[10px] font-semibold mt-2 uppercase tracking-wide">
                  ⚠️ This action is permanent and will cascade delete all related database records.
                </p>
              </div>
            </div>

            {formError && (
              <div className="mt-4 p-3 bg-red-500/15 border border-red-500/25 rounded-lg text-red-400 text-xs">
                {formError}
              </div>
            )}

            <div className="flex gap-4 mt-6">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="btn-secondary flex-1 py-2 text-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isSubmitting}
                className="bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold flex-1 py-2 text-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
