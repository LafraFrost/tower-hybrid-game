import { z } from 'zod';
import { insertUserSchema, insertDailyQuestSchema, insertUnitSchema, users, dailyQuests, games, units, cards, narrativeEvents } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  // === PLAYER / PROFILE ===
  me: {
    get: {
      method: 'GET' as const,
      path: '/api/me',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.notFound,
      },
    },
  },
  
  // === DAILY QUESTS ===
  quests: {
    list: {
      method: 'GET' as const,
      path: '/api/quests',
      responses: {
        200: z.array(z.custom<typeof dailyQuests.$inferSelect>()),
      },
    },
    complete: {
      method: 'POST' as const,
      path: '/api/quests/:id/complete',
      responses: {
        200: z.custom<typeof dailyQuests.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },

  // === GAME STATE ===
  game: {
    get: {
      method: 'GET' as const,
      path: '/api/game/:id',
      responses: {
        200: z.object({
          game: z.custom<typeof games.$inferSelect>(),
          units: z.array(z.custom<typeof units.$inferSelect>()),
        }),
        404: errorSchemas.notFound,
      },
    },
    sync: {
        method: 'GET' as const,
        path: '/api/game/:id/sync',
        responses: {
            200: z.object({
                game: z.custom<typeof games.$inferSelect>(),
                units: z.array(z.custom<typeof units.$inferSelect>()),
            }), 
        }
    }
  },

  // === TACTICAL MAP & ACTIONS ===
  units: {
    move: {
      method: 'POST' as const,
      path: '/api/units/:id/move',
      input: z.object({
        x: z.number().min(0).max(5),
        y: z.number().min(0).max(4),
      }),
      responses: {
        200: z.custom<typeof units.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },

  cards: {
    list: {
      method: 'GET' as const,
      path: '/api/game/:gameId/hand',
      responses: {
        200: z.array(z.custom<typeof cards.$inferSelect>()),
      },
    },
    play: {
      method: 'POST' as const,
      path: '/api/cards/:id/play',
      input: z.object({
        targetUnitId: z.number().optional(),
      }),
      responses: {
        200: z.object({ success: z.boolean(), message: z.string() }),
      },
    },
  },

  // === NARRATIVE EVENTS ===
  events: {
    get: {
      method: 'GET' as const,
      path: '/api/events/:id',
      responses: {
        200: z.custom<typeof narrativeEvents.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    choose: {
      method: 'POST' as const,
      path: '/api/events/:id/choose',
      input: z.object({
        option: z.enum(['A', 'B']),
      }),
      responses: {
        200: z.object({ success: z.boolean(), message: z.string(), results: z.any() }),
        400: errorSchemas.validation,
      },
    },
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
