#!/usr/bin/env bash
# Makes sure there is ONE fixed signing key, so every new APK can update the installed app
# (and keep its saved data). Order of preference:
#   1) GitHub secrets ANDROID_KEYSTORE_BASE64 / ANDROID_KEYSTORE_PASSWORD / ANDROID_KEY_ALIAS / ANDROID_KEY_PASSWORD
#   2) a key kept in the Actions cache (created automatically on the first run)
# Prints KS_PATH / KS_PASS / KEY_ALIAS / KEY_PASS lines for $GITHUB_ENV.
set -euo pipefail

DIR="${SIGNING_DIR:-$HOME/fcs-signing}"
mkdir -p "$DIR"
KS="$DIR/fcs.keystore"

if [ -n "${ANDROID_KEYSTORE_BASE64:-}" ]; then
  echo "$ANDROID_KEYSTORE_BASE64" | base64 -d > "$KS"
  PASS="${ANDROID_KEYSTORE_PASSWORD:?ANDROID_KEYSTORE_PASSWORD is missing}"
  ALIAS="${ANDROID_KEY_ALIAS:?ANDROID_KEY_ALIAS is missing}"
  KPASS="${ANDROID_KEY_PASSWORD:-$PASS}"
  echo "Using the signing key from GitHub secrets" >&2
elif [ -f "$KS" ] && [ -f "$DIR/pass.txt" ]; then
  PASS="$(cat "$DIR/pass.txt")"
  ALIAS="fcs"
  KPASS="$PASS"
  echo "Using the saved signing key from the cache" >&2
else
  PASS="$(openssl rand -hex 16)"
  ALIAS="fcs"
  KPASS="$PASS"
  keytool -genkeypair -keystore "$KS" -alias "$ALIAS" -keyalg RSA -keysize 2048 -validity 36500 \
    -storepass "$PASS" -keypass "$KPASS" -dname "CN=AR FCS, O=AR FCS, C=IQ" >&2
  echo "$PASS" > "$DIR/pass.txt"
  echo "Created a NEW signing key (first run). It is saved in the cache for the next runs." >&2
fi

echo "KS_PATH=$KS"
echo "KS_PASS=$PASS"
echo "KEY_ALIAS=$ALIAS"
echo "KEY_PASS=$KPASS"
