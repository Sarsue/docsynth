from mistralai.client import MistralClient
from mistralai.models.chat_completion import ChatMessage
import time
from dotenv import load_dotenv
import os
from prompts_manager import get_prompt
# Load environment variables from a .env file in the current directory
load_dotenv()
mistral_key = os.getenv("MISTRAL_API_KEY")


def resolve_intent(user_query):
    suffix_prompt = f"""
                Classify the following query:

                Query: "{user_query}"

                Classification:
         """
    
    test_prompt = get_prompt("") +  suffix_prompt
    api_key = mistral_key
    model = "mistral-medium"
    client = MistralClient(api_key=api_key)

    messages = [
                ChatMessage(role="user", content=test_prompt)
            ]
    # No streaming
    chat_response = client.chat(
                model=model,
                messages=messages,
            )

    mistral_intent = chat_response.choices[0].message.content
    return mistral_intent
def post_process(intent, answer):
    if 'weight training' in intent.lower():
        return answer.replace("Zyzz", "")
    return answer

def chat(query):
    try:
        
        suffix= f"""

                    Query: "{query}"

                    Advice: 
            """
        intent = resolve_intent(query)
        prompt = get_prompt(intent)  + suffix

    
        # handle user query intent 
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
        
        return post_process(intent,mistral_summary)

    except Exception as e:
        print(str(e))
        return "n/a"


if __name__ == '__main__':
    pass
