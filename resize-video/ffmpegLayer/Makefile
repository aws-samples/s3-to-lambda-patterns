# Builds the FfmpegLayer Lambda layer. Invoked automatically by `sam build`.
#
# Downloads a pinned static FFmpeg release build for Linux arm64 from
# https://johnvansickle.com/ffmpeg/, verifies it against a known SHA-256, and
# places the ffmpeg and ffprobe binaries in bin/, so they are available to the
# function at /opt/bin/ffmpeg and /opt/bin/ffprobe.
#
# To upgrade, change FFMPEG_VERSION and FFMPEG_SHA256 together.
#
# Requires curl, tar (with xz support) and sha256sum or shasum.

FFMPEG_VERSION ?= 7.0.2
FFMPEG_SHA256 ?= f4149bb2b0784e30e99bdda85471c9b5930d3402014e934a5098b41d0f7201b1
FFMPEG_FILE := ffmpeg-$(FFMPEG_VERSION)-arm64-static.tar.xz
# Current releases live under releases/ and move to old-releases/ when superseded
FFMPEG_URLS := https://johnvansickle.com/ffmpeg/releases/$(FFMPEG_FILE) https://johnvansickle.com/ffmpeg/old-releases/$(FFMPEG_FILE)

# Use sha256sum (Linux) if available, otherwise shasum (macOS)
SHA256 := $(shell command -v sha256sum >/dev/null 2>&1 && echo "sha256sum" || echo "shasum -a 256")

build-FfmpegLayer:
	set -e; \
	WORK_DIR=$$(mktemp -d); trap 'rm -rf "$$WORK_DIR"' EXIT; \
	for url in $(FFMPEG_URLS); do curl -fsSL -o "$$WORK_DIR/ffmpeg.tar.xz" "$$url" && break; done; \
	test -s "$$WORK_DIR/ffmpeg.tar.xz" || { echo "Failed to download $(FFMPEG_FILE)" >&2; exit 1; }; \
	ACTUAL=$$($(SHA256) "$$WORK_DIR/ffmpeg.tar.xz" | cut -d ' ' -f 1); \
	test "$$ACTUAL" = "$(FFMPEG_SHA256)" || { echo "SHA-256 mismatch for $(FFMPEG_FILE): got $$ACTUAL" >&2; exit 1; }; \
	mkdir -p "$$WORK_DIR/ffmpeg" "$(ARTIFACTS_DIR)/bin"; \
	tar -xJf "$$WORK_DIR/ffmpeg.tar.xz" -C "$$WORK_DIR/ffmpeg" --strip-components=1; \
	cp "$$WORK_DIR/ffmpeg/ffmpeg" "$$WORK_DIR/ffmpeg/ffprobe" "$(ARTIFACTS_DIR)/bin/"; \
	chmod 755 "$(ARTIFACTS_DIR)/bin/ffmpeg" "$(ARTIFACTS_DIR)/bin/ffprobe"
