from typing import Optional, Dict


def build_image_analysis_prompt(
    *,
    business_name: str,
    business_type: str,
    camera_name: str,
    camera_description: str,
    analysis_goal: str,
    previous_state: Optional[str] = None,
    additional_context: Optional[Dict[str, str]] = None,
) -> str:
    """
    Builds a structured prompt for VLM image analysis.

    The model is instructed to:
    1. Understand the business and camera context
    2. Analyze the new image
    3. Consider previous state only if relevant
    4. Return two outputs:
       - Rich natural language description (LLM-style)
       - Short, technical, CLIP-oriented description
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

    previous_state_block = (
        f"\nPrevious observed state (may be outdated or irrelevant):\n{previous_state}"
        if previous_state
        else "\nNo previous state is provided."
    )

    prompt = f"""
You are an AI visual analyst for a real-world business monitoring system.

Your task is to analyze a newly captured image from a fixed camera inside a business.
The goal is to understand what is happening in the scene in a way that helps the business owner
identify meaningful changes, events, or anomalies.

=== BUSINESS & CAMERA CONTEXT ===
{context_block}

=== PREVIOUS STATE ===
{previous_state_block}

Important instructions:
- The previous state is provided only for context. Use it only if it is clearly relevant.
- Do NOT assume continuity if the image suggests a different situation.
- Focus on observable facts first, then interpretation.

=== IMAGE ANALYSIS TASK ===

Analyze the image and produce TWO outputs:

1. RICH_DESCRIPTION (LLM style):
   - A clear, natural language description of what is happening in the image.
   - Include people, actions, interactions, objects, and general atmosphere if relevant.
   - This text may be several sentences long.
   - Write as if explaining to a business owner.

2. CLIP_DESCRIPTION (CLIP-oriented style):
   - A short, technical, objective description.
   - Focus on visible elements only.
   - Use concise noun-phrase style.
   - Avoid full sentences if possible.
   - Avoid opinions or business interpretation.

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

RICH_DESCRIPTION:
<text here>

CLIP_DESCRIPTION:
<text here>

=== FORMAT EXAMPLE ===

RICH_DESCRIPTION:
Two customers are standing near the counter while one employee is handling items behind it.

CLIP_DESCRIPTION:
two people near counter, employee behind counter, shelves in background

"""

    return prompt.strip()