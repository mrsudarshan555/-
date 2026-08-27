#pragma once

#include "llama.h"
#include "ggml.h"
#include <string>
#include <vector>
#include <functional>
#include <atomic>
#include <memory>
#include <mutex>

namespace mayra {

struct EngineOptions {
    int n_threads = 4;
    int n_gpu_layers = 0;
    int context_size = 2048;
    int batch_size = 512;
};

struct GenerationOptions {
    std::string system_prompt = "You are MAYRA, a helpful, intelligent personal AI companion.";
    float temperature = 0.7f;
    float top_p = 0.9f;
    int max_tokens = 512;
    int batch_size = 512;
    std::vector<std::string> stop_sequences;
};

struct GenerationStats {
    int prompt_tokens = 0;
    int completion_tokens = 0;
    double duration_ms = 0.0;
    double tokens_per_second = 0.0;
};

using TokenCallback = std::function<bool(const std::string& token, const std::string& accumulated, double tps)>;

class LlamaEngine {
public:
    LlamaEngine();
    ~LlamaEngine();

    bool init();
    bool loadModel(const std::string& model_path, const EngineOptions& options);
    bool unloadModel();
    bool isModelLoaded() const;

    std::string getActiveModelPath() const;
    int getContextSize() const;

    bool generate(
        const std::string& prompt,
        const GenerationOptions& options,
        TokenCallback token_cb,
        std::string& out_result,
        GenerationStats& out_stats
    );

    void cancel();
    bool isGenerating() const;

private:
    std::string m_model_path;
    EngineOptions m_options;

    struct llama_model * m_model = nullptr;
    struct llama_context * m_ctx = nullptr;
    struct llama_sampler * m_sampler = nullptr;

    std::atomic<bool> m_is_loaded{false};
    std::atomic<bool> m_is_generating{false};
    std::atomic<bool> m_cancel_requested{false};
    mutable std::mutex m_mutex;
};

} // namespace mayra
