cmake_minimum_required(VERSION 3.22.1)

project("mayra_llama_engine" C CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_C_STANDARD 11)
set(CMAKE_C_STANDARD_REQUIRED ON)

# Optimization flags for ARM64-v8a NEON & FP16 hardware acceleration
if(${ANDROID_ABI} STREQUAL "arm64-v8a")
    add_compile_options(-O3 -fPIC -DANDROID -D__ARM_NEON -march=armv8-a+fp+simd -DGGML_USE_K_QUANTS)
else()
    add_compile_options(-O3 -fPIC -DANDROID -DGGML_USE_K_QUANTS)
endif()

# System libraries
find_library(log-lib log)
find_library(android-lib android)

# Path to prebuilt official llama.cpp / ggml shared binaries
set(JNILIBS_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../jniLibs/${ANDROID_ABI}")
set(PREBUILT_LLAMA_SO "${JNILIBS_DIR}/libllama.so")
set(PREBUILT_GGML_SO "${JNILIBS_DIR}/libggml.so")

if(EXISTS "${PREBUILT_LLAMA_SO}" AND EXISTS "${PREBUILT_GGML_SO}")
    message(STATUS "=== REAL LLAMA.CPP DETECTED ===")
    message(STATUS "Found official prebuilt llama.cpp binaries for ${ANDROID_ABI} in ${JNILIBS_DIR}")
    
    # Import prebuilt libllama.so
    add_library(llama SHARED IMPORTED)
    set_target_properties(llama PROPERTIES IMPORTED_LOCATION "${PREBUILT_LLAMA_SO}")
    
    # Import prebuilt libggml.so
    add_library(ggml SHARED IMPORTED)
    set_target_properties(ggml PROPERTIES IMPORTED_LOCATION "${PREBUILT_GGML_SO}")
    
    # Main Shared Library Target linked with official llama.cpp
    add_library(
        mayra_llama
        SHARED
        mayra_llama_jni.cpp
        llama_engine.cpp
    )
    
    target_compile_definitions(mayra_llama PRIVATE HAVE_REAL_LLAMA=1)
    
    target_include_directories(
        mayra_llama
        PRIVATE
        ${CMAKE_CURRENT_SOURCE_DIR}
    )
    
    target_link_libraries(
        mayra_llama
        llama
        ggml
        ${log-lib}
        ${android-lib}
    )
else()
    message(WARNING "==========================================================================")
    message(WARNING "Real llama.cpp prebuilt binaries (libllama.so, libggml.so) NOT found in:")
    message(WARNING "  ${JNILIBS_DIR}")
    message(WARNING "Compiling fallback scaffolding engine.")
    message(WARNING "Offline GGUF model execution will safely report 'Offline mode unavailable'")
    message(WARNING "at runtime without crashing or producing fake outputs.")
    message(WARNING "See SETUP_OFFLINE_MODEL.md for instructions on downloading real binaries.")
    message(WARNING "==========================================================================")
    
    # Compile with local scaffolding stub
    add_library(
        mayra_llama
        SHARED
        mayra_llama_jni.cpp
        llama_engine.cpp
        llama.cpp
    )
    
    target_compile_definitions(mayra_llama PRIVATE HAVE_REAL_LLAMA=0)
    
    target_include_directories(
        mayra_llama
        PRIVATE
        ${CMAKE_CURRENT_SOURCE_DIR}
    )
    
    target_link_libraries(
        mayra_llama
        ${log-lib}
        ${android-lib}
    )
endif()

