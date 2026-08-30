# MAYRA / STONICX: Real Offline AI Model (llama.cpp) Setup Guide

This guide details how to integrate the real prebuilt `llama.cpp` and `ggml` shared libraries into the Android project to enable genuine, on-device GGUF transformer inference.

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    MAYRA / STONICX UI                       │
│    (Native Android Compose / Hybrid Local Model Bridge)     │
└──────────────────────────────┬──────────────────────────────┘
                               │ JNI
┌──────────────────────────────▼──────────────────────────────┐
│                    libmayra_llama.so                        │
│        (mayra_llama_jni.cpp + llama_engine.cpp)             │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
┌──────────────▼──────────────┐┌──────────────▼───────────────┐
│        libllama.so          ││         libggml.so           │
│   (Official Prebuilt)       ││   (ARM64 NEON / FP16 SIMD)   │
└─────────────────────────────┘└──────────────────────────────┘
```

The build system (`app/src/main/cpp/CMakeLists.txt`) automatically checks for prebuilt binaries at:
```
app/src/main/jniLibs/${ANDROID_ABI}/libllama.so
app/src/main/jniLibs/${ANDROID_ABI}/libggml.so
```

- **If present**: CMake links `libllama.so` and `libggml.so` with `HAVE_REAL_LLAMA=1`, enabling full tensor execution and streaming inference for GGUF weights.
- **If absent**: CMake builds the safe fallback scaffold (`HAVE_REAL_LLAMA=0`). The app compiles cleanly without breaking the build, and the UI gracefully reports `"Offline mode unavailable"` instead of producing fake/simulated outputs.

---

## 2. Obtaining Prebuilt `libllama.so` and `libggml.so`

### Method A: Official llama.cpp GitHub Releases & CI Artifacts (Fastest)
1. Go to the official repository: **[ggerganov/llama.cpp Releases](https://github.com/ggerganov/llama.cpp/releases)**
2. Download the Android release archive containing `arm64-v8a` shared libraries (`.so`), or fetch the Android build artifact from GitHub Actions CI.
3. Extract `libllama.so` and `libggml.so`.

---

### Method B: Compiling with Android NDK (Recommended for custom optimizations)
If you have the Android NDK installed (or in Google Colab / Linux terminal):

```bash
# 1. Clone official llama.cpp
git clone https://github.com/ggerganov/llama.cpp.git
cd llama.cpp

# 2. Set your Android NDK path
export ANDROID_NDK=$ANDROID_HOME/ndk/25.1.8937393  # or your installed NDK version

# 3. Create build directory for ARM64-v8a
mkdir build-android-arm64 && cd build-android-arm64

# 4. Configure CMake with Android Toolchain & Shared Libraries
cmake .. \
  -DCMAKE_TOOLCHAIN_FILE=$ANDROID_NDK/build/cmake/android.toolchain.cmake \
  -DANDROID_ABI=arm64-v8a \
  -DANDROID_PLATFORM=android-26 \
  -DBUILD_SHARED_LIBS=ON \
  -DGGML_OPENMP=OFF \
  -DGGML_LLAMAFILE=OFF

# 5. Build libraries
make -j$(nproc) llama ggml

# The built libraries will be in 'bin/' or 'lib/':
# - libllama.so
# - libggml.so
```

---

## 3. Placing `.so` Files in the Android Project

Place the compiled shared libraries into the corresponding ABI directories:

```
app/
└── src/
    └── main/
        └── jniLibs/
            ├── arm64-v8a/             <-- Primary target for 64-bit Android devices
            │   ├── libllama.so
            │   └── libggml.so
            ├── armeabi-v7a/           <-- Optional: 32-bit legacy devices
            │   ├── libllama.so
            │   └── libggml.so
            └── x86_64/                <-- Optional: Android Emulator
                ├── libllama.so
                └── libggml.so
```

---

## 4. Supported GGUF Quantized Models

The engine supports any standard GGUF model (`Q4_K_M`, `Q4_0`, `Q5_K_M`, `Q8_0`). Recommended lightweight models for mobile devices (6GB RAM):

| Model | Format | Size | Recommended RAM | Description |
| :--- | :--- | :--- | :--- | :--- |
| **SmolLM2-360M-Instruct** | `Q4_K_M` | ~240 MB | 2GB+ | Ultra-fast on-device responses, low battery impact |
| **Qwen2.5-0.5B-Instruct** | `Q4_K_M` | ~380 MB | 3GB+ | High Hindi/English bilingual accuracy |
| **Llama-3.2-1B-Instruct** | `Q4_K_M` | ~750 MB | 4GB+ | Excellent reasoning & structured assistant responses |

### Storing Models on Device
Models are loaded from the app's standard internal storage directory:
```
/data/data/com.mayra.assistant/files/models/<model_filename>.gguf
```
Or the external app files directory:
```
/sdcard/Android/data/com.mayra.assistant/files/models/<model_filename>.gguf
```
Users can also trigger automatic model downloads directly via the **Settings -> Offline AI Models** section in the app.

---

## 5. Verification & Logcat Diagnostics

To verify that the real engine is active when running on an Android device:

```bash
adb logcat -s MayraLlamaJNI MayraLlamaEngine
```

**Successful Output with Real Binaries:**
```
I/MayraLlamaJNI: Native library 'mayra_llama' loaded successfully
I/MayraLlamaJNI: nativeInit called
I/MayraLlamaEngine: LlamaEngine instance constructed
I/MayraLlamaEngine: Loading GGUF model: /data/user/0/com.mayra.assistant/files/models/smollm2-360m-instruct-q4_k_m.gguf
I/MayraLlamaEngine: Real GGUF model successfully loaded into llama context
```

**Graceful Fallback Output (When `.so` or model files are missing):**
```
W/MayraLlamaJNI: nativeIsAvailable: Prebuilt libllama.so/libggml.so not linked in build. Reporting unavailable.
E/MayraLlamaJNI: nativeLoadModel: Real llama.cpp binaries (libllama.so, libggml.so) not linked. Cannot execute GGUF weights. Offline mode unavailable.
```
