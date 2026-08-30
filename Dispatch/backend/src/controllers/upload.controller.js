import pool from "../config/db.js";


export const uploadDocument = async(req,res)=>{

    try{


        if(!req.file){

            return res.status(400).json({
                message:"No file uploaded"
            });

        }


        const {load_number}=req.params;

        const {
            document_type
        } = req.body;



        // Find load

        const loadResult = await pool.query(
            `
            SELECT id 
            FROM loads
            WHERE pb_num=$1
            OR load_number=$1
            `,
            [
                load_number
            ]
        );

        if(loadResult.rows.length===0){

            return res.status(404).json({
                message:"Load not found"
            });

        }



        const loadId = loadResult.rows[0].id;



        // Logged in user from JWT middleware

        const userId = req.user.id;



        // Save document record

        const result = await pool.query(

            `
            INSERT INTO documents
            (
                load_id,
                uploaded_by,
                document_type,
                file_name,
                file_path
            )

            VALUES
            ($1,$2,$3,$4,$5)

            RETURNING *
            `,

            [
                loadId,
                userId,
                document_type || "OTHER",
                req.file.filename,
                req.file.path
            ]

        );




        res.json({

            success:true,

            message:"Document uploaded successfully",

            document:result.rows[0]

        });



    }
    catch(error){

        console.log(error);


        res.status(500).json({

            message:"Upload failed"

        });

    }

};