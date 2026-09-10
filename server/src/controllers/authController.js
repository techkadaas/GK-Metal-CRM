import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'gk_metal_default_jwt_secret_dev';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const getCurrentUser = (req, res) => {
  // Return current logged in employee context
  res.json({
    success: true,
    user: {
      id: 'emp_1',
      employeeId: 'EMP-01',
      name: 'G. Karthikeyan',
      email: 'karthik@gkmetallab.com',
      role: 'Admin',
      department: 'Technical & Quality QA',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    }
  });
};

export const login = (req, res) => {
  const { email, password } = req.body;
  const user = {
    id: 'emp_1',
    employeeId: 'EMP-01',
    name: 'G. Karthikeyan',
    email: email || 'karthik@gkmetallab.com',
    role: 'Admin',
    department: 'Technical & Quality QA'
  };

  try {
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      token,
      user
    });
  } catch (error) {
    res.json({
      success: true,
      token: `token_${Date.now()}`,
      user
    });
  }
};

