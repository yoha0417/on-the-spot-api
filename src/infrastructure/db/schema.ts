import { sql } from 'drizzle-orm';
import { sqliteTable, text, real } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull()
});

export const places = sqliteTable('places', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
  address: text('address'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull()
});

export const visits = sqliteTable('visits', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  placeId: text('place_id').notNull().references(() => places.id),
  enteredAt: text('entered_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  exitedAt: text('exited_at'),
  status: text('status').default('active').notNull()
});

export const posts = sqliteTable('posts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  placeId: text('place_id').notNull().references(() => places.id),
  visitId: text('visit_id').notNull().references(() => visits.id),
  content: text('content').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull()
});

// Export all tables
export const schema = {
  users,
  places,
  visits,
  posts
};