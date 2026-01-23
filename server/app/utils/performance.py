"""
Backend Performance Optimization Module
"""
import asyncio
import time
import psutil
from functools import wraps
from typing import Any, Callable, Dict, Optional
from cachetools import TTLCache
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global caches
model_cache = TTLCache(maxsize=100, ttl=3600)  # 1 hour TTL
api_cache = TTLCache(maxsize=1000, ttl=300)    # 5 minutes TTL

class PerformanceMonitor:
    """Monitor and track performance metrics"""
    
    def __init__(self):
        self.metrics = {
            'request_count': 0,
            'total_response_time': 0,
            'cache_hits': 0,
            'cache_misses': 0,
            'memory_usage': 0,
            'cpu_usage': 0
        }
    
    def record_request(self, response_time: float):
        """Record request metrics"""
        self.metrics['request_count'] += 1
        self.metrics['total_response_time'] += response_time
    
    def record_cache_hit(self):
        """Record cache hit"""
        self.metrics['cache_hits'] += 1
    
    def record_cache_miss(self):
        """Record cache miss"""
        self.metrics['cache_misses'] += 1
    
    def update_system_metrics(self):
        """Update system resource metrics"""
        self.metrics['memory_usage'] = psutil.virtual_memory().percent
        self.metrics['cpu_usage'] = psutil.cpu_percent()
    
    def get_average_response_time(self) -> float:
        """Get average response time"""
        if self.metrics['request_count'] == 0:
            return 0
        return self.metrics['total_response_time'] / self.metrics['request_count']
    
    def get_cache_hit_rate(self) -> float:
        """Get cache hit rate percentage"""
        total_cache_requests = self.metrics['cache_hits'] + self.metrics['cache_misses']
        if total_cache_requests == 0:
            return 0
        return (self.metrics['cache_hits'] / total_cache_requests) * 100

# Global performance monitor instance
perf_monitor = PerformanceMonitor()

def performance_timer(func: Callable) -> Callable:
    """Decorator to measure function execution time"""
    @wraps(func)
    async def async_wrapper(*args, **kwargs):
        start_time = time.time()
        try:
            result = await func(*args, **kwargs)
            return result
        finally:
            execution_time = time.time() - start_time
            perf_monitor.record_request(execution_time)
            logger.info(f"{func.__name__} executed in {execution_time:.3f}s")
    
    @wraps(func)
    def sync_wrapper(*args, **kwargs):
        start_time = time.time()
        try:
            result = func(*args, **kwargs)
            return result
        finally:
            execution_time = time.time() - start_time
            perf_monitor.record_request(execution_time)
            logger.info(f"{func.__name__} executed in {execution_time:.3f}s")
    
    if asyncio.iscoroutinefunction(func):
        return async_wrapper
    else:
        return sync_wrapper

