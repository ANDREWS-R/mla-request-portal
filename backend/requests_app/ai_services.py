import os
import re
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

# Try to configure Gemini API
HAS_GEMINI = False
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
if GEMINI_API_KEY:
    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        HAS_GEMINI = True
        logger.info("Gemini API configured successfully.")
    except Exception as e:
        logger.error(f"Failed to configure Gemini API: {e}")

# Try to import speech recognition
HAS_SPEECH_REC = False
try:
    import speech_recognition as sr
    HAS_SPEECH_REC = True
except ImportError:
    logger.warning("speech_recognition not installed. Voice transcription will run in mock mode.")

# Import Google Translate
HAS_GOOGLE_TRANS = False
try:
    from googletrans import Translator
    translator = Translator()
    HAS_GOOGLE_TRANS = True
except ImportError:
    logger.warning("googletrans not installed. Translation will run in fallback mode.")


def transcribe_voice(voice_file_path):
    """
    Transcribes a voice recording file to text.
    If Gemini is configured, it can handle audio uploads directly.
    Otherwise, we use SpeechRecognition (for wav files) or fall back to a mock/simulated transcription.
    """
    if not voice_file_path or not os.path.exists(voice_file_path):
        return "No audio file provided."

    # Method 1: Use Gemini if available and file exists
    if HAS_GEMINI:
        try:
            import google.generativeai as genai
            logger.info(f"Transcribing audio file with Gemini: {voice_file_path}")
            
            # Upload file to Gemini File API
            audio_file = genai.upload_file(path=voice_file_path)
            model = genai.GenerativeModel("gemini-2.5-flash")
            
            response = model.generate_content([
                audio_file,
                "Please transcribe this voice message precisely. Respond only with the transcription text."
            ])
            
            # Clean up the file from Gemini
            try:
                genai.delete_file(audio_file.name)
            except Exception as df_err:
                logger.warning(f"Failed to delete uploaded file from Gemini: {df_err}")
                
            return response.text.strip()
        except Exception as e:
            logger.error(f"Gemini transcription failed, falling back: {e}")

    # Method 2: Use SpeechRecognition (free local/web API)
    if HAS_SPEECH_REC:
        try:
            # Note: speech_recognition requires WAV format. In production, we'd use pydub to convert ogg/mp3 to wav.
            # Let's write a quick check for WAV format or try to process it.
            r = sr.Recognizer()
            with sr.AudioFile(voice_file_path) as source:
                audio_data = r.record(source)
                text = r.recognize_google(audio_data)
                return text
        except Exception as e:
            logger.error(f"SpeechRecognition failed: {e}")

    # Method 3: Fallback/Mock mode if files are just for demo
    # We return a simulated transcription of typical MLA requests
    logger.info("Using mock voice transcription.")
    filename = os.path.basename(voice_file_path).lower()
    if 'water' in filename:
        return "I am calling from Aluva ward 4. There is no drinking water in our area for the last three days. Please help."
    elif 'road' in filename:
        return "Sir, the road near the temple is completely broken and full of potholes. There are many accidents happening. Please repair it immediately."
    elif 'electricity' in filename:
        return "The electricity transformer in our street was damaged yesterday and there is power outage. Please resolve it."
    
    return "This is a recorded voice message from a citizen regarding a constituency problem that needs attention."


def translate_text(text, target_lang='en'):
    """
    Translates request text to a common language (e.g., English or Malayalam).
    Returns (translated_text, source_language_code).
    """
    if not text:
        return "", "en"

    # Method 1: Use Gemini if available
    if HAS_GEMINI:
        try:
            import google.generativeai as genai
            model = genai.GenerativeModel("gemini-2.5-flash")
            prompt = f"Translate the following text to English. Respond only with the translated text. Original text:\n\n{text}"
            response = model.generate_content(prompt)
            # Detect language (simplified detection request)
            det_prompt = f"What is the ISO 2-letter language code of the following text? Respond only with the code (e.g., ml, en, hi):\n\n{text}"
            det_response = model.generate_content(det_prompt)
            return response.text.strip(), det_response.text.strip().lower()[:2]
        except Exception as e:
            logger.error(f"Gemini translation failed: {e}")

    # Method 2: Use googletrans (free Google Translate)
    if HAS_GOOGLE_TRANS:
        try:
            translation = translator.translate(text, dest=target_lang)
            return translation.text, translation.src
        except Exception as e:
            logger.error(f"googletrans translation failed: {e}")

    # Method 3: Simple mock translation (identifies Malayalam script and simulates translation)
    # Checks if text contains Malayalam characters (Unicode range 0D00 - 0D7F)
    contains_malayalam = any('\u0d00' <= char <= '\u0d7f' for char in text)
    if contains_malayalam:
        # Provide a simulated translation
        if "വെള്ളം" in text or "കുടിവെള്ളം" in text:
            return "Our area lacks clean drinking water. Please solve this issue.", "ml"
        elif "റോഡ്" in text:
            return "The road is severely damaged and needs reconstruction.", "ml"
        elif "കറന്റ്" in text or "വൈദ്യുതി" in text:
            return "Frequent power outages in our neighborhood are causing difficulties.", "ml"
        return "Translated Malayalam request: " + text, "ml"
        
    return text, "en"


