import React, { useEffect, useState } from 'react';
import { useAppSelector } from '../store';
import api from '../utils/api';
import { Users } from 'lucide-react';

export default function AdminUsers() {
  const { user } = useAppSelector((state) => state.auth);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await api.get('/admin/stats');
        setUsersList(res.data.users);
      } catch (err) {
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Manage Platform Users</h2>
          <p className="text-slate-400 mt-2">View and oversee all registered student, teacher, and administrator accounts.</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500 border border-violet-500/20">
          <Users className="w-6 h-6" />
        </div>
      </div>

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
              </tr>
            </thead>
            <tbody>
              {usersList.map((usr) => (
                <tr key={usr.id} className="border-b border-slate-800/40 hover:bg-slate-900/20">
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
