import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

admin.initializeApp();

interface SendPushNotificationPayload {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export const sendPushNotification = functions.https.onRequest(
  async (request, response) => {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      response.set("Access-Control-Allow-Origin", "*");
      response.set("Access-Control-Allow-Methods", "POST, OPTIONS");
      response.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
      );
      response.status(204).send("");
      return;
    }

    if (request.method !== "POST") {
      response.status(405).send("Method Not Allowed");
      return;
    }

    response.set("Access-Control-Allow-Origin", "*");
    response.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    response.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    try {
      const { token, title, body, data } =
        request.body as SendPushNotificationPayload;

      if (!token || !title || !body) {
        response.status(400).json({
          error: "Missing required fields: token, title, and body are required",
        });
        return;
      }

      const message: admin.messaging.Message = {
        token,
        notification: {
          title,
          body,
        },
        data: data
          ? Object.entries(data).reduce(
              (acc, [key, value]) => {
                acc[key] = String(value);
                return acc;
              },
              {} as Record<string, string>
            )
          : undefined,
        android: {
          priority: "high" as const,
        },
        apns: {
          headers: {
            "apns-priority": "10",
          },
          payload: {
            aps: {
              sound: "default",
              badge: 1,
            },
          },
        },
      };

      console.log("Sending push notification:", {
        token: token.substring(0, 20) + "...",
        title,
        body,
      });

      const responseMessage = await admin.messaging().send(message);

      console.log("Push notification sent successfully:", responseMessage);

      response.status(200).json({
        success: true,
        messageId: responseMessage,
      });
    } catch (error) {
      console.error("Error sending push notification:", error);
      response.status(500).json({
        error: "Failed to send push notification",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }
);
