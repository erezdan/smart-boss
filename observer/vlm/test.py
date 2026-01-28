import ollama


def test_llm():
    """
    Simple test function for OCR and defect detection
    using a local LLaVA model via Ollama.
    """

    image_path = r"C:\Users\USER\Downloads\WhatsApp Image 2026-01-18 at 12.26.15.jpeg"

    prompt = (
        "You are acting as an AUDITOR, not an OCR engine and not a text reconstructor.\n"
        "Your task is to detect PROBLEMS and DEVIATIONS only.\n\n"

        "CRITICAL RULES:\n"
        "- Do NOT reconstruct or complete missing text.\n"
        "- Do NOT guess missing characters.\n"
        "- Do NOT generate a full final text.\n"
        "- NEVER replace missing data with inferred values.\n"
        "- If information is missing or unclear, report it as an ISSUE.\n\n"

        "CONTEXT:\n"
        "The input represents OCR results from an industrial OCR model (e.g., YOLO-based), "
        "detecting individual characters on a SodaStream CO2 cylinder.\n"
        "Each character has a position and confidence score.\n\n"

        "KNOWN CYLINDER TYPE:\n"
        "SodaStream CO2 cylinder\n\n"

        "EXPECTED STRUCTURE (GROUND TRUTH TEMPLATE):\n"
        "- Line 1: Serial number, exactly 8 digits\n"
        "- Line 2: Fixed text: 'CO2 PH250 BAR'\n"
        "- Line 3: Date in format YYYY/MM\n\n"

        "OCR INPUT:\n"
        "(Characters are already grouped by detected line and sorted by x-position)\n\n"

        "LINE 1 OCR:\n"
        "5(0.95), 0(0.94), 4(0.93), 2(0.92), 7(0.91), 9(0.90), 0(0.89)\n\n"

        "LINE 2 OCR:\n"
        "C(0.89), O(0.88), 2(0.87), P(0.85), H(0.84), 2(0.83), 5(0.82), 0(0.84), "
        "B(0.86), A(0.85), R(0.87)\n\n"

        "LINE 3 OCR:\n"
        "2(0.94), 0(0.93), 1(0.92), 9(0.91), /(0.95), 0(0.90), 8(0.89)\n\n"

        "TASK:\n"
        "Compare the OCR INPUT against the EXPECTED STRUCTURE.\n"
        "Identify ONLY problems, deviations, or risks.\n"
        "Examples of issues:\n"
        "- Missing characters\n"
        "- Extra characters\n"
        "- Confidence too low for reliable reading\n"
        "- Structural mismatch (wrong length, wrong format)\n"
        "- Ambiguous or partially detected characters\n\n"

        "DO NOT:\n"
        "- Output a corrected or completed text\n"
        "- Suggest what the missing characters might be\n\n"

        "OUTPUT FORMAT (exactly):\n\n"
        "ISSUE_REPORT:\n"
        "- Line: <line number>\n"
        "  Type: <Missing / LowConfidence / StructuralMismatch / ExtraCharacter>\n"
        "  Details: <short factual description>\n\n"
        "Repeat ISSUE_REPORT block for each detected issue.\n\n"

        "SUMMARY:\n"
        "- Total issues found: <number>\n"
        "- Overall readability: <Good / Borderline / Unreliable>\n"
    )

    #ollama.chat(
    #    model="gpt-oss:20b",
    #    messages=[{"role": "user", "content": "ping"}],
    #    keep_alive=-1
    #)

    response = ollama.chat(
        model="gpt-oss:20b", # llava:7b or gpt-oss:20b
        messages=[
            {
                "role": "user",
                "content": prompt,
                #"images": [image_path],
            }
        ],
    )

    print("===== MODEL RESPONSE =====")
    print(response["message"]["content"])
    print("==========================")

def test_vlm():
    """
    Visual inspection test for detecting defects on a SodaStream CO2 cylinder
    using a local VLM (LLaVA) via Ollama.
    """

    image_path = r"C:\Users\USER\Downloads\WhatsApp Image 2026-01-18 at 12.31.27.jpeg"

    prompt = (
        "You are acting as a VISUAL INSPECTION AUDITOR for industrial quality control.\n"
        "You are NOT an OCR engine and NOT a product classifier.\n\n"

        "CRITICAL RULES:\n"
        "- Do NOT assume the cylinder is valid unless clearly visible.\n"
        "- Do NOT ignore unclear or suspicious visual areas.\n"
        "- Do NOT guess hidden or occluded parts.\n"
        "- If something cannot be verified visually, report it as an ISSUE.\n\n"

        "CONTEXT:\n"
        "The image shows a SodaStream CO2 cylinder used in an automated exchange station.\n"
        "The cylinder has a printed or wrapped label (outer coating).\n"
        "Your task is to visually inspect the OUTER SURFACE ONLY.\n\n"

        "DEFECT TYPES TO LOOK FOR:\n"
        "- Torn, ripped, or peeling label\n"
        "- Scratches, dents, or deformation on the surface\n"
        "- Stains, discoloration, or burn marks\n"
        "- Wrinkles, bubbles, or misalignment of the wrap\n"
        "- Missing or partially missing label areas\n"
        "- Any foreign objects, stickers, or markings\n\n"

        "TASK:\n"
        "Analyze the image and identify ONLY visible defects or risks.\n"
        "Report factual visual observations only.\n\n"

        "DO NOT:\n"
        "- Suggest repairs or fixes\n"
        "- Guess how the defect occurred\n"
        "- State whether the cylinder is safe or unsafe\n\n"

        "OUTPUT FORMAT (exactly):\n\n"
        "DEFECT_REPORT:\n"
        "- Location: <approximate area on cylinder>\n"
        "  Type: <Scratch / Tear / Deformation / Stain / MissingLabel / Other>\n"
        "  Details: <short factual visual description>\n\n"
        "Repeat DEFECT_REPORT block for each detected defect.\n\n"

        "SUMMARY:\n"
        "- Total defects found: <number>\n"
        "- Overall surface condition: <Good / Borderline / Poor>\n"
    )

    # run the command ollana serve
    ollama.chat(
        model="llava:7b",
        messages=[{"role": "user", "content": "ping"}],
        keep_alive=-1
    )

    response = ollama.chat(
        model="llava:7b",
        messages=[
            {
                "role": "user",
                "content": prompt,
                "images": [image_path],
            }
        ],
    )

    print("===== MODEL RESPONSE =====")
    print(response["message"]["content"])
    print("==========================")