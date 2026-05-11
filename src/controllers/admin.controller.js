export const adminDashboardHandler = (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to the admin dashboard',
    admin: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    }
  });
};