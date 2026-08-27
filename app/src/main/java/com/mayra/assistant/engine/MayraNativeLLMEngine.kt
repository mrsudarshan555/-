package com.mayra.assistant.engine

import android.util.Log

interface NativeTokenCallback {
    fun onToken(token: String, accumulated: String, tps: Double): Boolean
    fun onComplete(fullText: String, tps: Double)
}

/**
 * JNI wrapper for native llama.cpp ARM64 execution engine.
 */
object MayraNativeLLMEngine {

    private const val TAG = "MayraNativeLLMEngine"

    init {
        try {
            System.loadLibrary("mayra_llama")
            Log.i(TAG, "Native library 'mayra_llama' loaded successfully")
        } catch (e: UnsatisfiedLinkError) {
            Log.e(TAG, "Failed to load native library 'mayra_llama': ${e.message}")
        }
    }

    external fun nativeInit(): Boolean
    external fun nativeIsAvailable(): Boolean
    external fun nativeLoadModel(
        modelPath: String,
        nThreads: Int,
        nGpuLayers: Int,
        contextSize: Int
    ): Boolean
    external fun nativeUnloadModel(): Boolean
    external fun nativeIsModelLoaded(): Boolean
    external fun nativeGetActiveModel(): String
    external fun nativeCancel(): Boolean
    external fun nativeGenerateStream(
        promptStr: String,
        systemPromptStr: String,
        temperature: Float,
        topP: Float,
        maxTokens: Int,
        callback: NativeTokenCallback
    ): Boolean
}
