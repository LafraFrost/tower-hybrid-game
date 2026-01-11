CREATE TABLE "auth"."users" (
	"id" uuid PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cards" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" integer NOT NULL,
	"user_id" integer,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"pa_cost" integer NOT NULL,
	"description" text,
	"status" text DEFAULT 'DECK'
);
--> statement-breakpoint
CREATE TABLE "combat_encounters" (
	"id" serial PRIMARY KEY NOT NULL,
	"hero_session_id" integer NOT NULL,
	"room_id" integer,
	"encounter_type" text NOT NULL,
	"difficulty" integer DEFAULT 1,
	"enemies" jsonb DEFAULT '[]'::jsonb,
	"status" text DEFAULT 'ACTIVE',
	"current_turn" integer DEFAULT 1,
	"grid_state" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "custom_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"profile_image_url" text,
	"is_admin" boolean DEFAULT false,
	"camera_permission" boolean DEFAULT false,
	"location_permission" boolean DEFAULT false,
	"is_goblin_attack_active" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"last_login_at" timestamp,
	CONSTRAINT "custom_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "daily_quests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"description" text NOT NULL,
	"reward_xp" integer NOT NULL,
	"reward_stat_type" text,
	"reward_stat_value" integer,
	"is_completed" boolean DEFAULT false,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "game_locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"building_type" text,
	"coordinate_x" double precision NOT NULL,
	"coordinate_y" double precision NOT NULL,
	"is_built" boolean DEFAULT false,
	"is_unlocked" boolean DEFAULT true,
	"is_under_attack" boolean DEFAULT false,
	"mine_map_completed" boolean DEFAULT false,
	"level" integer DEFAULT 1,
	"required_wood" integer DEFAULT 0,
	"required_stone" integer DEFAULT 0,
	"required_gold" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "game_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_code" text NOT NULL,
	"status" text DEFAULT 'lobby' NOT NULL,
	"host_id" uuid NOT NULL,
	"players" jsonb DEFAULT '[]'::jsonb,
	"current_floor" integer DEFAULT 1,
	"node_counter" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "game_sessions_room_code_unique" UNIQUE("room_code")
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" serial PRIMARY KEY NOT NULL,
	"status" text DEFAULT 'LOBBY',
	"current_turn" integer DEFAULT 1,
	"active_unit_id" text,
	"grid_state" jsonb DEFAULT '[]'::jsonb,
	"map_state" jsonb DEFAULT '[]'::jsonb,
	"current_level" integer DEFAULT 1
);
--> statement-breakpoint
CREATE TABLE "hero_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"hero_name" text NOT NULL,
	"hero_class" text NOT NULL,
	"current_hp" integer NOT NULL,
	"max_hp" integer NOT NULL,
	"current_pa" integer DEFAULT 3,
	"current_r2" integer DEFAULT 0,
	"max_r2" integer NOT NULL,
	"node_counter" integer DEFAULT 0,
	"credits" integer DEFAULT 100,
	"current_floor" integer DEFAULT 1,
	"game_mode" text DEFAULT 'solo',
	"room_code" text,
	"is_active" boolean DEFAULT true,
	"deck_cards" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "multiplayer_rooms" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_code" text NOT NULL,
	"host_hero_session_id" integer NOT NULL,
	"status" text DEFAULT 'LOBBY',
	"current_action" text,
	"node_counter" integer DEFAULT 0,
	"current_floor" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "multiplayer_rooms_room_code_unique" UNIQUE("room_code")
);
--> statement-breakpoint
CREATE TABLE "narrative_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"option_a" jsonb NOT NULL,
	"option_b" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "random_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"effect" jsonb NOT NULL,
	"narrative_choice" jsonb
);
--> statement-breakpoint
CREATE TABLE "room_participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_id" integer NOT NULL,
	"hero_session_id" integer NOT NULL,
	"is_host" boolean DEFAULT false,
	"joined_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" text PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "units" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" integer NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"class" text,
	"hp" integer NOT NULL,
	"max_hp" integer NOT NULL,
	"pa" integer DEFAULT 0,
	"r2" integer DEFAULT 0,
	"x" integer DEFAULT 0,
	"y" integer DEFAULT 0,
	"owner_id" integer
);
--> statement-breakpoint
CREATE TABLE "user_locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"accuracy" double precision,
	"session_type" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"hero_name" text NOT NULL,
	"hero_class" text NOT NULL,
	"persistent_credits" integer DEFAULT 100,
	"persistent_deck_cards" jsonb DEFAULT '[]'::jsonb,
	"solo_node_counter" integer DEFAULT 0,
	"solo_current_floor" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_profiles_hero_name_unique" UNIQUE("hero_name")
);
--> statement-breakpoint
CREATE TABLE "user_resources" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"user_id" integer,
	"wood" integer DEFAULT 0,
	"stone" integer DEFAULT 0,
	"gold" integer DEFAULT 0,
	"is_mine_unlocked" boolean DEFAULT false,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"xp" integer DEFAULT 0,
	"bonus_hp" integer DEFAULT 0,
	"bonus_pa" integer DEFAULT 0,
	"bonus_r2" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "user_resources" ADD CONSTRAINT "user_resources_user_id_custom_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."custom_users"("id") ON DELETE no action ON UPDATE no action;