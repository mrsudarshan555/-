package com.mayra.assistant.engine

import android.app.ActivityManager
import android.content.Context
import android.os.Environment
import android.os.StatFs
import android.util.Log
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import java.io.File
import java.util.concurrent.atomic.AtomicBoolean

data class DeviceMemoryInfo(
    val totalRamMb: Int,
    val availRamMb: Int,
    val isLowMemory: Boolean
)

data class DeviceStorageInfo(
    val totalStorageMb: Long,
    val freeStorageMb: Long
)

data class NativeBridgeStatus(
    val isSupported: Boolean,
    val isEngineInitialized: Boolean,
    val isModelLoaded: Boolean,
    val activeModelId: String?,
    val availableVramMb: Int? = null,
    val deviceRamMb: Int? = null,
    val lowMemoryAlert: Boolean = false,
    val engineVersion: String = "llama.cpp-arm64-v8a"
)

data class StreamTokenEvent(
    val token: String,
    val accumulated: String,
    val isFinished: Boolean,
    val tokensPerSecond: Double
)

class MayraNativeLLMBridge(private val context: Context) {

    companion object {
        private const val TAG = "MayraNativeLLMBridge"

        @Volatile
        private var INSTANCE: MayraNativeLLMBridge? = null

        fun getInstance(context: Context): MayraNativeLLMBridge {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: MayraNativeLLMBridge(context.applicationContext).also { INSTANCE = it }
            }
        }
    }

    private val bridgeScope = CoroutineScope(Dispatchers.Default + SupervisorJob())
    private val isGenerating = AtomicBoolean(false)
    private var activeModelPath: String? = null

    private val _tokenFlow = MutableSharedFlow<StreamTokenEvent>(extraBufferCapacity = 64)
    val tokenFlow: SharedFlow<StreamTokenEvent> = _tokenFlow

    init {
        try {
            MayraNativeLLMEngine.nativeInit()
        } catch (e: Exception) {
            Log.e(TAG, "Error initializing native engine: ${e.message}")
        }
    }

    fun isAvailable(): Boolean {
        return try {
            MayraNativeLLMEngine.nativeIsAvailable()
        } catch (e: Exception) {
            false
        }
    }

    fun getDeviceMemory(): DeviceMemoryInfo {
        val actManager = context.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager
        val memInfo = ActivityManager.MemoryInfo()
        actManager?.getMemoryInfo(memInfo)

        val totalRamMb = (memInfo.totalMem / (1024 * 1024)).toInt()
        val availRamMb = (memInfo.availMem / (1024 * 1024)).toInt()
        val isLowMem = memInfo.lowMemory || availRamMb < 400

        return DeviceMemoryInfo(
            totalRamMb = totalRamMb,
            availRamMb = availRamMb,
            isLowMemory = isLowMem
        )
    }

    fun getAvailableStorage(): DeviceStorageInfo {
        return try {
            val stat = StatFs(context.filesDir.absolutePath)
            val totalBytes = stat.totalBytes
            val freeBytes = stat.availableBytes
            DeviceStorageInfo(
                totalStorageMb = totalBytes / (1024 * 1024),
                freeStorageMb = freeBytes / (1024 * 1024)
            )
        } catch (e: Exception) {
            DeviceStorageInfo(totalStorageMb = 0, freeStorageMb = 0)
        }
    }

    fun getModelDirectory(): String {
        val dir = File(context.filesDir, "models")
        if (!dir.exists()) {
            dir.mkdirs()
        }
        return dir.absolutePath
    }

    fun checkModelFile(filename: String): String {
        val modelDir = File(context.filesDir, "models")
        val file = File(modelDir, filename)
        val exists = file.exists() && file.isFile && file.length() > 0
        val sizeBytes = if (exists) file.length() else 0L
        val json = org.json.JSONObject().apply {
            put("exists", exists)
            put("sizeBytes", sizeBytes)
            put("path", file.absolutePath)
        }
        return json.toString()
    }

    fun deleteModelFile(filename: String): Boolean {
        return try {
            val modelDir = File(context.filesDir, "models")
            val file = File(modelDir, filename)
            if (file.exists()) {
                file.delete()
            } else {
                true
            }
        } catch (e: Exception) {
            false
        }
    }

    fun isModelLoaded(): Boolean {
        return try {
            MayraNativeLLMEngine.nativeIsModelLoaded()
        } catch (e: Exception) {
            false
        }
    }

    fun getStatus(): NativeBridgeStatus {
        val mem = getDeviceMemory()
        val isLoaded = isModelLoaded()

        return NativeBridgeStatus(
            isSupported = isAvailable(),
            isEngineInitialized = true,
            isModelLoaded = isLoaded,
            activeModelId = if (isLoaded) activeModelPath else null,
            deviceRamMb = mem.totalRamMb,
            availableVramMb = mem.availRamMb,
            lowMemoryAlert = mem.isLowMemory
        )
    }

    suspend fun loadModel(
        modelPath: String,
        nThreads: Int = 4,
        nGpuLayers: Int = 0,
        contextSize: Int = 2048
    ): Boolean = withContext(Dispatchers.IO) {
        val file = File(modelPath)
        if (!file.exists()) {
            Log.e(TAG, "Model file not found: $modelPath")
            return@withContext false
        }

        // Check memory before loading
        val mem = getDeviceMemory()
        if (mem.availRamMb < 350) {
            Log.e(TAG, "Insufficient memory to load model: ${mem.availRamMb} MB available")
            return@withContext false
        }

        val success = try {
            MayraNativeLLMEngine.nativeLoadModel(
                modelPath = file.absolutePath,
                nThreads = nThreads,
                nGpuLayers = nGpuLayers,
                contextSize = contextSize
            )
        } catch (e: Exception) {
            Log.e(TAG, "Failed to load model: ${e.message}")
            false
        }

        if (success) {
            activeModelPath = file.name
        }
        success
    }

    suspend fun unloadModel(): Boolean = withContext(Dispatchers.IO) {
        cancelGeneration()
        val success = try {
            MayraNativeLLMEngine.nativeUnloadModel()
        } catch (e: Exception) {
            false
        }
        activeModelPath = null
        success
    }

    fun generateStream(
        prompt: String,
        systemPrompt: String = "You are MAYRA.",
        temperature: Float = 0.7f,
        topP: Float = 0.9f,
        maxTokens: Int = 512,
        onToken: (token: String, accumulated: String, tps: Double) -> Boolean,
        onComplete: (fullText: String, tps: Double) -> Unit
    ): Boolean {
        if (!isModelLoaded()) return false
        isGenerating.set(true)

        val callback = object : NativeTokenCallback {
            override fun onToken(token: String, accumulated: String, tps: Double): Boolean {
                if (!isGenerating.get()) return false
                _tokenFlow.tryEmit(StreamTokenEvent(token, accumulated, false, tps))
                return onToken(token, accumulated, tps)
            }

            override fun onComplete(fullText: String, tps: Double) {
                isGenerating.set(false)
                _tokenFlow.tryEmit(StreamTokenEvent("", fullText, true, tps))
                onComplete(fullText, tps)
            }
        }

        return try {
            MayraNativeLLMEngine.nativeGenerateStream(
                promptStr = prompt,
                systemPromptStr = systemPrompt,
                temperature = temperature,
                topP = topP,
                maxTokens = maxTokens,
                callback = callback
            )
        } catch (e: Exception) {
            Log.e(TAG, "Native generation error: ${e.message}")
            isGenerating.set(false)
            false
        }
    }

    fun cancelGeneration(): Boolean {
        isGenerating.set(false)
        return try {
            MayraNativeLLMEngine.nativeCancel()
        } catch (e: Exception) {
            false
        }
    }
}
