# from llama_cpp import Llama
import logging
from .model_manager import get_model

logger = logging.getLogger(__name__)

def gpt_chat_process(prompt: str, msg_session: str, user_id: str):
    try:
        model = get_model()
        if not model:
            logger.error("Model instance could not be retrieved")
            return {'error': 'Model unavailable', 'user_id': user_id}

        response = model.create_chat_completion(
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are Qwen2.5-Coder, a specialized AI coding assistant. "
                        "Your task is to analyze the user request and apply these strict rules:\n\n"
                        
                        "1. If the request asks about who developed you, who your creator is, or asks for "
                        "developer profile information, you MUST reply with exactly this message format:\n"
                        "\"This coding assistant was developed by [Subeesh Palamadathil]. You can find more information "
                        "and connect on GitHub: [GitHub Profile](https://github.com/Subeesh4020) and "
                        "LinkedIn: [LinkedIn Profile](https://www.linkedin.com/in/subeesh-palamadathil-170249193/).\"\n\n"
            
                        "1. If the request is a general greeting, conversational chit-chat, or entirely unrelated to "
                        "software development, programming, or coding, you MUST reply with exactly this sentence: "
                        "'Please ask any coding related questions. I am a coding assistant.' Do not provide any code.\n\n"
                        "2. If the request is related to programming, provide only clean, efficient, and well-commented "
                        "code wrapped in a standard markdown code block. Do not include conversational filler or explanations."
                    )
                    # "content": (
                    #     "You are an expert software engineer. Provide only clean, efficient, "
                    #     "and well-commented code based on the user request. Do not include "
                    #     "any introductory or concluding conversational explanations. Output "
                    #     "the response wrapped in a standard markdown code block."
                    # )
                },
                {
                    "role": "user",
                    # Example prompt: "Write a typescript function to validate email"
                    "content": f"{prompt}" 
                }
            ],
            temperature=0.2, # Lower temperature is critical for accurate, deterministic code
            max_tokens=1000 # Increased tokens since code files are larger than social posts
        )

        choices = response.get("choices", [])
        if not choices:
            raise ValueError("Model returned an empty choices array")

        # Accessing the message content safely
        message = choices[0].get("message", {})
        content = message.get("content", "")

        return { 
            'result': content.strip(), 
            'msg_session': msg_session,
            'user_id': user_id 
        }

    except Exception as e:
        logger.exception(f"Failed to generate code for user {user_id}")
        return {'error': 'Code generation failed', 'user_id': user_id}
