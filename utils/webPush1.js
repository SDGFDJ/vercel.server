import webPush from "web-push";

webPush.setVapidDetails(
  "mailto:youremail@example.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export const sendPush = (subscription, payload) => {
  return webPush.sendNotification(subscription, JSON.stringify(payload));
};
