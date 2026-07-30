// import pool from "../config/db.js";

// // Ensure messages table exists helper


// // Get all Messages or filter by query params
// export const getMessages = async (req, res) => {
//   try {
//     const { driver_id, driverId, shipment_id, shipmentId, group_id, groupId } = req.query;

//     const targetDriver = driver_id || driverId;
//     const targetShipment = shipment_id || shipmentId;
//     const targetGroup = group_id || groupId;

//     let query = `SELECT * FROM messages WHERE 1=1`;
//     const params = [];

//     if (targetDriver) {
//       params.push(targetDriver);
//       query += ` AND (driver_id = $${params.length} OR sender_id = $${params.length} OR recipient_id = $${params.length})`;
//     }
//     if (targetShipment) {
//       params.push(targetShipment);
//       query += ` AND shipment_id = $${params.length}`;
//     }
//     if (targetGroup) {
//       params.push(targetGroup);
//       query += ` AND group_id = $${params.length}`;
//     }

//     query += ` ORDER BY created_at ASC`;

//     const result = await pool.query(query, params);

//     // Format output for frontend compatibility
//     const formatted = result.rows.map((row) => {
//       const msgObj = {
//         id: row.id,
//         senderId: row.sender_id,
//         sender_id: row.sender_id,
//         senderName: row.sender_name,
//         sender_name: row.sender_name,
//         senderRole: row.sender_role,
//         sender_role: row.sender_role,
//         recipientId: row.recipient_id,
//         recipient_id: row.recipient_id,
//         driverId: row.driver_id,
//         driver_id: row.driver_id,
//         shipmentId: row.shipment_id,
//         shipment_id: row.shipment_id,
//         groupId: row.group_id,
//         group_id: row.group_id,
//         text: row.text,
//         read: row.read || row.is_read || false,
//         is_read: row.read || row.is_read || false,
//         attachments: row.attachments || null,
//         timestamp: row.created_at,
//         created_at: row.created_at,
//         ... (row.data && typeof row.data === "object" ? row.data : {})
//       };

//       return {
//         ...msgObj,
//         data: msgObj
//       };
//     });

//     res.json(formatted);
//   } catch (error) {
//     console.error("Error fetching messages:", error);
//     res.status(500).json({ success: false, message: "Server Error fetching messages" });
//   }
// };

// // Get single Message by ID
// export const getMessageById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const result = await pool.query(`SELECT * FROM messages WHERE id = $1`, [id]);
//     if (result.rows.length === 0) {
//       return res.status(404).json({ success: false, message: "Message not found" });
//     }
//     const row = result.rows[0];
//     const msgObj = {
//       id: row.id,
//       senderId: row.sender_id,
//       senderName: row.sender_name,
//       senderRole: row.sender_role,
//       recipientId: row.recipient_id,
//       driverId: row.driver_id,
//       shipmentId: row.shipment_id,
//       groupId: row.group_id,
//       text: row.text,
//       read: row.read || row.is_read || false,
//       attachments: row.attachments,
//       timestamp: row.created_at,
//       ... (row.data && typeof row.data === "object" ? row.data : {})
//     };

//     res.json({ success: true, message: msgObj });
//   } catch (error) {
//     console.error("Error fetching message:", error);
//     res.status(500).json({ success: false, message: "Server Error" });
//   }
// };

// // Send / Create Message
// export const sendMessage = async (req, res) => {
//   try {
//     const {
//       senderId,
//       sender_id,
//       senderName,
//       sender_name,
//       senderRole,
//       sender_role,
//       recipientId,
//       recipient_id,
//       driverId,
//       driver_id,
//       shipmentId,
//       shipment_id,
//       groupId,
//       group_id,
//       text,
//       content,
//       attachments,
//       fileUrl
//     } = req.body;

