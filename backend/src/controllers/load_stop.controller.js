import pool from "../config/db";

export const createLoadStop = async (req, res) => {
    try {

        const {
            load_id,
            stop_order,
            company_name,
            address,
            city,
            state,
            zip,
            stop_type,
            arrival_time,
            departure_time
        } = req.body;

        // Check load exists
        const load = await pool.query(
            `
            SELECT id
            FROM loads
            WHERE id=$1
            `,
            [load_id]
        );

        if (load.rows.length === 0) {
            return res.status(404).json({
                message: "Load not found"
            });
        }

        const result = await pool.query(
            `
            INSERT INTO load_stops
            (
                load_id,
                stop_order,
                company_name,
                address,
                city,
                state,
                zip,
                stop_type,
                arrival_time,
                departure_time
            )

            VALUES
            ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)

            RETURNING *
            `,
            [
                load_id,
                stop_order,
                company_name,
                address,
                city,
                state,
                zip,
                stop_type,
                arrival_time,
                departure_time
            ]
        );

        res.status(201).json({
            success: true,
            message: "Load stop created successfully",
            stop: result.rows[0]
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Server Error"
        });

    }
};

export const getAllLoadStops = async (req, res) => {

    try {

        const result = await pool.query(
            `
            SELECT *
            FROM load_stops
            ORDER BY load_id, stop_order
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

export const getLoadStopById = async (req, res) => {

    try {

        const { id } = req.params;

        const result = await pool.query(
            `
            SELECT *
            FROM load_stops
            WHERE id=$1
            `,
            [id]
        );

        if (result.rows.length === 0) {

            return res.status(404).json({
                message: "Load stop not found"
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

export const getStopsByLoad = async (req, res) => {

    try {

        const { loadId } = req.params;

        const result = await pool.query(
            `
            SELECT *
            FROM load_stops
            WHERE load_id=$1
            ORDER BY stop_order
            `,
            [loadId]
        );

        res.json(result.rows);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Server Error"
        });

    }

};

export const updateLoadStop = async (req, res) => {

    try {

        const { id } = req.params;

        const {
            stop_order,
            company_name,
            address,
            city,
            state,
            zip,
            stop_type,
            arrival_time,
            departure_time
        } = req.body;

        const result = await pool.query(
            `
            UPDATE load_stops

            SET
            stop_order=$1,
            company_name=$2,
            address=$3,
            city=$4,
            state=$5,
            zip=$6,
            stop_type=$7,
            arrival_time=$8,
            departure_time=$9

            WHERE id=$10

            RETURNING *
            `,
            [
                stop_order,
                company_name,
                address,
                city,
                state,
                zip,
                stop_type,
                arrival_time,
                departure_time,
                id
            ]
        );

        if (result.rows.length === 0) {

            return res.status(404).json({
                message: "Load stop not found"
            });

        }

        res.json({
            success: true,
            message: "Load stop updated successfully",
            stop: result.rows[0]
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Server Error"
        });

    }

};

export const deleteLoadStop = async (req, res) => {

    try {

        const { id } = req.params;

        const result = await pool.query(
            `
            DELETE FROM load_stops
            WHERE id=$1
            RETURNING *
            `,
            [id]
        );

        if (result.rows.length === 0) {

            return res.status(404).json({
                message: "Load stop not found"
            });

        }

        res.json({
            success: true,
            message: "Load stop deleted successfully"
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Server Error"
        });

    }

};