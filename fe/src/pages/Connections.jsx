import { useEffect, useState } from 'react';
import api from '../api/axios';
import UserCard from '../components/UserCard';
import ShareSquadStory from '../components/profile/ShareSquadStory';
import { Users, UserCheck, Clock, UserMinus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Connections() {
  const [data, setData] = useState({ connections: [], pendingRequests: [], sentRequests: [] });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('connections');

  const fetchConnections = async () => {
    try {
      const res = await api.get('/users/connections');
      setData(res.data);
    } catch { toast.error('Failed to load connections'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchConnections(); }, []);

  const handleAccept = async (userId) => {
    try {
      await api.post(`/users/accept/${userId}`);
      toast.success('Connection accepted!');
      fetchConnections();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleReject = async (userId) => {
    try {
      await api.post(`/users/reject/${userId}`);
      toast.success('Request rejected');
      fetchConnections();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDisconnect = async (userId) => {
    if (!window.confirm('Are you sure you want to disconnect?')) return;
    try {
      await api.post(`/users/disconnect/${userId}`);
      toast.success('Disconnected successfully');
      fetchConnections();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to disconnect'); }
  };

  const tabs = [
    { key: 'connections', label: 'Connections', count: data.connections.length, icon: UserCheck },
    { key: 'pending', label: 'Pending', count: data.pendingRequests.length, icon: Clock },
    { key: 'sent', label: 'Sent', count: data.sentRequests.length, icon: Users },
  ];

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 dark:border-blue-400"></div></div>;

  const currentList = tab === 'connections' ? data.connections : tab === 'pending' ? data.pendingRequests : data.sentRequests;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Connections</h1>
        {tab === 'connections' && data.connections.length > 0 && (
          <ShareSquadStory connections={data.connections} />
        )}
      </div>
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        {tabs.map(({ key, label, count, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === key ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300'}`}>
            <Icon size={16} />{label}
            {count > 0 && <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs px-1.5 py-0.5 rounded-full">{count}</span>}
          </button>
        ))}
      </div>

      {currentList.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Users size={48} className="mx-auto mb-3 opacity-40" />
          <p>No {tab === 'connections' ? 'connections' : tab === 'pending' ? 'pending requests' : 'sent requests'} yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentList.map(u => (
            <UserCard key={u._id} user={u} actions={
              tab === 'pending' ? (
                <>
                  <button onClick={() => handleAccept(u._id)} className="btn-primary text-sm py-1.5">Accept</button>
                  <button onClick={() => handleReject(u._id)} className="btn-secondary text-sm py-1.5">Decline</button>
                </>
              ) : tab === 'sent' ? (
                <span className="text-sm text-gray-500 dark:text-gray-400">Request Sent</span>
              ) : (
                <div className="flex gap-2 w-full">
                  <a href={`/messages?with=${u._id}`} className="btn-primary text-sm py-1.5 flex-1 text-center">Message</a>
                  <button onClick={() => handleDisconnect(u._id)} className="btn-secondary text-sm py-1.5 px-3 border-red-200 dark:border-red-900/30 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20" title="Disconnect">
                     <UserMinus size={16} />
                  </button>
                </div>
              )
            } />
          ))}
        </div>
      )}
    </div>
  );
}
