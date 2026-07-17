import pool from "../config/db";

export const createTruck = async (req, res) => {
    try {

        const {
            truck_number,
            vin,
            make,
            model,
            year,
            plate_number
        } = req.body;

        const existingTruck = await pool.query(
            `
            SELECT id
            FROM trucks
            WHERE truck_number=$1
            `,
            [truck_number]
        );

        if (existingTruck.rows.length > 0) {
            return res.status(400).json({
                message: "Truck already exists"
            });
        }

        const result = await pool.query(
            `
            INSERT INTO trucks
            (
                truck_number,
                vin,
                make,
                model,
                year,
                plate_number
            )

            VALUES
            ($1,$2,$3,$4,$5,$6)

            RETURNING *
            `,
            [
                truck_number,
                vin,
                make,
                model,
                year,
                plate_number
            ]
        );

        res.status(201).json({
            success: true,
            message: "Truck created successfully",
            truck: result.rows[0]
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Server Error"
        });

    }
};

export const getAllTrucks = async (req, res) => {

    try {

        const result = await pool.query(
            `
            SELECT *
            FROM trucks
            ORDER BY created_at DESC
            `
        );

        res.status(200).json(result.rows);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Server Error"
        });

    }

};

export const getTruckById = async (req, res) => {

    try {

        const { id } = req.params;

        const result = await pool.query(
            `
            SELECT *
            FROM trucks
            WHERE id=$1
            `,
            [id]
        );

        if (result.rows.length === 0) {

            return res.status(404).json({
                message: "Truck not found"
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

export const updateTruck = async (req, res) => {

    try {

        const { id } = req.params;

        const {
            truck_number,
            vin,
            make,
            model,
            year,
            plate_number,
            status
        } = req.body;

        const result = await pool.query(
            `
            UPDATE trucks

            SET
            truck_number=$1,
            vin=$2,
            make=$3,
            model=$4,
            year=$5,
            plate_number=$6,
            status=$7

            WHERE id=$8

            RETURNING *
            `,
            [
                truck_number,
                vin,
                make,
                model,
                year,
                plate_number,
                status,
                id
            ]
        );

        if (result.rows.length === 0) {

            return res.status(404).json({
                message: "Truck not found"
            });

        }

        res.json({
            success: true,
            message: "Truck updated successfully",
            truck: result.rows[0]
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Server Error"
        });

    }

};

export const deleteTruck = async (req, res) => {

    try {

        const { id } = req.params;

        const result = await pool.query(
            `
            DELETE FROM trucks
            WHERE id=$1
            RETURNING *
            `,
            [id]
        );

        if (result.rows.length === 0) {

            return res.status(404).json({
                message: "Truck not found"
            });

        }

        res.json({
            success: true,
            message: "Truck deleted successfully"
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Server Error"
        });

    }

};