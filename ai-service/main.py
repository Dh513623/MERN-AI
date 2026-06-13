
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import Response
from faster_whisper import WhisperModel

import tempfile
import os

from g2p_en import G2p
from rapidfuzz import fuzz
from difflib import SequenceMatcher

app = FastAPI()

# ----------------------------------
# Basic Routes
# ----------------------------------

@app.get("/")
async def root():
    return {
        "message": "AI service is running. Use POST /analyze"
    }


@app.get("/favicon.ico")
async def favicon():
    return Response(status_code=204)


@app.get("/.well-known/appspecific/com.chrome.devtools.json")
async def chrome_devtools_probe():
    return Response(status_code=204)


# ----------------------------------
# Lazy Load Whisper
# ----------------------------------

model = None


def get_model():
    global model

    if model is None:
        print("Loading Faster Whisper Tiny...")

        model = WhisperModel(
            "tiny",
            device="cpu",
            compute_type="int8"
        )

        print("Model Loaded Successfully")

    return model


# ----------------------------------
# G2P
# ----------------------------------

g2p = G2p()


def text_to_phonemes(text):
    return " ".join(g2p(text))


# ----------------------------------
# Compare Phonemes
# ----------------------------------

def compare_phonemes(expected_list, spoken_list):

    matcher = SequenceMatcher(
        None,
        expected_list,
        spoken_list
    )

    results = []

    for tag, i1, i2, j1, j2 in matcher.get_opcodes():

        for i in range(max(i2 - i1, j2 - j1)):

            exp = (
                expected_list[i1 + i]
                if i1 + i < i2
                else ""
            )

            spo = (
                spoken_list[j1 + i]
                if j1 + i < j2
                else ""
            )

            results.append({
                "expected": exp,
                "spoken": spo,
                "status": "correct" if tag == "equal" else "wrong"
            })

    return results


# ----------------------------------
# Analyze
# ----------------------------------

@app.post("/analyze")
async def analyze(
    audio: UploadFile = File(...),
    sentence: str = Form(...)
):

    temp_path = None

    try:

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=".webm"
        ) as temp:

            temp.write(await audio.read())
            temp_path = temp.name

        print("Audio Saved:", temp_path)

        model = get_model()

        segments, info = model.transcribe(
            temp_path,
            beam_size=1
        )

        spoken_text = " ".join(
            segment.text for segment in segments
        ).strip()

        print("Recognized:", spoken_text)

        expected_phoneme = text_to_phonemes(
            sentence.lower()
        )

        spoken_phoneme = text_to_phonemes(
            spoken_text.lower()
        )

        expected_list = expected_phoneme.split()
        spoken_list = spoken_phoneme.split()

        phoneme_comparison = compare_phonemes(
            expected_list,
            spoken_list
        )

        similarity = fuzz.ratio(
            expected_phoneme,
            spoken_phoneme
        )

        score = round(similarity / 10)

        strengths = []
        weaknesses = []

        if score >= 8:
            strengths.append(
                "Excellent pronunciation"
            )

        elif score >= 5:
            strengths.append(
                "Good attempt"
            )
            weaknesses.append(
                "Some pronunciation errors"
            )

        else:
            weaknesses.append(
                "Needs improvement in pronunciation"
            )

        return {
            "text": spoken_text,
            "score": score,
            "expected_phoneme": expected_phoneme,
            "spoken_phoneme": spoken_phoneme,
            "phoneme_comparison": phoneme_comparison,
            "strengths": strengths,
            "weaknesses": weaknesses
        }

    except Exception as e:

        print("ERROR:", str(e))

        return {
            "error": str(e)
        }

    finally:

        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
