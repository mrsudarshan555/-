package com.mayra.assistant.engine

import android.content.Context
import android.database.Cursor
import android.net.Uri
import android.os.Build
import android.provider.ContactsContract
import android.telecom.TelecomManager
import android.telephony.TelephonyManager
import android.util.Log
import com.mayra.assistant.services.MayraInCallService

/**
 * MAYRA Telecom & Caller ID Engine
 * 
 * Handles caller name lookup from contacts and executes call answer/reject actions.
 */
class MayraTelecomHandler(private val context: Context) {

    companion object {
        private const val TAG = "MayraTelecomHandler"
    }

    /**
     * Looks up contact name for a given phone number using ContactsContract
     */
    fun resolveContactName(phoneNumber: String): String? {
        if (phoneNumber.isBlank()) return null
        try {
            val uri = Uri.withAppendedPath(
                ContactsContract.PhoneLookup.CONTENT_FILTER_URI,
                Uri.encode(phoneNumber)
            )
            val projection = arrayOf(ContactsContract.PhoneLookup.DISPLAY_NAME)
            val cursor: Cursor? = context.contentResolver.query(uri, projection, null, null, null)

            cursor?.use {
                if (it.moveToFirst()) {
                    val nameIndex = it.getColumnIndex(ContactsContract.PhoneLookup.DISPLAY_NAME)
                    if (nameIndex != -1) {
                        return it.getString(nameIndex)
                    }
                }
            }
        } catch (e: SecurityException) {
            Log.e(TAG, "Missing READ_CONTACTS permission for caller lookup", e)
        } catch (e: Exception) {
            Log.e(TAG, "Error looking up contact name for $phoneNumber", e)
        }
        return null
    }

    /**
     * Answers an incoming ringing call
     */
    fun answerCall(): Boolean {
        // Method 1: Try InCallService first
        if (MayraInCallService.answerActiveCall()) {
            return true
        }

        // Method 2: TelecomManager API (Android 8.0+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val telecomManager = context.getSystemService(Context.TELECOM_SERVICE) as? TelecomManager
            if (telecomManager != null) {
                try {
                    telecomManager.acceptRingingCall()
                    Log.i(TAG, "Call accepted via TelecomManager.acceptRingingCall()")
                    return true
                } catch (e: SecurityException) {
                    Log.e(TAG, "Missing ANSWER_PHONE_CALLS permission", e)
                } catch (e: Exception) {
                    Log.e(TAG, "TelecomManager answer failed", e)
                }
            }
        }
        return false
    }

    /**
     * Rejects or ends a ringing or active call
     */
    fun rejectCall(): Boolean {
        // Method 1: Try InCallService first
        if (MayraInCallService.rejectActiveCall()) {
            return true
        }

        // Method 2: TelecomManager API
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            val telecomManager = context.getSystemService(Context.TELECOM_SERVICE) as? TelecomManager
            if (telecomManager != null) {
                try {
                    @Suppress("DEPRECATION")
                    telecomManager.endCall()
                    Log.i(TAG, "Call ended via TelecomManager.endCall()")
                    return true
                } catch (e: SecurityException) {
                    Log.e(TAG, "Missing ANSWER_PHONE_CALLS permission", e)
                } catch (e: Exception) {
                    Log.e(TAG, "TelecomManager endCall failed", e)
                }
            }
        }
        return false
    }
}
