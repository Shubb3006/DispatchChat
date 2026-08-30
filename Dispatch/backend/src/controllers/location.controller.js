import pool from "../config/db.js";
import { parseListParams, buildSearchClause, resolveSortClause } from "./customer.controller.js";

export const createLocation = async (req, res) => {
    try {

        const {
            name,
            address,
            city,
            state,
            zip_code,
            country,
            contact_person,
            contact_phone
        } = req.body;

        const existingLocation = await pool.query(
            `
            SELECT id
            FROM locations
            WHERE name=$1
            `,
            [name]
        );

        if (existingLocation.rows.length > 0) {
            return res.status(400).json({
                message: "Location already exists"
            });
        }

        const result = await pool.query(
            `
            INSERT INTO locations
            (
                name,
                address,
                city,
                state,
                zip_code,
                country,
                contact_person,
                contact_phone
            )

            VALUES
            ($1,$2,$3,$4,$5,$6,$7,$8)

            RETURNING *
            `,
            [
                name,
                address,
                city,
                state,
                zip_code,
                country,
                contact_person,
                contact_phone
            ]
        );

        res.status(201).json({
            success: true,
            message: "Location created successfully",
            location: result.rows[0]
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Server Error"
        });

    }
};

export const getAllLocations = async (req, res) => {

    try {
        const { hasListParams, limit, offset, q, sort } = parseListParams(req.query);

        // Paginated/searchable shape when list params are present
        if (hasListParams) {
            const params = [];
            const where = [];

            if (q) {
                where.push(
                    buildSearchClause(
                        q,
                        ["name", "address", "city", "state", "zip_code", "country", "contact_person"],
                        params
                    )
                );
            }

            const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
            const orderSql = resolveSortClause(
                sort,
                {
                    created_at: "created_at",
                    name: "name",
                    city: "city",
                    state: "state",
                    country: "country",
                },
                "ORDER BY created_at DESC"
            );

            params.push(limit, offset);
            const result = await pool.query(
                `SELECT *, COUNT(*) OVER() AS __total
                 FROM locations
                 ${whereSql}
                 ${orderSql}
                 LIMIT $${params.length - 1} OFFSET $${params.length}`,
                params
            );

            const total = result.rows.length ? Number(result.rows[0].__total) : 0;
            const data = result.rows.map(({ __total, ...row }) => row);

            return res.json({ data, total, limit, offset });
        }

        const result = await pool.query(
            `
            SELECT *
            FROM locations
            ORDER BY created_at DESC
            `
        );

        res.json(result.rows);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Server Error"
        });

    }

};

export const getLocationById = async (req, res) => {

    try {

        const { id } = req.params;

        const result = await pool.query(
            `
            SELECT *
            FROM locations
            WHERE id=$1
            `,
            [id]
        );

        if (result.rows.length === 0) {

            return res.status(404).json({
                message: "Location not found"
            });

        }

        res.json(result.rows[0]);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Server Error"
        });

    }

};

export const updateLocation = async (req, res) => {

    try {

        const { id } = req.params;

        const {
            name,
            address,
            city,
            state,
            zip_code,
            country,
            contact_person,
            contact_phone
        } = req.body;

        const result = await pool.query(
            `
            UPDATE locations

            SET
            name=$1,
            address=$2,
            city=$3,
            state=$4,
            zip_code=$5,
            country=$6,
            contact_person=$7,
            contact_phone=$8

            WHERE id=$9

            RETURNING *
            `,
            [
                name,
                address,
                city,
                state,
                zip_code,
                country,
                contact_person,
                contact_phone,
                id
            ]
        );

        if (result.rows.length === 0) {

            return res.status(404).json({
                message: "Location not found"
            });

        }

        res.json({
            success: true,
            message: "Location updated successfully",
            location: result.rows[0]
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Server Error"
        });

    }

};

export const deleteLocation = async (req, res) => {

    try {

        const { id } = req.params;

        const result = await pool.query(
            `
            DELETE FROM locations
            WHERE id=$1
            RETURNING *
            `,
            [id]
        );

        if (result.rows.length === 0) {

            return res.status(404).json({
                message: "Location not found"
            });

        }

        res.json({
            success: true,
            message: "Location deleted successfully"
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Server Error"
        });

    }

};