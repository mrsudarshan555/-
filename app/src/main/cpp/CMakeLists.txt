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

# Main Shared Library Target: libmayra_llama.so
add_library(
    mayra_llama
    SHARED
    mayra_llama_jni.cpp
    llama_engine.cpp
    llama.cpp
)

target_include_directories(
    mayra_llama
    PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}
)

find_library(log-lib log)
find_library(android-lib android)

target_link_libraries(
    mayra_llama
    ${log-lib}
    ${android-lib}
)
