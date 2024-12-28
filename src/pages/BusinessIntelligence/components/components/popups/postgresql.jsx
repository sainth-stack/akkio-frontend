import { drizzle } from 'drizzle-orm';
import { pgTable, serial, varchar, text } from 'drizzle-orm/pg-core';
import { z } from 'zod';

const demoRequestTable = pgTable('demo_requests', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().check((email) => email.match(/.+\@.+\..+/)),
    company: varchar('company', { length: 255 }).nullable(),
    status: varchar('status', { length: 255 }).nullable(),
});

const DemoRequestModel = drizzle.table(demoRequestTable);

const demoValidationSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    company: z.string().optional(),
    status: z.string().optional(),
});

export { demoValidationSchema, DemoRequestModel };
