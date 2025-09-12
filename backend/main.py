
import os
import re
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from google.cloud import firestore
from google.oauth2 import service_account

app = Flask(__name__)
# For production, you might restrict this to your extension's ID, but for now, this is fine.
CORS(app) 

try:
    credentials = service_account.Credentials.from_service_account_file('key.json')
    db = firestore.Client(credentials=credentials)
    print("✅ Firestore client initialized successfully!")
except Exception as e:
    print(f"❌ FATAL ERROR: Could not initialize Firestore client: {e}")
    db = None

def clean_domain(url):
    """Extracts a clean domain name from a URL."""
    domain = re.sub(r'^https?:\/\/', '', url)
    domain = domain.split('/')[0]
    domain = domain.replace('www.', '')
    return domain

@app.route('/analyze-site', methods=['POST'])
def analyze_site():
    if not db:
        return jsonify({"error": "Firestore not configured"}), 500
    try:
        data = request.get_json()
        url = data.get('url')
        api_key = data.get('apiKey')
        model_name = data.get('model', 'gemini-pro')

        if not all([url, api_key]):
            return jsonify({"error": "Missing url or apiKey"}), 400

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(model_name)
        
        domain = clean_domain(url)
        site_ref = db.collection('sites').document(domain)
        site_doc = site_ref.get()

        if site_doc.exists:
            return jsonify(site_doc.to_dict()), 200

        prompt = f"""
        Based on your knowledge, what are the primary generative AI functions offered by the website at the URL "{url}"?
        Respond ONLY with a valid JSON object with a single key "functions" which is an array of strings. Do not include any other text or markdown.
        Example: {{"functions": ["Text Generation", "Code Generation", "Image Generation"]}}
        """
        response = model.generate_content(prompt)
        json_str = response.text.strip()
        if json_str.startswith('```json'):
            json_str = json_str[7:]
        if json_str.endswith('```'):
            json_str = json_str[:-3]
        json_str = json_str.strip()
        site_data = json.loads(json_str)
        
        if "functions" not in site_data or not isinstance(site_data["functions"], list):
            raise ValueError("AI response did not contain a valid 'functions' array.")

        site_data['domain'] = domain
        site_ref.set(site_data)
        return jsonify(site_data), 200
    except Exception as e:
        return jsonify({"error": f"AI analysis failed: {str(e)}"}), 500

@app.route('/enhance-prompt', methods=['POST'])
def enhance_prompt():
    if not db:
        return jsonify({"error": "Firestore not configured"}), 500
    try:
        data = request.get_json()
        url = data.get('url')
        selected_function = data.get('function')
        user_prompt = data.get('prompt')
        api_key = data.get('apiKey')
        model_name = data.get('model', 'gemini-pro')

        if not all([url, selected_function, user_prompt, api_key]):
            return jsonify({"error": "Missing required parameters"}), 400
        
        genai.configure(api_key=api_key)
        domain = clean_domain(url)
        enhancement_id = f"{domain}_{selected_function.replace(' ', '_')}"
        enhancement_ref = db.collection('enhancements').document(enhancement_id)
        enhancement_doc = enhancement_ref.get()

        system_prompt_for_agent3 = ""
        if enhancement_doc.exists:
            system_prompt_for_agent3 = enhancement_doc.to_dict().get('system_prompt', '')
        else:
            agent2_model = genai.GenerativeModel(model_name)
            
            # --- NEW, OPTIMIZED "FEW-SHOT" PROMPT FOR AGENT 2 ---
            prompt_agent2 = f"""
            You are an AI assistant that creates expert-level, token-efficient system prompts for other AI models.
            Your task is to generate a concise and robust system prompt for an AI (Agent 3) that will enhance a user's input for the '{selected_function}' feature on '{domain}'.

            Follow the example below to structure your output. Be direct and avoid conversational fluff.

            --- EXAMPLE ---
            **Request:** Create a system prompt for the 'Image Generation' feature on 'midjourney.com'.
            **Your Output (Example System Prompt):**
            You are an expert Midjourney prompt engineer. Your goal is to expand a user's simple idea into a rich, detailed, and stylistically-aware prompt.
            1.  Identify the core subject.
            2.  Add descriptive details about the subject, environment, and mood.
            3.  Incorporate a specific art style, medium, or artist (e.g., 'impressionistic oil painting', 'shot on 35mm film', 'in the style of Hayao Miyazaki').
            4.  Append relevant technical parameters like aspect ratio (`--ar 16:9`) or stylization (`--s 750`).
            5.  Synthesize these elements into a single, comma-separated paragraph.
            You must only output the final, enhanced prompt and nothing else.
            --- END EXAMPLE ---

            Now, generate the system prompt for the '{selected_function}' feature on '{domain}'. Respond ONLY with the complete system prompt for Agent 3.
            """
            
            response_agent2 = agent2_model.generate_content(prompt_agent2)
            system_prompt_for_agent3 = response_agent2.text.strip()

            enhancement_data = {
                'domain': domain,
                'function': selected_function,
                'system_prompt': system_prompt_for_agent3
            }
            enhancement_ref.set(enhancement_data)

        # Agent 3: Use the generated or cached system prompt to enhance the user's prompt
        agent3_model = genai.GenerativeModel(
            model_name=model_name,
            system_instruction=system_prompt_for_agent3
        )
        response_agent3 = agent3_model.generate_content(user_prompt)
        enhanced_prompt = response_agent3.text.strip()
        
        return jsonify({"enhanced_prompt": enhanced_prompt}), 200

    except Exception as e:
        return jsonify({"error": f"An unexpected error occurred in enhancement: {str(e)}"}), 500