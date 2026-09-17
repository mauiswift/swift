# certs/

This directory contains CA certificates required by xend's payment integrations.

The certificate is an integration asset, not an application secret. Validate its
expiration and provider requirements before deploying a new environment.

## smartproxy.org.pem.crt

| Field       | Value                        |
|-------------|------------------------------|
| **Subject** | `CN=smartproxy.org http`     |
| **Issued**  | 2025-05-15                   |
| **Expires** | 2035-05-13                   |
| **Purpose** | Trust anchor for HTTPS connections routed through the SmartProxy infrastructure (required for Alipay integration) |

### Usage

Reference this file wherever your code makes outbound HTTPS requests to Alipay endpoints via SmartProxy.

**Python (`httpx` or `requests`):**
```python
import httpx
response = httpx.get("https://api-mock.alipay.com/...", verify="certs/smartproxy.org.pem.crt")

import requests
response = requests.get("https://api-mock.alipay.com/...", verify="certs/smartproxy.org.pem.crt")
```

**Node.js:**
```
NODE_EXTRA_CA_CERTS=certs/smartproxy.org.pem.crt
```

**Docker / system trust store:**
```dockerfile
COPY certs/smartproxy.org.pem.crt /usr/local/share/ca-certificates/smartproxy.org.crt
RUN update-ca-certificates
```

### Renewal

The certificate expires on **2035-05-13**. Before that date, obtain a new certificate from SmartProxy and replace this file, then redeploy the application.
