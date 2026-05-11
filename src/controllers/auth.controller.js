import User from "../models/User.js";
import jwt from 'jsonwebtoken';
import dotenv from "dotenv";
dotenv.config();
export const getProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const dbUser = await User.findById(req.user._id);
    if (!dbUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found in database', // Find full user in DB (in case req.user is minimal from OAuth)
      });
    }

    // Refresh lastLogin
    dbUser.lastLogin = new Date();
    await dbUser.save();

    const userProfile = {
      id: dbUser._id,
      name: dbUser.name,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      email: dbUser.email,
      picture: dbUser.picture,
      role: dbUser.role,
      lastLogin: dbUser.lastLogin,
      createdAt: dbUser.createdAt,
    };

    const token = jwt.sign(
      { id: dbUser._id, role: dbUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });


    res.json({
      success: true,
      user: userProfile,
       message: 'Profile fetched successfully',
    });
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Error during logout'
      });
    }
    
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Error destroying session'
        });
      }
      
      res.clearCookie('connect.sid');
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    });
  });
};

export const checkAuth = (req, res) => {
  if (req.isAuthenticated()) {
    const userProfile = {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      picture: req.user.picture,
      role: req.user.role,
    };

    res.json({
      success: true,
      authenticated: true,
      user: userProfile
    });
  } else {
    res.json({
      success: true,
      authenticated: false,
      user: null
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, {
      password: 0,
      __v: 0
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      users
    });
  }
  catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, firstName, lastName, phoneNumber, emailNotifications } = req.body;
    
    const updateData = {};
    if (name)
      updateData.name = name;
    if (firstName)
      updateData.firstName = firstName;
    if (lastName)
      updateData.lastName = lastName;
    if(phoneNumber)
      updateData.phoneNumber = phoneNumber;
    if(emailNotifications)
      updateData.emailNotifications = emailNotifications;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateData, { new: true,
        runValidators: true
      }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userProfile = {
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      picture: updatedUser.picture,
      role: updatedUser.role,
      phoneNumber: updatedUser.phoneNumber,
      emailNotifications: updatedUser.emailNotifications
    };

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: userProfile
    });
  }
  catch (error) {
    console.error('Error updating profile:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}; 