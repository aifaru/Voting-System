export enum UserRole {
  VOTER = 'VOTER',
  ADMIN = 'ADMIN'
}

export enum AccountStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface Constituency {
  id: string;
  name: string;
  region: string; // e.g., "North District"
  totalRegistered: number;
}

export interface User {
  id: string;
  voterId?: string; // Official Government Voter ID (e.g., ABC1234567)
  name: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  constituencyId?: string;
  disabilitySupport?: boolean;
  password?: string;
}

export interface Candidate {
  id: string;
  name: string;
  party: string;
  manifesto: string;
  imageUrl?: string;
}

export interface Election {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  candidates: Candidate[];
  isActive: boolean;
}

export interface Vote {
  id: string;
  electionId: string;
  voterId: string;
  candidateId: string;
  constituencyId: string; // Track where the vote came from
  timestamp: string;
}

export interface AuditLog {
  id: string;
  action: 'LOGIN' | 'VOTE_CAST' | 'USER_APPROVED' | 'USER_REJECTED' | 'ELECTION_CREATED' | 'SYSTEM_INIT';
  actorId: string; // Who performed the action
  actorName: string;
  details: string;
  timestamp: string;
  ipAddress?: string; // Mocked for now
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}