import React, { useEffect, useState } from 'react';
import { mockBackend } from '../services/mockBackend';
import { User, Election, AccountStatus, UserRole, AuditLog, Candidate } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { Check, X, Plus, Users, ShieldAlert, Activity, FileText, Trash2, UserPlus, Image as ImageIcon } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'VOTERS' | 'AUDIT'>('OVERVIEW');
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [elections, setElections] = useState<Election[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  
  // Analytics
  const [candidateResults, setCandidateResults] = useState<Record<string, any[]>>({});
  const [partyResults, setPartyResults] = useState<Record<string, any[]>>({});
  const [constituencyTurnout, setConstituencyTurnout] = useState<Record<string, any[]>>({});

  // Create Election Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  
  // New Candidate Form State
  const [newCandidates, setNewCandidates] = useState<Omit<Candidate, 'id'>[]>([]);
  const [candName, setCandName] = useState('');
  const [candParty, setCandParty] = useState('');
  const [candManifesto, setCandManifesto] = useState('');
  const [candImage, setCandImage] = useState('');

  const loadData = async () => {
    // User Data
    const users = await mockBackend.getAllUsers();
    setAllUsers(users);
    setPendingUsers(users.filter(u => u.status === AccountStatus.PENDING));
    
    // Election Data
    const activeElections = await mockBackend.getActiveElections();
    setElections(activeElections);

    // Audit Data
    const logs = await mockBackend.getAuditLogs();
    setAuditLogs(logs);

    // Process Analytics
    const cRes: Record<string, any[]> = {};
    const pRes: Record<string, any[]> = {};
    const conRes: Record<string, any[]> = {};
    
    for (const election of activeElections) {
      // Candidates
      const cData = await mockBackend.getElectionResults(election.id);
      cRes[election.id] = cData.map(d => ({
        name: election.candidates.find(c => c.id === d.candidateId)?.name || 'Unknown',
        votes: d.count
      }));

      // Parties
      const pData = await mockBackend.getPartyResults(election.id);
      pRes[election.id] = pData.map(d => ({ name: d.party, value: d.count }));

      // Constituencies
      const conData = await mockBackend.getConstituencyTurnout(election.id);
      conRes[election.id] = conData.map(d => ({ name: d.name, votes: d.votes }));
    }
    setCandidateResults(cRes);
    setPartyResults(pRes);
    setConstituencyTurnout(conRes);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); 
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (userId: string) => {
    await mockBackend.updateUserStatus(userId, AccountStatus.APPROVED);
    loadData();
  };

  const handleReject = async (userId: string) => {
    await mockBackend.updateUserStatus(userId, AccountStatus.REJECTED);
    loadData();
  };

  const handleAddCandidate = () => {
    if (!candName.trim() || !candParty.trim() || !candManifesto.trim()) {
      alert("Please fill in Name, Party, and Manifesto.");
      return;
    }

    setNewCandidates([
      ...newCandidates,
      {
        name: candName,
        party: candParty,
        manifesto: candManifesto,
        imageUrl: candImage || `https://picsum.photos/200?random=${Date.now()}`
      }
    ]);

    // Reset inputs
    setCandName('');
    setCandParty('');
    setCandManifesto('');
    setCandImage('');
  };

  const handleRemoveCandidate = (index: number) => {
    const updated = [...newCandidates];
    updated.splice(index, 1);
    setNewCandidates(updated);
  };

  const handleCreateElection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newCandidates.length < 2) {
      alert("An election requires at least 2 candidates.");
      return;
    }

    const candidatesWithIds: Candidate[] = newCandidates.map((c, idx) => ({
      ...c,
      id: `cand-${Date.now()}-${idx}`
    }));

    await mockBackend.createElection({
      title: newTitle,
      description: newDesc,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 86400000 * 7).toISOString(),
      candidates: candidatesWithIds
    });
    
    // Reset Form
    setShowCreateModal(false);
    setNewTitle('');
    setNewDesc('');
    setNewCandidates([]);
    loadData();
  };

  const votersList = allUsers.filter(u => u.role === UserRole.VOTER && u.status !== AccountStatus.PENDING);

  return (
    <div className="container mx-auto p-6 space-y-6 pb-24">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
           <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
             <ShieldAlert className="text-brand-600" /> 
             Election Official Console
           </h1>
           <p className="text-gray-500 text-sm">System Status: <span className="text-green-600 font-bold">ONLINE & SECURE</span></p>
        </div>
        <div className="flex gap-2">
           <button onClick={() => setShowCreateModal(true)} className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold shadow transition">
             <Plus size={16} /> New Election
           </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('OVERVIEW')}
          className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'OVERVIEW' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <Activity size={16} className="inline mr-2" /> Live Overview
        </button>
        <button 
          onClick={() => setActiveTab('VOTERS')}
          className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'VOTERS' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <Users size={16} className="inline mr-2" /> Voter Management
          {pendingUsers.length > 0 && <span className="ml-2 bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">{pendingUsers.length}</span>}
        </button>
        <button 
          onClick={() => setActiveTab('AUDIT')}
          className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'AUDIT' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <FileText size={16} className="inline mr-2" /> Audit Logs
        </button>
      </div>

      {/* --- TAB: AUDIT LOGS --- */}
      {activeTab === 'AUDIT' && (
        <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
             <h2 className="font-bold text-gray-700">System Immutable Log</h2>
             <span className="text-xs text-gray-400 font-mono">HASH: SHA-256-ENABLED</span>
          </div>
          <div className="overflow-auto h-[600px]">
             <table className="w-full text-left text-sm">
               <thead className="bg-gray-100 text-gray-500 sticky top-0">
                 <tr>
                   <th className="p-4">Timestamp</th>
                   <th className="p-4">Action</th>
                   <th className="p-4">Actor</th>
                   <th className="p-4">Details</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100 font-mono">
                 {auditLogs.map(log => (
                   <tr key={log.id} className="hover:bg-gray-50">
                     <td className="p-4 text-gray-500 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                     <td className="p-4 font-bold text-gray-700">{log.action}</td>
                     <td className="p-4 text-blue-600">{log.actorName} <span className="text-gray-400 text-xs block">{log.actorId}</span></td>
                     <td className="p-4 text-gray-600">{log.details}</td>
                   </tr>
                 ))}
                 {auditLogs.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-400">No logs found.</td></tr>}
               </tbody>
             </table>
          </div>
        </div>
      )}

      {/* --- TAB: VOTER MANAGEMENT --- */}
      {activeTab === 'VOTERS' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {/* Pending */}
           <section className="bg-white rounded-xl shadow border border-gray-200 p-6">
              <h3 className="font-bold text-lg mb-4 text-orange-600">Pending Validations</h3>
              {pendingUsers.length === 0 ? (
                <div className="p-8 text-center text-gray-400 bg-gray-50 rounded">All requests processed.</div>
              ) : (
                <ul className="space-y-3">
                  {pendingUsers.map(user => (
                    <li key={user.id} className="flex justify-between items-center p-3 border rounded hover:bg-orange-50 transition">
                      <div>
                        <div className="font-bold">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                        <div className="text-xs text-gray-500">ID: {user.voterId || 'Generating...'}</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleApprove(user.id)} className="bg-green-100 text-green-700 p-2 rounded"><Check size={16} /></button>
                        <button onClick={() => handleReject(user.id)} className="bg-red-100 text-red-700 p-2 rounded"><X size={16} /></button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
           </section>

           {/* Registry */}
           <section className="bg-white rounded-xl shadow border border-gray-200 p-6">
              <h3 className="font-bold text-lg mb-4 text-brand-900">Electoral Roll ({votersList.length})</h3>
              <div className="overflow-auto max-h-[500px]">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left">
                    <tr>
                      <th className="p-2">Voter ID</th>
                      <th className="p-2">Name</th>
                      <th className="p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {votersList.map(user => (
                      <tr key={user.id}>
                        <td className="p-2 font-mono text-gray-500">{user.voterId}</td>
                        <td className="p-2 font-medium">{user.name}</td>
                        <td className="p-2 text-green-600 font-bold text-xs">{user.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </section>
        </div>
      )}

      {/* --- TAB: OVERVIEW --- */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-8">
          {elections.map(election => (
            <div key={election.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-slate-800 text-white px-6 py-4 border-b flex justify-between">
                <div>
                  <h3 className="text-lg font-bold">{election.title}</h3>
                  <p className="text-slate-300 text-xs font-mono tracking-wide uppercase">ID: {election.id}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{
                     (candidateResults[election.id] || []).reduce((acc, curr) => acc + curr.votes, 0)
                  }</div>
                  <div className="text-xs uppercase opacity-70">Total Votes Cast</div>
                </div>
              </div>
              
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Chart 1: Candidates */}
                <div className="h-60">
                   <h4 className="text-xs font-bold text-gray-500 uppercase mb-4">Candidate Performance</h4>
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={candidateResults[election.id]} layout="vertical" margin={{left: 40}}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 10}} />
                        <Tooltip />
                        <Bar dataKey="votes" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Chart 2: Parties */}
                <div className="h-60">
                   <h4 className="text-xs font-bold text-gray-500 uppercase mb-4">Party Share</h4>
                   <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={partyResults[election.id]} cx="50%" cy="50%" innerRadius={40} outerRadius={70} fill="#8884d8" paddingAngle={5} dataKey="value">
                          {partyResults[election.id] && partyResults[election.id].map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" iconSize={8} wrapperStyle={{fontSize: '10px'}}/>
                      </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Chart 3: Constituency Turnout (New) */}
                <div className="h-60">
                   <h4 className="text-xs font-bold text-gray-500 uppercase mb-4">Turnout by Constituency</h4>
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={constituencyTurnout[election.id]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{fontSize: 10}} interval={0} angle={-25} textAnchor="end" height={60} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="votes" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Creation */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FileText className="text-brand-600" />
                Setup New Election
              </h2>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form onSubmit={handleCreateElection} className="space-y-6">
                
                {/* Step 1: Election Details */}
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide border-b pb-2">1. Election Details</h3>
                  <div>
                    <label className="block text-sm font-medium mb-1">Election Title</label>
                    <input 
                      className="w-full border p-2 rounded focus:ring-2 focus:ring-brand-500 outline-none" 
                      placeholder="e.g. National General Assembly 2025"
                      value={newTitle} 
                      onChange={e => setNewTitle(e.target.value)} 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea 
                      className="w-full border p-2 rounded focus:ring-2 focus:ring-brand-500 outline-none" 
                      rows={3} 
                      placeholder="Describe the purpose of this election..."
                      value={newDesc} 
                      onChange={e => setNewDesc(e.target.value)} 
                      required 
                    />
                  </div>
                </div>

                {/* Step 2: Candidate Management */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">2. Candidates & Parties</h3>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{newCandidates.length} Added</span>
                  </div>

                  {/* Add Candidate Form */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 grid gap-3">
                    <div className="grid grid-cols-2 gap-3">
                       <input 
                          className="border p-2 rounded text-sm" 
                          placeholder="Candidate Name" 
                          value={candName} 
                          onChange={e => setCandName(e.target.value)} 
                       />
                       <input 
                          className="border p-2 rounded text-sm" 
                          placeholder="Party Affiliation" 
                          value={candParty} 
                          onChange={e => setCandParty(e.target.value)} 
                       />
                    </div>
                    <textarea 
                       className="border p-2 rounded text-sm w-full" 
                       rows={2} 
                       placeholder="Manifesto / Key Promises..." 
                       value={candManifesto} 
                       onChange={e => setCandManifesto(e.target.value)} 
                    />
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <ImageIcon size={16} className="absolute left-3 top-3 text-gray-400" />
                        <input 
                            className="border p-2 pl-9 rounded text-sm w-full" 
                            placeholder="Image URL (Optional)" 
                            value={candImage} 
                            onChange={e => setCandImage(e.target.value)} 
                        />
                      </div>
                      <button 
                        type="button" 
                        onClick={handleAddCandidate}
                        className="bg-brand-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-brand-700 flex items-center gap-2"
                      >
                        <UserPlus size={16} /> Add
                      </button>
                    </div>
                  </div>

                  {/* Added Candidates List */}
                  {newCandidates.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {newCandidates.map((c, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-white border p-3 rounded shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                               <img src={c.imageUrl} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <div className="font-bold text-sm">{c.name}</div>
                              <div className="text-xs text-gray-500">{c.party}</div>
                            </div>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveCandidate(idx)}
                            className="text-red-500 hover:bg-red-50 p-2 rounded transition"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-sm text-gray-400 py-4 italic border-2 border-dashed rounded">
                      No candidates added yet. Add at least 2.
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => setShowCreateModal(false)} 
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className={`px-6 py-2 bg-brand-600 text-white rounded font-bold shadow-md transition ${newCandidates.length < 2 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-brand-700'}`}
                    disabled={newCandidates.length < 2}
                  >
                    Launch Election
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};