# Builds the FfmpegLayer Lambda layer. Invoked automatically by `sam build`.
#
# Downloads the current static FFmpeg release build for Linux arm64 from
# https://johnvansickle.com/ffmpeg/ and places the ffmpeg and ffprobe binaries
# in bin/, so they are available to the function at /opt/bin/ffmpeg and
# /opt/bin/ffprobe.
#
# Requires curl, tar (with xz support) and md5sum or md5.

FFMPEG_URL ?= https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-arm64-static.tar.xz
WORK_DIR := $(shell mktemp -d)

# Use md5sum (Linux) if available, otherwise md5 (macOS)
MD5 := $(shell command -v md5sum >/dev/null 2>&1 && echo "md5sum" || echo "md5 -q")

build-FfmpegLayer:
	curl -fsSL -o "$(WORK_DIR)/ffmpeg.tar.xz" "$(FFMPEG_URL)"
	curl -fsSL -o "$(WORK_DIR)/ffmpeg.tar.xz.md5" "$(FFMPEG_URL).md5"
	# Verify the download against the published checksum
	test "$$($(MD5) "$(WORK_DIR)/ffmpeg.tar.xz" | cut -d ' ' -f 1)" = "$$(cut -d ' ' -f 1 "$(WORK_DIR)/ffmpeg.tar.xz.md5")"
	mkdir -p "$(WORK_DIR)/ffmpeg" "$(ARTIFACTS_DIR)/bin"
	tar -xJf "$(WORK_DIR)/ffmpeg.tar.xz" -C "$(WORK_DIR)/ffmpeg" --strip-components=1
	cp "$(WORK_DIR)/ffmpeg/ffmpeg" "$(WORK_DIR)/ffmpeg/ffprobe" "$(ARTIFACTS_DIR)/bin/"
	chmod 755 "$(ARTIFACTS_DIR)/bin/ffmpeg" "$(ARTIFACTS_DIR)/bin/ffprobe"
	rm -rf "$(WORK_DIR)"
