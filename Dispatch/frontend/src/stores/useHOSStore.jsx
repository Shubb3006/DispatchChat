// // import { create } from "zustand";
// // import toast from "react-hot-toast";
// // import { axiosInstance } from "../../lib/axios";

// // export const useHOSStore = create((set, get) => ({
// //   hosLogs: [],
// //   isLoading: false,
// //   error: null,

// //   fetchHOSLogs: async () => {
// //     set({ isLoading: true, error: null });
// //     try {
// //       const response = await axiosInstance.get("/hos-logs");
// //       console.log(response.data);
// //       const logList = response.data || [];
// //       const parsedLogs = logList.map((item) =>
// //         typeof item.data === "string"
// //           ? JSON.parse(item.data)
// //           : item.data || item
// //       );
// //       set({ hosLogs: parsedLogs, isLoading: false });
// //     } catch (err) {
// //       console.error("Failed to fetch HOS logs:", err);
// //       set({ error: "Failed to fetch HOS logs", isLoading: false });
// //     }
// //   },

// //   updateHOSLog: async (driverId, newStatus) => {
// //     try {
// //       console.log(driverId);
// //       const response = await axiosInstance.put(`/hos-logs/${driverId}/status`, {
// //         status: newStatus,
// //       });
// //       const updatedLog = response.data;
// //       set((state) => ({
// //         hosLogs: state.hosLogs.map((log) =>
// //           log.driverId === driverId ? { ...log, ...updatedLog } : log
// //         ),
// //       }));
// //       toast.success(`HOS Status updated to ${newStatus}`);
// //     } catch (err) {
// //       console.error("Failed to update HOS status:", err);
// //       toast.error("Failed to update HOS log status");
// //     }
// //   },
// // }));

// import { create } from "zustand";
// import toast from "react-hot-toast";
// import { axiosInstance } from "../../lib/axios";

// export const useHOSStore = create((set, get) => ({
//   hosLogs: [],
//   isLoading: false,
//   error: null,

//   fetchHOSLogs: async () => {
//     set({ isLoading: true, error: null });
//     try {
//       const response = await axiosInstance.get("/hos-logs");
//       const rawData = response.data;
//       const logList = Array.isArray(rawData)
//         ? rawData
//         : rawData?.logs || rawData?.data || [];

//       const parsedLogs = logList.map((item) => {
//         const raw =
//           typeof item.data === "string"
//             ? JSON.parse(item.data)
//             : item.data || item;
//         return {
//           id: raw.id,
//           driverId: raw.driver_id || raw.driverId,
//           driver_id: raw.driver_id || raw.driverId,
//           driverName: raw.driver_name || raw.driverName || "Driver",
//           driver_name: raw.driver_name || raw.driverName || "Driver",
//           currentStatus: raw.current_status || raw.currentStatus || "OFF",
//           current_status: raw.current_status || raw.currentStatus || "OFF",
//           driveTimeRemainingSec:
//             raw.drive_time_remaining_sec ?? raw.driveTimeRemainingSec ?? 39600,
//           shiftTimeRemainingSec:
//             raw.shift_time_remaining_sec ?? raw.shiftTimeRemainingSec ?? 50400,
//           cycleTimeRemainingSec:
//             raw.cycle_time_remaining_sec ?? raw.cycleTimeRemainingSec ?? 252000,
//           breakTimeRemainingSec:
//             raw.break_time_remaining_sec ?? raw.breakTimeRemainingSec ?? 28800,
//           cycleType: raw.cycle_type || raw.cycleType || "US_70_8",
//           lastStatusChange:
//             raw.last_status_change ||
//             raw.lastStatusChange ||
//             new Date().toISOString(),
//           ...raw,
//         };
//       });

//       set({ hosLogs: parsedLogs, isLoading: false });
//     } catch (err) {
//       console.error("Failed to fetch HOS logs:", err);
//       set({ error: "Failed to fetch HOS logs", isLoading: false });
//     }
//   },

//   updateHOSLog: async (status) => {
//     try {
//       const response = await axiosInstance.put(`/hos-logs/`, {
//         status,
//       });

//       const updatedLog = response.data.log;

//       set((state) => ({
//         hosLogs: state.hosLogs.map((log) =>
//           log.driver_id === driverId ? updatedLog : log
//         ),
//       }));

