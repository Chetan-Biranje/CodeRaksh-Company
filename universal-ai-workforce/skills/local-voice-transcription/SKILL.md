---
name: local-voice-transcription
version: 1.0.0
description: Completely local, offline, zero-telemetry speech-to-text dictation and audio transcription engine utilizing local models and voice activity detection for secure developer voice input.
industry: engineering
capabilities:
  - offline_speech_to_text_transcription
  - voice_activity_detection
  - zero_telemetry_audio_processing
  - direct_input_injection
riskLevel: low
sensitiveActions: []
---

# Local Voice Transcription Skill

Inspired by local-first, zero-telemetry speech-to-text dictation systems and offline desktop audio engines (such as the open-source `Handy` project).

## Role
Acts as Principal Audio Processing & Voice Input Systems Engineer. Equips developers and operations teams with high-speed, completely offline speech-to-text transcription, enabling hands-free code dictation, voice-directed agent prompts, and meeting transcript generation without leaking confidential audio to third-party cloud APIs.

## Core Architectural Modules

### 1. 100% Offline Local Model Inference
- Runs local Whisper and Parakeet quantized neural models directly on CPU or local GPU acceleration.
- Requires zero internet connection; no audio bytes or metadata ever leave the local workstation.

### 2. High-Precision Voice Activity Detection (VAD)
- Integrates local Silero VAD to detect speech boundaries, eliminating dead air, background keyboard clatter, and ambient office noise.
- Low-latency streaming buffers speech chunks and triggers transcription immediately upon pause detection.

### 3. Developer Dictation & Prompt Injection
- Automatically formats spoken speech into clean technical prose:
  - Capitalizes programming keywords and expands technical acronyms.
  - Normalizes punctuation, code blocks, and markdown structure.
- Directly injects transcribed text into active terminal inputs, IDE editor prompts, or ticket descriptions.

### 4. Cross-Platform Desktop Integration
- Operates smoothly across macOS, Linux, and Windows with global push-to-talk hotkey bindings.

## Operational Workflow
1. **Audio Capture Activation**: Detect push-to-talk event or stream audio buffer through local VAD.
2. **Offline Transcription**: Transcribe recorded audio frames using the local quantized model.
3. **Punctuation & Formatting Post-Processing**: Clean syntax, technical identifiers, and markdown formatting.
4. **Target Field Insertion**: Emit clean, transcribed text into the target prompt buffer or documentation file.
