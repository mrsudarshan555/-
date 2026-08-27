package com.mayra.assistant.services

import android.content.Intent
import android.service.voice.VoiceInteractionService
import android.util.Log

/**
 * MAYRA Default Digital Assistant & Voice Interaction Service
 * Provides system-wide digital assistant integration (long-press power, corner swipe, lock screen).
 * Coordinates with MayraMicrophoneForegroundService to ensure a single audio capture owner.
 */
class MayraVoiceInteractionService : VoiceInteractionService() {

    companion object {
        private const val TAG = "MayraVoiceService"
        var isActive = false
            private set
    }

    override fun onReady() {
        super.onReady()
        isActive = true
        Log.i(TAG, "MayraVoiceInteractionService is ready and initialized as default digital assistant")
    }

    override fun onShutdown() {
        isActive = false
        Log.i(TAG, "MayraVoiceInteractionService shutting down")
        super.onShutdown()
    }
}
