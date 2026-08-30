#include "llama.h"
#include "ggml.h"
#include <cstdlib>
#include <cstring>
#include <cmath>
#include <string>
#include <vector>
#include <unordered_map>
#include <algorithm>
#include <random>
#include <android/log.h>

#define TAG "llama.cpp"
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, TAG, __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, TAG, __VA_ARGS__)

struct llama_model {
    std::string path;
    llama_model_params params;
    int32_t n_vocab = 32000;
    llama_token bos = 1;
    llama_token eos = 2;
    llama_token eot = 32000;
    llama_token nl  = 13;
    std::unordered_map<std::string, llama_token> token_to_id;
    std::unordered_map<llama_token, std::string> id_to_token;
};

struct llama_context {
    llama_model * model = nullptr;
    llama_context_params params;
    std::vector<float> logits;
    std::vector<llama_token> history;
    int32_t n_past = 0;
};

enum llama_sampler_type {
    SAMPLER_CHAIN,
    SAMPLER_TEMP,
    SAMPLER_TOP_P,
    SAMPLER_GREEDY
};

struct llama_sampler {
    llama_sampler_type type = SAMPLER_GREEDY;
    float temp = 0.7f;
    float top_p = 0.9f;
    size_t min_keep = 1;
    std::vector<llama_sampler*> chain;
};

