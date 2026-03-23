import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Users, Plus, X, Search, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import GroupQuickPeek from '../components/GroupQuickPeek';

export default function PublicGroups() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', description: '', subject: '', maxMembers: 50 });
  const [creating, setCreating] = useState(false);

  const fetchGroups = async () => {
    try {
      const res = await api.get(`/groups?search=${search}`);
      setGroups(res.data);
    } catch {
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchGroups, 500);
    return () => clearTimeout(timer);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/groups', form);
      toast.success('Group created!');
      setShowForm(false);
      setForm({ name: '', description: '', subject: '', maxMembers: 50 });
      fetchGroups();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (id) => {
    try {
      await api.post(`/groups/${id}/join`);
      toast.success('Joined group!');
      fetchGroups();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join');
    }
  };

  const handleLeave = async (id) => {
    try {
      await api.post(`/groups/${id}/leave`);
      toast.success('Left group');
      fetchGroups();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to leave');
    }
  };

  if (loading && !groups.length) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Users size={24} className="text-blue-600" /> Public Study Groups
        </h1>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search groups..."
              className="input pl-10 py-2 min-w-[250px]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center justify-center gap-2 px-4 py-2">
            <Plus size={18} /> Create Group
          </button>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold dark:text-white">Create Study Group</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <input className="input" placeholder="Group Name (e.g. GATE 2025 Prep) *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              <input className="input" placeholder="Subject Focus *" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required />
              <textarea className="input" rows={3} placeholder="Description *" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Max Members</label>
                <input type="number" className="input" value={form.maxMembers} onChange={e => setForm({ ...form, maxMembers: +e.target.value })} min={2} max={500} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1" disabled={creating}>{creating ? 'Creating...' : 'Create Group'}</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {groups.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50">
          <Users size={48} className="mx-auto mb-3 opacity-40" />
          <p className="text-lg font-medium">No groups found</p>
          <p className="text-sm mt-1">Be the first to create one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map(group => {
            const isMember = group.members.includes(user?._id);
            const isFull = group.members.length >= group.maxMembers;
            
            return (
              <GroupQuickPeek key={group._id} groupId={group._id}>
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow flex flex-col w-full text-left">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white line-clamp-1">{group.name}</h3>
                    <span className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs font-medium px-2 py-1 rounded-md">{group.subject}</span>
                  </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 flex-grow mb-4">{group.description}</p>
                
                <div className="flex items-center justify-between text-sm mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center text-gray-500 dark:text-gray-400">
                    <Users size={16} className="mr-1.5" />
                    <span>{group.members.length} / {group.maxMembers}</span>
                  </div>
                  
                  {isMember ? (
                    <div className="flex items-center gap-2">
                      <button onClick={(e) => { e.stopPropagation(); navigate(`/groups/${group._id}`); }} className="btn-primary py-1 px-3 text-sm flex items-center gap-1">
                        Open Hub <ChevronRight size={14} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleLeave(group._id); }} className="btn-secondary py-1 px-3 text-sm flex items-center gap-1 !text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-900/20">
                        Leave
                      </button>
                    </div>
                  ) : isFull ? (
                    <span className="text-gray-400 text-sm font-medium px-3 py-1">Full</span>
                  ) : (
                    <button onClick={(e) => { e.stopPropagation(); handleJoin(group._id); }} className="btn-primary py-1 px-3 text-sm">
                      Join Group
                    </button>
                  )}
                </div>
              </div>
            </GroupQuickPeek>
          );
        })}
        </div>
      )}
    </div>
  );
}