//     const resolvedSenderId = senderId || sender_id || "DISP_OFFICE";
//     const resolvedSenderName = senderName || sender_name || "Dispatch Central";
//     const resolvedSenderRole = senderRole || sender_role || "dispatcher";
//     const resolvedRecipientId = recipientId || recipient_id || "DRV001";
//     const resolvedDriverId = driverId || driver_id || null;
//     const resolvedShipmentId = shipmentId || shipment_id || null;
//     const resolvedGroupId = groupId || group_id || null;
//     const resolvedText = text !== undefined ? text : (content || "");
//     const resolvedAttachments = attachments || (fileUrl ? [{ url: fileUrl }] : null);

//     const payloadData = { ...req.body };

//     const result = await pool.query(
//       `INSERT INTO messages (
//         sender_id, sender_name, sender_role, recipient_id, driver_id,
//         shipment_id, group_id, text, read, is_read, attachments, data
//        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, false, $9, $10)
//        RETURNING *`,
//       [
//         resolvedSenderId,
//         resolvedSenderName,
//         resolvedSenderRole,
//         resolvedRecipientId,
//         resolvedDriverId,
//         resolvedShipmentId,
//         resolvedGroupId,
//         resolvedText,
//         resolvedAttachments ? JSON.stringify(resolvedAttachments) : null,
//         JSON.stringify(payloadData)
//       ]
//     );

//     const row = result.rows[0];
//     const createdMsg = {
//       id: row.id,
//       senderId: row.sender_id,
//       sender_id: row.sender_id,
//       senderName: row.sender_name,
//       sender_name: row.sender_name,
//       senderRole: row.sender_role,
//       sender_role: row.sender_role,
//       recipientId: row.recipient_id,
//       recipient_id: row.recipient_id,
//       driverId: row.driver_id,
//       driver_id: row.driver_id,
//       shipmentId: row.shipment_id,
//       shipment_id: row.shipment_id,
//       groupId: row.group_id,
//       group_id: row.group_id,
//       text: row.text,
//       read: false,
//       is_read: false,
//       attachments: row.attachments,
//       timestamp: row.created_at,
//       created_at: row.created_at
//     };

//     res.status(201).json({
//       success: true,
//       message: "Message sent successfully",
//       ...createdMsg,
//       data: createdMsg
//     });
//   } catch (error) {
//     console.error("Error sending message:", error);
//     res.status(500).json({ success: false, message: "Server Error sending message" });
//   }
// };

// // Mark Messages as Read
// export const markMessagesAsRead = async (req, res) => {
//   try {
//     const { shipmentId, shipment_id, role, driverId, driver_id, messageIds } = req.body;

//     const targetShipment = shipmentId || shipment_id;
//     const targetDriver = driverId || driver_id;

//     if (Array.isArray(messageIds) && messageIds.length > 0) {
//       await pool.query(
//         `UPDATE messages SET read = true, is_read = true, updated_at = CURRENT_TIMESTAMP WHERE id = ANY($1::uuid[])`,
//         [messageIds]
//       );
//     } else if (targetShipment) {
//       await pool.query(
//         `UPDATE messages SET read = true, is_read = true, updated_at = CURRENT_TIMESTAMP WHERE shipment_id = $1`,
//         [targetShipment]
//       );
//     } else if (targetDriver) {
//       await pool.query(
//         `UPDATE messages SET read = true, is_read = true, updated_at = CURRENT_TIMESTAMP WHERE driver_id = $1 OR sender_id = $1 OR recipient_id = $1`,
//         [targetDriver]
//       );
//     } else {
//       await pool.query(
//         `UPDATE messages SET read = true, is_read = true, updated_at = CURRENT_TIMESTAMP WHERE read = false`
//       );
//     }

//     res.json({ success: true, message: "Messages marked as read" });
//   } catch (error) {
//     console.error("Error marking messages as read:", error);
//     res.status(500).json({ success: false, message: "Server Error" });
//   }
// };

// // Delete Message
// export const deleteMessage = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const result = await pool.query(`DELETE FROM messages WHERE id = $1 RETURNING *`, [id]);
//     if (result.rows.length === 0) {
//       return res.status(404).json({ success: false, message: "Message not found" });
//     }
//     res.json({ success: true, message: "Message deleted successfully" });
//   } catch (error) {
//     console.error("Error deleting message:", error);
//     res.status(500).json({ success: false, message: "Server Error" });
//   }
// };



