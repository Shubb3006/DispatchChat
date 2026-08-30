import pool from "../config/db.js"
export const createCustomer = async (req, res) => {
  try {
    const {
      company_name,
      contact_person,
      email,
      phone,
      address,
      city,
      state,
      country,
      zip_code,
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO customers
      (
        company_name,
        contact_person,
        email,
        phone,
        address,
        city,
        state,
        country,
        zip_code
      )
      VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *
      `,
      [
        company_name,
        contact_person,
        email,
        phone,
        address,
        city,
        state,
        country,
        zip_code,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Customer created successfully",
      customer: result.rows[0],
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Get All Customers
export const getCustomers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM customers
      ORDER BY created_at DESC
    `);

    return res.json({
      success: true,
      customers: result.rows,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Get Single Customer
export const getCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT *
      FROM customers
      WHERE id=$1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    return res.json({
      success: true,
      customer: result.rows[0],
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Update Customer
export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      company_name,
      contact_person,
      email,
      phone,
      address,
      city,
      state,
      country,
      zip_code,
    } = req.body;

    const result = await pool.query(
      `
      UPDATE customers
      SET
        company_name=$1,
        contact_person=$2,
        email=$3,
        phone=$4,
        address=$5,
        city=$6,
        state=$7,
        country=$8,
        zip_code=$9
      WHERE id=$10
      RETURNING *
      `,
      [
        company_name,
        contact_person,
        email,
        phone,
        address,
        city,
        state,
        country,
        zip_code,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    return res.json({
      success: true,
      message: "Customer updated successfully",
      customer: result.rows[0],
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Delete Customer
export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM customers
      WHERE id=$1
      RETURNING *
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    return res.json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};