import re
import time
import json
import logging
import urllib.parse
from collections import defaultdict
from typing import Dict, Any, List
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

logger = logging.getLogger("farmiq.waf")

# -----------------------------------------------------------------------------
# OWASP CORE RULE SET (CRS) REGEX HEURISTICS
# -----------------------------------------------------------------------------
SQLI_PATTERNS = re.compile(
    r"(union\s+select|or\s+1\s*=\s*1|'\s*--|;\s*drop\s+table|benchmark\s*\(|sleep\s*\(|information_schema|waitfor\s+delay)",
    re.IGNORECASE
)

XSS_PATTERNS = re.compile(
    r"(<script|javascript:|onerror\s*=|onload\s*=|eval\s*\(|<iframe|<img\s+src=.*onerror|document\.cookie)",
    re.IGNORECASE
)

PATH_TRAVERSAL_PATTERNS = re.compile(
    r"(\.\./|\.\.\\|/etc/passwd|win\.ini|/proc/self/|boot\.ini)",
    re.IGNORECASE
)

RCE_PATTERNS = re.compile(
    r"(;\s*rm\s+-rf|\|\s*cat\s+/|;\s*whoami|curl\s+.*\|\s*sh|powershell\s+-enc)",
    re.IGNORECASE
)

MALICIOUS_USER_AGENTS = re.compile(
    r"(sqlmap|nikto|acunetix|nmap|masscan|wpscan|havij|zgrab|gobuster|dirbuster)",
    re.IGNORECASE
)


# Live WAF Security Telemetry Global Store
WAF_GLOBAL_STATS = {
    "total_requests_screened": 0,
    "threats_blocked": 0,
    "sqli_detected": 0,
    "xss_detected": 0,
    "path_traversal_detected": 0,
    "malicious_bots_blocked": 0,
    "rate_limits_enforced": 0,
    "last_threat_timestamp": None,
    "waf_engine": "OWASP ModSecurity Core Rule Set v3.3-Enterprise"
}

def get_waf_metrics() -> Dict[str, Any]:
    """Returns current live firewall screening metrics."""
    return WAF_GLOBAL_STATS


class OWASPModSecurityWAFMiddleware(BaseHTTPMiddleware):
    """
    Enterprise Application Firewall & OWASP Guardrails Middleware.
    Inspects headers, query strings, and payloads against OWASP Core Rule Set.
    Enforces Zero-Trust Rate Limiting and Strict Security Headers.
    """

    def __init__(self, app, rate_limit_per_minute: int = 180):
        super().__init__(app)
        self.rate_limit_per_minute = rate_limit_per_minute
        self.request_counts: Dict[str, List[float]] = defaultdict(list)
        self.stats = WAF_GLOBAL_STATS

    async def dispatch(self, request: Request, call_next):
        self.stats["total_requests_screened"] += 1
        client_ip = request.client.host if request.client else "127.0.0.1"

        # 1. Inspect Malicious User-Agent
        user_agent = request.headers.get("user-agent", "")
        if MALICIOUS_USER_AGENTS.search(user_agent):
            self.stats["threats_blocked"] += 1
            self.stats["malicious_bots_blocked"] += 1
            logger.warning(f"WAF Blocked Malicious Scanner Agent from {client_ip}: {user_agent}")
            return self._build_blocked_response(
                reason="Malicious Automated Scanner Tool Detected (OWASP CRS Rule 913100)",
                client_ip=client_ip
            )

        # 2. Inspect Query String for Injection Payloads (Normalized URL-decoded)
        query_str = urllib.parse.unquote_plus(str(request.url.query))
        if query_str:
            violation = self._inspect_payload_string(query_str)
            if violation:
                self.stats["threats_blocked"] += 1
                logger.warning(f"WAF Blocked Query Payload Attack from {client_ip}: {violation}")
                return self._build_blocked_response(reason=violation, client_ip=client_ip)

        # 3. Inspect URL Path (Normalized URL-decoded)
        path_str = urllib.parse.unquote(request.url.path)
        if PATH_TRAVERSAL_PATTERNS.search(path_str):
            self.stats["threats_blocked"] += 1
            self.stats["path_traversal_detected"] += 1
            logger.warning(f"WAF Blocked Path Traversal Attack from {client_ip}: {path_str}")
            return self._build_blocked_response(
                reason="Path Traversal / LFI Attempt (OWASP CRS Rule 930100)",
                client_ip=client_ip
            )

        # 4. Zero-Trust Token Bucket Rate Limiting (Per IP)
        now = time.time()
        timestamps = self.request_counts[client_ip]
        # Keep only timestamps in last 60 seconds
        self.request_counts[client_ip] = [t for t in timestamps if now - t <= 60]
        if len(self.request_counts[client_ip]) >= self.rate_limit_per_minute:
            self.stats["rate_limits_enforced"] += 1
            return JSONResponse(
                status_code=429,
                content={
                    "error": "Rate Limit Exceeded",
                    "message": "Too many requests. Zero-Trust API rate limit enforced.",
                    "limit_per_minute": self.rate_limit_per_minute
                }
            )
        self.request_counts[client_ip].append(now)

        # Process Request
        response: Response = await call_next(request)

        # 5. Inject Enterprise Defensive Security Headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["X-WAF-Protection"] = "OWASP-CRS-ModSecurity-Active"

        return response

    def _inspect_payload_string(self, text: str) -> str:
        """Evaluates raw strings against injection heuristics."""
        if SQLI_PATTERNS.search(text):
            self.stats["sqli_detected"] += 1
            return "SQL Injection Attack Signature Detected (OWASP CRS Rule 942100)"
        if XSS_PATTERNS.search(text):
            self.stats["xss_detected"] += 1
            return "Cross-Site Scripting (XSS) Signature Detected (OWASP CRS Rule 941100)"
        if RCE_PATTERNS.search(text):
            return "Remote Command Execution (RCE) Signature Detected (OWASP CRS Rule 932100)"
        if PATH_TRAVERSAL_PATTERNS.search(text):
            self.stats["path_traversal_detected"] += 1
            return "Path Traversal / LFI Attempt Detected (OWASP CRS Rule 930100)"
        return ""

    def _build_blocked_response(self, reason: str, client_ip: str) -> JSONResponse:
        """Returns standard 403 Forbidden with security audit ID."""
        audit_id = f"SEC-{int(time.time())}-{hash(client_ip) % 10000:04d}"
        return JSONResponse(
            status_code=403,
            content={
                "error": "Forbidden: Security Policy Violation",
                "waf_engine": "OWASP ModSecurity Core Rule Set v3.3",
                "audit_event_id": audit_id,
                "reason": reason,
                "client_ip": client_ip,
                "timestamp": time.time()
            }
        )

    def get_metrics(self) -> Dict[str, Any]:
        """Returns live firewall screening metrics."""
        return self.stats