//       toast.success("HOS updated");
//     } catch (err) {
//       toast.error("Failed to update HOS");
//     }
//   },
// }));

// import { create } from "zustand";
// import toast from "react-hot-toast";
// import { axiosInstance } from "../../lib/axios";

// export const useHOSStore = create((set) => ({
//   hosLog: null,
//   isLoading: false,
//   error: null,

//   fetchHOSLog: async () => {
//     set({ isLoading: true, error: null });
//     console.log("sd");
//     try {
//       const response = await axiosInstance.get("/hos-logs/me");
//       console.log(response.data);

//       set({
//         hosLog: response.data.log,
//         isLoading: false,
//       });
//     } catch (err) {
//       console.error(err);

//       set({
//         error: "Failed to fetch HOS log",
//         isLoading: false,
//       });
//     }
//   },

//   updateHOSLog: async (status) => {
//     try {
//       console.log(status);
//       const response = await axiosInstance.put("/hos-logs/me", {
//         status,
//       });

//       set({
//         hosLog: response.data.log,
//       });

//       toast.success("HOS updated");
//     } catch (err) {
//       console.error(err);
//       toast.error("Failed to update HOS");
//     }
//   },
// }));

import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../../lib/axios";

export const useHOSStore = create((set) => ({
  // Driver
  hosLog: null,

  // Dispatcher/Admin
  hosLogs: [],

  isLoading: false,
  error: null,

  /*
  ==========================================
  DRIVER - GET MY HOS
  GET /hos-logs/me
  ==========================================
  */
  fetchHOSLog: async () => {
    set({
      isLoading: true,
      error: null,
    });

    try {
      const response = await axiosInstance.get("/hos-logs/me");

      set({
        hosLog: response.data.log,
        isLoading: false,
      });
    } catch (err) {
      console.error(err);

      set({
        error: "Failed to fetch HOS",
        isLoading: false,
      });
    }
  },

  /*
  ==========================================
  DRIVER - UPDATE MY HOS
  PUT /hos-logs/me
  ==========================================
  */
  updateHOSLog: async (status) => {
    try {
      const response = await axiosInstance.put("/hos-logs/me", {
        status,
      });

      set({
        hosLog: response.data.log,
      });

      toast.success("HOS updated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update HOS");
    }
  },

  /*
  ==========================================
  DISPATCHER - GET ALL DRIVER HOS
  GET /hos-logs
  ==========================================
  */
  fetchAllHOSLogs: async () => {
    set({
      isLoading: true,
      error: null,
    });

    try {
      const response = await axiosInstance.get("/hos-logs");
      // Transform backend snake_case to camelCase for UI consistency
      const mappedLogs = (response.data.logs || []).map((log) => ({
        id: log.id,
        driverId: log.driver_id,
        driver_id: log.driver_id,
        driverName: log.full_name || log.username || "Driver",
        currentStatus: log.current_status || "OFF",
        current_status: log.current_status || "OFF",
        drivingSecondsRemaining: log.drive_time_remaining_sec || 39600,
        driving_seconds_remaining: log.drive_time_remaining_sec || 39600,
        dutySecondsRemaining: log.shift_time_remaining_sec || 50400,
        duty_seconds_remaining: log.shift_time_remaining_sec || 50400,
        cycleSecondsRemaining: log.cycle_time_remaining_sec || 252000,
        cycle_seconds_remaining: log.cycle_time_remaining_sec || 252000,
        ...log
      }));
      set({
        hosLogs: mappedLogs,
        isLoading: false,
      });
    } catch (err) {
      console.error(err);

      set({
        error: "Failed to fetch HOS logs",
        isLoading: false,
      });
    }
  },

  /*
  ==========================================
  DISPATCHER - UPDATE ANY DRIVER HOS
  PUT /hos-logs/:driverId
  ==========================================
  */
  updateDriverHOS: async (driverId, status) => {
    try {
      const response = await axiosInstance.put(`/hos-logs/${driverId}`, {
        status,
      });

      const updatedLog = response.data.log;

      set((state) => ({
        hosLogs: state.hosLogs.map((log) =>
          log.driver_id === driverId || log.driverId === driverId
            ? updatedLog
            : log
        ),
      }));

      toast.success("HOS updated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update HOS");
    }
  },
}));
