#!/usr/bin/env bash
# usage: sign-apk.sh unsigned.apk signed.apk   (needs KS_PATH KS_PASS KEY_ALIAS KEY_PASS and ANDROID_HOME)
set -euo pipefail
IN="$1"; OUT="$2"
BT="$(ls -d "${ANDROID_HOME:?ANDROID_HOME is not set}"/build-tools/* | sort -V | tail -1)"
ALIGNED="$(mktemp -u).apk"
"$BT/zipalign" -p -f 4 "$IN" "$ALIGNED"
"$BT/apksigner" sign --ks "$KS_PATH" --ks-key-alias "$KEY_ALIAS" --ks-pass "pass:$KS_PASS" --key-pass "pass:$KEY_PASS" --out "$OUT" "$ALIGNED"
"$BT/apksigner" verify --print-certs "$OUT"
rm -f "$ALIGNED"
