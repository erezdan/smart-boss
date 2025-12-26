from firebase_functions import https_fn
from vlm_analyze.handler import handle_vlm_analyze

@https_fn.on_request()
def vlm_analyze(req):
    return handle_vlm_analyze(req)

