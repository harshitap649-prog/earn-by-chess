import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { CONFIG } from "../config";
import { prisma } from "../db";

export interface AuthedRequest extends Request {
  user?: { id: string };
}

export const authMiddleware = async (
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("Auth failed: No authorization header");
      return res.status(401).json({ error: "Unauthorized - No token provided" });
    }

    const token = authHeader.substring(7);
    let decoded: { userId: string };
    
    try {
      decoded = jwt.verify(token, CONFIG.jwtSecret) as { userId: string };
    } catch (jwtError) {
      console.log("Auth failed: Invalid JWT token", jwtError);
      return res.status(401).json({ error: "Invalid token - Please login again" });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      console.log("Auth failed: User not found", decoded.userId);
      return res.status(401).json({ error: "User not found" });
    }

    req.user = { id: user.id };
    next();
  } catch (error: any) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ error: error.message || "Authentication failed" });
  }
};

