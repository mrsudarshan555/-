package com.mayra.assistant.engine

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.telephony.SmsManager
import android.util.Log

/**
 * MAYRA Direct SMS Engine
 * 
 * Directly dispatches cellular SMS in the background without UI interruption
 * using standard Android SmsManager APIs.
 */
class MayraSmsHandler(private val context: Context) {

    companion object {
        private const val TAG = "MayraSmsHandler"
    }

    /**
     * Directly sends SMS to recipient number
     */
    fun sendDirectSms(phoneNumber: String, messageText: String, onResult: (Boolean, String) -> Unit) {
        if (phoneNumber.isBlank() || messageText.isBlank()) {
            onResult(false, "Phone number or message is empty")
            return
        }

        try {
            val smsManager: SmsManager = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                context.getSystemService(SmsManager::class.java)
            } else {
                @Suppress("DEPRECATION")
                SmsManager.getDefault()
            }

            val cleanNumber = phoneNumber.replace("[^0-9+]".toRegex(), "")

            // Handle multi-part SMS for long messages
            val parts = smsManager.divideMessage(messageText)
            if (parts.size > 1) {
                smsManager.sendMultipartTextMessage(cleanNumber, null, parts, null, null)
            } else {
                smsManager.sendTextMessage(cleanNumber, null, messageText, null, null)
            }

            Log.i(TAG, "SMS successfully dispatched to $cleanNumber")
            onResult(true, "SMS sent successfully to $cleanNumber")
        } catch (e: SecurityException) {
            Log.e(TAG, "Missing SEND_SMS runtime permission", e)
            onResult(false, "SEND_SMS permission not granted by user")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to send SMS to $phoneNumber", e)
            onResult(false, "Failed to send SMS: ${e.localizedMessage}")
        }
    }
}
