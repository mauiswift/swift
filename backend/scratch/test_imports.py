import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    import backend.routers
    print("SUCCESS: backend.routers imported")
    from backend.routers import magpie, swiftpay, xend, payments
    print("SUCCESS: Essential routers imported")
except Exception as e:
    print(f"FAILURE: {e}")
    import traceback
    traceback.print_exc()
