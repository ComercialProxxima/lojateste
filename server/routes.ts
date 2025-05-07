import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import multer from "multer";
import path from "path";
import fs from "fs";
import { 
  insertUserSchema, 
  updateUserSchema,
  insertProductSchema,
  updateProductSchema,
  insertOrderSchema,
  updateOrderSchema,
  insertOrderItemSchema,
  insertPointTransactionSchema,
  UserRoleEnum
} from "@shared/schema";
import { z } from "zod";

// Set up multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(import.meta.dirname, "..", "uploads");
      
      // Create the uploads directory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      // Generate a unique filename
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
      const extension = path.extname(file.originalname);
      cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo inválido. Apenas imagens JPG, PNG, GIF e WebP são permitidas.'));
    }
  }
});

// Helper function to parse ID from request params
function parseId(idParam: string): number {
  const id = parseInt(idParam);
  if (isNaN(id)) {
    throw new Error("ID inválido");
  }
  return id;
}

// Middleware to check if user is admin
function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Não autenticado" });
  }
  if (req.user.role !== UserRoleEnum.ADMIN) {
    return res.status(403).json({ message: "Acesso não autorizado. Apenas administradores podem acessar esta função." });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // -------------------------
  // USER ROUTES
  // -------------------------
  
  // Get all employees (admin only)
  app.get("/api/admin/employees", isAdmin, async (req: Request, res: Response) => {
    try {
      const employees = await storage.getEmployees();
      // Don't send password hashes to client
      const safeEmployees = employees.map(({ password, ...employee }) => employee);
      res.status(200).json(safeEmployees);
    } catch (error) {
      res.status(500).json({ message: `Erro ao buscar funcionários: ${error.message}` });
    }
  });
  
  // Update user (admin only)
  app.patch("/api/admin/users/:id", isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseId(req.params.id);
      
      // Verificar se o usuário existe
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Importar hashPassword apenas se precisarmos atualizar a senha
      let newPasswordHash;
      if (req.body.password) {
        const { hashPassword } = await import("./auth");
        newPasswordHash = await hashPassword(req.body.password);
      }
      
      // Preparar dados para atualização
      const updateData: any = {};
      if (req.body.username !== undefined) updateData.username = req.body.username;
      if (req.body.email !== undefined) updateData.email = req.body.email;
      if (req.body.displayName !== undefined) updateData.displayName = req.body.displayName;
      if (req.body.role !== undefined) updateData.role = req.body.role;
      if (req.body.unit !== undefined) updateData.unit = req.body.unit;
      if (newPasswordHash) updateData.password = newPasswordHash;
      
      // Atualizar o usuário
      const updatedUser = await storage.updateUser(id, updateData);
      if (!updatedUser) {
        return res.status(500).json({ message: "Falha ao atualizar usuário" });
      }
      
      // Não enviar hash de senha para o cliente
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      res.status(500).json({ message: `Erro ao atualizar usuário: ${error.message}` });
    }
  });
  
  // Delete user (admin only)
  app.delete("/api/admin/users/:id", isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseId(req.params.id);
      
      // Verificar se não está tentando excluir a si mesmo
      if (req.user && req.user.id === id) {
        return res.status(400).json({ message: "Não é possível excluir o próprio usuário" });
      }
      
      // Verificar se o usuário existe
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Excluir o usuário
      const isDeleted = await storage.deleteUser(id);
      if (!isDeleted) {
        return res.status(500).json({ message: "Falha ao excluir usuário" });
      }
      
      res.status(200).json({ message: "Usuário excluído com sucesso" });
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      res.status(500).json({ message: `Erro ao excluir usuário: ${error.message}` });
    }
  });

  // Update user points (admin only)
  app.patch("/api/admin/users/:id/points", isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseId(req.params.id);
      
      const pointsSchema = z.object({
        points: z.number().int(),
        description: z.string().min(1)
      });
      
      const parsedData = pointsSchema.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({ message: "Dados inválidos fornecidos" });
      }
      
      const { points, description } = parsedData.data;
      
      // Get current user
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Update user points
      const newPoints = user.points + points;
      const updatedUser = await storage.updateUser(id, { points: newPoints });
      
      // Create a point transaction record
      await storage.createPointTransaction({
        userId: id,
        points,
        description,
        transactionType: points > 0 ? "earned" : "adjusted",
        referenceId: null,
      });
      
      // Don't send password hash to client
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: `Erro ao atualizar pontos: ${error.message}` });
    }
  });

  // -------------------------
  // PRODUCT ROUTES
  // -------------------------
  
  // Get all products
  app.get("/api/products", async (req: Request, res: Response) => {
    try {
      // Users see only active products, admins see all
      const isAdmin = req.isAuthenticated() && req.user.role === UserRoleEnum.ADMIN;
      const products = isAdmin 
        ? await storage.getAllProducts()
        : await storage.getActiveProducts();
      
      res.status(200).json(products);
    } catch (error) {
      res.status(500).json({ message: `Erro ao buscar produtos: ${error.message}` });
    }
  });
  
  // Get a single product
  app.get("/api/products/:id", async (req: Request, res: Response) => {
    try {
      const id = parseId(req.params.id);
      
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Produto não encontrado" });
      }
      
      // If not admin and product is inactive, return 404
      if ((!req.isAuthenticated() || req.user.role !== UserRoleEnum.ADMIN) && !product.isActive) {
        return res.status(404).json({ message: "Produto não encontrado" });
      }
      
      res.status(200).json(product);
    } catch (error) {
      res.status(500).json({ message: `Erro ao buscar produto: ${error.message}` });
    }
  });
  
  // Create a product (admin only)
  app.post("/api/admin/products", isAdmin, upload.single('image'), async (req: Request, res: Response) => {
    try {
      const productSchema = insertProductSchema.extend({
        pointsCost: z.coerce.number().int().positive(),
        stock: z.coerce.number().int().min(0),
        isActive: z.coerce.boolean().optional()
      });
      
      const parsedData = productSchema.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({ 
          message: "Dados inválidos fornecidos", 
          errors: parsedData.error.format() 
        });
      }
      
      let imageUrl = null;
      if (req.file) {
        // In a production app, we would upload to S3/Cloudinary/etc.
        // For this example, we just use the local path
        imageUrl = `/uploads/${req.file.filename}`;
      }
      
      const product = await storage.createProduct({
        ...parsedData.data,
        imageUrl
      });
      
      res.status(201).json(product);
    } catch (error) {
      res.status(500).json({ message: `Erro ao criar produto: ${error.message}` });
    }
  });
  
  // Update a product (admin only)
  app.patch("/api/admin/products/:id", isAdmin, upload.single('image'), async (req: Request, res: Response) => {
    try {
      const id = parseId(req.params.id);
      
      const productSchema = updateProductSchema.extend({
        pointsCost: z.coerce.number().int().positive().optional(),
        stock: z.coerce.number().int().min(0).optional(),
        isActive: z.coerce.boolean().optional()
      });
      
      const parsedData = productSchema.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({ 
          message: "Dados inválidos fornecidos", 
          errors: parsedData.error.format() 
        });
      }
      
      // If a new image was uploaded, update the imageUrl
      let imageUrl = undefined;
      if (req.file) {
        imageUrl = `/uploads/${req.file.filename}`;
        
        // Delete old image if it exists
        const product = await storage.getProduct(id);
        if (product?.imageUrl) {
          const oldImagePath = path.join(import.meta.dirname, "..", "public", product.imageUrl);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
      }
      
      const updatedProduct = await storage.updateProduct(id, {
        ...parsedData.data,
        ...(imageUrl ? { imageUrl } : {})
      });
      
      if (!updatedProduct) {
        return res.status(404).json({ message: "Produto não encontrado" });
      }
      
      res.status(200).json(updatedProduct);
    } catch (error) {
      res.status(500).json({ message: `Erro ao atualizar produto: ${error.message}` });
    }
  });
  
  // Delete a product (admin only)
  app.delete("/api/admin/products/:id", isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseId(req.params.id);
      
      // Check if product exists
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Produto não encontrado" });
      }
      
      // Delete the product
      await storage.deleteProduct(id);
      
      // Delete the image if it exists
      if (product.imageUrl) {
        const imagePath = path.join(import.meta.dirname, "..", "public", product.imageUrl);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
      
      res.status(200).json({ message: "Produto excluído com sucesso" });
    } catch (error) {
      res.status(500).json({ message: `Erro ao excluir produto: ${error.message}` });
    }
  });
  
  // -------------------------
  // ORDER ROUTES
  // -------------------------
  
  // Get user orders
  app.get("/api/protected/orders", async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      
      const orders = await storage.getOrdersByUserId(userId);
      res.status(200).json(orders);
    } catch (error) {
      res.status(500).json({ message: `Erro ao buscar pedidos: ${error.message}` });
    }
  });
  
  // Get order details
  app.get("/api/protected/orders/:id", async (req: Request, res: Response) => {
    try {
      const id = parseId(req.params.id);
      
      const orderWithItems = await storage.getOrderWithItems(id);
      if (!orderWithItems) {
        return res.status(404).json({ message: "Pedido não encontrado" });
      }
      
      // Check if the order belongs to the user or if user is admin
      if (
        orderWithItems.order.userId !== req.user.id && 
        req.user.role !== UserRoleEnum.ADMIN
      ) {
        return res.status(403).json({ message: "Acesso não autorizado a este pedido" });
      }
      
      res.status(200).json(orderWithItems);
    } catch (error) {
      res.status(500).json({ message: `Erro ao buscar detalhes do pedido: ${error.message}` });
    }
  });
  
  // Create a new order
  app.post("/api/protected/orders", async (req: Request, res: Response) => {
    try {
      const orderRequestSchema = z.object({
        items: z.array(z.object({
          productId: z.number().int().positive(),
          quantity: z.number().int().positive()
        }))
      });
      
      const parsedData = orderRequestSchema.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({ 
          message: "Dados inválidos fornecidos", 
          errors: parsedData.error.format() 
        });
      }
      
      const { items } = parsedData.data;
      const userId = req.user.id;
      
      // Get user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Get products and calculate total points
      let totalPoints = 0;
      const orderProducts = [];
      
      for (const item of items) {
        const product = await storage.getProduct(item.productId);
        if (!product) {
          return res.status(400).json({ message: `Produto ID ${item.productId} não encontrado` });
        }
        
        if (!product.isActive) {
          return res.status(400).json({ message: `Produto ${product.name} não está disponível` });
        }
        
        if (product.stock < item.quantity) {
          return res.status(400).json({ message: `Estoque insuficiente para ${product.name}` });
        }
        
        const itemTotal = product.pointsCost * item.quantity;
        totalPoints += itemTotal;
        
        orderProducts.push({
          product,
          quantity: item.quantity,
          pointsCost: product.pointsCost
        });
      }
      
      // Check if user has enough points
      if (user.points < totalPoints) {
        return res.status(400).json({ 
          message: "Pontos insuficientes", 
          userPoints: user.points,
          requiredPoints: totalPoints
        });
      }
      
      // Create order
      const order = await storage.createOrder({
        userId,
        totalPoints,
        status: "pending"
      });
      
      // Create order items
      const orderItems = await storage.createOrderItems(
        orderProducts.map(item => ({
          orderId: order.id,
          productId: item.product.id,
          quantity: item.quantity,
          pointsCost: item.pointsCost
        }))
      );
      
      // Update product stock
      for (const item of orderProducts) {
        await storage.updateProduct(item.product.id, {
          stock: item.product.stock - item.quantity
        });
      }
      
      // Update user points
      await storage.updateUser(userId, {
        points: user.points - totalPoints
      });
      
      // Create point transaction
      await storage.createPointTransaction({
        userId,
        points: -totalPoints,
        description: `Pedido #${order.id}`,
        transactionType: "spent",
        referenceId: order.id
      });
      
      // Return order with items
      res.status(201).json({
        order,
        items: orderItems.map((item, index) => ({
          ...item,
          product: orderProducts[index].product
        }))
      });
    } catch (error) {
      res.status(500).json({ message: `Erro ao criar pedido: ${error.message}` });
    }
  });
  
  // Get all orders (admin only)
  app.get("/api/admin/orders", isAdmin, async (req: Request, res: Response) => {
    try {
      // Obter todos os pedidos com informações do usuário
      const allOrders = await storage.getAllOrders();
      
      res.status(200).json(allOrders);
    } catch (error) {
      res.status(500).json({ message: `Erro ao buscar pedidos: ${error instanceof Error ? error.message : String(error)}` });
    }
  });
  
  // Get specific order details (admin only)
  app.get("/api/admin/orders/:id", isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseId(req.params.id);
      
      const orderDetails = await storage.getOrderWithItems(id);
      if (!orderDetails) {
        return res.status(404).json({ message: "Pedido não encontrado" });
      }
      
      res.status(200).json(orderDetails);
    } catch (error) {
      res.status(500).json({ message: `Erro ao buscar detalhes do pedido: ${error instanceof Error ? error.message : String(error)}` });
    }
  });
  
  // Update order status (admin only)
  app.patch("/api/admin/orders/:id/status", isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseId(req.params.id);
      
      const statusSchema = z.object({
        status: z.enum(["pending", "completed", "cancelled"])
      });
      
      const parsedData = statusSchema.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({ message: "Status inválido fornecido" });
      }
      
      const { status } = parsedData.data;
      
      // Get the order
      const order = await storage.getOrder(id);
      if (!order) {
        return res.status(404).json({ message: "Pedido não encontrado" });
      }
      
      // Handle cancellation (refund points)
      if (status === "cancelled" && order.status !== "cancelled") {
        const user = await storage.getUser(order.userId);
        if (user) {
          // Update user points (refund)
          await storage.updateUser(user.id, {
            points: user.points + order.totalPoints
          });
          
          // Create point transaction
          await storage.createPointTransaction({
            userId: user.id,
            points: order.totalPoints,
            description: `Reembolso do Pedido #${order.id}`,
            transactionType: "earned",
            referenceId: order.id
          });
          
          // Return inventory
          const orderItems = await storage.getOrderItems(order.id);
          for (const item of orderItems) {
            const product = await storage.getProduct(item.productId);
            if (product) {
              await storage.updateProduct(product.id, {
                stock: product.stock + item.quantity
              });
            }
          }
        }
      }
      
      // Update order status
      const updatedOrder = await storage.updateOrder(id, { status });
      
      res.status(200).json(updatedOrder);
    } catch (error) {
      res.status(500).json({ message: `Erro ao atualizar status do pedido: ${error.message}` });
    }
  });
  
  // -------------------------
  // POINT TRANSACTION ROUTES
  // -------------------------
  
  // Get user point history
  app.get("/api/protected/points/history", async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      
      const transactions = await storage.getPointTransactionsByUserId(userId);
      res.status(200).json(transactions);
    } catch (error) {
      res.status(500).json({ message: `Erro ao buscar histórico de pontos: ${error.message}` });
    }
  });
  
  // Rota para atualizar o perfil do usuário
  app.patch("/api/protected/profile", async (req: Request, res: Response) => {
    console.log("Recebida solicitação para atualizar perfil:", req.body);
    
    try {
      if (!req.isAuthenticated() || !req.user) {
        console.log("Usuário não autenticado");
        return res.status(401).json({ message: "Não autenticado" });
      }
      
      const { displayName, currentPassword, newPassword, unit, profileImageUrl } = req.body;
      
      console.log("Dados recebidos: ", {
        displayName, 
        unit, 
        profileImageUrl: profileImageUrl ? "[imagem recebida]" : null,
        hasCurrentPassword: !!currentPassword,
        hasNewPassword: !!newPassword
      });
      
      if (!currentPassword) {
        return res.status(400).json({ message: "Senha atual é obrigatória" });
      }
      
      // Verificar a senha atual
      const user = await storage.getUser(req.user.id);
      if (!user) {
        console.log("Usuário não encontrado ID:", req.user.id);
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Importar funções de autenticação
      const { comparePasswords, hashPassword } = await import("./auth");
      
      // Comparar senha atual
      const passwordValid = await comparePasswords(currentPassword, user.password);
      if (!passwordValid) {
        console.log("Senha atual incorreta");
        return res.status(400).json({ message: "Senha atual incorreta" });
      }
      
      // Preparar dados de atualização
      const updateData: any = {};
      if (displayName !== undefined) updateData.displayName = displayName;
      if (newPassword) updateData.password = await hashPassword(newPassword);
      if (unit !== undefined) updateData.unit = unit;
      if (profileImageUrl !== undefined) updateData.profileImageUrl = profileImageUrl;
      
      console.log("Dados para atualização:", {
        ...updateData,
        password: updateData.password ? "[senha encriptada]" : undefined,
        profileImageUrl: updateData.profileImageUrl ? "[imagem]" : null
      });
      
      // Atualizar usuário
      const updatedUser = await storage.updateUser(req.user.id, updateData);
      if (!updatedUser) {
        console.log("Falha ao atualizar usuário");
        return res.status(404).json({ message: "Não foi possível atualizar o usuário" });
      }
      
      // Não enviar hash de senha para o cliente
      const { password, ...userWithoutPassword } = updatedUser;
      
      console.log("Perfil atualizado com sucesso");
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      res.status(500).json({ message: `Erro ao atualizar perfil: ${error.message}` });
    }
  });

  // Init server
  const httpServer = createServer(app);
  return httpServer;
}
