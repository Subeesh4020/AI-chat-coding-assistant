import logging
import os
import signal
import time
import sys
import asyncio

# from kafka_python.topic_setup import create_topics
# from ModerationService.image_moderation_consumer import ImageModerationConsumer
# from TextGeneration.generate_ai_desc_consumer import GenAiDescConsumer
from classInfra import worker_service
from QueueAndWorker.model_manager import load_model


# Check if the environment is production. Default to 'development' if not set.
ENVIRONMENT = os.getenv("APP_ENV", "development")

# Automatically pick the level based on the environment
if ENVIRONMENT == "production":
    LOG_LEVEL = logging.INFO    # Hides DEBUG noise in production
else:
    LOG_LEVEL = logging.DEBUG   # Shows EVERYTHING in development
    
logging.basicConfig(
    level=LOG_LEVEL,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

# logging.getLogger("kafka").setLevel(logging.WARNING)

# Works all of these if set logging.DEBUG 
# logger.debug() 
# logger.info() 
# logger.warning()
# logger.error() 
# logger.critical()

logging.basicConfig(level=logging.INFO)

logger = logging.getLogger(__name__)

# def kafka_init():
    
#     create_topics()

#     # START PRODUCERS
#     producer_manager.create_producer(
#         producer_name="image-moderation-producer",
#         max_retries=6
#     )

#     producer_manager.create_producer(
#         producer_name="text-gen-producer",
#         max_retries=6
#     )
    
#     # START CONSUMERS
#     image_moderation_consumer = ImageModerationConsumer()
#     image_moderation_consumer.start()
    
#     text_generation_consumer = GenAiDescConsumer()
#     text_generation_consumer.start()
        
        
shutdown_event = None

def signal_handler(sig, frame):
    logger.info(
        "🛑 Shutdown signal received"
    )
    shutdown_event.set()
    
# MAIN APPLICATION
async def main():
    global shutdown_event
    exit_code = 0
    
    # logger.info(
    #     "🚀 Starting moderation service"
    # )
    
    # logger.info(
    #     "Starting topic creation"
    # )
    
    try: 
        # Simulate adding jobs via our Producer class
        # await queue_service.connect()
        # Start up the background worker service
        await worker_service.start()
        load_model()
        
        # CREATE TOPICS
        # 💡 FIX: Force the blocking Kafka call to execute on a separate thread
        
        # await asyncio.to_thread(kafka_init)
        
        shutdown_event = asyncio.Event()
        # Wait until Ctrl+C or SIGTERM
        await shutdown_event.wait()

        # KEEP SERVICE RUNNING - no need this because we already has await shutdown_event.wait()
        # while True:
        #     await asyncio.sleep(60)
    except Exception as e:
        logger.exception("❌ Error starting service")
        exit_code = 1
    finally:
        logging.info("Cleaning up...")
        
        try: 
            # consumer_manager.stop_all_consumers()
            # producer_manager.stop_all_producers()
            
            # Clean queue and worker
            await worker_service.stop()
            # await queue_service.disconnect()

            logger.info(
                "✅ Graceful shutdown completed"
            )
        except Exception as e: 
            logger.exception("❌ Graceful shutdown failed")
        finally:
            sys.exit(exit_code)
        

# SERVICE ENTRY POINT
if __name__ == "__main__":
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    asyncio.run(main()) # no need of sys.exit(0) at last, asyncio will do that