import { sql } from 'drizzle-orm';
import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';

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
  // enteredAt / exitedAt を話し合った名称（checkedInAt / checkedOutAt）に変更
  checkedInAt: text('checked_in_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // 自動チェックアウト（Cronバッチ）判定用のハートビート時刻を追加
  lastHeartbeatAt: text('last_heartbeat_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  checkedOutAt: text('checked_out_at'),
  status: text('status').default('active').notNull()
});

export const posts = sqliteTable('posts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  placeId: text('place_id').notNull().references(() => places.id),
  visitId: text('visit_id').notNull().references(() => visits.id),
  content: text('content').notNull(),
  // 写真投稿用にimageUrlを追加
  imageUrl: text('image_url'),
  // ユーザーが選択できる遅延公開フラグ（trueなら30分後に公開）
  isDelayedPublish: integer('is_delayed_publish', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull()
});

// 新規追加: いいね機能
export const likes = sqliteTable('likes', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  postId: text('post_id').notNull().references(() => posts.id),
  userId: text('user_id').notNull().references(() => users.id),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull()
});

// Export all tables
export const schema = {
  users,
  places,
  visits,
  posts,
  likes
};