def summarize_and_classify(text):
    """
    Generates an AI summary, urgency rating, constituency name, and problem category.
    Returns a dict with keys: 'summary', 'urgency', 'category', 'constituency'.
    """
    if not text:
        return {
            'summary': "Empty request description.",
            'urgency': "LOW",
            'category': "OTHER",
            'constituency': "Unknown"
        }

    # Method 1: Use Gemini if available
    if HAS_GEMINI:
        try:
            import google.generativeai as genai
            import json
            
            model = genai.GenerativeModel("gemini-2.5-flash")
            
            prompt = f"""
            Analyze this citizen request to an MLA and extract information.
            Return a JSON object with exactly the following keys:
            - "summary": A 1-2 sentence concise summary of the core issue.
            - "urgency": Either "LOW", "MEDIUM", or "HIGH".
            - "category": One of "ROADS", "WATER", "ELECTRICITY", "HEALTH", "EDUCATION", "FINANCIAL_AID", or "OTHER".
            - "constituency": The name of the place/ward/constituency mentioned (e.g. Aluva, Trivandrum), or null if not found.

            Request Text:
            "{text}"
            """
            
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            
            result = json.loads(response.text.strip())
            return {
                'summary': result.get('summary', text[:150] + '...'),
                'urgency': result.get('urgency', 'MEDIUM').upper(),
                'category': result.get('category', 'OTHER').upper(),
                'constituency': result.get('constituency', 'Unknown') or 'Unknown'
            }
        except Exception as e:
            logger.error(f"Gemini analysis failed: {e}")

    # Method 2: Rule-based heuristic analysis (very reliable out-of-the-box fallback)
    text_lower = text.lower()
    
    # 1. Classify Category
    category = 'OTHER'
    category_keywords = {
        'ROADS': ['road', 'pothole', 'street', 'bridge', 'highway', 'traffic', 'tarring', 'റോഡ്', 'പാലം'],
        'WATER': ['water', 'leak', 'pipe', 'drinking', 'sewer', 'drainage', 'well', 'വെള്ളം', 'കുടിവെള്ളം', 'പൈപ്പ്'],
        'ELECTRICITY': ['power', 'electricity', 'light', 'transformer', 'wire', 'blackout', 'voltage', 'കറന്റ്', 'വൈദ്യുതി'],
        'HEALTH': ['hospital', 'clinic', 'doctor', 'health', 'disease', 'medicine', 'sanitation', 'garbage', 'ആശുപത്രി'],
        'EDUCATION': ['school', 'college', 'teacher', 'education', 'student', 'class', 'സ്കൂൾ', 'വിദ്യാഭ്യാസം'],
        'FINANCIAL_AID': ['money', 'loan', 'pension', 'fund', 'grant', 'financial', 'aid', 'poor', 'പെൻഷൻ', 'ധനസഹായം'],
    }
    
    for cat, keywords in category_keywords.items():
        if any(keyword in text_lower for keyword in keywords):
            category = cat
            break

    # 2. Classify Urgency
    urgency = 'MEDIUM'
    high_urgency_keywords = ['emergency', 'danger', 'urgent', 'broken', 'accident', 'dying', 'blocking', 'critical', 'aparth', 'അപകടം', 'ഉടൻ']
    low_urgency_keywords = ['suggestion', 'feedback', 'request to consider', 'future plan', 'അഭിപ്രായം']
    
    if any(keyword in text_lower for keyword in high_urgency_keywords):
        urgency = 'HIGH'
    elif any(keyword in text_lower for keyword in low_urgency_keywords):
        urgency = 'LOW'

    # 3. Classify Constituency
    # Simple search for common Kerala/generic place patterns (capitalized words in English or specific Malayalam patterns)
    constituency = 'Unknown'
    # Try finding "at <Place>" or "from <Place>" or "<Place> constituency"
    match = re.search(r'(?:at|from|in)\s+([A-Z][a-z]+)', text)
    if match:
        constituency = match.group(1)
    else:
        # Check some common Kerala places for fallback simulation
        places = ['Aluva', 'Ernakulam', 'Trivandrum', 'Kochi', 'Calicut', 'Kottayam', 'Thrissur', 'Palakkad']
        for p in places:
            if p.lower() in text_lower:
                constituency = p
                break
                
    # 4. Generate Summary
    # Take first two sentences
    sentences = re.split(r'(?<=[.!?])\s+', text)
    summary = " ".join(sentences[:2])
    if len(summary) > 150:
        summary = summary[:147] + "..."
    if not summary:
        summary = "No content."

    return {
        'summary': summary,
        'urgency': urgency,
        'category': category,
        'constituency': constituency
    }