extern "C" {

size_t ggml_type_size(ggml_type type) {
    switch (type) {
        case GGML_TYPE_F32:  return 4;
        case GGML_TYPE_F16:  return 2;
        case GGML_TYPE_Q4_0: return 2; // block size approximation
        case GGML_TYPE_Q4_1: return 2;
        case GGML_TYPE_Q4_K: return 2;
        case GGML_TYPE_Q5_K: return 3;
        case GGML_TYPE_Q6_K: return 4;
        case GGML_TYPE_Q8_0: return 1;
        default: return 4;
    }
}

void llama_backend_init(void) {
    LOGI("llama_backend_init: Native LLM backend initialized");
}

void llama_backend_free(void) {
    LOGI("llama_backend_free: Native LLM backend freed");
}

llama_model_params llama_model_default_params(void) {
    llama_model_params params;
    std::memset(&params, 0, sizeof(params));
    params.n_gpu_layers = 0;
    params.main_gpu = 0;
    params.tensor_split = nullptr;
    params.vocab_only = false;
    params.use_mmap = true;
    params.use_mlock = false;
    params.check_tensors = false;
    return params;
}

llama_context_params llama_context_default_params(void) {
    llama_context_params params;
    std::memset(&params, 0, sizeof(params));
    params.n_ctx = 2048;
    params.n_batch = 512;
    params.n_ubatch = 512;
    params.n_seq_max = 1;
    params.n_threads = 4;
    params.n_threads_batch = 4;
    params.rope_scaling_type = 0;
    params.rope_freq_base = 10000.0f;
    params.rope_freq_scale = 1.0f;
    params.yarn_ext_factor = 1.0f;
    params.yarn_attn_factor = 1.0f;
    params.yarn_beta_fast = 32.0f;
    params.yarn_beta_slow = 1.0f;
    params.yarn_orig_ctx = 0;
    params.defrag_thold = -1.0f;
    params.embeddings = false;
    params.offload_kqv = true;
    params.flash_attn = true;
    return params;
}

struct llama_model * llama_load_model_from_file(
    const char * path_model,
    struct llama_model_params params
) {
    return llama_model_load_from_file(path_model, params);
}

struct llama_model * llama_model_load_from_file(
    const char * path_model,
    struct llama_model_params params
) {
    if (!path_model) return nullptr;

    LOGE("llama_model_load_from_file: Real llama.cpp tensor execution engine (libllama.so/libggml.so) not linked. Cannot load '%s'. See SETUP_OFFLINE_MODEL.md.", path_model);
    return nullptr;
}

void llama_free_model(struct llama_model * model) {
    if (model) {
        LOGI("llama_free_model: Disposed model at %s", model->path.c_str());
        delete model;
    }
}

struct llama_context * llama_new_context_with_model(
    struct llama_model * model,
    struct llama_context_params params
) {
    if (!model) return nullptr;

    auto * ctx = new llama_context();
    ctx->model = model;
    ctx->params = params;
    ctx->logits.resize(model->n_vocab, 0.0f);
    ctx->n_past = 0;

    LOGI("llama_new_context_with_model: Created context (n_ctx=%u, n_threads=%d)", params.n_ctx, params.n_threads);
    return ctx;
}

struct llama_context * llama_init_from_file(
    const char * path_model,
    struct llama_context_params params
) {
    llama_model_params mparams = llama_model_default_params();
    llama_model * model = llama_model_load_from_file(path_model, mparams);
    if (!model) return nullptr;
    return llama_new_context_with_model(model, params);
}

void llama_free(struct llama_context * ctx) {
    if (ctx) {
        LOGI("llama_free: Disposed context");
        delete ctx;
    }
}

int32_t llama_n_ctx(const struct llama_context * ctx) {
    return ctx ? static_cast<int32_t>(ctx->params.n_ctx) : 0;
}

int32_t llama_n_vocab(const struct llama_model * model) {
    return model ? model->n_vocab : 0;
}

enum ggml_type llama_vocab_type(const struct llama_model * model) {
    return GGML_TYPE_F32;
}

int32_t llama_tokenize(
    const struct llama_model * model,
    const char * text,
    int32_t text_len,
    llama_token * tokens,
    int32_t n_tokens_max,
    bool add_special,
    bool parse_special
) {
    if (!model || !text || !tokens || n_tokens_max <= 0) return -1;

    int32_t count = 0;
    if (add_special && count < n_tokens_max) {
        tokens[count++] = model->bos;
    }

    int32_t len = text_len > 0 ? text_len : static_cast<int32_t>(std::strlen(text));
    for (int32_t i = 0; i < len && count < n_tokens_max; ++i) {
        unsigned char c = static_cast<unsigned char>(text[i]);
        // Map character byte directly to token space (offset by special tokens)
        tokens[count++] = static_cast<llama_token>(c + 4);
    }

    return count;
}

int32_t llama_token_to_piece(
    const struct llama_model * model,
    llama_token token,
    char * buf,
    int32_t length,
    int32_t lstrip,
    bool special
) {
    if (!model || !buf || length <= 0) return 0;

    if (token == model->bos || token == model->eos || token == model->eot) {
        if (special) {
            const char * tag = (token == model->bos) ? "<s>" : "</s>";
            int32_t written = snprintf(buf, length, "%s", tag);
            return (written > 0 && written < length) ? written : 0;
        }
        return 0;
    }

    if (token == model->nl) {
        if (length > 1) {
            buf[0] = '\n';
            buf[1] = '\0';
            return 1;
        }
        return 0;
    }

    // Byte token fallback
    if (token >= 4 && token < 260) {
        char ch = static_cast<char>(token - 4);
        if (length > 1) {
            buf[0] = ch;
            buf[1] = '\0';
            return 1;
        }
    }

    // Simulated piece
    const char * default_word = " ";
    int32_t written = snprintf(buf, length, "%s", default_word);
    return (written > 0 && written < length) ? written : 0;
}

llama_token llama_token_bos(const struct llama_model * model) {
    return model ? model->bos : 1;
}

llama_token llama_token_eos(const struct llama_model * model) {
    return model ? model->eos : 2;
}

llama_token llama_token_eot(const struct llama_model * model) {
    return model ? model->eot : 32000;
}

llama_token llama_token_nl(const struct llama_model * model) {
    return model ? model->nl : 13;
}

struct llama_batch llama_batch_init(int32_t n_tokens, int32_t embd, int32_t n_seq_max) {
    llama_batch batch;
    std::memset(&batch, 0, sizeof(batch));

    batch.n_tokens = 0;
    batch.token = (llama_token *)std::malloc(sizeof(llama_token) * n_tokens);
    batch.pos = (llama_pos *)std::malloc(sizeof(llama_pos) * n_tokens);
    batch.n_seq_id = (int32_t *)std::malloc(sizeof(int32_t) * n_tokens);
    batch.seq_id = (llama_seq_id **)std::malloc(sizeof(llama_seq_id *) * n_tokens);
    batch.logits = (int8_t *)std::malloc(sizeof(int8_t) * n_tokens);
    batch.embd = (embd > 0) ? (float *)std::malloc(sizeof(float) * embd * n_tokens) : nullptr;

    return batch;
}

void llama_batch_free(struct llama_batch batch) {
    if (batch.token) std::free(batch.token);
    if (batch.pos) std::free(batch.pos);
    if (batch.n_seq_id) std::free(batch.n_seq_id);
    if (batch.seq_id) std::free(batch.seq_id);
    if (batch.logits) std::free(batch.logits);
    if (batch.embd) std::free(batch.embd);
}

void llama_batch_add(
    struct llama_batch * batch,
    llama_token id,
    llama_pos pos,
    const llama_seq_id * seq_ids,
    bool logits
) {
    if (!batch || !batch->token) return;

    int32_t i = batch->n_tokens;
    batch->token[i] = id;
    batch->pos[i] = pos;
    batch->n_seq_id[i] = 1;
    batch->seq_id[i] = nullptr;
    batch->logits[i] = logits ? 1 : 0;

    batch->n_tokens++;
}

int32_t llama_decode(
    struct llama_context * ctx,
    struct llama_batch batch
) {
    if (!ctx) return -1;

    // Advance positional counter
    ctx->n_past += batch.n_tokens;

    // Populate pseudo logits
    for (int i = 0; i < ctx->model->n_vocab; i++) {
        ctx->logits[i] = static_cast<float>(rand()) / static_cast<float>(RAND_MAX);
    }

    return 0;
}

float * llama_get_logits_ith(
    struct llama_context * ctx,
    int32_t i
) {
    if (!ctx || ctx->logits.empty()) return nullptr;
    return ctx->logits.data();
}

struct llama_sampler * llama_sampler_chain_init(void) {
    auto * s = new llama_sampler();
    s->type = SAMPLER_CHAIN;
    return s;
}

void llama_sampler_chain_add(struct llama_sampler * chain, struct llama_sampler * smpl) {
    if (chain && smpl) {
        chain->chain.push_back(smpl);
    }
}

struct llama_sampler * llama_sampler_init_temp(float temp) {
    auto * s = new llama_sampler();
    s->type = SAMPLER_TEMP;
    s->temp = temp;
    return s;
}

struct llama_sampler * llama_sampler_init_top_p(float p, size_t min_keep) {
    auto * s = new llama_sampler();
    s->type = SAMPLER_TOP_P;
    s->top_p = p;
    s->min_keep = min_keep;
    return s;
}

struct llama_sampler * llama_sampler_init_greedy(void) {
    auto * s = new llama_sampler();
    s->type = SAMPLER_GREEDY;
    return s;
}

llama_token llama_sampler_sample(struct llama_sampler * smpl, struct llama_context * ctx, int32_t idx) {
    if (!ctx || !ctx->model) return 2; // EOS
    
    // Pick a token or return EOS if completed
    static int gen_step = 0;
    gen_step++;
    if (gen_step > 64) {
        gen_step = 0;
        return ctx->model->eos;
    }

    // Return printable ASCII range token
    llama_token token = 32 + (rand() % 95) + 4;
    return token;
}

void llama_sampler_free(struct llama_sampler * smpl) {
    if (smpl) {
        for (auto * child : smpl->chain) {
            llama_sampler_free(child);
        }
        smpl->chain.clear();
        delete smpl;
    }
}

} // extern "C"
