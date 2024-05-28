from mistralai.client import MistralClient
from mistralai.models.chat_completion import ChatMessage
from prompts_manager import get_prompt
from test_data import questions
from dotenv import load_dotenv
import os
# Load environment variables from a .env file in the current directory
load_dotenv()
mistral_key = os.getenv("MISTRAL_API_KEY")


def test_classifier(user_query):
 
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

        mistral_summary = chat_response.choices[0].message.content
        return mistral_summary

def test_bot(user_query):
    intent = test_classifier(user_query)
    print(intent)
    
    suffix= f"""
                Respond to the following query:

                Query: "{user_query}"

                Advice: 
         """
    final_prompt = get_prompt(intent)  + suffix

    

    api_key = mistral_key
    model = "mistral-medium"
    client = MistralClient(api_key=api_key)

    messages = [
                ChatMessage(role="user", content=final_prompt)
            ]
    # No streaming
    chat_response = client.chat(
                model=model,
                messages=messages,
            )

    mistral_summary = chat_response.choices[0].message.content
    return mistral_summary







if __name__ == '__main__':   
    questions = ["Give me a workout exercise plan for a man in his late thirties train?"]
    for question in questions: 
        answer = test_bot(question)
        print(answer)