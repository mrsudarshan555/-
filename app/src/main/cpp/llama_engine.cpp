#include "llama_engine.h"
#include <android/log.h>
#include <chrono>
#include <thread>
#include <sstream>
#include <fstream>
#include <cstring>
#include <vector>

#define LOG_TAG "MayraLlamaEngine"
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, LOG_TAG, __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, LOG_TAG, __VA_ARGS__)
#define LOGW(...) __android_log_print(ANDROID_LOG_WARN, LOG_TAG, __VA_ARGS__)

namespace mayra {

LlamaEngine::LlamaEngine() {
    LOGI("LlamaEngine instance constructed");
    llama_backend_init();
}

LlamaEngine::~LlamaEngine() {
    unloadModel();
    llama_backend_free();
}

bool LlamaEngine::init() {
    LOGI("LlamaEngine initialized with ARM64-v8a backend");
    return true;
}

bool LlamaEngine::loadModel(const std::string& model_path, const EngineOptions& options) {
    std::lock_guard<std::mutex> lock(m_mutex);

    if (m_is_loaded) {
        LOGI("Unloading existing model before loading new one");
        unloadModel();
    }

    // Verify file existence on disk
    std::ifstream file(model_path, std::ios::binary);
    if (!file.is_open()) {
        LOGE("GGUF model file not found or inaccessible at path: %s", model_path.c_str());
        return false;
    }
    file.close();

    m_model_path = model_path;
    m_options = options;

    LOGI("Loading GGUF model: %s (threads: %d, gpu_layers: %d, context: %d)", 
         model_path.c_str(), options.n_threads, options.n_gpu_layers, options.context_size);

    // Set model parameters
    struct llama_model_params mparams = llama_model_default_params();
    mparams.n_gpu_layers = options.n_gpu_layers;
    mparams.use_mmap = true;
    mparams.use_mlock = false;

    // Load actual GGUF model from disk
    m_model = llama_model_load_from_file(model_path.c_str(), mparams);
    if (!m_model) {
        LOGE("llama_model_load_from_file failed for: %s", model_path.c_str());
        return false;
    }

    // Create llama context
    struct llama_context_params cparams = llama_context_default_params();
    cparams.n_ctx = options.context_size > 0 ? options.context_size : 2048;
    cparams.n_batch = options.batch_size > 0 ? options.batch_size : 512;
    cparams.n_threads = options.n_threads > 0 ? options.n_threads : 4;
    cparams.n_threads_batch = options.n_threads > 0 ? options.n_threads : 4;
    cparams.flash_attn = true;

    m_ctx = llama_new_context_with_model(m_model, cparams);
    if (!m_ctx) {
        LOGE("llama_new_context_with_model failed for model");
        llama_free_model(m_model);
        m_model = nullptr;
        return false;
    }

    m_is_loaded = true;
    LOGI("Real GGUF model successfully loaded into llama context");
    return true;
}

bool LlamaEngine::unloadModel() {
    std::lock_guard<std::mutex> lock(m_mutex);

    if (m_is_generating) {
        cancel();
    }

    if (m_sampler) {
        llama_sampler_free(m_sampler);
        m_sampler = nullptr;
    }

    if (m_ctx) {
        LOGI("Freeing llama_context");
        llama_free(m_ctx);
        m_ctx = nullptr;
    }

    if (m_model) {
        LOGI("Freeing llama_model: %s", m_model_path.c_str());
        llama_free_model(m_model);
        m_model = nullptr;
    }

    m_model_path.clear();
    m_is_loaded = false;
    return true;
}

bool LlamaEngine::isModelLoaded() const {
    return m_is_loaded.load() && m_model != nullptr && m_ctx != nullptr;
}

std::string LlamaEngine::getActiveModelPath() const {
    std::lock_guard<std::mutex> lock(m_mutex);
    return m_model_path;
}

int LlamaEngine::getContextSize() const {
    return m_options.context_size;
}

void LlamaEngine::cancel() {
    if (m_is_generating) {
        LOGI("Cancellation requested for active generation");
        m_cancel_requested = true;
    }
}

bool LlamaEngine::isGenerating() const {
    return m_is_generating.load();
}

bool LlamaEngine::generate(
    const std::string& prompt,
    const GenerationOptions& options,
    TokenCallback token_cb,
    std::string& out_result,
    GenerationStats& out_stats
) {
    if (!isModelLoaded()) {
        LOGE("Cannot generate: llama_model / llama_context not initialized");
        return false;
    }

    m_is_generating = true;
    m_cancel_requested = false;

    auto start_time = std::chrono::high_resolution_clock::now();
    out_result.clear();

    // Format prompt with ChatML / system template
    std::string formatted_prompt = "<|im_start|>system\n" + options.system_prompt + "<|im_end|>\n"
                                 + "<|im_start|>user\n" + prompt + "<|im_end|>\n"
                                 + "<|im_start|>assistant\n";

    // Tokenize prompt
    const int max_prompt_tokens = m_options.context_size > 0 ? m_options.context_size : 2048;
    std::vector<llama_token> prompt_tokens(max_prompt_tokens);
    int n_tokens = llama_tokenize(
        m_model,
        formatted_prompt.c_str(),
        static_cast<int32_t>(formatted_prompt.length()),
        prompt_tokens.data(),
        max_prompt_tokens,
        true,  // add_special
        true   // parse_special
    );

    if (n_tokens < 0) {
        LOGE("Tokenization failed for prompt");
        m_is_generating = false;
        return false;
    }
    prompt_tokens.resize(n_tokens);
    out_stats.prompt_tokens = n_tokens;

    // Initialize Sampler Chain
    if (m_sampler) {
        llama_sampler_free(m_sampler);
    }
    m_sampler = llama_sampler_chain_init();
    llama_sampler_chain_add(m_sampler, llama_sampler_init_top_p(options.top_p > 0.0f ? options.top_p : 0.9f, 1));
    llama_sampler_chain_add(m_sampler, llama_sampler_init_temp(options.temperature > 0.0f ? options.temperature : 0.7f));

    // Batch evaluation for prompt tokens
    struct llama_batch batch = llama_batch_init(options.batch_size > 0 ? options.batch_size : 512, 0, 1);

    for (int i = 0; i < n_tokens; i++) {
        llama_batch_add(&batch, prompt_tokens[i], i, nullptr, i == n_tokens - 1);
    }

    if (llama_decode(m_ctx, batch) != 0) {
        LOGE("llama_decode failed during prompt ingestion");
        llama_batch_free(batch);
        m_is_generating = false;
        return false;
    }

    llama_batch_free(batch);

    // Generation loop
    llama_token eos_token = llama_token_eos(m_model);
    llama_token eot_token = llama_token_eot(m_model);
    int max_gen_tokens = options.max_tokens > 0 ? options.max_tokens : 512;
    int cur_pos = n_tokens;

    std::string accumulated = "";
    out_stats.completion_tokens = 0;

    char piece_buf[256];

    for (int step = 0; step < max_gen_tokens; ++step) {
        if (m_cancel_requested) {
            LOGI("Generation cancelled at step %d", step);
            break;
        }

        llama_token new_token = llama_sampler_sample(m_sampler, m_ctx, -1);

        // Check for end of sequence
        if (new_token == eos_token || new_token == eot_token) {
            LOGI("EOS encountered; generation completed");
            break;
        }

        // Convert token to UTF-8 piece
        int piece_len = llama_token_to_piece(m_model, new_token, piece_buf, sizeof(piece_buf), 0, false);
        if (piece_len > 0) {
            std::string piece(piece_buf, piece_len);
            accumulated += piece;
            out_stats.completion_tokens++;

            auto now = std::chrono::high_resolution_clock::now();
            double elapsed_sec = std::chrono::duration<double>(now - start_time).count();
            double current_tps = elapsed_sec > 0 ? (out_stats.completion_tokens / elapsed_sec) : 0.0;

            if (token_cb) {
                bool cont = token_cb(piece, accumulated, current_tps);
                if (!cont) {
                    LOGI("Token callback requested stop");
                    break;
                }
            }
        }

        // Decode next single token
        struct llama_batch single_batch = llama_batch_init(1, 0, 1);
        llama_batch_add(&single_batch, new_token, cur_pos++, nullptr, true);

        if (llama_decode(m_ctx, single_batch) != 0) {
            LOGE("llama_decode failed at generation step %d", step);
            llama_batch_free(single_batch);
            break;
        }
        llama_batch_free(single_batch);
    }

    auto end_time = std::chrono::high_resolution_clock::now();
    double duration_ms = std::chrono::duration<double, std::milli>(end_time - start_time).count();
    out_stats.duration_ms = duration_ms;
    out_stats.tokens_per_second = (out_stats.completion_tokens > 0 && duration_ms > 0)
        ? (out_stats.completion_tokens / (duration_ms / 1000.0))
        : 0.0;

    out_result = accumulated;
    m_is_generating = false;
    return true;
}

} // namespace mayra
