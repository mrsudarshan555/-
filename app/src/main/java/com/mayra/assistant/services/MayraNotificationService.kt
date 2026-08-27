package com.mayra.assistant.services

import android.app.Notification
import android.content.Intent
import android.os.Bundle
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log

/**
 * MAYRA Notification Listener Service
 * 
 * Captures incoming notifications (WhatsApp, SMS, Telegram, Phone calls),
 * parses sender name + message text, and provides real-time events to Mayra.
 */
class MayraNotificationService : NotificationListenerService() {

    companion object {
        private const val TAG = "MayraNotificationSvc"
        
        @Volatile
        private var instance: MayraNotificationService? = null

        fun getInstance(): MayraNotificationService? = instance

        fun isRunning(): Boolean = instance != null

        // Callback for the plugin/bridge
        var onNotificationReceivedListener: ((NotificationData) -> Unit)? = null
    }

    data class NotificationData(
        val id: String,
        val packageName: String,
        val appName: String,
        val sender: String,
        val text: String,
        val timestamp: Long,
        val isMessaging: Boolean,
        val isCall: Boolean
    )

    override fun onListenerConnected() {
        super.onListenerConnected()
        instance = this
        Log.i(TAG, "Mayra Notification Listener Connected successfully.")
    }

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        if (sbn == null) return
        val notification = sbn.notification ?: return
        val extras: Bundle = notification.extras ?: return
        val packageName = sbn.packageName ?: return

        // Skip our own notifications to prevent echo loops
        if (packageName == applicationContext.packageName) return

        try {
            val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString() ?: ""
            val text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: ""
            val bigText = extras.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString() ?: text
            val subText = extras.getCharSequence(Notification.EXTRA_SUB_TEXT)?.toString() ?: ""

            // Resolve friendly app label
            val pm = applicationContext.packageManager
            val appLabel = try {
                val appInfo = pm.getApplicationInfo(packageName, 0)
                pm.getApplicationLabel(appInfo).toString()
            } catch (e: Exception) {
                packageName
            }

            val isMessaging = packageName.contains("whatsapp", ignoreCase = true) ||
                              packageName.contains("messaging", ignoreCase = true) ||
                              packageName.contains("mms", ignoreCase = true) ||
                              packageName.contains("telegram", ignoreCase = true) ||
                              packageName.contains("signal", ignoreCase = true)

            val isCall = notification.category == Notification.CATEGORY_CALL ||
                         packageName.contains("dialer", ignoreCase = true) ||
                         packageName.contains("telecom", ignoreCase = true)

            val messagePayload = if (bigText.isNotBlank()) bigText else text

            if (title.isNotBlank() || messagePayload.isNotBlank()) {
                val data = NotificationData(
                    id = "${sbn.id}_${sbn.postTime}",
                    packageName = packageName,
                    appName = appLabel,
                    sender = if (title.isNotBlank()) title else appLabel,
                    text = messagePayload,
                    timestamp = sbn.postTime,
                    isMessaging = isMessaging,
                    isCall = isCall
                )

                Log.i(TAG, "Captured notification from $appLabel (${data.sender}): $messagePayload")
                onNotificationReceivedListener?.invoke(data)

                // Also send local broadcast
                val broadcastIntent = Intent("com.mayra.assistant.ACTION_NOTIFICATION_POSTED").apply {
                    putExtra("id", data.id)
                    putExtra("packageName", data.packageName)
                    putExtra("appName", data.appName)
                    putExtra("sender", data.sender)
                    putExtra("text", data.text)
                    putExtra("timestamp", data.timestamp)
                    putExtra("isMessaging", data.isMessaging)
                    putExtra("isCall", data.isCall)
                }
                sendBroadcast(broadcastIntent)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error processing incoming notification", e)
        }
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification?) {
        // Handled when user dismisses notification
    }

    override fun onListenerDisconnected() {
        super.onListenerDisconnected()
        instance = null
        Log.w(TAG, "Mayra Notification Listener Disconnected.")
    }

    override fun onDestroy() {
        super.onDestroy()
        instance = null
    }
}
