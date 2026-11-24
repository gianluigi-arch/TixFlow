export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'TixFlow API',
    version: '1.0.0',
    description:
      'REST API for TixFlow — Concurrent Campus Event Ticketing & QR Access System (Phase 2: Core Auth, RBAC, and Events).',
  },
  servers: [
    {
      url: 'http://localhost:4000',
      description: 'Local development server',
    },
  ],
  tags: [
    { name: 'Health', description: 'Service health check' },
    { name: 'Auth', description: 'Cookie-based JWT authentication and session management' },
    { name: 'Events', description: 'Campus events and ticket tier management' },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'tixflow_token',
        description: 'HTTP-only JWT session cookie issued on /api/auth/register or /api/auth/login',
      },
    },
    schemas: {
      Role: {
        type: 'string',
        enum: ['PARTICIPANT', 'PANITIA'],
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Budi Santoso' },
          email: { type: 'string', format: 'email', example: 'budi@kampus.ac.id' },
          role: { $ref: '#/components/schemas/Role' },
          createdAt: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'name', 'email', 'role', 'createdAt'],
      },
      UserSummary: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Panitia BEM' },
          email: { type: 'string', format: 'email', example: 'panitia@kampus.ac.id' },
        },
        required: ['id', 'name', 'email'],
      },
      TicketTier: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          eventId: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Early Bird' },
          price: { type: 'integer', minimum: 0, example: 50000 },
          totalQuota: { type: 'integer', minimum: 1, example: 100 },
          remainingQuota: { type: 'integer', minimum: 0, example: 100 },
        },
        required: ['id', 'eventId', 'name', 'price', 'totalQuota', 'remainingQuota'],
      },
      Event: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string', example: 'TechFest Kampus 2026' },
          description: {
            type: 'string',
            example: 'Seminar nasional teknologi dan workshop rekayasa perangkat lunak.',
          },
          eventDate: { type: 'string', format: 'date-time' },
          location: { type: 'string', example: 'Auditorium Utama Gedung A' },
          createdBy: { type: 'string', format: 'uuid' },
          creator: { $ref: '#/components/schemas/UserSummary' },
          ticketTiers: {
            type: 'array',
            items: { $ref: '#/components/schemas/TicketTier' },
          },
        },
        required: ['id', 'title', 'description', 'eventDate', 'location', 'createdBy'],
      },
      RegisterRequest: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 100, example: 'Budi Santoso' },
          email: { type: 'string', format: 'email', example: 'budi@kampus.ac.id' },
          password: { type: 'string', minLength: 8, maxLength: 72, example: 'password123' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'budi@kampus.ac.id' },
          password: { type: 'string', minLength: 1, example: 'password123' },
        },
      },
      CreateEventRequest: {
        type: 'object',
        required: ['title', 'description', 'eventDate', 'location'],
        properties: {
          title: { type: 'string', minLength: 3, maxLength: 200, example: 'TechFest Kampus 2026' },
          description: {
            type: 'string',
            minLength: 10,
            maxLength: 5000,
            example: 'Seminar nasional teknologi dan workshop rekayasa perangkat lunak.',
          },
          eventDate: {
            type: 'string',
            format: 'date-time',
            example: '2026-12-10T09:00:00.000Z',
          },
          location: {
            type: 'string',
            minLength: 2,
            maxLength: 255,
            example: 'Auditorium Utama Gedung A',
          },
        },
      },
      CreateTierRequest: {
        type: 'object',
        required: ['name', 'price', 'totalQuota'],
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 100, example: 'VIP Pass' },
          price: { type: 'integer', minimum: 0, example: 150000 },
          totalQuota: { type: 'integer', minimum: 1, example: 50 },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'success' },
          data: {
            type: 'object',
            properties: {
              user: { $ref: '#/components/schemas/User' },
            },
            required: ['user'],
          },
        },
        required: ['status', 'data'],
      },
      MessageResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'success' },
          message: { type: 'string', example: 'Logged out successfully' },
        },
        required: ['status', 'message'],
      },
      EventsListResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'success' },
          data: {
            type: 'object',
            properties: {
              events: {
                type: 'array',
                items: { $ref: '#/components/schemas/Event' },
              },
            },
            required: ['events'],
          },
        },
        required: ['status', 'data'],
      },
      EventResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'success' },
          data: {
            type: 'object',
            properties: {
              event: { $ref: '#/components/schemas/Event' },
            },
            required: ['event'],
          },
        },
        required: ['status', 'data'],
      },
      TierResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'success' },
          data: {
            type: 'object',
            properties: {
              tier: { $ref: '#/components/schemas/TicketTier' },
            },
            required: ['tier'],
          },
        },
        required: ['status', 'data'],
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'error' },
          message: { type: 'string', example: 'Error description' },
        },
        required: ['status', 'message'],
      },
      ValidationErrorResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'error' },
          message: { type: 'string', example: 'Validation failed' },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string', example: 'body.email' },
                message: { type: 'string', example: 'Invalid email address' },
              },
              required: ['field', 'message'],
            },
          },
        },
        required: ['status', 'message', 'errors'],
      },
    },
  },
  paths: {
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: 'Service health check',
        responses: {
          '200': {
            description: 'Backend API is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    service: { type: 'string', example: 'tixflow-backend' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new PARTICIPANT account',
        description:
          'Creates a new user with role forced to PARTICIPANT and sets an HTTP-only JWT cookie.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'User registered and session cookie set',
            headers: {
              'Set-Cookie': {
                description: 'HTTP-only JWT cookie (tixflow_token)',
                schema: { type: 'string' },
              },
            },
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
          '400': {
            description: 'Validation failed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ValidationErrorResponse' },
              },
            },
          },
          '409': {
            description: 'Email already registered',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '429': {
            description: 'Too many authentication attempts',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Authenticate user and set HTTP-only JWT cookie',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login successful and session cookie set',
            headers: {
              'Set-Cookie': {
                description: 'HTTP-only JWT cookie (tixflow_token)',
                schema: { type: 'string' },
              },
            },
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
          '400': {
            description: 'Validation failed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ValidationErrorResponse' },
              },
            },
          },
          '401': {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '429': {
            description: 'Too many authentication attempts',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Clear active session cookie',
        responses: {
          '200': {
            description: 'Logged out successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' },
              },
            },
          },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get authenticated user profile',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': {
            description: 'Authenticated user profile',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
          '401': {
            description: 'Missing or invalid authentication cookie',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/events': {
      get: {
        tags: ['Events'],
        summary: 'List all events with ticket tiers (Public)',
        responses: {
          '200': {
            description: 'List of events',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/EventsListResponse' },
              },
            },
          },
        },
      },
      post: {
        tags: ['Events'],
        summary: 'Create a new event (PANITIA only)',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateEventRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Event created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/EventResponse' },
              },
            },
          },
          '400': {
            description: 'Validation failed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ValidationErrorResponse' },
              },
            },
          },
          '401': {
            description: 'Authentication required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '403': {
            description: 'Forbidden: requires PANITIA role',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/events/{id}': {
      get: {
        tags: ['Events'],
        summary: 'Get event details by ID (Public)',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'Event UUID',
          },
        ],
        responses: {
          '200': {
            description: 'Event details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/EventResponse' },
              },
            },
          },
          '400': {
            description: 'Invalid UUID format',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ValidationErrorResponse' },
              },
            },
          },
          '404': {
            description: 'Event not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/events/{id}/tiers': {
      post: {
        tags: ['Events'],
        summary: 'Add a ticket tier to an event (PANITIA only)',
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'Event UUID',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateTierRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Ticket tier created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TierResponse' },
              },
            },
          },
          '400': {
            description: 'Validation failed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ValidationErrorResponse' },
              },
            },
          },
          '401': {
            description: 'Authentication required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '403': {
            description: 'Forbidden: requires PANITIA role',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '404': {
            description: 'Event not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
  },
} as const;
