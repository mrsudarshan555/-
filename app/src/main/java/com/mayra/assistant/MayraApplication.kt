package com.mayra.assistant

import android.app.Application

/**
 * MAYRA Android Application Entry Point
 * Initializes background services, biometric Voice Guardian security, and local caches.
 */
class MayraApplication : Application() {

    override fun onCreate() {
        super.onCreate()
        // Initialize MAYRA core components and telemetry
    }
}
