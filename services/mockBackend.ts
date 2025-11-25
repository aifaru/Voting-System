import { User, Election, Vote, UserRole, AccountStatus, AuditLog, Constituency } from '../types';

// --- Initial Mock Data ---

const INITIAL_CONSTITUENCIES: Constituency[] = [
  { id: 'con-1', name: 'Downtown Metro', region: 'Urban Central', totalRegistered: 1500 },
  { id: 'con-2', name: 'Westside Suburbs', region: 'Western District', totalRegistered: 800 },
  { id: 'con-3', name: 'North Hills', region: 'Northern Highlands', totalRegistered: 450 }
];

const INITIAL_ADMIN: User = {
  id: 'admin-1',
  name: 'System Administrator',
  email: 'admin@vote.com',
  role: UserRole.ADMIN,
  status: AccountStatus.APPROVED,
  password: 'Admin@1234'
};

const INITIAL_VOTERS: User[] = [
  {
    id: 'user-demo-1',
    voterId: 'VOT-2025-8842',
    name: 'Jane Citizen',
    email: 'jane@demo.com',
    role: UserRole.VOTER,
    status: AccountStatus.APPROVED,
    password: 'User@1234',
    constituencyId: 'con-1'
  }
];

const INITIAL_ELECTIONS: Election[] = [
  {
    id: 'elec-1',
    title: 'National Council Representative 2025',
    description: 'Electing the representative for the National Council to oversee urban development.',
    startDate: new Date(Date.now() - 86400000).toISOString(),
    endDate: new Date(Date.now() + 86400000 * 5).toISOString(),
    isActive: true,
    candidates: [
      { id: 'cand-1', name: 'Sarah Jenkins', party: 'Progressive Alliance', manifesto: 'Focusing on green energy and accessible public transport for all citizens.', imageUrl: 'https://picsum.photos/200/200?random=1' },
      { id: 'cand-2', name: 'Marcus Thorne', party: 'Traditional Union', manifesto: 'Strengthening economic policies and traditional educational values.', imageUrl: 'https://picsum.photos/200/200?random=2' },
      { id: 'cand-3', name: 'Elena Rodriguez', party: 'Community First', manifesto: 'Grassroots movements, local parks, and increased funding for community arts.', imageUrl: 'https://picsum.photos/200/200?random=3' }
    ]
  }
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class MockBackendService {
  private STORAGE_KEY_PREFIX = 'avis_v3_'; // Version 3 for new data model

  private getStored<T>(key: string, defaultVal: T): T {
    const stored = localStorage.getItem(this.STORAGE_KEY_PREFIX + key);
    return stored ? JSON.parse(stored) : defaultVal;
  }

  private setStored<T>(key: string, val: T) {
    localStorage.setItem(this.STORAGE_KEY_PREFIX + key, JSON.stringify(val));
  }

  // --- Audit Logging ---

  private async logAction(action: AuditLog['action'], actor: User, details: string) {
    const logs = this.getAuditLogsSync();
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      action,
      actorId: actor.id,
      actorName: actor.name,
      details,
      timestamp: new Date().toISOString(),
      ipAddress: '192.168.1.X (Mock)'
    };
    logs.unshift(newLog); // Newest first
    this.setStored('logs', logs);
  }

  private getAuditLogsSync(): AuditLog[] {
    return this.getStored<AuditLog[]>('logs', []);
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    await delay(300);
    return this.getAuditLogsSync();
  }

  // --- Core Data ---

  async getConstituencies(): Promise<Constituency[]> {
    return this.getStored('constituencies', INITIAL_CONSTITUENCIES);
  }

  // --- Auth & Users ---

  async login(email: string, password: string): Promise<User | null> {
    await delay(500);
    const users = this.getStored<User[]>('users', [INITIAL_ADMIN, ...INITIAL_VOTERS]);
    const user = users.find(u => u.email === email);
    
    if (user && user.password === password) {
      await this.logAction('LOGIN', user, 'User logged in successfully');
      return user;
    }
    return null;
  }

  async register(name: string, email: string, role: UserRole, password: string): Promise<User> {
    await delay(800);
    const users = this.getStored<User[]>('users', [INITIAL_ADMIN, ...INITIAL_VOTERS]);
    
    if (users.find(u => u.email === email)) {
      throw new Error('User already exists');
    }

    // Random assignment of constituency for demo purposes
    const constituencies = await this.getConstituencies();
    const randomCon = constituencies[Math.floor(Math.random() * constituencies.length)];

    const newUser: User = {
      id: `user-${Date.now()}`,
      voterId: role === UserRole.VOTER ? `VOT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}` : undefined,
      name,
      email,
      role,
      password,
      status: role === UserRole.ADMIN ? AccountStatus.APPROVED : AccountStatus.PENDING, 
      disabilitySupport: false,
      constituencyId: role === UserRole.VOTER ? randomCon.id : undefined
    };
    
    users.push(newUser);
    this.setStored('users', users);
    return newUser;
  }

  async resetPassword(email: string, newPassword: string): Promise<boolean> {
    await delay(1000);
    const users = this.getStored<User[]>('users', [INITIAL_ADMIN]);
    const userIndex = users.findIndex(u => u.email === email);
    
    if (userIndex === -1) throw new Error('User not found');

    users[userIndex].password = newPassword;
    this.setStored('users', users);
    return true;
  }

  async getAllUsers(): Promise<User[]> {
    await delay(300);
    return this.getStored<User[]>('users', [INITIAL_ADMIN, ...INITIAL_VOTERS]);
  }

  async updateUserStatus(userId: string, status: AccountStatus): Promise<void> {
    await delay(400);
    const users = this.getStored<User[]>('users', []);
    const user = users.find(u => u.id === userId);
    if (user) {
      user.status = status;
      this.setStored('users', users);
      // We assume an admin is performing this, but we don't have the admin context here easily in this mock
      // In a real app, the calling controller provides the actor. We'll mock the actor as 'System'.
      this.logAction(
        status === AccountStatus.APPROVED ? 'USER_APPROVED' : 'USER_REJECTED', 
        INITIAL_ADMIN, 
        `Updated status of user ${user.email} (${user.voterId}) to ${status}`
      );
    }
  }

  // --- Elections ---

  async getActiveElections(): Promise<Election[]> {
    await delay(400);
    return this.getStored('elections', INITIAL_ELECTIONS);
  }

  async createElection(election: Omit<Election, 'id' | 'isActive'>): Promise<Election> {
    await delay(600);
    const elections = this.getStored<Election[]>('elections', INITIAL_ELECTIONS);
    const newElection: Election = {
      ...election,
      id: `elec-${Date.now()}`,
      isActive: true
    };
    elections.push(newElection);
    this.setStored('elections', elections);
    
    this.logAction('ELECTION_CREATED', INITIAL_ADMIN, `Created election: ${election.title}`);
    return newElection;
  }

  // --- Voting ---

  async castVote(electionId: string, voterId: string, candidateId: string): Promise<boolean> {
    await delay(800);
    const votes = this.getStored<Vote[]>('votes', []);
    const users = this.getStored<User[]>('users', []);
    const voter = users.find(u => u.id === voterId);

    if (!voter) throw new Error("Voter not found");

    if (votes.some(v => v.electionId === electionId && v.voterId === voterId)) {
      throw new Error('You have already voted in this election.');
    }
    
    const newVote: Vote = {
      id: `vote-${Date.now()}`,
      electionId,
      voterId,
      candidateId,
      constituencyId: voter.constituencyId || 'unknown',
      timestamp: new Date().toISOString()
    };
    votes.push(newVote);
    this.setStored('votes', votes);

    // Security: Log that a vote was cast, but NOT who they voted for (Secret Ballot)
    this.logAction('VOTE_CAST', voter, `Voter cast a ballot in election ${electionId} from constituency ${voter.constituencyId}`);

    return true;
  }

  async hasVoted(electionId: string, voterId: string): Promise<boolean> {
    const votes = this.getStored<Vote[]>('votes', []);
    return votes.some(v => v.electionId === electionId && v.voterId === voterId);
  }

  // --- Analytics ---

  async getElectionResults(electionId: string): Promise<{ candidateId: string; count: number }[]> {
    await delay(500);
    const votes = this.getStored<Vote[]>('votes', []).filter(v => v.electionId === electionId);
    const counts: Record<string, number> = {};
    votes.forEach(v => {
      counts[v.candidateId] = (counts[v.candidateId] || 0) + 1;
    });
    return Object.entries(counts).map(([candidateId, count]) => ({ candidateId, count }));
  }

  async getPartyResults(electionId: string): Promise<{ party: string; count: number }[]> {
    await delay(500);
    const votes = this.getStored<Vote[]>('votes', []).filter(v => v.electionId === electionId);
    const elections = this.getStored<Election[]>('elections', INITIAL_ELECTIONS);
    const election = elections.find(e => e.id === electionId);
    if (!election) return [];

    const counts: Record<string, number> = {};
    votes.forEach(v => {
      const candidate = election.candidates.find(c => c.id === v.candidateId);
      if (candidate) {
        counts[candidate.party] = (counts[candidate.party] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([party, count]) => ({ party, count }));
  }

  async getConstituencyTurnout(electionId: string): Promise<{ name: string; votes: number }[]> {
    await delay(500);
    const votes = this.getStored<Vote[]>('votes', []).filter(v => v.electionId === electionId);
    const constituencies = await this.getConstituencies();
    
    const counts: Record<string, number> = {};
    const idToName: Record<string, string> = {};
    constituencies.forEach(c => idToName[c.id] = c.name);

    votes.forEach(v => {
      const cName = idToName[v.constituencyId] || 'Unknown';
      counts[cName] = (counts[cName] || 0) + 1;
    });

    return Object.entries(counts).map(([name, votes]) => ({ name, votes }));
  }
}

export const mockBackend = new MockBackendService();