import pool from "../config/db.js";

/*
====================================================
GET MESSAGES
GET /api/messages
====================================================
*/
export const getMessages = async (req, res) => {
  try {
    const {
      driver_id,
      shipment_id,
      recipient_id,
      sender_id,
    } = req.query;

    let query = `
      SELECT
        m.*,
        s.full_name AS sender_name,
        r.full_name AS recipient_name
      FROM messages m
      JOIN users s ON m.sender_id = s.id
      JOIN users r ON m.recipient_id = r.id
      WHERE 1=1
    `;

    const params = [];

    if (driver_id) {
      params.push(driver_id);
      query += ` AND m.driver_id=$${params.length}`;
    }

    if (shipment_id) {
      params.push(shipment_id);
      query += ` AND m.shipment_id=$${params.length}`;
    }

    if (sender_id) {
      params.push(sender_id);
      query += ` AND m.sender_id=$${params.length}`;
    }

    if (recipient_id) {
      params.push(recipient_id);
      query += ` AND m.recipient_id=$${params.length}`;
    }

    query += ` ORDER BY m.created_at ASC`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      messages: result.rows,
    });

  } catch (err) {
    console.log(err);

    res.status(500).json({
      success:false,
      message:"Server Error",
    });
  }
};



/*
====================================================
GET MESSAGE
GET /api/messages/:id
====================================================
*/
export const getMessageById = async (req,res)=>{

    try{

        const {id}=req.params;

        const result=await pool.query(
            `
            SELECT *
            FROM messages
            WHERE id=$1
            `,
            [id]
        );

        if(result.rows.length===0){

            return res.status(404).json({
                success:false,
                message:"Message not found"
            });

        }

        res.json({
            success:true,
            message:result.rows[0]
        });

    }catch(err){

        console.log(err);

        res.status(500).json({
            success:false,
            message:"Server Error"
        });

    }

};




/*
====================================================
SEND MESSAGE
POST /api/messages
====================================================
*/
export const sendMessage = async (req,res)=>{

    try{

        const senderId=req.user.id;

        const {
            recipient_id,
            driver_id,
            shipment_id,
            text,
            attachments
        }=req.body;

        const result=await pool.query(
            `
            INSERT INTO messages
            (
                sender_id,
                recipient_id,
                driver_id,
                shipment_id,
                text,
                attachments
            )
            VALUES($1,$2,$3,$4,$5,$6)
            RETURNING *
            `,
            [
                senderId,
                recipient_id,
                driver_id || null,
                shipment_id || null,
                text,
                attachments || []
            ]
        );

        res.status(201).json({
            success:true,
            message:"Message Sent",
            data:result.rows[0]
        });

    }catch(err){

        console.log(err);

        res.status(500).json({
            success:false,
            message:"Server Error"
        });

    }

};




/*
====================================================
MARK READ
PUT /api/messages/read
====================================================
*/
export const markMessagesAsRead = async(req,res)=>{

    try{

        const {messageIds}=req.body;

        await pool.query(
            `
            UPDATE messages
            SET
                is_read=true,
                read_at=CURRENT_TIMESTAMP,
                updated_at=CURRENT_TIMESTAMP
            WHERE id = ANY($1::uuid[])
            `,
            [messageIds]
        );

        res.json({
            success:true,
            message:"Messages marked as read"
        });

    }catch(err){

        console.log(err);

        res.status(500).json({
            success:false,
            message:"Server Error"
        });

    }

};




/*
====================================================
DELETE MESSAGE
DELETE /api/messages/:id
====================================================
*/
export const deleteMessage = async(req,res)=>{

    try{

        const {id}=req.params;

        const result=await pool.query(
            `
            DELETE FROM messages
            WHERE id=$1
            RETURNING *
            `,
            [id]
        );

        if(result.rows.length===0){

            return res.status(404).json({
                success:false,
                message:"Message not found"
            });

        }

        res.json({
            success:true,
            message:"Message deleted successfully"
        });

    }catch(err){

        console.log(err);

        res.status(500).json({
            success:false,
            message:"Server Error"
        });

    }

};