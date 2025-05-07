import { 
  users, type User, type InsertUser, type UpdateUser,
  products, type Product, type InsertProduct, type UpdateProduct,
  orders, type Order, type InsertOrder, type UpdateOrder,
  orderItems, type OrderItem, type InsertOrderItem,
  pointTransactions, type PointTransaction, type InsertPointTransaction,
  UserRoleEnum
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc } from "drizzle-orm";
import pg from "pg";
import session from "express-session";
import connectPg from "connect-pg-simple";

const { Pool } = pg;

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  sessionStore: session.Store;

  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: UpdateUser): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  getEmployees(): Promise<User[]>;
  
  // Product operations
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: UpdateProduct): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  getAllProducts(): Promise<Product[]>;
  getActiveProducts(): Promise<Product[]>;
  
  // Order operations
  getOrder(id: number): Promise<Order | undefined>;
  getOrdersByUserId(userId: number): Promise<Order[]>;
  getAllOrders(): Promise<(Order & { user: { id: number, username: string, displayName: string | null, email: string } })[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, order: UpdateOrder): Promise<Order | undefined>;
  getOrderWithItems(id: number): Promise<{order: Order, items: (OrderItem & {product: Product})[]} | undefined>;
  
  // Order items operations
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;
  createOrderItems(items: InsertOrderItem[]): Promise<OrderItem[]>;
  
  // Point transaction operations
  createPointTransaction(transaction: InsertPointTransaction): Promise<PointTransaction>;
  getPointTransactionsByUserId(userId: number): Promise<PointTransaction[]>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, userData: UpdateUser): Promise<User | undefined> {
    console.log(`Atualizando usuário ID: ${id} com dados:`, userData);
    try {
      // Certifique-se de que campos nulos sejam tratados corretamente
      const dataToUpdate: any = {};
      
      // Para cada campo no userData, verificamos se ele está definido (mesmo que seja null)
      if (userData.displayName !== undefined) dataToUpdate.displayName = userData.displayName;
      if (userData.email !== undefined) dataToUpdate.email = userData.email;
      if (userData.points !== undefined) dataToUpdate.points = userData.points;
      if (userData.role !== undefined) dataToUpdate.role = userData.role;
      if (userData.unit !== undefined) dataToUpdate.unit = userData.unit;
      if (userData.profileImageUrl !== undefined) dataToUpdate.profileImageUrl = userData.profileImageUrl;
      if (userData.password !== undefined) dataToUpdate.password = userData.password;
      
      // Adicionamos um timestamp de atualização
      dataToUpdate.updatedAt = new Date();
      
      console.log("Dados finais para atualização:", {
        ...dataToUpdate,
        password: dataToUpdate.password ? "[senha encriptada]" : undefined,
        profileImageUrl: dataToUpdate.profileImageUrl ? "[imagem]" : null
      });
      
      const result = await db
        .update(users)
        .set(dataToUpdate)
        .where(eq(users.id, id))
        .returning();
      
      console.log("Resultado da atualização:", result);
      
      if (result && result.length > 0) {
        const [updatedUser] = result;
        return updatedUser;
      }
      
      return undefined;
    } catch (error) {
      console.error(`Erro ao atualizar usuário ID ${id}:`, error);
      return undefined;
    }
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getEmployees(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.role, UserRoleEnum.EMPLOYEE));
  }
  
  async deleteUser(id: number): Promise<boolean> {
    try {
      console.log(`Deletando usuário com ID: ${id}`);
      const [deleted] = await db
        .delete(users)
        .where(eq(users.id, id))
        .returning();
      console.log("Resultado da exclusão:", deleted ? "Usuário excluído com sucesso" : "Nenhum usuário excluído");
      return !!deleted;
    } catch (error) {
      console.error(`Erro ao excluir usuário ID ${id}:`, error);
      return false;
    }
  }

  // Product operations
  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: number, productData: UpdateProduct): Promise<Product | undefined> {
    const [updatedProduct] = await db
      .update(products)
      .set(productData)
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(products)
      .where(eq(products.id, id))
      .returning();
    return !!deleted;
  }

  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(desc(products.createdAt));
  }

  async getActiveProducts(): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.isActive, true))
      .orderBy(asc(products.pointsCost));
  }

  // Order operations
  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getOrdersByUserId(userId: number): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));
  }
  
  async getAllOrders(): Promise<(Order & { user: { id: number, username: string, displayName: string | null, email: string } })[]> {
    return await db.query.orders.findMany({
      with: {
        user: {
          columns: {
            id: true,
            username: true,
            displayName: true,
            email: true
          }
        }
      },
      orderBy: [desc(orders.createdAt)]
    });
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async updateOrder(id: number, orderData: UpdateOrder): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(orders)
      .set(orderData)
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  async getOrderWithItems(id: number): Promise<{order: Order, items: (OrderItem & {product: Product})[]} | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    
    if (!order) return undefined;
    
    const items = await db.query.orderItems.findMany({
      where: eq(orderItems.orderId, id),
      with: {
        product: true
      }
    });
    
    return {
      order,
      items
    };
  }

  // Order items operations
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));
  }

  async createOrderItem(item: InsertOrderItem): Promise<OrderItem> {
    const [newItem] = await db.insert(orderItems).values(item).returning();
    return newItem;
  }

  async createOrderItems(items: InsertOrderItem[]): Promise<OrderItem[]> {
    return await db.insert(orderItems).values(items).returning();
  }

  // Point transaction operations
  async createPointTransaction(transaction: InsertPointTransaction): Promise<PointTransaction> {
    const [newTransaction] = await db
      .insert(pointTransactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  async getPointTransactionsByUserId(userId: number): Promise<PointTransaction[]> {
    return await db
      .select()
      .from(pointTransactions)
      .where(eq(pointTransactions.userId, userId))
      .orderBy(desc(pointTransactions.createdAt));
  }
}

export const storage = new DatabaseStorage();
