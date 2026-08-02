import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Signup Route with Role Selection (user / admin)
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const assignedRole = (role || 'user').toLowerCase() === 'admin' ? 'admin' : 'user';

    // Check existing email
    const [existing] = await pool.query('SELECT * FROM users WHERE LOWER(email) = :email', {
      email: cleanEmail,
    });

    if (existing && existing.length > 0) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES (:name, :email, :password_hash, :role)`,
      {
        name,
        email: cleanEmail,
        password_hash: passwordHash,
        role: assignedRole,
      }
    );

    const userId = result.insertId;
    const userPayload = {
      id: userId,
      name,
      email: cleanEmail,
      role: assignedRole,
    };

    const token = jwt.sign(userPayload, process.env.JWT_SECRET || 'secret_key', {
      expiresIn: '7d',
    });

    res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: userPayload,
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Failed to create account. Please try again.' });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    const [users] = await pool.query('SELECT * FROM users WHERE LOWER(email) = :email', {
      email: cleanEmail,
    });

    if (!users || users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = users[0];
    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const userPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || 'user',
      phone: user.phone || '',
      employment_type: user.employment_type || 'Salaried',
      monthly_income: user.monthly_income || 50000,
      credit_score: user.credit_score || 720,
    };

    const token = jwt.sign(userPayload, process.env.JWT_SECRET || 'secret_key', {
      expiresIn: '7d',
    });

    res.json({
      message: 'Login successful.',
      token,
      user: userPayload,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Login failed. Please try again.' });
  }
});

// Get User Profile
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const [users] = await pool.query('SELECT id, name, email, role, phone, employment_type, monthly_income, credit_score, created_at FROM users WHERE id = :userId', { userId });

    if (!users || users.length === 0) {
      return res.status(404).json({ message: 'User profile not found.' });
    }

    res.json(users[0]);
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ message: 'Failed to fetch profile.' });
  }
});

// Update Profile
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone, employment_type, monthly_income, credit_score } = req.body;

    await pool.query(
      `UPDATE users
       SET name = :name,
           phone = :phone,
           employment_type = :employment_type,
           monthly_income = :monthly_income,
           credit_score = :credit_score
       WHERE id = :userId`,
      {
        userId,
        name,
        phone: phone || '',
        employment_type: employment_type || 'Salaried',
        monthly_income: Number(monthly_income) || 50000,
        credit_score: Number(credit_score) || 720,
      }
    );

    const [updated] = await pool.query('SELECT id, name, email, role, phone, employment_type, monthly_income, credit_score FROM users WHERE id = :userId', { userId });
    res.json({ message: 'Profile updated successfully.', user: updated[0] });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ message: 'Failed to update profile.' });
  }
});

export default router;
