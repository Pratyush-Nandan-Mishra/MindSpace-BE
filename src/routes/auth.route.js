import express from "express";
import passport from "passport";
import {
  getProfile,
  logout,
  checkAuth,
  getAllUsers,
  updateProfile,
} from "../controllers/auth.controller.js";
import {
  isAuthenticated,
  isNotAuthenticated,
  isAdmin
} from "../middleware/auth.middleware.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken, 
} from "../helpers/jwt.helper.js";

import User from "../models/User.js"; 

const router = express.Router();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:8080";

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  router.get(
    "/google",
    isNotAuthenticated,
    passport.authenticate("google", { scope: ["profile", "email"] })
  );

  // No successRedirect if JSON
  router.get(
    "/google/callback",
    passport.authenticate("google", {
      failureRedirect: `${FRONTEND_URL}/auth/redirect?error=auth_failed`,
    }),
    async (req, res) => {
      //Check if it's an API request
      const isApiRequest = req.headers.accept?.includes('application/json') ||
                           req.query.mode === 'json';

      // Generate tokens
      const accessToken = generateAccessToken(req.user);
      const refreshToken = generateRefreshToken(req.user);

      if (isApiRequest) {
        // For Postman 
        return res.json({
          success: true,
          message: "Login successful",
          user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
            picture: req.user.picture,
          },
          accessToken,
          refreshToken,
          expiresIn: process.env.JWT_EXPIRES_IN,
        });
      }

      //Redirect to frontend
      res.redirect(`${FRONTEND_URL}/dashboard`);
    }
  );
} else {
  router.get("/google", (req, res) => {
    console.error("Google OAuth is not configured. Check .env file.");
    res.redirect(`${FRONTEND_URL}/auth/error?code=OAUTH_NOT_CONFIGURED`);
  });

  router.get("/google/callback", (req, res) => {
    res.status(503).json({
      success: false,
      message:
        "Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file.",
    });
  });
}

// Use verifyRefreshToken, not verifyAccessToken
router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: "Refresh token required",
    });
  }

  try {
    const decoded = verifyRefreshToken(refreshToken); 

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    res.json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: process.env.JWT_EXPIRES_IN,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token",
    });
  }
});


router.get("/success", (req, res) => {
  res.json({
    success: true,
    message: "Authentication successful",
    user: req.user
      ? {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          picture: req.user.picture,
        }
      : null,
  });
});

router.get("/failure", (req, res) => {
  res.status(401).json({
    success: false,
    message: "Authentication failed",
  });
});


router.post("/logout", isAuthenticated, logout);
router.get("/profile", isAuthenticated, getProfile);
router.put("/profile", isAuthenticated, updateProfile);
router.get("/status", checkAuth);
router.get("/users", isAuthenticated, isAdmin, getAllUsers);
router.get("/me", getProfile);

export default router;



// import express from "express";
// import passport from "passport";
// import {
//   getProfile,
//   logout,
//   checkAuth,
//   getAllUsers,
//   updateProfile,
// } from "../controllers/auth.controller.js";
// import {
//   isAuthenticated,
//   isNotAuthenticated,
//   isAdmin
// } from "../middleware/auth.middleware.js";
// import {
//   generateAccessToken,
//   generateRefreshToken,
//   verifyAccessToken,
// } from "../helpers/jwt.helper.js"
// //import {authenticateJwt} from "../middleware/jwt.middleware.js";

// const router = express.Router();

// const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:8080";

// if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
//   router.get(
//     "/google",
//     isNotAuthenticated,
//     passport.authenticate("google", { scope: ["profile", "email"] })
//   );

//   router.get(
//     "/google/callback",
//     passport.authenticate("google", {
//       failureRedirect: `${FRONTEND_URL}/auth/redirect?error=auth_failed`,
//       successRedirect: `${FRONTEND_URL}/dashboard`,
//     }),
//     (req, res) => {
//       const accessToken = generateAccessToken(req.user);
//       const refreshToken = generateRefreshToken(req.user);
//       res.json({
//        success: true,
//        message: "Login successful",
//        user: {
//          id: req.user._id,
//          name: req.user.name,
//          email: req.user.email,
//          role: req.user.role,
//       },
//       accessToken,
//       refreshToken,
//       expiresIn: process.env.JWT_EXPIRES_IN,
//     });
//     }
//   );
// } else {
//   router.get("/google", (req, res) => {
//     res.status(503).json({
//       success: false,
//       message:
//         "Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file.",
//     });
//   });

//   router.get("/google/callback", (req, res) => {
//     res.status(503).json({
//       success: false,
//       message:
//         "Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file.",
//     });
//   });
// }


// router.post("/refresh", async (req, res) => {
//   const { refreshToken } = req.body;

//   if (!refreshToken) {
//     return res.status(401).json({
//       success: false,
//       message: "Refresh token required",
//     });
//   }

//   try {
//     const decoded = await verifyAccessToken(refreshToken);

    
//     const user = await User.findById(decoded.id);
//     if (!user) {
//       return res.status(401).json({ success: false, message: "User not found" });
//     }


//     const newAccessToken = generateAccessToken(user);
//     const newRefreshToken = generateRefreshToken(user);

//     res.json({
//       success: true,
//       accessToken: newAccessToken,
//       refreshToken: newRefreshToken,
//       expiresIn: process.env.JWT_EXPIRES_IN,
//     });
//   } catch (error) {
//     return res.status(401).json({
//       success: false,
//       message: "Invalid or expired refresh token",
//     });
//   }
// });

// router.get("/success", (req, res) => {
//   res.json({
//     success: true,
//     message: "Authentication successful",
//     user: req.user
//       ? {
//           id: req.user._id,
//           name: req.user.name,
//           email: req.user.email,
//           picture: req.user.picture,
//         }
//       : null,
//   });
// });

// router.get("/failure", (req, res) => {
//   res.status(401).json({
//     success: false,
//     message: "Authentication failed",
//   });
// });

// router.post("/logout", isAuthenticated, logout);
// router.get("/profile", isAuthenticated, getProfile);
// router.put("/profile", isAuthenticated, updateProfile);
// router.get("/status", checkAuth);
// router.get("/users", isAuthenticated, isAdmin, getAllUsers);
// router.get("/me", getProfile); 
// //router.get("/me", authenticateJwt, getProfile); 
// //router.put("/profile", authenticateJwt, updateProfile);
// //router.get("/profile", authenticateJwt, getProfile);
// //for testing only
// //router.put("/profile", updateProfile);
// //router.get("/profile", getProfile);


// export default router;
