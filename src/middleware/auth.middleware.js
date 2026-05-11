export const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ 
    success: false, 
    message: 'Authentication required' 
  });
};

export const isNotAuthenticated = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return next();
  }
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';
  res.redirect(`${FRONTEND_URL}/dashboard`);
};

export const isAdmin = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Admin access required' 
    });
  }

  return next();
};

export const getCurrentUser = (req, res, next) => {
  if (req.isAuthenticated()) {
    req.currentUser = req.user;
  }
  next();
}; 