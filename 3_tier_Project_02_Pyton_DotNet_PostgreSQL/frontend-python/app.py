import os
from typing import Optional

import requests
from flask import Flask, Response, jsonify, render_template, request

app = Flask(__name__)
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8080").rstrip("/")
REQUEST_TIMEOUT = float(os.getenv("REQUEST_TIMEOUT", "10"))


def forward(method: str, path: str) -> Response:
    """Forward browser API calls to the .NET backend.

    The browser only talks to this Python service. Python acts as the
    presentation-tier proxy, while the .NET service owns business/data access.
    """
    url = f"{BACKEND_URL}{path}"
    kwargs = {
        "params": request.args,
        "timeout": REQUEST_TIMEOUT,
    }

    if method in {"POST", "PUT", "PATCH"}:
        kwargs["json"] = request.get_json(silent=True) or {}

    try:
        upstream = requests.request(method, url, **kwargs)
    except requests.RequestException as exc:
        return jsonify({
            "error": "Backend service is unavailable",
            "details": str(exc),
        }), 502

    content_type = upstream.headers.get("Content-Type", "application/json")
    return Response(
        upstream.content,
        status=upstream.status_code,
        content_type=content_type,
    )


@app.get("/")
def index():
    return render_template("index.html", backend_url=BACKEND_URL)


@app.get("/health")
def health():
    backend_status: Optional[str] = None
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=2)
        backend_status = "UP" if response.ok else "DOWN"
    except requests.RequestException:
        backend_status = "DOWN"

    return jsonify({
        "status": "UP",
        "service": "python-frontend",
        "backend": backend_status,
    })


@app.route("/api/projects", methods=["GET", "POST"])
def projects_proxy():
    return forward(request.method, "/api/projects")


@app.route("/api/projects/<int:project_id>", methods=["GET", "PUT", "DELETE"])
def project_proxy(project_id: int):
    return forward(request.method, f"/api/projects/{project_id}")


@app.get("/api/stats")
def stats_proxy():
    return forward("GET", "/api/stats")


@app.get("/api/metadata")
def metadata_proxy():
    return forward("GET", "/api/metadata")


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=os.getenv("FLASK_DEBUG") == "1")
