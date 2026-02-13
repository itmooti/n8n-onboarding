#!/usr/bin/env python3
"""
Generate onboarding videos using Google Veo 3.1 API.

Usage:
    export GEMINI_API_KEY="your-key-here"
    python scripts/generate_videos.py [--video STEP_NUM] [--all]

Videos are saved to public/videos/
Each video costs ~$6 (8 seconds at $0.75/sec).
Total cost for all 7 Veo 3 videos: ~$42

Requirements:
    pip install google-genai
"""

import os
import sys
import time
import argparse
from pathlib import Path

# Awesomate brand colors (correct)
NAVY = "#0f1128"
RED = "#e9484d"
ORANGE = "#ef9563"
BLUE = "#1e63e9"

VIDEO_PROMPTS = {
    1: {
        "filename": "step01-welcome.mp4",
        "title": "Welcome to Awesomate",
        "prompt": (
            "Create a welcoming tech SaaS onboarding video. Show a friendly, professional presenter "
            "(mid-30s, casual business attire) standing in a modern, clean office environment with subtle "
            "tech elements — screens showing workflow diagrams and automation pipelines in the background. "
            "They speak directly to camera with energy and warmth, gesturing naturally. The tone is confident "
            "and approachable: 'We've got this, let's make this easy.' Warm lighting, shallow depth of field, "
            f"brand colour palette is dark navy ({NAVY}) and red-orange gradient ({RED} to {ORANGE}). "
            "End with a subtle animated logo reveal — a gradient square with the letter 'A' in white."
        ),
    },
    3: {
        "filename": "step03-subdomain.mp4",
        "title": "Your Workspace URL",
        "prompt": (
            "Create a clean screen-recording style video showing a browser address bar. A URL is being typed: "
            "'yourname.awesomate.io' with the subdomain portion highlighted and glowing in a red-to-orange "
            f"gradient ({RED} to {ORANGE}). Show a subtle animation of the slug changing between different "
            "names (like 'acme', 'smith-co', 'brightideas'), each time the slug portion pulses with a "
            f"gradient glow. Clean, modern UI aesthetic. Dark background ({NAVY}), browser chrome visible. "
            "Minimalist motion graphics, no text overlays besides the URL. Smooth, satisfying transitions."
        ),
    },
    4: {
        "filename": "step04-tech-level.mp4",
        "title": "Your Comfort Level",
        "prompt": (
            "Create a split-screen metaphor video. On the left side, a confident developer types code on a "
            "terminal with a dark theme — n8n workflow JSON visible on screen. On the right side, a relaxed "
            "business owner sits comfortably while automation workflows run on a large screen behind them, "
            "showing connected nodes processing data automatically. The two scenes merge in the middle with "
            f"a smooth gradient blend using brand colours ({RED} to {ORANGE}). The message is: whether "
            "you're hands-on or hands-off, we've got you covered. Modern, warm aesthetic. Subtle particle "
            f"effects in the transition zone. Dark navy ({NAVY}) tones throughout."
        ),
    },
    7: {
        "filename": "step07-credentials.mp4",
        "title": "Credential Setup",
        "prompt": (
            "Create a screen-recording style video showing an n8n-like credential setup interface — a dark-themed "
            "application UI. Show API keys being pasted into fields, OAuth popup windows appearing and being approved, "
            "green checkmarks confirming successful connections one after another (Google, Slack, Xero, HubSpot). "
            "Speed up the process to feel snappy and satisfying. Each successful connection triggers a subtle "
            f"celebration animation in brand gradient ({RED} to {ORANGE}). Clean modern aesthetic, dark UI theme "
            f"with {NAVY} backgrounds. Text overlay fades in: 'Get connected, the right way.'"
        ),
    },
    9: {
        "filename": "step09-ai-agents.mp4",
        "title": "AI Chat Agents",
        "prompt": (
            "Create a video showing a modern chat interface with an AI agent responding to customer questions in "
            "real-time. The chat bubbles appear smoothly — a customer types 'What are your opening hours?' and the "
            "AI responds instantly with helpful, accurate information. Then seamlessly show the AI handing off to "
            "a human agent for a more complex query. Split to show three chat windows side-by-side representing "
            "different use cases: customer support, sales enquiries, and internal team assistance. Modern, clean "
            f"design with {NAVY} dark UI. Chat bubbles have {RED}-to-{ORANGE} gradient accents. End with text: "
            "'Your AI team, ready on day one.'"
        ),
    },
    10: {
        "filename": "step10-workflow-setup.mp4",
        "title": "Workflow Templates",
        "prompt": (
            "Create a video showing an n8n-style workflow canvas where pre-built automation templates load in "
            "sequence. Show nodes connecting with smooth animated lines — an email trigger connects to a CRM "
            "update, which connects to a Slack notification. Then a second workflow appears: a form submission "
            "triggers an AI processing node which feeds into a spreadsheet. Workflows snap into place with "
            f"satisfying animations. Brand accent colours ({RED} to {ORANGE}) on the connection lines and node "
            f"highlights. Dark canvas background ({NAVY}). The feel is: professional templates, ready to go."
        ),
    },
    14: {
        "filename": "step14-business-profile.mp4",
        "title": "About Your Business",
        "prompt": (
            "Create a warm, professional video showing the concept of business profiling for automation. "
            "Show a abstract visualisation of business data flowing into a central profile — company details, "
            "team information, and operational data streams converge into a glowing central node. The data "
            "transforms into a clear, organised dashboard showing business insights. The tone is reassuring — "
            f"your information helps us build the right automations for you. Warm lighting, {NAVY} dark background "
            f"with {RED}-to-{ORANGE} gradient accents on data streams and highlights. Clean, modern aesthetic."
        ),
    },
}

