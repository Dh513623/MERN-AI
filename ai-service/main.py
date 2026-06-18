
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import Response
from faster_whisper import WhisperModel

import tempfile
import os
import numpy as np

from g2p_en import G2p
from rapidfuzz import fuzz
from difflib import SequenceMatcher

import nltk

for pkg in ["punkt", "wordnet", "averaged_perceptron_tagger_eng"]:
    try:
        nltk.data.find(pkg)
    except LookupError:
        nltk.download(pkg)

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
# Preload Whisper at startup (NOT lazily on first request)
# ----------------------------------

model = None


@app.on_event("startup")
async def load_model_on_startup():
    """
    Loads the model once when the container/process boots.
    This means the cold-start cost happens at deploy time,
    not on a user's first request after the service wakes up.
    """
    global model

    print("Loading Faster Whisper Tiny...")

    model = WhisperModel(
        "tiny",
        device="cpu",
        compute_type="int8"
    )

    print("Model loaded. Warming up with a dummy inference...")

    try:
        # Run one fake transcription so all internal buffers/kernels
        # are initialized before the first real user request arrives.
        dummy_audio = np.zeros(16000, dtype=np.float32)  # 1 second of silence
        list(model.transcribe(dummy_audio, beam_size=1)[0])
        print("Warmup complete. Model ready.")
    except Exception as e:
        # Warmup failing shouldn't crash the app - real requests will
        # still trigger lazy init inside faster-whisper if needed.
        print("Warmup skipped/failed (non-fatal):", str(e))


def get_model():
    global model

    if model is None:
        # Fallback safety net in case startup event hasn't finished yet
        # or was skipped (e.g. --reload edge cases in dev).
        print("Model not ready yet, loading now...")
        model = WhisperModel(
            "tiny",
            device="cpu",
            compute_type="int8"
        )

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

        whisper_model = get_model()

        segments, info = whisper_model.transcribe(
            temp_path,
            beam_size=1,
            vad_filter=True,                 # skip silence -> faster on short clips
            condition_on_previous_text=False  # avoids extra context overhead
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