def cache_result(ttl: int = 300, cache_key: Optional[str] = None):
    """Decorator to cache function results"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            # Generate cache key
            key = cache_key or f"{func.__name__}:{hash(str(args) + str(kwargs))}"
            
            # Check cache
            cached_result = api_cache.get(key)
            if cached_result is not None:
                perf_monitor.record_cache_hit()
                logger.info(f"Cache hit for {func.__name__}")
                return cached_result
            
            # Cache miss - execute function
            perf_monitor.record_cache_miss()
            result = await func(*args, **kwargs)
            
            # Store in cache
            api_cache[key] = result
            logger.info(f"Cached result for {func.__name__}")
            return result
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            # Generate cache key
            key = cache_key or f"{func.__name__}:{hash(str(args) + str(kwargs))}"
            
            # Check cache
            cached_result = api_cache.get(key)
            if cached_result is not None:
                perf_monitor.record_cache_hit()
                logger.info(f"Cache hit for {func.__name__}")
                return cached_result
            
            # Cache miss - execute function
            perf_monitor.record_cache_miss()
            result = func(*args, **kwargs)
            
            # Store in cache
            api_cache[key] = result
            logger.info(f"Cached result for {func.__name__}")
            return result
        
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator

class DatabaseOptimizer:
    """Database query optimization utilities"""
    
    @staticmethod
    def optimize_query(query: str) -> str:
        """Basic query optimization"""
        # Remove unnecessary whitespace
        optimized = ' '.join(query.split())
        
        # Add basic optimizations
        if 'SELECT *' in optimized.upper():
            logger.warning("Consider selecting specific columns instead of *")
        
        return optimized
    
    @staticmethod
    def batch_insert_data(data: list, batch_size: int = 1000):
        """Process data in batches for better memory usage"""
        for i in range(0, len(data), batch_size):
            yield data[i:i + batch_size]

class MemoryOptimizer:
    """Memory usage optimization utilities"""
    
    @staticmethod
    def clear_model_cache():
        """Clear model cache to free memory"""
        model_cache.clear()
        logger.info("Model cache cleared")
    
    @staticmethod
    def clear_api_cache():
        """Clear API cache to free memory"""
        api_cache.clear()
        logger.info("API cache cleared")
    
    @staticmethod
    def get_memory_usage() -> Dict[str, float]:
        """Get current memory usage statistics"""
        memory = psutil.virtual_memory()
        return {
            'total_gb': memory.total / (1024**3),
            'available_gb': memory.available / (1024**3),
            'used_gb': memory.used / (1024**3),
            'percentage': memory.percent
        }
    
    @staticmethod
    def optimize_memory():
        """Run memory optimization routines"""
        # Clear caches if memory usage is high
        memory_stats = MemoryOptimizer.get_memory_usage()
        if memory_stats['percentage'] > 80:
            MemoryOptimizer.clear_api_cache()
            logger.warning(f"High memory usage detected: {memory_stats['percentage']:.1f}%")

class AsyncTaskManager:
    """Manage async tasks efficiently"""
    
    def __init__(self, max_concurrent: int = 10):
        self.semaphore = asyncio.Semaphore(max_concurrent)
        self.tasks = set()
    
    async def execute_task(self, coro):
        """Execute task with concurrency control"""
        async with self.semaphore:
            task = asyncio.create_task(coro)
            self.tasks.add(task)
            try:
                result = await task
                return result
            finally:
                self.tasks.discard(task)
    
    async def wait_for_all(self):
        """Wait for all tasks to complete"""
        if self.tasks:
            await asyncio.gather(*self.tasks, return_exceptions=True)

# Global task manager
task_manager = AsyncTaskManager()

def get_performance_metrics() -> Dict[str, Any]:
    """Get comprehensive performance metrics"""
    perf_monitor.update_system_metrics()
    
    return {
        'requests': {
            'total': perf_monitor.metrics['request_count'],
            'average_response_time': perf_monitor.get_average_response_time(),
        },
        'cache': {
            'hit_rate': perf_monitor.get_cache_hit_rate(),
            'hits': perf_monitor.metrics['cache_hits'],
            'misses': perf_monitor.metrics['cache_misses'],
            'api_cache_size': len(api_cache),
            'model_cache_size': len(model_cache),
        },
        'system': {
            'memory_usage_percent': perf_monitor.metrics['memory_usage'],
            'cpu_usage_percent': perf_monitor.metrics['cpu_usage'],
            'memory_stats': MemoryOptimizer.get_memory_usage(),
        },
        'tasks': {
            'active_tasks': len(task_manager.tasks),
        }
    }

# Background task to periodically optimize memory
async def memory_optimization_task():
    """Background task for memory optimization"""
    while True:
        try:
            await asyncio.sleep(300)  # Run every 5 minutes
            MemoryOptimizer.optimize_memory()
        except Exception as e:
            logger.error(f"Memory optimization task error: {e}")

# Start background optimization task
async def start_optimization_tasks():
    """Start all background optimization tasks"""
    asyncio.create_task(memory_optimization_task())
    logger.info("Background optimization tasks started")
