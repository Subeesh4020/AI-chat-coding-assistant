import asyncio
import re
import json
from typing import Any
import logging
from bullmq import Worker, Job
import redis
# from socketio_emitter import Emitter

from .gpt_chat import gpt_chat_process
# from TextGeneration.generate_ai_desc_producer import send_ai_gen_desc_message
logger = logging.getLogger(__name__)

class WorkerManager:
    def __init__(self, queue_name: str, redis_url: str = "redis://127.0.0.1:6379"):
        self.queue_name = queue_name
         # 2. Defensive handling in case someone explicitly passes None as redis_url
        if redis_url is None:
            redis_url = "redis://127.0.0.1:6379"
            
        self.redis_url = redis_url
        self.worker = None
        self.redis_client = redis.Redis.from_url(redis_url)
        # self.io_emitter = Emitter(client=self.redis_client, namespace="/")

    async def job_processor(self, job: Job, token: str) -> Any:
        """The core business logic that runs when a job is picked up."""
        logger.debug(f"⚙️  Processing Job {job.id} [{job.name}]...")
        
        try:
            # Simulate background task workload (e.g., calling an LLM or database script)
            # await asyncio.sleep(2) 
            if job.name == 'gpt-chat-process':
                prompt = job.data.get('prompt')
                msg_session = job.data.get('msgSession')
                user_id = job.data.get('userId')
                
                result = await asyncio.to_thread(gpt_chat_process, prompt, msg_session, user_id)
                
                logger.debug(result)
                text_content = result.get('result')
                msg_session = result.get('msg_session')
                user_id = result.get('user_id')
                # Regex tracking to grab exactly what sits inside the markdown ticks
                code_match = re.search(r'```(?:python)?\n(.*?)```', text_content, re.DOTALL)
                clean_code = code_match.group(1).strip() if code_match else text_content.strip()
                
                self.redis_client.publish(
                    "ai_response",
                    json.dumps({
                        "event": "gptChatRes",
                        "userId": user_id,
                        "msg_session": msg_session,
                        "payload": {
                            "result": clean_code
                        }
                    })
                )
        except Exception:
            logger.exception("Message send failed")
            
        # This return value will be stored in Redis as the job result
        return {"status": "success", "processed_data": job.data}

    def setup_event_listeners(self) -> None:
        """Hooks into specific job lifecycles using event callbacks."""
        if not self.worker:
            return

        # @self.worker.on("completed")
        def on_completed(job: Job, result: Any, token: str):
            logger.debug(f"✅ Event: Job {job.id} completed! Result: {result}")

        self.worker.on("completed", on_completed)
        
        # @self.worker.on("failed")
        def on_failed(job: Job, error: Exception, token: str):
            logger.debug(f"❌ Event: Job {job.id} failed! Reason: {error}")

        self.worker.on("failed", on_failed)
        
        # @self.worker.on("active")
        def on_active(job: Job, token: str):
            logger.debug(f"🏃 Event: Job {job.id} is now active.")

        self.worker.on("active", on_active)
        
    async def start(self) -> None:
        """Starts the background worker instance."""
        if not self.worker:
            self.worker = Worker(
                self.queue_name, 
                self.job_processor, 
                opts={"connection": self.redis_url}
            )
            self.setup_event_listeners()
            logger.info(f"🚀 Worker is running and listening to queue: {self.queue_name}")

    async def stop(self) -> None:
        """Gracefully closes the worker loop."""
        if self.worker:
            await self.worker.close()
            self.worker = None
            logger.info(f"🛑 Worker stopped safely.")
