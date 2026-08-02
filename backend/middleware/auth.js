import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : req.query.token;

  if (!token) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired session.' });
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    requireAuth(req, res, () => {
      const userRole = (req.user?.role || 'user').toLowerCase();
      const targetRole = role.toLowerCase();

      if (userRole !== targetRole && userRole !== 'admin') {
        return res.status(403).json({ message: `Access forbidden: ${role.toUpperCase()} privileges required.` });
      }
      next();
    });
  };
}

export const requireAdmin = requireRole('admin');
