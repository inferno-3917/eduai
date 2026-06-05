import { Request, Response } from 'express';
import { query } from '../config/db';
import * as bcrypt from 'bcryptjs';

// Get dashboard statistics and user list
export const getStats = async (req: Request, res: Response) => {
  try {
    // 1. Total users
    const usersCountRes = await query('SELECT COUNT(*) as count FROM users');
    const totalUsers = parseInt(usersCountRes.rows[0].count);

    // 2. Active users (users who took an assessment or chatted recently)
    const activeUsersRes = await query(
      `SELECT COUNT(DISTINCT user_id) as count FROM (
         SELECT user_id FROM quiz_attempts
         UNION
         SELECT user_id FROM chat_history
       ) as active`
    );
    const activeUsers = parseInt(activeUsersRes.rows[0].count);

    // 3. Courses count
    const coursesCountRes = await query('SELECT COUNT(*) as count FROM courses');
    const totalCourses = parseInt(coursesCountRes.rows[0].count);

    // 4. Attempts count
    const attemptsCountRes = await query('SELECT COUNT(*) as count FROM quiz_attempts');
    const totalAttempts = parseInt(attemptsCountRes.rows[0].count);

    // 5. User list (id, name, email, role, date registered)
    const userListRes = await query(
      `SELECT u.id, u.name, u.email, r.name as role, u.created_at 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       ORDER BY u.created_at DESC`
    );

    return res.status(200).json({
      stats: {
        totalUsers,
        activeUsers: activeUsers || totalUsers, // fallback if zero
        totalCourses,
        totalAttempts
      },
      users: userListRes.rows
    });

  } catch (error) {
    console.error('Fetch admin stats error:', error);
    return res.status(500).json({ message: 'Failed to retrieve admin platform metrics.' });
  }
};

// Create a new user (Admin only)
export const createUser = async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Name, email, password, and role are required.' });
  }

  try {
    // 1. Check if email already exists
    const emailCheck = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ message: 'A user with this email address already exists.' });
    }

    // 2. Resolve role to role_id
    const roleRes = await query('SELECT id FROM roles WHERE name = $1', [role]);
    if (roleRes.rows.length === 0) {
      return res.status(400).json({ message: `Invalid role type: ${role}` });
    }
    const roleId = roleRes.rows[0].id;

    // 3. Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. Insert user
    const insertRes = await query(
      `INSERT INTO users (name, email, password_hash, role_id) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, name, email, created_at`,
      [name, email, passwordHash, roleId]
    );

    return res.status(201).json({
      message: 'User created successfully.',
      user: {
        id: insertRes.rows[0].id,
        name: insertRes.rows[0].name,
        email: insertRes.rows[0].email,
        role,
        created_at: insertRes.rows[0].created_at
      }
    });

  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({ message: 'Failed to create user.' });
  }
};

// Update an existing user (Admin only)
export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email, password, role } = req.body;

  try {
    // 1. Check if user exists
    const userRes = await query('SELECT u.*, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1', [id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    const currentUser = userRes.rows[0];

    // 2. If email is updated, check for conflicts
    let updatedEmail = currentUser.email;
    if (email && email !== currentUser.email) {
      const emailCheck = await query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, id]);
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ message: 'A user with this email address already exists.' });
      }
      updatedEmail = email;
    }

    // 3. Resolve role to role_id
    let updatedRoleId = currentUser.role_id;
    let finalRole = currentUser.role;
    if (role && role !== currentUser.role) {
      const roleRes = await query('SELECT id FROM roles WHERE name = $1', [role]);
      if (roleRes.rows.length === 0) {
        return res.status(400).json({ message: `Invalid role type: ${role}` });
      }
      updatedRoleId = roleRes.rows[0].id;
      finalRole = role;
    }

    // 4. If password is provided, hash it
    let updatedPasswordHash = currentUser.password_hash;
    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      updatedPasswordHash = await bcrypt.hash(password, salt);
    }

    const updatedName = name || currentUser.name;

    // 5. Perform update
    await query(
      `UPDATE users 
       SET name = $1, email = $2, password_hash = $3, role_id = $4, updated_at = NOW() 
       WHERE id = $5`,
      [updatedName, updatedEmail, updatedPasswordHash, updatedRoleId, id]
    );

    return res.status(200).json({
      message: 'User updated successfully.',
      user: {
        id: parseInt(id),
        name: updatedName,
        email: updatedEmail,
        role: finalRole
      }
    });

  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({ message: 'Failed to update user.' });
  }
};

// Delete an existing user (Admin only)
export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // 1. Prevent self-deletion
    if (req.user && req.user.id === parseInt(id)) {
      return res.status(400).json({ message: 'Self-deletion is forbidden. You cannot delete your own admin account.' });
    }

    // 2. Perform deletion (cascades to quiz_attempts, learning_paths, etc.)
    const deleteRes = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    if (deleteRes.rowCount === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.status(200).json({
      message: 'User deleted successfully.',
      userId: parseInt(id)
    });

  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ message: 'Failed to delete user.' });
  }
};
