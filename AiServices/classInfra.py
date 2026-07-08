from dotenv import load_dotenv
import os

# from kafka_python.producer_manager import ProducerManager
# from kafka_python.consumer_manager import ConsumerManager

load_dotenv()

QUEUE_NAME = "gpt-chat"
REDIS_URI = os.getenv('REDIS_URI')

# CREATE MANAGERS
# producer_manager = ProducerManager()
# consumer_manager = ConsumerManager()

# from QueueAndWorker.queue_manager import QueueManager
from QueueAndWorker.worker_manager import WorkerManager

# Init queue and workers 
# queue_service = QueueManager(QUEUE_NAME, REDIS_URI)
worker_service = WorkerManager(QUEUE_NAME, REDIS_URI)