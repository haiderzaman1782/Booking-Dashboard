import pool from '../config/database.js';

export class User {
  static async findAll(params = {}) {
    const { limit = 100, offset = 0, role, status } = params;
    let query = 'SELECT * FROM users WHERE 1=1';
    const values = [];
    let paramCount = 1;

    if (role && role !== 'all') {
      query += ` AND role = $${paramCount++}`;
      values.push(role);
    }

    if (status && status !== 'all') {
      query += ` AND status = $${paramCount++}`;
      values.push(status);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  }

  static async create(userData) {
    const {
      fullName,
      email,
      phone,
      role = 'customer',
      status = 'active',
      avatar = null,
    } = userData;

    // Log avatar for debugging
    console.log('User.create - avatar:', avatar ? `Present (${typeof avatar}, length: ${avatar.length})` : 'null/undefined');

    const result = await pool.query(
      `INSERT INTO users (fullName, email, phone, role, status, avatar, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [fullName, email, phone, role, status, avatar]
    );
    
    console.log('User created in DB, avatar saved:', result.rows[0].avatar ? 'Yes' : 'No');
    return result.rows[0];
  }

  static async update(id, userData) {
    const {
      fullName,
      email,
      phone,
      role,
      status,
      avatar,
    } = userData;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (fullName !== undefined) {
      updates.push(`fullName = $${paramCount++}`);
      values.push(fullName);
    }
    if (email !== undefined) {
      updates.push(`email = $${paramCount++}`);
      values.push(email);
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramCount++}`);
      values.push(phone);
    }
    if (role !== undefined) {
      updates.push(`role = $${paramCount++}`);
      values.push(role);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }
    if (avatar !== undefined) {
      updates.push(`avatar = $${paramCount++}`);
      values.push(avatar);
    }

    if (updates.length === 0) {
      return await this.findById(id);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }

  static async updateStats(userId) {
    // Update user statistics based on related records
    const appointmentsResult = await pool.query(
      'SELECT COUNT(*) FROM appointments WHERE user_id = $1',
      [userId]
    );
    const paymentsResult = await pool.query(
      'SELECT COUNT(*) FROM payments WHERE user_id = $1',
      [userId]
    );
    const callsResult = await pool.query(
      'SELECT COUNT(*) FROM calls WHERE user_id = $1',
      [userId]
    );

    await pool.query(
      `UPDATE users SET 
        totalAppointments = $1,
        totalPayments = $2,
        totalCalls = $3,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [
        parseInt(appointmentsResult.rows[0].count),
        parseInt(paymentsResult.rows[0].count),
        parseInt(callsResult.rows[0].count),
        userId
      ]
    );
  }
}

