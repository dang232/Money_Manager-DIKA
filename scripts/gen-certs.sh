#!/usr/bin/env bash
# ponytail: generate mTLS material for the gateway <-> user-service link.
# Idempotent — wipes infra/certs/* before regenerating.
# Works on git-bash (Windows) and Linux/macOS bash.
set -euo pipefail

# ponytail: prevent MSYS/git-bash from converting /CN=... into C:\CN=...
export MSYS_NO_PATHCONV=1

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
OUT_DIR="${REPO_ROOT}/infra/certs"

DAYS_CA=3650
DAYS_CERT=825
CN_CA="Money Manager Dev Root CA"
CN_SERVER="user-service"
CN_CLIENT="gateway"

echo "==> Generating mTLS certs into ${OUT_DIR}"
rm -rf "${OUT_DIR}"
mkdir -p "${OUT_DIR}"
cd "${OUT_DIR}"

# ─── CA ─────────────────────────────────────────────────────────────────────
openssl genrsa -out ca.key 4096 2>/dev/null
openssl req -x509 -new -nodes -key ca.key -sha256 -days "${DAYS_CA}" \
  -subj "/CN=${CN_CA}/O=Money Manager/C=VN" \
  -out ca.pem

# ─── Server cert (user-service) ────────────────────────────────────────────
openssl genrsa -out user-service.key 2048 2>/dev/null
openssl req -new -key user-service.key -out user-service.csr \
  -subj "/CN=${CN_SERVER}/O=Money Manager/C=VN"

cat > user-service.ext <<'EOF'
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = user-service
DNS.2 = localhost
IP.1  = 127.0.0.1
EOF

openssl x509 -req -in user-service.csr -CA ca.pem -CAkey ca.key -CAcreateserial \
  -out user-service.crt -days "${DAYS_CERT}" -sha256 \
  -extfile user-service.ext

# ─── Client cert (gateway) ─────────────────────────────────────────────────
openssl genrsa -out gateway.key 2048 2>/dev/null
openssl req -new -key gateway.key -out gateway.csr \
  -subj "/CN=${CN_CLIENT}/O=Money Manager/C=VN"

cat > gateway.ext <<'EOF'
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, keyEncipherment
extendedKeyUsage = clientAuth
EOF

openssl x509 -req -in gateway.csr -CA ca.pem -CAkey ca.key -CAcreateserial \
  -out gateway.crt -days "${DAYS_CERT}" -sha256 \
  -extfile gateway.ext

# ─── Cleanup temp files ────────────────────────────────────────────────────
rm -f user-service.csr user-service.ext gateway.csr gateway.ext ca.srl

chmod 600 *.key
chmod 644 *.pem *.crt

echo
echo "==> Done. Files:"
ls -1 "${OUT_DIR}"
echo
echo "Next: docker compose down && docker compose up --build"