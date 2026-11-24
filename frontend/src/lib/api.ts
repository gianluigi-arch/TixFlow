import type {
  ApiErrorPayload,
  EventItem,
  FieldValidationError,
  TicketItem,
  TicketTier,
  User,
} from '@/types/api';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export class ApiError extends Error {
  public readonly status: number;
  public readonly errors?: FieldValidationError[];

  constructor(
    status: number,
    message: string,
    errors?: FieldValidationError[],
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      credentials: 'include',
    });
  } catch {
    throw new ApiError(
      0,
      `Tidak dapat terhubung ke server backend (${API_BASE_URL}). Pastikan API sedang berjalan.`,
    );
  }

  let payload: unknown = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const errPayload = payload as Partial<ApiErrorPayload> | null;
    throw new ApiError(
      response.status,
      errPayload?.message || `Permintaan gagal dengan status ${response.status}.`,
      errPayload?.errors,
    );
  }

  return payload as T;
}

interface SuccessEnvelope<T> {
  status: 'success';
  message?: string;
  data: T;
}

export const authApi = {
  async register(body: { name: string; email: string; password: string }): Promise<User> {
    const res = await apiFetch<SuccessEnvelope<{ user: User }>>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return res.data.user;
  },

  async login(body: { email: string; password: string }): Promise<User> {
    const res = await apiFetch<SuccessEnvelope<{ user: User }>>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return res.data.user;
  },

  async logout(): Promise<void> {
    await apiFetch<{ status: 'success'; message: string }>('/api/auth/logout', {
      method: 'POST',
    });
  },

  async me(): Promise<User> {
    const res = await apiFetch<SuccessEnvelope<{ user: User }>>('/api/auth/me');
    return res.data.user;
  },
};

export const eventsApi = {
  async list(): Promise<EventItem[]> {
    const res = await apiFetch<SuccessEnvelope<{ events: EventItem[] }>>('/api/events');
    return res.data.events;
  },

  async getById(id: string): Promise<EventItem> {
    const res = await apiFetch<SuccessEnvelope<{ event: EventItem }>>(`/api/events/${id}`);
    return res.data.event;
  },

  async create(body: {
    title: string;
    description: string;
    eventDate: string;
    location: string;
  }): Promise<EventItem> {
    const res = await apiFetch<SuccessEnvelope<{ event: EventItem }>>('/api/events', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return res.data.event;
  },

  async createTier(
    eventId: string,
    body: { name: string; price: number; totalQuota: number },
  ): Promise<TicketTier> {
    const res = await apiFetch<SuccessEnvelope<{ tier: TicketTier }>>(
      `/api/events/${eventId}/tiers`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
    );
    return res.data.tier;
  },
};

export const ticketsApi = {
  async book(tierId: string): Promise<TicketItem> {
    const res = await apiFetch<SuccessEnvelope<{ ticket: TicketItem }>>(
      '/api/tickets/book',
      {
        method: 'POST',
        body: JSON.stringify({ tierId }),
      },
    );
    return res.data.ticket;
  },

  async myTickets(): Promise<TicketItem[]> {
    const res = await apiFetch<SuccessEnvelope<{ tickets: TicketItem[] }>>(
      '/api/tickets/my',
    );
    return res.data.tickets;
  },

  async checkin(ticketCode: string): Promise<{ message: string; ticket: TicketItem }> {
    const res = await apiFetch<SuccessEnvelope<{ ticket: TicketItem }>>(
      '/api/tickets/checkin',
      {
        method: 'POST',
        body: JSON.stringify({ ticketCode }),
      },
    );
    return {
      message: res.message || 'Tiket berhasil check-in.',
      ticket: res.data.ticket,
    };
  },
};
