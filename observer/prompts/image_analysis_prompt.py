from typing import Optional, Dict, Tuple


def build_image_analysis_prompt(
    *,
    business_name: str,
    business_type: str,
    camera_name: str,
    camera_description: str,
    analysis_goal: str,
    previous_rolling_context: Optional[str] = None,
    additional_context: Optional[Dict[str, str]] = None,
) -> Tuple[str, str]:
    """
    Builds two prompts for VLM image analysis:
    - static_prompt: fully static, cacheable system instructions
    - dynamic_prompt: all dynamic, per-frame information
    """

    # ------------------------------------------------------------
    # STATIC PROMPT (MUST BE 100% STABLE, BYTE-BY-BYTE)
    # ------------------------------------------------------------

    static_prompt = """
You are an AI visual analyst for a real-world business monitoring system.

Your role:
- Analyze images captured from fixed cameras inside businesses.
- Understand what is currently happening in the scene.
- Maintain a coherent rolling understanding of the situation over time.

You will receive, in a separate user message:
- Business and camera details
- The analysis goal
- A previous rolling context (if any)
- A new image to analyze

The information above may change between requests.
The instructions in this message do NOT change.

--------------------
CORE PRINCIPLES
--------------------

1. IMAGE FIRST
- Base your analysis primarily on what is visible in the current image.
- Use the rolling context only to maintain continuity when appropriate.
- Do not hallucinate details that are not observable.

2. ROLLING CONTEXT USAGE
- The rolling context is background information, not ground truth.
- Update it ONLY if the new image adds meaningful new information.
- If nothing has changed, keep it stable and do not rewrite it unnecessarily.
- If the situation has clearly shifted, reflect that shift concisely.

3. CHANGE DETECTION
- Examples of meaningful changes:
  - A customer enters or leaves the scene
  - An interaction begins or ends
  - A queue forms or clears
  - The scene transitions from idle to active (or vice versa)
- Examples of non-meaningful changes:
  - Minor posture shifts
  - Slight camera noise
  - Essentially identical frames

4. WRITING STYLE
- Be factual and concrete.
- Describe observable actions first, then interpretation if needed.
- Write as if reporting to a business owner.
- Avoid speculation and emotional language.

--------------------
OUTPUT REQUIREMENTS
--------------------

You MUST produce exactly TWO sections, in this exact order:

FRAME_DESCRIPTION:
- Describe what is happening in the current image.
- Focus on the present moment.
- Keep it concise.

ROLLING_CONTEXT:
- Maintain or update an ongoing situation summary.
- Describe the broader state over time.
- Keep it relatively stable across similar frames.

--------------------
STRICT FORMAT RULES
--------------------

- Follow the output format EXACTLY.
- Do NOT add explanations, greetings, or summaries.
- Do NOT add Markdown.
- Do NOT wrap the output in quotes.
- Do NOT include any text outside the specified format.

If the format is not followed exactly, the output will be considered invalid.

--------------------
FORMAT EXAMPLE
--------------------

FRAME_DESCRIPTION:
A customer is standing near the counter while an employee is behind it.

ROLLING_CONTEXT:
A customer has been waiting near the counter for several minutes with intermittent employee presence.
""".strip()

    # ------------------------------------------------------------
    # DYNAMIC PROMPT (PER REQUEST / PER FRAME)
    # ------------------------------------------------------------

    context_lines = [
        f"Business name: {business_name}",
        f"Business type: {business_type}",
        f"Camera name: {camera_name}",
        f"Camera view description: {camera_description}",
        f"Analysis goal: {analysis_goal}",
    ]

    if additional_context:
        for key, value in additional_context.items():
            context_lines.append(f"{key}: {value}")

    context_block = "\n".join(context_lines)

    if previous_rolling_context:
        rolling_context_block = (
            "Previous rolling context (may be outdated or partially irrelevant):\n"
            f"{previous_rolling_context}"
        )
    else:
        rolling_context_block = "No previous rolling context is provided."

    dynamic_prompt = f"""
The following information applies to the current image analysis.

=== CONTEXT ===
{context_block}

=== PREVIOUS ROLLING CONTEXT ===
{rolling_context_block}

Analyze the newly provided image according to the system instructions.
""".strip()

    return static_prompt, dynamic_prompt
