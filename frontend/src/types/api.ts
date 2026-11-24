export type Role = 'PARTICIPANT' | 'PANITIA';

export type TicketStatus = 'VALID' | 'USED' | 'CANCELLED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface UserSummary {
  id: string;
  name: string;
  email: string;
}

export interface EventSummary {
  id: string;
  title: string;
  description?: string;
  eventDate: string;
  location: string;
}

export interface TicketTier {
  id: string;
  eventId: string;
  name: string;
  price: number;
  totalQuota: number;
  remainingQuota: number;
  event?: EventSummary;
}

export interface EventItem {
  id: string;
  title: string;
  description: string;
  eventDate: string;
  location: string;
  createdBy: string;
  creator?: UserSummary;
  ticketTiers: TicketTier[];
}

export interface TicketItem {
  id: string;
  ticketCode: string;
  userId: string;
  tierId: string;
  status: TicketStatus;
  checkedInAt: string | null;
  createdAt: string;
  user?: UserSummary;
  tier?: TicketTier & {
    event?: EventSummary;
  };
}

export interface FieldValidationError {
  field: string;
  message: string;
}

export interface ApiErrorPayload {
  status: 'error';
  message: string;
  errors?: FieldValidationError[];
}
