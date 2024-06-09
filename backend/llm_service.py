from mistralai.client import MistralClient
from mistralai.models.chat_completion import ChatMessage
import time
from dotenv import load_dotenv
import os
import random
# Load environment variables from a .env file in the current directory
load_dotenv()
mistral_key = os.getenv("MISTRAL_API_KEY")




def chat(query):
    try:
        # Get Personas from database
        personas = {
        "Osho": ["The Book of Secrets", "The Mustard Seed"],
        "Carl Jung": ["The Archetypes and the Collective Unconscious", "Man and His Symbols"],
        "Friedrich Nietzsche": ["Thus Spoke Zarathustra", "Beyond Good and Evil"],
        "Buddha": ["The Dhammapada", "Sutta Nipata"],
        "Rumi": ["The Essential Rumi", "The Masnavi"],
        "Plato": ["The Republic", "The Symposium"],
        "Eckhart Tolle": ["The Power of Now", "A New Earth"],
        "David Deida": ["The Way of the Superior Man", "Dear Lover"],
     }

        # Convert personas dictionary to a comma-delimited string with titles
        persona_str = ", ".join([f"{key} (works: {', '.join(value)})" for key, value in personas.items()])

        # Load prompt from prompts folder 
        file_path = os.path.join("prompts", "prompt.txt")
        with open(file_path, "r") as file:
            prompt_template = file.read()

        # Format the prompt with the personas and query
        prompt = prompt_template.format(persona_str = persona_str,query=query)
    
        
        api_key = mistral_key
        model = "mistral-medium"
        client = MistralClient(api_key=api_key)

        messages = [
            ChatMessage(role="user", content=prompt)
        ]

        # No streaming
        chat_response = client.chat(
            model=model,
            messages=messages,
        )

        mistral_summary = chat_response.choices[0].message.content 
        print(mistral_summary)
        return mistral_summary

    except Exception as e:
        print(str(e))
        return "n/a"


if __name__ == '__main__':
    pass
