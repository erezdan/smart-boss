from typing import Optional, Dict


def build_image_analysis_prompt(
    *,
    business_name: str,
    business_type: str,
    camera_name: str,
    camera_description: str,
    analysis_goal: str,
    previous_rolling_context: Optional[str] = None,
    additional_context: Optional[Dict[str, str]] = None,
) -> str:
    """
    Builds a structured prompt for VLM image analysis.

    The model is instructed to:
    1. Understand the business and camera context
    2. Analyze the new image
    3. Use the previous rolling context only if relevant
    4. Return two outputs:
       - frame_description: what is happening now
       - rolling_context: updated ongoing situation summary
    """

    context_lines = []

    context_lines.append(f"Business name: {business_name}")
    context_lines.append(f"Business type: {business_type}")
    context_lines.append(f"Camera name: {camera_name}")
    context_lines.append(f"Camera view description: {camera_description}")
    context_lines.append(f"Analysis goal: {analysis_goal}")

    if additional_context:
        for key, value in additional_context.items():
            context_lines.append(f"{key}: {value}")

    context_block = "\n".join(context_lines)

    previous_context_block = (
        f"\nPrevious rolling context (may be outdated or partially irrelevant):\n{previous_rolling_context}"
        if previous_rolling_context
        else "\nNo previous rolling context is provided."
    )

    prompt = f"""
You are an AI visual analyst for a real-world business monitoring system.

Your task is to analyze a newly captured image from a fixed camera inside a business.
The goal is to understand what is happening in the scene and to maintain a coherent
ongoing understanding of the situation over time.

=== BUSINESS & CAMERA CONTEXT ===
{context_block}

=== PREVIOUS ROLLING CONTEXT ===
{previous_context_block}

Important instructions:
- The previous rolling context is provided only as background information.
- Update it only if the new image provides meaningful new information.
- Do NOT repeat the entire context if nothing has changed.
- If the scene has clearly shifted, reflect that change in the updated context.
- Focus on observable facts first, then interpretation.

=== IMAGE ANALYSIS TASK ===

Analyze the image and produce TWO outputs:

1. FRAME_DESCRIPTION:
   - Describe what is happening in the current image.
   - You may rely on the rolling context for continuity if relevant.
   - Keep it concise and factual.
   - Write as if reporting the current state to a business owner.

2. ROLLING_CONTEXT:
   - Maintain or update an ongoing situation summary.
   - This should describe the broader state over time, not just this frame.
   - Update only what has changed or become clearer.
   - Keep it relatively stable across similar frames.

=== CRITICAL SYSTEM INSTRUCTION ===

You are generating output for an automated system.
Your response will be parsed by code.

You MUST follow the output format exactly.
Do NOT add explanations, greetings, summaries, or any text outside the specified format.
Do NOT wrap the output in quotes.
Do NOT add Markdown.
If the format is not followed exactly, the response will be considered invalid.

=== OUTPUT FORMAT (MANDATORY) ===

Return the result EXACTLY in the following format, with no additional text before or after:

FRAME_DESCRIPTION:
<text here>

ROLLING_CONTEXT:
<text here>

=== FORMAT EXAMPLE ===

FRAME_DESCRIPTION:
The customer is still standing near the counter while the employee is behind it.

ROLLING_CONTEXT:
A customer has been waiting near the counter for several minutes with intermittent employee presence.
"""

    return prompt.strip()
