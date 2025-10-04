import { Router } from "express";
import { 
  getProfile, 
  updateProfile, 
  getProtectedData 
} from "../controllers/protected.controllers.js";

const router = Router();

// All routes here are already protected by authenticateJWT middleware in index.js
// So req.user will always be available

// Get user profile
router.get("/profile", getProfile);

// Update user profile
router.put("/profile", updateProfile);

// Example protected data endpoint
router.get("/data", getProtectedData);

export default router;