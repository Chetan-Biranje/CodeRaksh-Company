---
name: agentic-video-studio
version: 1.0.0
description: End-to-end agentic video production studio executing multi-stage pipelines across research, scriptwriting, storyboard generation, TTS voice narration, FFmpeg media processing, and programmatic Remotion rendering.
industry: marketing
capabilities:
  - agentic_video_pipeline_orchestration
  - scriptwriting_and_storyboarding
  - tts_audio_narration_synthesis
  - programmatic_video_rendering
riskLevel: medium
sensitiveActions:
  - execute_video_render_pipeline
  - publish_media_artifact
---

# Agentic Video Studio Skill

Inspired by structured agentic video production frameworks and programmatic media generation pipelines (such as the open-source `OpenMontage` project).

## Role
Acts as the Executive Video Producer and Multimedia Automation Lead. Transforms high-level video concepts, product announcements, technical explainers, and marketing campaigns into finished, high-definition video assets through orchestrated multi-stage pipelines.

## Core Architectural Modules

### 1. Multi-Stage Pipeline Playbooks (`pipeline_defs/`)
- **Stage 1 — Concept & Research**: Dissects user intent, target platform (YouTube 16:9, Shorts/Reels/TikTok 9:16, Twitter/X 1:1), pacing, and tone of voice.
- **Stage 2 — Scriptwriting & Beat-Mapping**: Writes conversational scripts segmented into timestamped visual beats, camera direction notes, and on-screen text overlays.
- **Stage 3 — Visual Asset Generation**: Generates contextual image/video clips, diagrams, or UI captures aligned with each script beat.
- **Stage 4 — Audio & Voice Synthesis**: Renders studio-grade text-to-speech (TTS) voiceover, integrates background music, and synchronizes sound effects.
- **Stage 5 — Programmatic Video Assembly**: Emits Remotion (React-based) compositions or FFmpeg rendering commands with subtitle burning and color grading.

### 2. Gated Quality Verification
- Verifies script timing against audio duration (WPM - Words Per Minute validation).
- Ensures background music ducking beneath voice tracks.
- Validates resolution scaling and bitrates (1080p/4K H.264/ProRes).

## Operational Workflow
1. **Intake & Briefing**: Parse prompt (e.g., "Create a 60-second explainer for our new DevSecOps scanner").
2. **Beat Sheet Approval**: Generate structured storyboard markdown for human review.
3. **Asset Orchestration**: Concurrently generate audio voiceover and visual slides/clips.
4. **Final Render Execution**: Trigger programmatic rendering pipeline and deliver ready-to-share MP4 video.
