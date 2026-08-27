import { Network } from "@capacitor/network";

const QUEUE_KEY = "offline_msg_queue";

export const getQueue = () => {
  const q = localStorage.getItem(QUEUE_KEY);
  return q ? JSON.parse(q) : [];
};

export const addToQueue = (messageData, type, targetId) => {
  const q = getQueue();
  q.push({ messageData, type, targetId, timestamp: Date.now() });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
};

export const clearQueue = () => {
  localStorage.removeItem(QUEUE_KEY);
};

export const listenToNetwork = (callback) => {
  Network.addListener("networkStatusChange", (status) => {
    if (status.connected) {
      callback();
    }
  });
};