def check_spam_or_fraud(text):
    """
    Checks if a text submission is spam, advertisement, or gibberish.
    Returns True if spam, False otherwise.
    """
    if not text or len(text.strip()) < 10:
        return True
    
    text_lower = text.lower()
    
    # 1. Use Gemini if available
    if HAS_GEMINI:
        try:
            import google.generativeai as genai
            model = genai.GenerativeModel("gemini-2.5-flash")
            prompt = f"Analyze the following request text from a citizen. Is it spam, gibberish, an advertisement, or completely fraudulent? Respond ONLY with 'true' or 'false'. Text:\n\n{text}"
            response = model.generate_content(prompt)
            result = response.text.strip().lower()
            return 'true' in result
        except Exception as e:
            logger.error(f"Gemini spam check failed, using heuristics: {e}")

    # 2. Local heuristic checks
    # Gibberish check: very few spaces or no vowels in long words
    words = text_lower.split()
    if len(words) > 0:
        vowel_count = sum(1 for char in text_lower if char in 'aeiouaeiouy\u0d05\u0d06\u0d07\u0d08\u0d09\u0d0a\u0d0b\u0d0c\u0d0e\u0d0f\u0d10\u0d12\u0d13\u0d14')
        if vowel_count / len(text_lower) < 0.1:  # less than 10% vowels
            return True
            
    # Check common spam triggers
    spam_triggers = [
        'viagra', 'cialis', 'casino', 'lottery winner', 'free money', 
        'click here', 'buy now', 'earn online', 'work from home', 'crypto profit',
        'investment scheme', 'adult site', 'meet girls', 'subscribe now'
    ]
    if any(trigger in text_lower for trigger in spam_triggers):
        return True
        
    # Check repeated characters (e.g. "aaaaa", "asdfasdfasdf")
    if re.search(r'(.)\1{5,}', text_lower): # 6 repeated characters
        return True

    return False


def find_duplicate_requests(description, constituency, exclude_id=None):
    """
    Checks if there are other requests in the database that are duplicates of this description.
    Returns (is_duplicate, original_request_id_or_None)
    """
    from .models import ConstituencyRequest
    if not description or not constituency:
        return False, None

    # Filter requests in the same constituency created in the last 30 days
    import datetime
    from django.utils import timezone
    cutoff = timezone.now() - datetime.timedelta(days=30)
    
    existing_requests = ConstituencyRequest.objects.filter(
        constituency__iexact=constituency,
        created_at__gte=cutoff,
        is_spam=False,
        is_duplicate=False
    )
    if exclude_id:
        existing_requests = existing_requests.exclude(id=exclude_id)
    
    # Pre-process current description words
    desc_words = set(re.findall(r'\w+', description.lower()))
    if len(desc_words) < 5:
        return False, None

    # 1. Try Gemini similarity check if available
    if HAS_GEMINI and existing_requests.exists():
        try:
            import google.generativeai as genai
            model = genai.GenerativeModel("gemini-2.5-flash")
            
            # To avoid overloading, check top 5 most recent requests in the area
            for req in existing_requests[:5]:
                prompt = f"""
                Are the following two citizen descriptions reporting the exact same issue at the exact same location?
                For example, two people reporting "the same water pipe leak on Main street" or "the same pothole in front of Library" are duplicates.
                Respond with ONLY 'true' if they are duplicate reports of the same physical problem, or 'false' if they are different issues.
                
                Description 1: "{req.translation or req.description}"
                Description 2: "{description}"
                """
                response = model.generate_content(prompt)
                if 'true' in response.text.strip().lower():
                    return True, req.id
        except Exception as e:
            logger.error(f"Gemini similarity check failed, using local overlap: {e}")

    # 2. Local fallback Jaccard overlap check
    for req in existing_requests:
        req_text = req.translation or req.description
        req_words = set(re.findall(r'\w+', req_text.lower()))
        if not req_words:
            continue
            
        intersection = desc_words.intersection(req_words)
        union = desc_words.union(req_words)
        jaccard_similarity = len(intersection) / len(union)
        
        # If similarity is greater than 60%, flag it as duplicate
        if jaccard_similarity > 0.6:
            return True, req.id

    return False, None

