import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";

export const initNotifications = async () => {
  if (Capacitor.getPlatform() === "web") return;

  try {
    const permission = await LocalNotifications.requestPermissions();
    if (permission.display !== "granted") {
      console.log("Notification permission not granted");
    }
  } catch (err) {
    console.error("Error initializing notifications:", err);
  }
};

export const showLocalNotification = async (title, body, extraData = {}) => {
  if (Capacitor.getPlatform() === "web") return;

  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          title,
          body,
          id: Math.floor(Math.random() * 100000),
          schedule: { at: new Date(Date.now() + 100) },
          sound: "default",
          attachments: [],
          actionTypeId: "",
          extra: extraData,
        },
      ],
    });
  } catch (err) {
    console.error("Error showing notification:", err);
  }
};