# Explainer videos (generated with different approach — voiceover + motion graphics)
EXPLAINER_PROMPTS = {
    8: {
        "filename": "step08-openrouter.mp4",
        "title": "What is OpenRouter?",
        "prompt": (
            "Create an animated explainer video about OpenRouter for small business owners. "
            "Show the concept using a simple visual metaphor: a single golden key (glowing "
            f"with {RED}-to-{ORANGE} gradient) that unlocks multiple doors, each labelled with "
            "a different AI model name (ChatGPT, Claude, Gemini). Then show how this key connects "
            "to n8n workflow nodes, powering AI features. The animation style should be clean, "
            "modern 2D motion graphics — no characters, just icons, shapes, and flowing connections. "
            f"Dark background ({NAVY}), bright gradient accents. Simple and easy to understand."
        ),
    },
    11: {
        "filename": "step11-local-hosting.mp4",
        "title": "Data Sovereignty",
        "prompt": (
            "Create an animated explainer about data sovereignty and local hosting options. "
            "Show a visual metaphor: a secure server rack with an Australian flag beside it, "
            "representing local data hosting. Contrast with cloud servers floating above, "
            "connected by encrypted data streams. Both options show shield icons indicating "
            "security. The message: your data is secure either way, local hosting is an extra "
            f"option for regulated industries. Clean 2D motion graphics, dark {NAVY} background, "
            f"{RED}-to-{ORANGE} gradient accents. Reassuring, professional tone."
        ),
    },
}


def generate_video(step_num: int, output_dir: Path, api_key: str) -> bool:
    """Generate a single video using Veo 3.1 API."""
    try:
        from google import genai
        from google.genai import types
    except ImportError:
        print("Error: google-genai package not installed. Run: pip install google-genai")
        return False

    # Get prompt data
    prompt_data = VIDEO_PROMPTS.get(step_num) or EXPLAINER_PROMPTS.get(step_num)
    if not prompt_data:
        print(f"No prompt defined for step {step_num}")
        return False

    output_path = output_dir / prompt_data["filename"]
    if output_path.exists():
        print(f"  Skipping step {step_num} — {output_path.name} already exists")
        return True

    print(f"\n  Generating: {prompt_data['title']} (step {step_num})...")
    print(f"  Prompt: {prompt_data['prompt'][:100]}...")

    client = genai.Client(api_key=api_key)

    try:
        operation = client.models.generate_videos(
            model="veo-3.0-generate-001",
            prompt=prompt_data["prompt"],
            config=types.GenerateVideosConfig(
                aspect_ratio="16:9",
                resolution="720p",
            ),
        )

        # Poll for completion
        attempts = 0
        while not operation.done:
            attempts += 1
            if attempts > 60:  # 10 minutes max
                print(f"  Timeout waiting for step {step_num} video")
                return False
            print(f"  Waiting... ({attempts * 10}s)")
            time.sleep(10)
            operation = client.operations.get(operation)

        if not operation.response or not operation.response.generated_videos:
            print(f"  No video generated for step {step_num}")
            return False

        # Save the video
        generated_video = operation.response.generated_videos[0]
        client.files.download(file=generated_video.video)
        generated_video.video.save(str(output_path))
        print(f"  Saved: {output_path}")
        return True

    except Exception as e:
        print(f"  Error generating step {step_num}: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description="Generate onboarding videos with Veo 3")
    parser.add_argument("--video", type=int, help="Generate a specific step video")
    parser.add_argument("--all", action="store_true", help="Generate all videos")
    parser.add_argument("--explainers", action="store_true", help="Generate explainer videos only")
    parser.add_argument("--list", action="store_true", help="List all available video prompts")
    args = parser.parse_args()

    if args.list:
        print("\nVeo 3 Videos:")
        for step, data in sorted(VIDEO_PROMPTS.items()):
            print(f"  Step {step}: {data['title']} → {data['filename']}")
        print("\nExplainer Videos:")
        for step, data in sorted(EXPLAINER_PROMPTS.items()):
            print(f"  Step {step}: {data['title']} → {data['filename']}")
        print(f"\nTotal: {len(VIDEO_PROMPTS) + len(EXPLAINER_PROMPTS)} videos")
        return

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY environment variable not set")
        sys.exit(1)

    # Output directory
    output_dir = Path(__file__).parent.parent / "public" / "videos"
    output_dir.mkdir(parents=True, exist_ok=True)

    if args.video:
        success = generate_video(args.video, output_dir, api_key)
        sys.exit(0 if success else 1)

    if args.explainers:
        steps = sorted(EXPLAINER_PROMPTS.keys())
    elif args.all:
        steps = sorted(set(list(VIDEO_PROMPTS.keys()) + list(EXPLAINER_PROMPTS.keys())))
    else:
        parser.print_help()
        return

    print(f"Generating {len(steps)} videos...")
    print(f"Estimated cost: ~${len(steps) * 6} (8s at $0.75/sec each)")
    print(f"Output: {output_dir}\n")

    results = {}
    for step in steps:
        success = generate_video(step, output_dir, api_key)
        results[step] = success

    print("\n=== Results ===")
    for step, success in results.items():
        status = "OK" if success else "FAILED"
        data = VIDEO_PROMPTS.get(step) or EXPLAINER_PROMPTS.get(step, {})
        print(f"  Step {step} ({data.get('title', '?')}): {status}")

    failed = sum(1 for v in results.values() if not v)
    if failed:
        print(f"\n{failed} video(s) failed. Re-run with --video STEP to retry.")
        sys.exit(1)
    else:
        print("\nAll videos generated successfully!")


if __name__ == "__main__":
    main()
