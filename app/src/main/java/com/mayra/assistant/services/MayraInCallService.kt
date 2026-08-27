package com.mayra.assistant.services

import android.os.Build
import android.telecom.Call
import android.telecom.InCallService
import android.util.Log

/**
 * MAYRA Telecom InCallService
 * 
 * Provides direct, modern Android call lifecycle management:
 * - Listens for incoming ringing calls
 * - Answers calls via call.answer(0)
 * - Rejects or terminates calls via call.reject(false, null) or call.disconnect()
 */
class MayraInCallService : InCallService() {

    companion object {
        private const val TAG = "MayraInCallService"

        @Volatile
        private var activeCall: Call? = null

        fun getActiveCall(): Call? = activeCall

        fun answerActiveCall(): Boolean {
            val call = activeCall ?: return false
            try {
                if (call.state == Call.STATE_RINGING) {
                    call.answer(0)
                    Log.i(TAG, "Call answered successfully via InCallService")
                    return true
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to answer call", e)
            }
            return false
        }

        fun rejectActiveCall(): Boolean {
            val call = activeCall ?: return false
            try {
                if (call.state == Call.STATE_RINGING) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        call.reject(Call.REJECT_REASON_DECLINED)
                    } else {
                        @Suppress("DEPRECATION")
                        call.reject(false, null)
                    }
                    Log.i(TAG, "Call rejected successfully via InCallService")
                    return true
                } else {
                    call.disconnect()
                    return true
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to reject call", e)
            }
            return false
        }
    }

    private val callCallback = object : Call.Callback() {
        override fun onStateChanged(call: Call?, state: Int) {
            super.onStateChanged(call, state)
            Log.i(TAG, "Call state changed: $state")
            if (state == Call.STATE_DISCONNECTED) {
                activeCall = null
            }
        }
    }

    override fun onCallAdded(call: Call?) {
        super.onCallAdded(call)
        Log.i(TAG, "New call added: state=${call?.state}")
        activeCall = call
        call?.registerCallback(callCallback)
    }

    override fun onCallRemoved(call: Call?) {
        super.onCallRemoved(call)
        Log.i(TAG, "Call removed")
        call?.unregisterCallback(callCallback)
        if (activeCall == call) {
            activeCall = null
        }
    }
}
