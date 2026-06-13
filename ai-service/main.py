# uvicorn main:app --reload --port 8000
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import Response
import whisper
import tempfile
import librosa
import numpy as np
from g2p_en import G2p
from rapidfuzz import fuzz
from difflib import SequenceMatcher


app = FastAPI()


@app.get("/favicon.ico")
async def favicon():
    return Response(status_code=204)


@app.get("/")
async def root():
    return {"message": "AI service is running. Use POST /analyze to submit audio."}


@app.get("/.well-known/appspecific/com.chrome.devtools.json")
async def chrome_devtools_probe():
    return Response(status_code=204)

# ✅ Load Whisper model
model = whisper.load_model("tiny")

g2p = G2p()

def text_to_phonemes(text):
    phonemes = g2p(text)
    
    return " ".join(phonemes)



# 🔥 Compare phonemes (advanced)
def compare_phonemes(expected_list, spoken_list):
    matcher = SequenceMatcher(None, expected_list, spoken_list)
    result = []

    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        for i in range(max(i2 - i1, j2 - j1)):
            exp = expected_list[i1 + i] if i1 + i < i2 else ""
            spo = spoken_list[j1 + i] if j1 + i < j2 else ""

            status = "correct" if tag == "equal" else "wrong"

            result.append({
                "expected": exp,
                "spoken": spo,
                "status": status
            })

    return result


@app.post("/analyze")
async def analyze(
    audio: UploadFile = File(...),
    sentence: str = Form(...)
):

    # Save audio file
    with tempfile.NamedTemporaryFile(delete=False) as temp:
        temp.write(await audio.read())
        temp_path = temp.name

    try:

        print("TEMP FILE:", temp_path)
        print("ORIGINAL FILE:", audio.filename)

        # Load audio
        audio_data, sr = librosa.load(temp_path, sr=16000)

        print("LIBROSA SUCCESS")

        audio_np = np.array(audio_data)

        result = model.transcribe(audio_np)

        print("WHISPER SUCCESS")

        spoken_text = result["text"].strip()

    except Exception as e:

        print("========== ERROR ==========")
        print("TYPE:", type(e))
        print("MESSAGE:", e)
        print("==========================")

        raise e

    # Convert to phonemes
    expected_phoneme = text_to_phonemes(sentence.lower())
    spoken_phoneme = text_to_phonemes(spoken_text.lower())

    # Split phonemes
    expected_list = expected_phoneme.split()
    spoken_list = spoken_phoneme.split()

    # Compare phonemes
    phoneme_comparison = compare_phonemes(
        expected_list,
        spoken_list
    )

    # Score calculation
    similarity = fuzz.ratio(
        expected_phoneme,
        spoken_phoneme
    )

    score = round(similarity / 10)

    strengths = []
    weaknesses = []

    if score >= 8:
        strengths.append("Excellent pronunciation")

    elif score >= 5:
        strengths.append("Good attempt")
        weaknesses.append("Some pronunciation errors")

    else:
        weaknesses.append("Needs improvement in pronunciation")

    return {
        "text": spoken_text,
        "score": score,
        "expected_phoneme": expected_phoneme,
        "spoken_phoneme": spoken_phoneme,
        "phoneme_comparison": phoneme_comparison,
        "strengths": strengths,
        "weaknesses": weaknesses
    }
