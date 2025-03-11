export interface User {
  email: string;
  subscribeNewsletter: boolean;
  createdAt: Date;
}

export interface DiscoveryData {
  userId: string;
  industry: string;
  otherIndustry?: string;
  challenges: string[];
  tools: string[];
  otherTools?: string[];
  continuation: string;
  submittedAt: Date;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface LeadData extends User, DiscoveryData {
  chatHistory: ChatMessage[];
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  notes?: string;
  appointmentDate?: Date;
} 