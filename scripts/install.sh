#!/usr/bin/env sh
# Install `skills` CLI binary from GitHub Releases.
#
# One-liner (after you publish release assets — see "Release assets" below):
#   curl -fsSL https://raw.githubusercontent.com/OWNER/REPO/main/scripts/install.sh | sh
#
# Or with an explicit version tag:
#   curl -fsSL .../install.sh | SKILLS_VERSION=v1.4.13 sh
#
# Environment:
#   SKILLS_GITHUB_REPO   owner/repo (default: listenbehind/skills)
#   SKILLS_VERSION       tag like v1.4.13, or "latest" (default: latest)
#   SKILLS_INSTALL_DIR   install directory (default: $HOME/.local/bin)
#   GITHUB_TOKEN         optional; raises GitHub API rate limits for "latest"
#
# Release asset names this script downloads (must exist on the GitHub Release):
#   skills-linux-amd64 / skills-linux-arm64
#   skills-darwin-amd64 / skills-darwin-arm64
#   skills-windows-amd64.exe / skills-windows-arm64.exe
#
# listenbehind/skills CI (.github/workflows/release-sea.yml) currently publishes only:
#   skills-linux-amd64, skills-darwin-arm64, skills-windows-amd64.exe
# On Linux ARM or Intel Mac, install via npm or add those targets back to the workflow.

set -eu

REPO="${SKILLS_GITHUB_REPO:-listenbehind/skills}"
VERSION="${SKILLS_VERSION:-latest}"
INSTALL_DIR="${SKILLS_INSTALL_DIR:-$HOME/.local/bin}"

die() {
  printf '%s\n' "$*" >&2
  exit 1
}

api_curl() {
  url=$1
  if [ -n "${GITHUB_TOKEN:-}" ]; then
    curl -fsSL -H "Authorization: Bearer $GITHUB_TOKEN" -H "Accept: application/vnd.github+json" "$url"
  else
    curl -fsSL -H "Accept: application/vnd.github+json" "$url"
  fi
}

http_download() {
  url=$1
  out=$2
  if [ -n "${GITHUB_TOKEN:-}" ]; then
    curl -fL --proto '=https' --tlsv1.2 -H "Authorization: Bearer $GITHUB_TOKEN" -o "$out" "$url"
  else
    curl -fL --proto '=https' --tlsv1.2 -o "$out" "$url"
  fi
}

case "$(uname -s)" in
Linux) OS=linux ;;
Darwin) OS=darwin ;;
CYGWIN* | MINGW* | MSYS*)
  OS=windows
  ;;
*) die "Unsupported OS: $(uname -s)" ;;
esac

case "$(uname -m)" in
x86_64 | amd64) ARCH=amd64 ;;
arm64 | aarch64) ARCH=arm64 ;;
*) die "Unsupported architecture: $(uname -m)" ;;
esac

if [ "$VERSION" = "latest" ]; then
  json=$(api_curl "https://api.github.com/repos/${REPO}/releases/latest") || die "Failed to fetch latest release (rate limit? set GITHUB_TOKEN)"
  TAG=$(printf '%s' "$json" | tr -d '\n' | sed -n 's/.*"tag_name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -n1)
  [ -n "$TAG" ] || die "Could not parse tag_name from GitHub API response"
else
  TAG=$VERSION
fi

if [ "$OS" = "windows" ]; then
  ASSET="skills-windows-${ARCH}.exe"
  OUT_NAME="skills.exe"
else
  ASSET="skills-${OS}-${ARCH}"
  OUT_NAME="skills"
fi

URL="https://github.com/${REPO}/releases/download/${TAG}/${ASSET}"
TMP=$(mktemp)
trap 'rm -f "$TMP"' EXIT INT TERM

printf 'Installing skills from %s\n' "$URL"
http_download "$URL" "$TMP" || die "Download failed. Does release ${TAG} include ${ASSET}? See scripts/install.sh header."

mkdir -p "$INSTALL_DIR"
install_path="${INSTALL_DIR}/${OUT_NAME}"
mv "$TMP" "$install_path"
chmod +x "$install_path"
trap - EXIT INT TERM
rm -f "$TMP" 2>/dev/null || true

printf 'Installed: %s\n' "$install_path"
case ":${PATH:-}:" in
*:"$INSTALL_DIR":*) ;;
*)
  printf '\nAdd to PATH (pick one):\n'
  printf '  export PATH="%s:$PATH"\n' "$INSTALL_DIR"
  printf '  echo %s export PATH="%s:\$PATH" >> ~/.profile\n' '#' "$INSTALL_DIR"
  ;;
esac

printf 'Try: %s --help  (or %s with no args)\n' "$install_path" "$install_path"
