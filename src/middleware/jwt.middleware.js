import jwt from 'jsonwebtoken';
import User from '../models/User.js'

export  const authenticateJWT = async (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'User no longer exists.' });
    }

    req.user = user; // Attach full user object
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(403).json({ message: 'Token expired.' });
    }
    return res.status(403).json({ message: 'Invalid token.' });
  }
};

