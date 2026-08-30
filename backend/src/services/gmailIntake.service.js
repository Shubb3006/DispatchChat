import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";

// Cache of already processed Message IDs in this session
const processedMessageIds = new Set();

/**
 * Creates IMAP client for Gmail monitoring
 */
function createImapClient() {
  const user = process.env.GMAIL_USER || "";
  const pass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || "";

  if (!user || !pass) {
    return null;
  }

  return new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: {
      user,
      pass,
    },
    logger: false,
  });
}

/**
 * Polls Gmail for incoming Load Confirmation emails with PDF attachments
 * Searches: subject:"Load Confirmation" has:attachment
 * Maximum batch size: 10 emails per cycle
 */
export async function pollGmailForLoadConfirmations({ maxBatch = 10 } = {}) {
  const client = createImapClient();

  if (!client) {
    return {
      success: false,
      reason: "GMAIL_USER or GMAIL_APP_PASSWORD is not configured in .env",
      emails: [],
    };
  }

  const foundEmails = [];

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");

    try {
      // Search for unseen messages or subject containing 'Load Confirmation'
      const searchCriteria = {
        unseen: true,
        header: {
          subject: "Load Confirmation",
        },
      };

      // Fallback search by UID sequence if criteria returns empty
      let messages = [];
      for await (const message of client.fetch(searchCriteria, { source: true, envelope: true })) {
        if (messages.length >= maxBatch) break;
        messages.push(message);
      }

      if (messages.length === 0) {
        // Fallback: Check last 10 messages with subject matching Load Confirmation
        for await (const message of client.fetch("1:*", { source: true, envelope: true }, { uid: false })) {
          const subj = message.envelope?.subject || "";
          const msgId = message.envelope?.messageId || String(message.seq);
          if (
            subj.toLowerCase().includes("load confirmation") ||
            subj.toLowerCase().includes("load tender") ||
            subj.toLowerCase().includes("rate confirmation")
          ) {
            if (!processedMessageIds.has(msgId)) {
              messages.push(message);
              if (messages.length >= maxBatch) break;
            }
          }
        }
      }

      for (const msg of messages) {
        const msgId = msg.envelope?.messageId || `MSG-${msg.seq}`;
        if (processedMessageIds.has(msgId)) continue;

        // Parse full MIME message
        const parsed = await simpleParser(msg.source);

        const emailSubject = parsed.subject || msg.envelope?.subject || "Load Confirmation";
        const senderEmail = parsed.from?.value?.[0]?.address || msg.envelope?.from?.[0]?.address || "sender@logistics.com";
        const emailText = parsed.text || parsed.html || "";

        // Extract PDF attachments
        const pdfAttachments = [];
        if (parsed.attachments && parsed.attachments.length > 0) {
          for (const att of parsed.attachments) {
            const isPdf =
              att.contentType === "application/pdf" ||
              att.filename?.toLowerCase().endsWith(".pdf");

            if (isPdf && att.content) {
              pdfAttachments.push({
                fileName: att.filename || "load-confirmation.pdf",
                contentType: att.contentType || "application/pdf",
                content: att.content, // Buffer
                size: att.size,
              });
            }
          }
        }

        // Only include if has attachments or clear load tender body
        if (pdfAttachments.length > 0 || emailText.length > 50) {
          foundEmails.push({
            messageId: msgId,
            subject: emailSubject,
            from: senderEmail,
            text: emailText,
            attachments: pdfAttachments,
            receivedAt: parsed.date || new Date(),
          });

          processedMessageIds.add(msgId);
        }
      }
    } finally {
      lock.release();
    }

    await client.logout();

    return {
      success: true,
      count: foundEmails.length,
      emails: foundEmails,
    };
  } catch (err) {
    console.error("❌ Gmail IMAP polling error:", err.message);
    try {
      await client.logout();
    } catch (_) {}
    return {
      success: false,
      error: err.message,
      emails: [],
    };
  }
}
