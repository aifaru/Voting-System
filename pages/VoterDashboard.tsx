import React, { useEffect, useState } from 'react';
import { mockBackend } from '../services/mockBackend';
import { generateSimpleSummary, generateManifestoAnalysis } from '../services/geminiService';
import { Election, User, AccountStatus, Constituency } from '../types';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { Volume2, Info, CheckCircle, Lock, Calendar, Loader2, AlertTriangle, MapPin, CreditCard } from 'lucide-react';

interface VoterDashboardProps {
  user: User;
}

export const VoterDashboard: React.FC<VoterDashboardProps> = ({ user }) => {
  const [elections, setElections] = useState<Election[]>([]);
  const [votedElections, setVotedElections] = useState<Set<string>>(new Set());
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [candidateAnalysis, setCandidateAnalysis] = useState<Record<string, string>>({});
  const [userConstituency, setUserConstituency] = useState<Constituency | null>(null);
  
  // Voting State
  const [confirmingVoteId, setConfirmingVoteId] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const { speakText } = useAccessibility();

  useEffect(() => {
    const init = async () => {
      // Load Elections
      const active = await mockBackend.getActiveElections();
      setElections(active);

      // Check Voting History
      const votedSet = new Set<string>();
      for (const elec of active) {
        const hasVoted = await mockBackend.hasVoted(elec.id, user.id);
        if (hasVoted) votedSet.add(elec.id);
      }
      setVotedElections(votedSet);

      // Load Constituency Data
      if (user.constituencyId) {
        const cons = await mockBackend.getConstituencies();
        const myCon = cons.find(c => c.id === user.constituencyId);
        if (myCon) setUserConstituency(myCon);
      }
    };
    init();
  }, [user.id, user.constituencyId]);

  const handleSelectElection = async (election: Election) => {
    setSelectedElection(election);
    setSuccessMsg('');
    setConfirmingVoteId(null);
    setAiSummary('Loading simplified summary...');
    // AI Feature: Simplify description
    const summary = await generateSimpleSummary(election.description);
    setAiSummary(summary);
    
    // AI Feature: Analyze Candidates
    const analysis: Record<string, string> = {};
    for(const cand of election.candidates) {
        analysis[cand.id] = await generateManifestoAnalysis(cand.name, cand.party, cand.manifesto);
    }
    setCandidateAnalysis(analysis);
  };

  const handleConfirmVote = async (candidateId: string) => {
    if (!selectedElection) return;
    setIsVoting(true);
    
    try {
      await mockBackend.castVote(selectedElection.id, user.id, candidateId);
      
      setVotedElections(prev => new Set(prev).add(selectedElection.id));
      setSuccessMsg("Vote submitted successfully! Thank you for participating.");
      speakText("Vote submitted successfully.");
      
      setTimeout(() => {
        setSelectedElection(null);
        setSuccessMsg('');
        setIsVoting(false);
        setConfirmingVoteId(null);
      }, 3000);
      
    } catch (e: any) {
      alert(e.message);
      setIsVoting(false);
      setConfirmingVoteId(null);
    }
  };

  if (user.status !== AccountStatus.APPROVED) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="bg-yellow-50 p-8 rounded-full mb-6 animate-pulse">
          <Lock size={64} className="text-yellow-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Account Verification Pending</h2>
        <p className="text-gray-600 max-w-md">
          Your voter registration is currently being reviewed by an election official. 
          You will be notified once your voting rights are activated.
        </p>
      </div>
    );
  }

  // Voting Booth View
  if (selectedElection) {
    if (successMsg) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center animate-in zoom-in duration-300">
           <div className="bg-green-100 p-6 rounded-full mb-6">
             <CheckCircle size={80} className="text-green-600" />
           </div>
           <h2 className="text-3xl font-bold text-green-800 mb-2">Vote Recorded!</h2>
           <p className="text-gray-600 mb-8 text-lg">Your voice has been heard. Redirecting to dashboard...</p>
        </div>
      );
    }

    return (
      <div className="container mx-auto p-4 md:p-8 pb-24">
        <button 
          onClick={() => setSelectedElection(null)}
          className="mb-6 text-brand-600 hover:underline flex items-center gap-2 font-medium"
        >
          &larr; Back to Election List
        </button>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="p-8 border-b bg-gray-50">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-2 text-brand-900">{selectedElection.title}</h1>
                <p className="text-gray-600 mb-4 max-w-2xl">{selectedElection.description}</p>
                {userConstituency && (
                  <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 px-3 py-1 rounded-full text-sm font-medium border border-brand-100">
                    <MapPin size={14} /> Voting for: {userConstituency.name}
                  </div>
                )}
              </div>
              <button onClick={() => speakText(selectedElection.description)} className="p-2 bg-brand-100 rounded-full hover:bg-brand-200 text-brand-700 self-start" title="Read Aloud">
                <Volume2 size={24} />
              </button>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mt-6">
              <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wide flex items-center gap-2 mb-1">
                 <Info size={16} /> AI Simplified Summary
              </h3>
              <p className="text-blue-900">{aiSummary}</p>
            </div>
          </div>

          <div className="p-8 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {selectedElection.candidates.map(candidate => (
              <div key={candidate.id} className="relative border-2 border-gray-200 rounded-xl p-6 hover:border-brand-400 hover:shadow-lg transition flex flex-col h-full bg-white group">
                
                {/* Confirmation Overlay */}
                {confirmingVoteId === candidate.id && (
                  <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 text-center rounded-xl animate-in fade-in duration-200">
                    <AlertTriangle size={48} className="text-brand-600 mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Your Vote</h3>
                    <p className="text-gray-600 mb-6">You are about to cast a secure vote for <span className="font-bold text-brand-700">{candidate.name}</span>. This action cannot be undone.</p>
                    <div className="flex flex-col w-full gap-3">
                      <button 
                        onClick={() => handleConfirmVote(candidate.id)}
                        disabled={isVoting}
                        className="w-full bg-brand-600 text-white font-bold py-3 rounded-lg hover:bg-brand-700 transition flex justify-center items-center gap-2"
                      >
                        {isVoting ? <Loader2 className="animate-spin" /> : <CheckCircle size={20} />}
                        {isVoting ? 'Submitting...' : 'Yes, Cast My Vote'}
                      </button>
                      <button 
                        onClick={() => setConfirmingVoteId(null)}
                        disabled={isVoting}
                        className="w-full bg-gray-100 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-200 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 mb-4">
                  {candidate.imageUrl && (
                    <img src={candidate.imageUrl} alt={candidate.name} className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm" />
                  )}
                  <div>
                    <h3 className="text-xl font-bold">{candidate.name}</h3>
                    <p className="text-sm text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded inline-block">{candidate.party}</p>
                  </div>
                </div>
                
                <div className="flex-1 mb-6">
                  <p className="text-gray-700 italic mb-3">"{candidate.manifesto}"</p>
                  {candidateAnalysis[candidate.id] ? (
                     <div className="text-sm bg-gray-50 p-3 rounded text-gray-600 border border-gray-100">
                        <strong className="block text-gray-800 mb-1">Key Impact Analysis:</strong>
                        {candidateAnalysis[candidate.id]}
                     </div>
                  ) : <span className="text-xs text-gray-400">Analyzing manifesto...</span>}
                </div>

                <button 
                  onClick={() => setConfirmingVoteId(candidate.id)}
                  className="w-full bg-brand-600 text-white font-bold py-3 rounded-lg hover:bg-brand-700 transition focus:ring-4 focus:ring-brand-200"
                  aria-label={`Select ${candidate.name}`}
                >
                  Select Candidate
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Dashboard List View
  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      
      {/* Voter ID Card Header */}
      <div className="bg-gradient-to-r from-brand-900 to-brand-700 rounded-xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">Voter Dashboard</h1>
          <p className="opacity-80">Welcome, <span className="font-semibold">{user.name}</span>. Secure Digital Voting Console.</p>
        </div>
        <div className="bg-white/10 backdrop-blur-md p-4 rounded-lg border border-white/20 flex flex-col gap-2 min-w-[250px]">
           <div className="flex items-center gap-2 text-sm font-bold text-brand-100 uppercase tracking-wider">
             <CreditCard size={14} /> Official Voter ID
           </div>
           <div className="text-xl font-mono tracking-widest">{user.voterId || 'PENDING-GEN'}</div>
           {userConstituency && (
             <div className="text-sm flex items-center gap-1 opacity-90 border-t border-white/20 pt-2 mt-1">
               <MapPin size={12} /> {userConstituency.name} ({userConstituency.region})
             </div>
           )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {elections.map(election => {
          const hasVoted = votedElections.has(election.id);
          return (
            <div key={election.id} className={`bg-white rounded-xl shadow-md border overflow-hidden flex flex-col ${hasVoted ? 'border-green-200 bg-green-50' : 'border-gray-200 hover:shadow-lg transition'}`}>
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                   <span className="bg-brand-100 text-brand-800 text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                     <Calendar size={12} /> Active
                   </span>
                   {hasVoted && (
                     <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                       <CheckCircle size={12} /> Voted
                     </span>
                   )}
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-900">{election.title}</h3>
                <p className="text-gray-600 text-sm line-clamp-3 mb-4">{election.description}</p>
              </div>
              
              <div className="p-6 pt-0 mt-auto">
                {hasVoted ? (
                  <button disabled className="w-full bg-green-600 text-white font-bold py-2 rounded-lg opacity-90 cursor-not-allowed flex items-center justify-center gap-2 shadow-sm">
                    <CheckCircle size={20} />
                    Vote Submitted
                  </button>
                ) : (
                  <button 
                    onClick={() => handleSelectElection(election)}
                    className="w-full bg-white border-2 border-brand-600 text-brand-600 font-bold py-2 rounded-lg hover:bg-brand-50 transition shadow-sm hover:shadow-md"
                  >
                    Enter Voting Booth
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {elections.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
            No active elections at this time.
          </div>
        )}
      </div>
    </div>
  );
};