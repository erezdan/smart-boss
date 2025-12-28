from flask import Flask, request
from vlm_analyze.handler import handle_vlm_analyze
from dotenv import load_dotenv

# Load .env ONLY for local execution
load_dotenv()

app = Flask(__name__)

@app.route("/vlm/analyze", methods=["POST"])
def vlm_analyze():
    return handle_vlm_analyze(request)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, debug=True, use_reloader=False)
