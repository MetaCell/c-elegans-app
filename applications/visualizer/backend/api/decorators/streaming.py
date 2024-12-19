import asyncio
import sys
import threading
from queue import Queue
from functools import wraps
from django.http import StreamingHttpResponse

def with_stdout_streaming(func):
    """
    A decorator that:
    - Runs the decorated function in a separate thread,
    - Captures anything it prints to stdout,
    - Streams that output asynchronously line-by-line as it's produced.
    """
    @wraps(func)
    def wrapper(request, *args, **kwargs):
        q = Queue()

        def run_func():
            # Redirect sys.stdout
            old_stdout = sys.stdout

            class QueueWriter:
                def write(self, data):
                    if data:
                        q.put(data)

                def flush(self):
                    pass  # For compatibility with print

            sys.stdout = QueueWriter()

            try:
                func(request, *args, **kwargs)
            except Exception as e:
                q.put(f"Error: {e}\n")
            finally:
                # Signal completion
                q.put(None)
                sys.stdout = old_stdout

        # Run the function in a background thread
        t = threading.Thread(target=run_func)
        t.start()

        # Async generator to yield lines from the queue
        async def line_generator():
            while True:
                line = await asyncio.to_thread(q.get)
                if line is None:  # End signal
                    break
                yield line

        # Return a streaming response that sends data asynchronously
        return StreamingHttpResponse(line_generator(), content_type="text/plain")

    return wrapper
