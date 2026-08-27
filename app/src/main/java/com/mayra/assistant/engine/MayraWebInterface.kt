package com.mayra.assistant.engine

import android.content.Context
import android.webkit.JavascriptInterface
import android.webkit.WebView
import kotlinx.coroutines.*
import org.json.JSONObject

/**
 * Android WebView JavaScript Interface mapping to window.MayraNativeLLM.
 */
class MayraWebInterface(
    private val context: Context,
    private val webView: WebView? = null
) {
    private val bridge = MayraNativeLLMBridge.getInstance(context)
    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())

    @JavascriptInterface
    fun isAvailable(): Boolean {
        return bridge.isAvailable()
    }

    @JavascriptInterface
    fun getDeviceMemory(): String {
        val mem = bridge.getDeviceMemory()
        val json = JSONObject().apply {
            put("totalRamMb", mem.totalRamMb)
            put("availRamMb", mem.availRamMb)
            put("isLowMemory", mem.isLowMemory)
        }
        return json.toString()
    }

    @JavascriptInterface
    fun getAvailableStorage(): String {
        val storage = bridge.getAvailableStorage()
        val json = JSONObject().apply {
            put("totalStorageMb", storage.totalStorageMb)
            put("freeStorageMb", storage.freeStorageMb)
        }
        return json.toString()
    }

    @JavascriptInterface
    fun getModelDirectory(): String {
        return bridge.getModelDirectory()
    }

    @JavascriptInterface
    fun checkModelFile(filename: String): String {
        return bridge.checkModelFile(filename)
    }

    @JavascriptInterface
    fun deleteModelFile(filename: String): Boolean {
        return bridge.deleteModelFile(filename)
    }

    @JavascriptInterface
    fun isModelLoaded(): Boolean {
        return bridge.isModelLoaded()
    }

    @JavascriptInterface
    fun getModelStatus(): String {
        return getStatus()
    }

    @JavascriptInterface
    fun getStatus(): String {
        val status = bridge.getStatus()
        val json = JSONObject().apply {
            put("isSupported", status.isSupported)
            put("isEngineInitialized", status.isEngineInitialized)
            put("isModelLoaded", status.isModelLoaded)
            put("activeModelId", status.activeModelId ?: JSONObject.NULL)
            put("deviceRamMb", status.deviceRamMb ?: JSONObject.NULL)
            put("availableVramMb", status.availableVramMb ?: JSONObject.NULL)
            put("lowMemoryAlert", status.lowMemoryAlert)
            put("engineVersion", status.engineVersion)
        }
        return json.toString()
    }

    @JavascriptInterface
    fun loadLocalModel(modelPath: String, optionsJson: String?): Boolean {
        return loadModel(modelPath, optionsJson)
    }

    @JavascriptInterface
    fun loadModel(modelPath: String, optionsJson: String?): Boolean {
        return runBlocking(Dispatchers.IO) {
            var nThreads = 4
            var nGpuLayers = 0
            var contextSize = 2048

            if (!optionsJson.isNullOrBlank()) {
                try {
                    val opts = JSONObject(optionsJson)
                    nThreads = opts.optInt("nThreads", 4)
                    nGpuLayers = opts.optInt("nGpuLayers", 0)
                    contextSize = opts.optInt("contextSize", 2048)
                } catch (e: Exception) {
                    // fallback to defaults
                }
            }

            bridge.loadModel(modelPath, nThreads, nGpuLayers, contextSize)
        }
    }

    @JavascriptInterface
    fun unloadLocalModel(): Boolean {
        return unloadModel()
    }

    @JavascriptInterface
    fun unloadModel(): Boolean {
        return runBlocking(Dispatchers.IO) {
            bridge.unloadModel()
        }
    }

    @JavascriptInterface
    fun streamPrompt(
        prompt: String,
        optionsJson: String?
    ) {
        scope.launch(Dispatchers.IO) {
            var sysPrompt = "You are MAYRA."
            var temp = 0.7f
            var topP = 0.9f
            var maxTokens = 512

            if (!optionsJson.isNullOrBlank()) {
                try {
                    val opts = JSONObject(optionsJson)
                    sysPrompt = opts.optString("systemPrompt", "You are MAYRA.")
                    temp = opts.optDouble("temperature", 0.7).toFloat()
                    topP = opts.optDouble("topP", 0.9).toFloat()
                    maxTokens = opts.optInt("maxTokens", 512)
                } catch (e: Exception) {
                    // fallback
                }
            }

            bridge.generateStream(
                prompt = prompt,
                systemPrompt = sysPrompt,
                temperature = temp,
                topP = topP,
                maxTokens = maxTokens,
                onToken = { token, accumulated, tps ->
                    dispatchJsToken(token, accumulated, tps)
                    true
                },
                onComplete = { fullText, tps ->
                    dispatchJsComplete(fullText, tps)
                }
            )
        }
    }

    private fun dispatchJsToken(token: String, accumulated: String, tps: Double) {
        webView?.post {
            val escToken = JSONObject.quote(token)
            val escAcc = JSONObject.quote(accumulated)
            val js = "if (window.__mayra_native_on_token) { window.__mayra_native_on_token($escToken, $escAcc, $tps); }"
            webView.evaluateJavascript(js, null)
        }
    }

    private fun dispatchJsComplete(fullText: String, tps: Double) {
        webView?.post {
            val escFull = JSONObject.quote(fullText)
            val js = "if (window.__mayra_native_on_complete) { window.__mayra_native_on_complete($escFull, $tps); }"
            webView.evaluateJavascript(js, null)
        }
    }

    @JavascriptInterface
    fun cancelOfflineGeneration(): Boolean {
        return cancelGeneration()
    }

    @JavascriptInterface
    fun cancelGeneration(): Boolean {
        return bridge.cancelGeneration()
    }
}
