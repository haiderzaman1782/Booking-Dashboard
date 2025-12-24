import pool from '../config/database.js';

export class Payment {
  static async findAll(params = {}) {
    const { limit = 100, offset = 0, status, search } = params;
    let query = 'SELECT * FROM payments WHERE 1=1';
    const values = [];
    let paramCount = 1;

    if (status && status !== 'all') {
      query += ` AND status = $${paramCount++}`;
      values.push(status);
    }

    if (search) {
      query += ` AND (customerName ILIKE $${paramCount++} OR id ILIKE $${paramCount++} OR transactionId ILIKE $${paramCount++})`;
      const searchPattern = `%${search}%`;
      values.push(searchPattern, searchPattern, searchPattern);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM payments WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async findByTransactionId(transactionId) {
    const result = await pool.query('SELECT * FROM payments WHERE transactionId = $1', [transactionId]);
    return result.rows[0];
  }

  static async create(paymentData) {
    const {
      id,
      transactionId,
      customerName,
      appointmentId,
      paymentMethod,
      amount,
      status = 'pending',
      date,
      timestamp,
      refundStatus,
      service,
      userId,
    } = paymentData;

    // Generate transaction ID if not provided
    const finalTransactionId = transactionId || `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const finalId = id || `PAY${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const result = await pool.query(
      `INSERT INTO payments 
       (id, transactionId, customerName, paymentMethod, amount, status, date, timestamp, refundStatus, service, user_id, appointment_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      // $12 maps to appointment_id (foreign key referencing appointments.id)
      [finalId, finalTransactionId, customerName, paymentMethod, amount, status, date, timestamp, refundStatus, service, userId, appointmentId]
    );
    return result.rows[0];
  }

  static async update(id, paymentData) {
    const {
      status,
      refundStatus,
      failureReason,
    } = paymentData;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }
    if (refundStatus !== undefined) {
      updates.push(`refundStatus = $${paramCount++}`);
      values.push(refundStatus);
    }
    if (failureReason !== undefined) {
      updates.push(`failureReason = $${paramCount++}`);
      values.push(failureReason);
    }

    if (updates.length === 0) {
      return await this.findById(id);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE payments SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query('DELETE FROM payments WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }
}

