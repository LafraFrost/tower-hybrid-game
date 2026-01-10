import { sql } from "drizzle-orm";
import { pgTable, text, serial, integer, boolean, timestamp, jsonb, doublePrecision, uuid, pgSchema } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === SUPABASE AUTH USERS (reference only) ===
const auth = pgSchema("auth");
export const authUsers = auth.table("users", {
  id: uuid("id").primaryKey(),
});

// === USERS ===
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  xp: integer("xp").default(0),
  bonusHp: integer("bonus_hp").default(0),
  bonusPa: integer("bonus_pa").default(0),
  bonusR2: integer("bonus_r2").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });

// === CUSTOM USERS (Custom authentication with hashed passwords) ===
export const customUsers = pgTable("custom_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  isAdmin: boolean("is_admin").default(false),
  cameraPermission: boolean("camera_permission").default(false),
  locationPermission: boolean("location_permission").default(false),
  isGoblinAttackActive: boolean("is_goblin_attack_active").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
});

// === USER LOCATIONS (GPS tracking for gameplay) ===
export const userLocations = pgTable("user_locations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  accuracy: doublePrecision("accuracy"),
  sessionType: text("session_type"), // 'solo', 'tabletop', 'idle'
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserLocationSchema = createInsertSchema(userLocations).omit({ id: true, createdAt: true });
export type UserLocation = typeof userLocations.$inferSelect;
export type InsertUserLocation = z.infer<typeof insertUserLocationSchema>;

// === GAME LOCATIONS (Buildings on the player's map - Ikariam style) ===
export const gameLocations = pgTable("game_locations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(), // "Magazzino", "Orto", "Fucina"
  buildingType: text("building_type"), // "warehouse", "farm", "blacksmith"
  coordinateX: doublePrecision("coordinate_x").notNull(), // Position in % (0-100)
  coordinateY: doublePrecision("coordinate_y").notNull(), // Position in % (0-100)
  is_built: boolean("is_built").default(false),
  level: integer("level").default(1),
  requiredWood: integer("required_wood").default(0),
  requiredStone: integer("required_stone").default(0),
  requiredGold: integer("required_gold").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGameLocationSchema = createInsertSchema(gameLocations).omit({ id: true, createdAt: true });
export type GameLocation = typeof gameLocations.$inferSelect;
export type InsertGameLocation = z.infer<typeof insertGameLocationSchema>;

// === USER RESOURCES ===
export const userResources = pgTable("user_resources", {
  id: uuid("id").default(sql`uuid_generate_v4()`).primaryKey(),
  userId: integer("user_id").references(() => customUsers.id),
  wood: integer("wood").default(0),
  stone: integer("stone").default(0),
  gold: integer("gold").default(0),
  isMineUnlocked: boolean("is_mine_unlocked").default(false), // Unlocked after defeating Boss Node 22
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const insertUserResourceSchema = createInsertSchema(userResources).omit({ id: true, updatedAt: true });
export type UserResource = typeof userResources.$inferSelect;
export type InsertUserResource = z.infer<typeof insertUserResourceSchema>;

export const insertCustomUserSchema = createInsertSchema(customUsers).omit({ 
  id: true, 
  createdAt: true, 
  lastLoginAt: true,
  passwordHash: true 
});
export type CustomUser = typeof customUsers.$inferSelect;
export type InsertCustomUser = z.infer<typeof insertCustomUserSchema>;

// === USER PROFILES (Persistent data between solo campaign and tabletop) ===
export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  
  // Identifier (heroName is unique per profile)
  heroName: text("hero_name").notNull().unique(),
  heroClass: text("hero_class").notNull(),
  
  // ONLY these persist between solo campaign and tabletop sessions
  persistentCredits: integer("persistent_credits").default(100),
  persistentDeckCards: jsonb("persistent_deck_cards").default([]), // Card IDs earned in solo
  
  // Solo campaign progress (separate from tabletop)
  soloNodeCounter: integer("solo_node_counter").default(0),
  soloCurrentFloor: integer("solo_current_floor").default(1),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({ id: true, createdAt: true, updatedAt: true });

// === HERO SESSIONS (Per-hero game progression) ===
export const heroSessions = pgTable("hero_sessions", {
  id: serial("id").primaryKey(),
  heroName: text("hero_name").notNull(),
  heroClass: text("hero_class").notNull(),
  
  // Current Stats
  currentHp: integer("current_hp").notNull(),
  maxHp: integer("max_hp").notNull(),
  currentPa: integer("current_pa").default(3),
  currentR2: integer("current_r2").default(0),
  maxR2: integer("max_r2").notNull(),
  
  // Progression
  nodeCounter: integer("node_counter").default(0),
  credits: integer("credits").default(100),
  currentFloor: integer("current_floor").default(1),
  
  // Game State
  gameMode: text("game_mode").default("solo"), // 'solo' | 'tabletop'
  roomCode: text("room_code"), // For multiplayer sessions
  isActive: boolean("is_active").default(true),
  
  // Purchased/unlocked cards (JSON array of card IDs)
  deckCards: jsonb("deck_cards").default([]),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertHeroSessionSchema = createInsertSchema(heroSessions).omit({ id: true, createdAt: true, updatedAt: true });

// === MULTIPLAYER ROOMS ===
export const multiplayerRooms = pgTable("multiplayer_rooms", {
  id: serial("id").primaryKey(),
  roomCode: text("room_code").notNull().unique(),
  hostHeroSessionId: integer("host_hero_session_id").notNull(),
  status: text("status").default("LOBBY"), // LOBBY, TACTICAL, COMBAT, SHOP
  currentAction: text("current_action"), // Current action being performed
  nodeCounter: integer("node_counter").default(0),
  currentFloor: integer("current_floor").default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMultiplayerRoomSchema = createInsertSchema(multiplayerRooms).omit({ id: true, createdAt: true });

// === ROOM PARTICIPANTS ===
export const roomParticipants = pgTable("room_participants", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull(),
  heroSessionId: integer("hero_session_id").notNull(),
  isHost: boolean("is_host").default(false),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const insertRoomParticipantSchema = createInsertSchema(roomParticipants).omit({ id: true, joinedAt: true });

// === COMBAT ENCOUNTERS ===
export const combatEncounters = pgTable("combat_encounters", {
  id: serial("id").primaryKey(),
  heroSessionId: integer("hero_session_id").notNull(),
  roomId: integer("room_id"), // Optional for multiplayer
  encounterType: text("encounter_type").notNull(), // 'COMBAT', 'ELITE', 'BOSS'
  difficulty: integer("difficulty").default(1), // Based on node counter
  
  // Enemy data (JSON array)
  enemies: jsonb("enemies").default([]),
  
  // Combat state
  status: text("status").default("ACTIVE"), // ACTIVE, WON, LOST
  currentTurn: integer("current_turn").default(1),
  gridState: jsonb("grid_state").default([]),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCombatEncounterSchema = createInsertSchema(combatEncounters).omit({ id: true, createdAt: true });

// === DAILY QUESTS ===
export const dailyQuests = pgTable("daily_quests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), 
  description: text("description").notNull(),
  rewardXp: integer("reward_xp").notNull(),
  rewardStatType: text("reward_stat_type"),
  rewardStatValue: integer("reward_stat_value"),
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDailyQuestSchema = createInsertSchema(dailyQuests).omit({ id: true, createdAt: true, completedAt: true });

// === GAME SESSION (Legacy - keeping for compatibility) ===
export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  status: text("status").default("LOBBY"),
  currentTurn: integer("current_turn").default(1),
  activeUnitId: text("active_unit_id"),
  gridState: jsonb("grid_state").default([]),
  mapState: jsonb("map_state").default([]),
  currentLevel: integer("current_level").default(1),
});

// === UNITS (Heroes & Enemies) ===
export const units = pgTable("units", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull(),
  type: text("type").notNull(),
  name: text("name").notNull(),
  class: text("class"),
  hp: integer("hp").notNull(),
  maxHp: integer("max_hp").notNull(),
  pa: integer("pa").default(0),
  r2: integer("r2").default(0),
  x: integer("x").default(0),
  y: integer("y").default(0),
  ownerId: integer("owner_id"),
});

export const insertUnitSchema = createInsertSchema(units).omit({ id: true });

// === CARDS ===
export const cards = pgTable("cards", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull(),
  userId: integer("user_id"),
  name: text("name").notNull(),
  type: text("type").notNull(),
  paCost: integer("pa_cost").notNull(),
  description: text("description"),
  status: text("status").default("DECK"),
});

export const insertCardSchema = createInsertSchema(cards).omit({ id: true });

// === NARRATIVE EVENTS ===
export const narrativeEvents = pgTable("narrative_events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  optionA: jsonb("option_a").notNull(),
  optionB: jsonb("option_b").notNull(),
});

export const insertNarrativeEventSchema = createInsertSchema(narrativeEvents).omit({ id: true });

// === RANDOM EVENTS ===
export const randomEvents = pgTable("random_events", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(), // 'positive', 'negative', 'narrative'
  title: text("title").notNull(),
  description: text("description").notNull(),
  effect: jsonb("effect").notNull(), // { type: 'heal_pa', value: 2 } or { type: 'credits', value: 50 } etc.
  narrativeChoice: jsonb("narrative_choice"), // Optional: { choiceA: {...}, choiceB: {...} }
});

export const insertRandomEventSchema = createInsertSchema(randomEvents).omit({ id: true });

// === SESSIONS ===
export const sessions = pgTable("sessions", {
  sid: text("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

export const insertSessionSchema = createInsertSchema(sessions).omit({ sid: true });

// === GAME SESSIONS (Multiplayer room state snapshot) ===
export const gameSessions = pgTable("game_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  roomCode: text("room_code").notNull().unique(), // ES. AB12CD
  status: text("status").notNull().default("lobby"), // 'lobby' | 'combat' | 'rest' | 'tactical'
  hostId: uuid("host_id").notNull(), // Host's custom_user.id (Supabase auth)
  players: jsonb("players").default([]), // Array of { heroSessionId, heroName, currentHp, maxHp, characterClass }
  currentFloor: integer("current_floor").default(1),
  nodeCounter: integer("node_counter").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertGameSessionSchema = createInsertSchema(gameSessions).omit({ id: true, createdAt: true, updatedAt: true });
export type GameSession = typeof gameSessions.$inferSelect;
export type InsertGameSession = z.infer<typeof insertGameSessionSchema>;

// === TYPES ===
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;

export type GameSession = typeof gameSessions.$inferSelect;
export type InsertGameSession = z.infer<typeof insertGameSessionSchema>;

export type HeroSession = typeof heroSessions.$inferSelect;
export type InsertHeroSession = z.infer<typeof insertHeroSessionSchema>;

export type MultiplayerRoom = typeof multiplayerRooms.$inferSelect;
export type InsertMultiplayerRoom = z.infer<typeof insertMultiplayerRoomSchema>;

export type RoomParticipant = typeof roomParticipants.$inferSelect;
export type InsertRoomParticipant = z.infer<typeof insertRoomParticipantSchema>;

export type CombatEncounter = typeof combatEncounters.$inferSelect;
export type InsertCombatEncounter = z.infer<typeof insertCombatEncounterSchema>;

export type DailyQuest = typeof dailyQuests.$inferSelect;
export type InsertDailyQuest = z.infer<typeof insertDailyQuestSchema>;

export type Game = typeof games.$inferSelect;
export type Unit = typeof units.$inferSelect;
export type Card = typeof cards.$inferSelect;
export type NarrativeEvent = typeof narrativeEvents.$inferSelect;
export type RandomEvent = typeof randomEvents.$inferSelect;
export type InsertRandomEvent = z.infer<typeof insertRandomEventSchema>;

// API Request Types
export type CompleteQuestRequest = { questId: number };
export type MoveUnitRequest = { unitId: number; x: number; y: number };
export type PlayCardRequest = { cardId: number; targetUnitId?: number };
export type ChoiceRequest = { eventId: number; option: 'A' | 'B' };

// Phygital Action Types
export type ActionType = 'COMBAT' | 'ELITE' | 'SHOP' | 'REST' | 'BOSS';

export interface PhygitalActionRequest {
  heroSessionId: number;
  action: ActionType;
  roomId?: number;
}

export interface ShopPurchaseRequest {
  heroSessionId: number;
  cardId: string;
  cost: number;
}

// Response Types
export type GameStateResponse = {
  game: Game;
  units: Unit[];
  activePlayerCards?: Card[]; 
};

export interface HeroSessionResponse {
  session: HeroSession;
  encounter?: CombatEncounter;
}

// Node Map Structure (for mapState jsonb)
export interface MapNode {
    id: string;
    type: 'BOSS' | 'ELITE' | 'EVENT' | 'SHOP' | 'START' | 'COMBAT';
    x: number;
    y: number;
    connections: string[];
    isVisited: boolean;
    label: string;
}

// Enemy Template for combat generation
export interface EnemyTemplate {
  id: string;
  name: string;
  baseHp: number;
  baseDamage: number;
  type: 'standard' | 'elite' | 'boss';
}
