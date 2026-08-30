#include <jni.h>
#include <string>
#include <memory>
#include <android/log.h>
#include "llama_engine.h"

#define LOG_TAG "MayraLlamaJNI"
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, LOG_TAG, __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, LOG_TAG, __VA_ARGS__)

static std::unique_ptr<mayra::LlamaEngine> g_engine = nullptr;

extern "C" {

JNIEXPORT jboolean JNICALL
Java_com_mayra_assistant_engine_MayraNativeLLMEngine_nativeInit(
    JNIEnv* env,
    jobject /* thiz */
) {
    LOGI("nativeInit called");
    if (!g_engine) {
        g_engine = std::make_unique<mayra::LlamaEngine>();
    }
    return g_engine->init() ? JNI_TRUE : JNI_FALSE;
}

JNIEXPORT jboolean JNICALL
Java_com_mayra_assistant_engine_MayraNativeLLMEngine_nativeIsAvailable(
    JNIEnv* env,
    jobject /* thiz */
) {
#if defined(HAVE_REAL_LLAMA) && (HAVE_REAL_LLAMA == 1)
    return JNI_TRUE;
#else
    LOGW("nativeIsAvailable: Prebuilt libllama.so/libggml.so not linked in build. Reporting unavailable.");
    return JNI_FALSE;
#endif
}

JNIEXPORT jboolean JNICALL
Java_com_mayra_assistant_engine_MayraNativeLLMEngine_nativeLoadModel(
    JNIEnv* env,
    jobject /* thiz */,
    jstring modelPath,
    jint nThreads,
    jint nGpuLayers,
    jint contextSize
) {
#if !defined(HAVE_REAL_LLAMA) || (HAVE_REAL_LLAMA == 0)
    LOGE("nativeLoadModel: Real llama.cpp binaries (libllama.so, libggml.so) not linked. Cannot execute GGUF weights. Offline mode unavailable.");
    return JNI_FALSE;
#else
    if (!g_engine) {
        g_engine = std::make_unique<mayra::LlamaEngine>();
    }

    const char* pathStr = env->GetStringUTFChars(modelPath, nullptr);
    std::string path(pathStr);
    env->ReleaseStringUTFChars(modelPath, pathStr);

    mayra::EngineOptions options;
    options.n_threads = nThreads > 0 ? nThreads : 4;
    options.n_gpu_layers = nGpuLayers >= 0 ? nGpuLayers : 0;
    options.context_size = contextSize > 0 ? contextSize : 2048;

    LOGI("nativeLoadModel starting llama_model_load_from_file: %s", path.c_str());
    bool success = g_engine->loadModel(path, options);
    if (!success) {
        LOGE("nativeLoadModel: Model loading failed for %s", path.c_str());
    }
    return success ? JNI_TRUE : JNI_FALSE;
#endif
}

JNIEXPORT jboolean JNICALL
Java_com_mayra_assistant_engine_MayraNativeLLMEngine_nativeUnloadModel(
    JNIEnv* env,
    jobject /* thiz */
) {
    LOGI("nativeUnloadModel");
    if (!g_engine) return JNI_TRUE;
    return g_engine->unloadModel() ? JNI_TRUE : JNI_FALSE;
}

JNIEXPORT jboolean JNICALL
Java_com_mayra_assistant_engine_MayraNativeLLMEngine_nativeIsModelLoaded(
    JNIEnv* env,
    jobject /* thiz */
) {
    if (!g_engine) return JNI_FALSE;
    return g_engine->isModelLoaded() ? JNI_TRUE : JNI_FALSE;
}

JNIEXPORT jstring JNICALL
Java_com_mayra_assistant_engine_MayraNativeLLMEngine_nativeGetActiveModel(
    JNIEnv* env,
    jobject /* thiz */
) {
    if (!g_engine) return env->NewStringUTF("");
    std::string active = g_engine->getActiveModelPath();
    return env->NewStringUTF(active.c_str());
}

JNIEXPORT jboolean JNICALL
Java_com_mayra_assistant_engine_MayraNativeLLMEngine_nativeCancel(
    JNIEnv* env,
    jobject /* thiz */
) {
    LOGI("nativeCancel called");
    if (g_engine) {
        g_engine->cancel();
    }
    return JNI_TRUE;
}

JNIEXPORT jboolean JNICALL
Java_com_mayra_assistant_engine_MayraNativeLLMEngine_nativeGenerateStream(
    JNIEnv* env,
    jobject /* thiz */,
    jstring promptStr,
    jstring systemPromptStr,
    jfloat temperature,
    jfloat topP,
    jint maxTokens,
    jobject callbackObj
) {
    if (!g_engine || !g_engine->isModelLoaded()) {
        LOGE("Cannot generate: Engine or model not loaded");
        return JNI_FALSE;
    }

    const char* promptChars = env->GetStringUTFChars(promptStr, nullptr);
    std::string prompt(promptChars);
    env->ReleaseStringUTFChars(promptStr, promptChars);

    const char* sysChars = systemPromptStr != nullptr ? env->GetStringUTFChars(systemPromptStr, nullptr) : "You are MAYRA.";
    std::string sysPrompt(sysChars);
    if (systemPromptStr != nullptr) {
        env->ReleaseStringUTFChars(systemPromptStr, sysChars);
    }

    mayra::GenerationOptions options;
    options.system_prompt = sysPrompt;
    options.temperature = temperature;
    options.top_p = topP;
    options.max_tokens = maxTokens;

    jclass cbClass = env->GetObjectClass(callbackObj);
    jmethodID onTokenMethod = env->GetMethodID(cbClass, "onToken", "(Ljava/lang/String;Ljava/lang/String;D)Z");
    jmethodID onCompleteMethod = env->GetMethodID(cbClass, "onComplete", "(Ljava/lang/String;D)V");

    mayra::TokenCallback token_cb = [&](const std::string& token, const std::string& accumulated, double tps) -> bool {
        if (!onTokenMethod || !callbackObj) return true;
        jstring jToken = env->NewStringUTF(token.c_str());
        jstring jAcc = env->NewStringUTF(accumulated.c_str());
        jboolean cont = env->CallBooleanMethod(callbackObj, onTokenMethod, jToken, jAcc, static_cast<jdouble>(tps));
        env->DeleteLocalRef(jToken);
        env->DeleteLocalRef(jAcc);
        return cont == JNI_TRUE;
    };

    std::string out_result;
    mayra::GenerationStats stats;
    bool success = g_engine->generate(prompt, options, token_cb, out_result, stats);

    if (success && onCompleteMethod && callbackObj) {
        jstring jResult = env->NewStringUTF(out_result.c_str());
        env->CallVoidMethod(callbackObj, onCompleteMethod, jResult, static_cast<jdouble>(stats.tokens_per_second));
        env->DeleteLocalRef(jResult);
    }

    return success ? JNI_TRUE : JNI_FALSE;
}

} // extern "C"
