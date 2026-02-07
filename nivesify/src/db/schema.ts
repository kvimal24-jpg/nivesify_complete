import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(), // We will use Google ID as the primary key
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  picture: text('picture'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const onboarding = sqliteTable('onboarding', {
  userId: text('user_id').primaryKey().references(() => users.id),
  data: text('data', { mode: 'json' }), // Stores your form data as JSON
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const mutualFundHealthCheck = sqliteTable('mutual_fund_health_check', {
  userId: text('user_id').primaryKey().references(() => users.id),
  data: text('data', { mode: 'json' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const mfSchemeCache = sqliteTable('mf_scheme_cache', {
  id: text('id').primaryKey(),
  data: text('data', { mode: 'json' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});
