#pragma once

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

// GGML types & backend constants
#ifndef GGML_TYPE_DEFINED
#define GGML_TYPE_DEFINED
enum ggml_type {
    GGML_TYPE_F32  = 0,
    GGML_TYPE_F16  = 1,
    GGML_TYPE_Q4_0 = 2,
    GGML_TYPE_Q4_1 = 3,
    GGML_TYPE_Q4_K = 12,
    GGML_TYPE_Q5_K = 13,
    GGML_TYPE_Q6_K = 14,
    GGML_TYPE_Q8_0 = 8,
    GGML_TYPE_COUNT,
};
typedef enum ggml_type ggml_type;
#endif

struct ggml_context;
struct ggml_tensor;

// LLAMA types
typedef int32_t llama_pos;
typedef int32_t llama_token;
typedef int32_t llama_seq_id;

struct llama_model;
struct llama_context;
struct llama_sampler;

typedef struct llama_token_data {
    llama_token id; // token id
    float logit;    // log-odds of the token
    float p;        // probability of the token
} llama_token_data;

typedef struct llama_token_data_array {
    llama_token_data * data;
    size_t size;
    bool sorted;
} llama_token_data_array;

typedef struct llama_batch {
    int32_t n_tokens;
    llama_token  * token;
    float        * embd;
    llama_pos    * pos;
    int32_t      * n_seq_id;
    llama_seq_id ** seq_id;
    int8_t       * logits;

    // internal
    int32_t all_pos_0;
    int32_t all_pos_1;
    int32_t all_seq_id;
} llama_batch;

typedef struct llama_model_params {
    int32_t n_gpu_layers; // number of layers to store in VRAM
    int32_t main_gpu;     // the GPU that is used for scratch and small tensors
    const float * tensor_split; // how to split layers across multiple GPUs
    bool vocab_only;      // only load the vocabulary, no weights
    bool use_mmap;        // use mmap if possible
    bool use_mlock;       // force system to keep model in RAM
    bool check_tensors;   // validate tensor data
} llama_model_params;

typedef struct llama_context_params {
    uint32_t n_ctx;             // text context, 0 = from model
    uint32_t n_batch;           // logical maximum batch size that can be submitted to llama_decode
    uint32_t n_ubatch;          // physical maximum batch size of prompt processing
    uint32_t n_seq_max;         // max number of sequences (i.e. distinct states for recurrent models)
    int32_t  n_threads;         // number of threads to use for generation
    int32_t  n_threads_batch;   // number of threads to use for batch processing
    int8_t   rope_scaling_type; // RoPE scaling type
    float    rope_freq_base;    // RoPE base frequency
    float    rope_freq_scale;   // RoPE frequency scaling factor
    float    yarn_ext_factor;   // YaRN extrapolation mix factor
    float    yarn_attn_factor;  // YaRN magnitude scaling factor
    float    yarn_beta_fast;    // YaRN low correction dim
    float    yarn_beta_slow;    // YaRN high correction dim
    uint32_t yarn_orig_ctx;     // YaRN original context length
    float    defrag_thold;      // KV cache defragmentation threshold
    bool     embeddings;        // whether to output embeddings
    bool     offload_kqv;       // whether to offload the KQV ops to GPU
    bool     flash_attn;        // whether to use Flash Attention
} llama_context_params;

// Core llama.cpp C API definitions
llama_model_params llama_model_default_params(void);
llama_context_params llama_context_default_params(void);

void llama_backend_init(void);
void llama_backend_free(void);

struct llama_model * llama_load_model_from_file(
    const char * path_model,
    struct llama_model_params params
);

struct llama_model * llama_model_load_from_file(
    const char * path_model,
    struct llama_model_params params
);

void llama_free_model(struct llama_model * model);

struct llama_context * llama_new_context_with_model(
    struct llama_model * model,
    struct llama_context_params params
);

struct llama_context * llama_init_from_file(
    const char * path_model,
    struct llama_context_params params
);

void llama_free(struct llama_context * ctx);

int32_t llama_n_ctx(const struct llama_context * ctx);
int32_t llama_n_vocab(const struct llama_model * model);
enum ggml_type llama_vocab_type(const struct llama_model * model);

// Tokenization
int32_t llama_tokenize(
    const struct llama_model * model,
    const char * text,
    int32_t text_len,
    llama_token * tokens,
    int32_t n_tokens_max,
    bool add_special,
    bool parse_special
);

int32_t llama_token_to_piece(
    const struct llama_model * model,
    llama_token token,
    char * buf,
    int32_t length,
    int32_t lstrip,
    bool special
);

llama_token llama_token_bos(const struct llama_model * model);
llama_token llama_token_eos(const struct llama_model * model);
llama_token llama_token_eot(const struct llama_model * model);
llama_token llama_token_nl(const struct llama_model * model);

// Batch & Decoding
struct llama_batch llama_batch_init(int32_t n_tokens, int32_t embd, int32_t n_seq_max);
void llama_batch_free(struct llama_batch batch);
void llama_batch_add(
    struct llama_batch * batch,
    llama_token id,
    llama_pos pos,
    const llama_seq_id * seq_ids,
    bool logits
);

int32_t llama_decode(
    struct llama_context * ctx,
    struct llama_batch batch
);

float * llama_get_logits_ith(
    struct llama_context * ctx,
    int32_t i
);

// Sampling
struct llama_sampler * llama_sampler_chain_init(void);
void llama_sampler_chain_add(struct llama_sampler * chain, struct llama_sampler * smpl);
struct llama_sampler * llama_sampler_init_temp(float temp);
struct llama_sampler * llama_sampler_init_top_p(float p, size_t min_keep);
struct llama_sampler * llama_sampler_init_greedy(void);
llama_token llama_sampler_sample(struct llama_sampler * smpl, struct llama_context * ctx, int32_t idx);
void llama_sampler_free(struct llama_sampler * smpl);

#ifdef __cplusplus
}
#endif
