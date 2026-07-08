# import asyncio
# from typing import Dict, Any
# from bullmq import Queue
# import logging

# logger = logging.getLogger(__name__)

# class QueueManager:
#     def __init__(self, queue_name: str, redis_url: str = "redis://127.0.0.1:6379"):
#         self.queue_name = queue_name
#         self.redis_url = redis_url
#         self.queue = None

#     async def connect(self) -> None:
#         """Initializes the connection to the BullMQ Redis queue."""
#         if not self.queue:
#             # Passing connection string via opts dict
#             self.queue = Queue(self.queue_name, opts={"connection": self.redis_url})
#             logger.info(f"📡 Connected to Queue: {self.queue_name}")

#     async def add_job(self, job_name: str, data: Dict[str, Any], priority: int = 0) -> Any:
#         """Adds a job into the queue with optional configurations."""
#         if not self.queue:
#             await self.connect()
            
#          # Inject the model string cleanly into the payload dictionary
#         opts = {"priority": priority} if priority > 0 else {}
#         # Call queue.add using only the valid signature parameters
#         job = await self.queue.add(job_name, data, opts)
#         logger.debug(f"➕ Job added! ID: {job.id} | Name: {job_name}")
#         return job

#     async def disconnect(self) -> None:
#         """Gracefully closes the queue connections."""
#         if self.queue:
#             await self.queue.close()
#             self.queue = None
#             logger.info(f"🛑 Disconnected from Queue: {self.queue_name}")
