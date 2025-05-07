import { pgTable, text, serial, integer, boolean, timestamp, jsonb, decimal, unique, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums
export const UserRoleEnum = {
  ADMIN: "admin",
  EMPLOYEE: "employee",
} as const;

// Users Table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  displayName: text("display_name"),
  role: text("role", { enum: ["admin", "employee"] }).notNull().default(UserRoleEnum.EMPLOYEE),
  points: integer("points").notNull().default(0),
  unit: text("unit"),
  profileImageUrl: text("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User Relations
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
}));

// Products Table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  pointsCost: integer("points_cost").notNull(),
  stock: integer("stock").notNull().default(0),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Products Relations
export const productsRelations = relations(products, ({ many }) => ({
  orderItems: many(orderItems),
}));

// Orders Table
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  totalPoints: integer("total_points").notNull(),
  status: text("status", { enum: ["pending", "completed", "cancelled"] }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Orders Relations
export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id]
  }),
  orderItems: many(orderItems),
}));

// Order Items Table
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  pointsCost: integer("points_cost").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Order Items Relations
export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id]
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id]
  }),
}));

// Point Transactions Table (for tracking point history)
export const pointTransactions = pgTable("point_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  points: integer("points").notNull(), // Can be positive (earning) or negative (spending)
  description: text("description").notNull(),
  transactionType: text("transaction_type", { enum: ["earned", "spent", "adjusted"] }).notNull(),
  referenceId: integer("reference_id"), // Optional reference to an order or other entity
  createdAt: timestamp("created_at").defaultNow(),
});

// Point Transactions Relations
export const pointTransactionsRelations = relations(pointTransactions, ({ one }) => ({
  user: one(users, {
    fields: [pointTransactions.userId],
    references: [users.id]
  }),
}));

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  displayName: true,
  role: true,
  points: true,
});

export const insertProductSchema = createInsertSchema(products).pick({
  name: true,
  description: true,
  pointsCost: true,
  stock: true,
  imageUrl: true,
  isActive: true,
});

export const insertOrderSchema = createInsertSchema(orders).pick({
  userId: true,
  totalPoints: true,
  status: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).pick({
  orderId: true,
  productId: true,
  quantity: true,
  pointsCost: true,
});

export const insertPointTransactionSchema = createInsertSchema(pointTransactions).pick({
  userId: true,
  points: true,
  description: true,
  transactionType: true,
  referenceId: true,
});

// Update Schemas
export const updateProductSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  pointsCost: z.number().int().positive().optional(),
  stock: z.number().int().optional(),
  imageUrl: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const updateOrderSchema = z.object({
  status: z.enum(["pending", "completed", "cancelled"]).optional(),
});

export const updateUserSchema = z.object({
  displayName: z.string().nullable().optional(),
  email: z.string().email().optional(),
  points: z.number().int().optional(),
  role: z.enum([UserRoleEnum.ADMIN, UserRoleEnum.EMPLOYEE]).optional(),
  unit: z.string().nullable().optional(),
  profileImageUrl: z.string().nullable().optional(),
  password: z.string().optional(),
});

// Type Exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;

export type InsertPointTransaction = z.infer<typeof insertPointTransactionSchema>;
export type PointTransaction = typeof pointTransactions.$inferSelect;

export type UpdateProduct = z.infer<typeof updateProductSchema>;
export type UpdateOrder = z.infer<typeof updateOrderSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
