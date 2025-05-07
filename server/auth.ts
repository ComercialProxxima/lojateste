import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as UserType, UserRoleEnum } from "@shared/schema";

declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      password: string;
      email: string;
      displayName: string | null;
      role: "admin" | "employee";
      points: number;
      createdAt: Date | null;
      updatedAt: Date | null;
    }
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'dev-secret-key',
    resave: true,
    saveUninitialized: true,
    store: storage.sessionStore,
    cookie: {
      httpOnly: true,
      secure: false, // Não usar secure para desenvolvimento
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Registration route (apenas administradores ou primeiro usuário)
  app.post("/api/register", async (req, res, next) => {
    try {
      // Verificar se o usuário existe
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Nome de usuário já existe" });
      }

      // Verificar se é o primeiro usuário (caso especial: primeiro usuário é admin)
      const allUsers = await storage.getAllUsers();
      const isFirstUser = allUsers.length === 0;
      
      // Se não for o primeiro usuário, apenas admins podem registrar
      if (!isFirstUser && (!req.isAuthenticated() || req.user.role !== UserRoleEnum.ADMIN)) {
        return res.status(403).json({ 
          message: "Apenas administradores podem registrar novos usuários" 
        });
      }
      
      // Definir papel do usuário
      const role = isFirstUser ? UserRoleEnum.ADMIN : (req.body.role || UserRoleEnum.EMPLOYEE);
      
      // Verificar se não-admin está tentando criar admin
      if (
        req.user && 
        req.user.role !== UserRoleEnum.ADMIN && 
        role === UserRoleEnum.ADMIN
      ) {
        return res.status(403).json({ 
          message: "Você não tem permissão para criar usuários administradores" 
        });
      }

      // Criar o usuário
      const user = await storage.createUser({
        ...req.body,
        role,
        password: await hashPassword(req.body.password),
      });

      // Fazer login automático após registro se for o primeiro usuário
      if (isFirstUser && !req.user) {
        req.login(user, (err) => {
          if (err) return next(err);
          // Não enviar hash de senha para o cliente
          const { password, ...userWithoutPassword } = user;
          res.status(201).json(userWithoutPassword);
        });
      } else {
        // Não enviar hash de senha para o cliente
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      }
    } catch (error) {
      next(error);
    }
  });

  // Login route
  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    // Don't send password hash to client
    const { password, ...userWithoutPassword } = req.user as Express.User;
    res.status(200).json(userWithoutPassword);
  });

  // Logout route
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // User info route
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autenticado" });
    
    // Don't send password hash to client
    const { password, ...userWithoutPassword } = req.user as Express.User;
    res.json(userWithoutPassword);
  });

  // Middleware to check if user is authenticated
  app.use("/api/admin/*", (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    
    if (req.user.role !== UserRoleEnum.ADMIN) {
      return res.status(403).json({ message: "Acesso não autorizado" });
    }
    
    next();
  });

  // Middleware to check if user is authenticated (for non-admin protected routes)
  app.use("/api/protected/*", (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    next();
  });
}