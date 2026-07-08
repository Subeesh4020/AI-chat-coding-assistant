
from llama_cpp import Llama
from huggingface_hub import hf_hub_download
from pathlib import Path
import os
import logging

logger = logging.getLogger(__name__)

_model = None

def load_model():
    global _model

    if _model is None:
        logger.info("Qwen2.5-coder-3b-instruct model loading started")
        try:
            # For dev
            BASE_DIR = Path(__file__).resolve().parent.parent
            model_path_qwen = BASE_DIR / "AiModels" / "CodingModel" / "qwen2.5-coder-3b-instruct-q4_k_m.gguf"
            model_path_qwen = os.environ.get('MODEL_PATH', str(model_path_qwen))
            
            # For production
            # Define a writeable cache path inside the user's home app directory
            # cache_dir = Path("/home/user/app/.cache/huggingface")
            # cache_dir.mkdir(parents=True, exist_ok=True)
            
            # model_path_qwen = hf_hub_download(
            #     repo_id="bartowski/Qwen2.5-Coder-3B-Instruct-GGUF",
            #     filename="Qwen2.5-Coder-3B-Instruct-Q4_K_M.gguf",
            #     cache_dir=str(cache_dir) # <-- Force it to use the writeable folder
            # )
            _model = Llama(
                model_path=model_path_qwen,
                n_ctx=4096,
                n_threads=2,       # adjust based on your CPU
                verbose=False
            )
            logger.info("✅ Qwen2.5-coder-3b-instruct model loaded")
        except Exception as e:
            logger.exception("Failed to load Qwen2.5-coder-3b-instruct model")
            
def get_model():
    return _model


# Do not bake the .gguf file into your Docker image. This makes your Docker builds incredibly slow and 
# fills up your local storage.The Best Practice: Mount the folder containing your AI models as a Docker Volume 
# on your Oracle Server. 
# This allows your container to read the model file directly from the host system disk.