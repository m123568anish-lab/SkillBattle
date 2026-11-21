"""
=========================================================
SkillBattle / Qubira — SSRF Protection Utility

Defends against Server-Side Request Forgery (SSRF) by:
1. Enforcing allowed URL schemes (http, https).
2. Prohibiting access to loopback, private, link-local,
   and cloud provider metadata IP addresses (e.g. 169.254.169.254).
3. Resolving hostnames to IP addresses prior to connection
   to prevent DNS rebinding and internal network probing.
=========================================================
"""

from __future__ import annotations

import ipaddress
import socket
from urllib.parse import urlparse

# Private / reserved IPv4 & IPv6 networks
_BLOCKED_NETWORKS = [
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("100.64.0.0/10"),       # Carrier-grade NAT
    ipaddress.ip_network("127.0.0.0/8"),         # Loopback
    ipaddress.ip_network("169.254.0.0/16"),       # Link-local / Cloud metadata
    ipaddress.ip_network("172.16.0.0/12"),       # Private class B
    ipaddress.ip_network("192.0.0.0/24"),        # IETF protocol assignments
    ipaddress.ip_network("192.0.2.0/24"),        # TEST-NET-1
    ipaddress.ip_network("192.168.0.0/16"),      # Private class C
    ipaddress.ip_network("198.18.0.0/15"),       # Benchmark testing
    ipaddress.ip_network("198.51.100.0/24"),     # TEST-NET-2
    ipaddress.ip_network("203.0.113.0/24"),      # TEST-NET-3
    ipaddress.ip_network("224.0.0.0/4"),         # Multicast
    ipaddress.ip_network("240.0.0.0/4"),         # Reserved
    ipaddress.ip_network("255.255.255.255/32"),  # Broadcast
    # IPv6
    ipaddress.ip_network("::/128"),              # Unspecified
    ipaddress.ip_network("::1/128"),             # Loopback
    ipaddress.ip_network("fc00::/7"),            # Unique local address
    ipaddress.ip_network("fe80::/10"),           # Link-local
    ipaddress.ip_network("ff00::/8"),            # Multicast
]

# Explicit cloud metadata hostnames
_BLOCKED_HOSTNAMES = {
    "metadata.google.internal",
    "metadata.goog",
    "instance-data",
    "localhost",
}

ALLOWED_SCHEMES = {"http", "https"}


class SSRFSecurityError(Exception):
    """Raised when a URL targets a prohibited destination or violates SSRF policy."""
    pass


def is_ip_blocked(ip: ipaddress.IPv4Address | ipaddress.IPv6Address) -> bool:
    """Return True if the IP address falls within any prohibited network."""
    if ip.is_loopback or ip.is_private or ip.is_link_local or ip.is_multicast or ip.is_reserved or ip.is_unspecified:
        return True
    return any(ip in net for net in _BLOCKED_NETWORKS)


def is_safe_ip(ip_str: str) -> bool:
    """Return True if the IP address is valid and publicly routable (not private/loopback)."""
    try:
        ip = ipaddress.ip_address(ip_str)
        return not is_ip_blocked(ip)
    except ValueError:
        return False


def is_safe_url(url: str, *, allow_localhost: bool = False) -> bool:
    """Return True if the URL is safe to fetch (does not target private/internal destinations)."""
    try:
        validate_url_for_ssrf(url, allow_localhost=allow_localhost)
        return True
    except (SSRFSecurityError, ValueError):
        return False


def validate_url_for_ssrf(url: str, *, allow_localhost: bool = False) -> str:
    """
    Validate that a given URL is safe to fetch from the server.
    
    Raises SSRFSecurityError if:
    - URL scheme is not http or https
    - URL has no hostname or contains credentials
    - Hostname is a known cloud metadata identifier
    - Hostname resolves to any private, loopback, or cloud-metadata IP
    """
    if not url or not isinstance(url, str):
        raise SSRFSecurityError("URL must be a non-empty string.")

    url = url.strip()
    try:
        parsed = urlparse(url)
    except Exception as exc:
        raise SSRFSecurityError(f"Malformed URL: {exc}") from exc

    scheme = (parsed.scheme or "").lower()
    if scheme not in ALLOWED_SCHEMES:
        raise SSRFSecurityError(f"Unsupported scheme '{scheme}'. Only HTTP and HTTPS are permitted.")

    if not parsed.hostname:
        raise SSRFSecurityError("URL must contain a valid hostname.")

    if parsed.username or parsed.password:
        raise SSRFSecurityError("Embedded credentials in URL are prohibited.")

    hostname = parsed.hostname.lower().strip(".")

    if hostname in _BLOCKED_HOSTNAMES and not allow_localhost:
        raise SSRFSecurityError(f"Access to '{hostname}' is blocked by SSRF policy.")

    # 1. Check if hostname is an IP literal
    try:
        ip = ipaddress.ip_address(hostname)
        if not allow_localhost and is_ip_blocked(ip):
            raise SSRFSecurityError(f"Access to IP address '{ip}' is blocked by SSRF policy.")
        return url
    except ValueError:
        pass  # Hostname is a domain name, proceed to DNS resolution

    # 2. Resolve DNS and inspect every returned address
    try:
        addr_info = socket.getaddrinfo(hostname, None, proto=socket.IPPROTO_TCP)
        for _, _, _, _, sockaddr in addr_info:
            ip_str = sockaddr[0]
            try:
                ip = ipaddress.ip_address(ip_str)
                if not allow_localhost and is_ip_blocked(ip):
                    raise SSRFSecurityError(
                        f"Domain '{hostname}' resolves to blocked internal IP '{ip}'."
                    )
            except ValueError:
                continue
    except socket.gaierror as exc:
        raise SSRFSecurityError(f"Failed to resolve hostname '{hostname}': {exc}") from exc

    return url
