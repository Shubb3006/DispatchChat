import cron from "node-cron";
import { pollGmailForLoadConfirmations } from "../services/gmailIntake.service.js";
import { processLoadConfirmationPipeline } from "../services/loadConfirmationPipeline.service.js";

let scheduledTask = null;
let isCycleExecuting = false;

const workerState = {
  isEnabled: process.env.AUTO_INGEST_ENABLED !== "false",
  cronSchedule: process.env.GMAIL_POLL_INTERVAL_CRON || "*/2 * * * *",
  lastRunAt: null,
  lastRunStatus: "Initialized",
  totalProcessed: 0,
  recentLogs: [],
};

function addLog(message, type = "info") {
  const entry = {
    timestamp: new Date().toISOString(),
    message,
    type,
  };
  workerState.recentLogs.unshift(entry);
  if (workerState.recentLogs.length > 50) {
    workerState.recentLogs.pop();
  }
}

/**
 * Runs one intake cycle across Gmail and queues
 */
export async function runIntakeCycle() {
  if (isCycleExecuting) {
    console.log("⏳ Intake cycle already in progress, skipping overlapping run.");
    return { success: false, reason: "Cycle in progress" };
  }

  isCycleExecuting = true;
  workerState.lastRunAt = new Date().toISOString();
  addLog("Starting automated Gmail Load Confirmation intake cycle...");

  try {
    const pollResult = await pollGmailForLoadConfirmations({ maxBatch: 10 });

    if (!pollResult.success) {
      const msg = `Gmail intake status: ${pollResult.reason || pollResult.error || "No new unread tenders"}`;
      workerState.lastRunStatus = msg;
      addLog(msg, "warning");
      isCycleExecuting = false;
      return { success: true, processed: 0, message: msg };
    }

    const emails = pollResult.emails || [];
    let processedCount = 0;

    for (const email of emails) {
      try {
        const primaryPdf = email.attachments?.[0];

        const pipelineResult = await processLoadConfirmationPipeline({
          emailText: email.text,
          emailSubject: email.subject,
          senderEmail: email.from,
          pdfBuffer: primaryPdf ? primaryPdf.content : null,
          fileName: primaryPdf ? primaryPdf.fileName : "load-confirmation.pdf",
        });

        if (pipelineResult.success) {
          processedCount++;
          workerState.totalProcessed++;
          addLog(
            `✅ Processed Load #${pipelineResult.load_number} for ${pipelineResult.tender.customer_name} ➔ ${pipelineResult.assigned_team}`,
            "success"
          );
        }
      } catch (err) {
        addLog(`❌ Failed processing email "${email.subject}": ${err.message}`, "error");
      }
    }

    const completionMsg = `Cycle completed. Processed ${processedCount} incoming load confirmation(s).`;
    workerState.lastRunStatus = completionMsg;
    addLog(completionMsg, "info");
    isCycleExecuting = false;

    return {
      success: true,
      processed: processedCount,
      totalProcessed: workerState.totalProcessed,
    };
  } catch (cycleErr) {
    console.error("Automation cycle error:", cycleErr);
    workerState.lastRunStatus = `Error: ${cycleErr.message}`;
    addLog(`Automation cycle fatal error: ${cycleErr.message}`, "error");
    isCycleExecuting = false;
    return { success: false, error: cycleErr.message };
  }
}

/**
 * Starts the background cron worker
 */
export function startAutomationWorker() {
  if (scheduledTask) {
    scheduledTask.stop();
  }

  const cronExp = workerState.cronSchedule;
  if (!cron.validate(cronExp)) {
    console.warn(`Invalid cron expression "${cronExp}", defaulting to "*/2 * * * *"`);
    workerState.cronSchedule = "*/2 * * * *";
  }

  console.log(`🤖 Starting Autonomous Load Confirmation Intake Worker [Schedule: ${workerState.cronSchedule}]`);
  addLog(`Worker started with cron schedule: ${workerState.cronSchedule}`);

  scheduledTask = cron.schedule(workerState.cronSchedule, async () => {
    if (workerState.isEnabled) {
      await runIntakeCycle();
    }
  });

  // Run initial check after 5 seconds
  setTimeout(() => {
    if (workerState.isEnabled) {
      runIntakeCycle().catch(() => {});
    }
  }, 5000);
}

/**
 * Stops the background worker
 */
export function stopAutomationWorker() {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
  }
  workerState.isEnabled = false;
  addLog("Worker stopped by administrator.", "warning");
}

/**
 * Returns current worker telemetry status
 */
export function getAutomationWorkerStatus() {
  return {
    ...workerState,
    isCronActive: Boolean(scheduledTask),
    isCycleExecuting,
    gmailAccount: process.env.GMAIL_USER || "Not Configured",
    isConfigured: Boolean(process.env.GMAIL_USER && (process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS)),
  };
}
