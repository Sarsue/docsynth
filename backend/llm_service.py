from mistralai.client import MistralClient
from mistralai.models.chat_completion import ChatMessage
import time
from dotenv import load_dotenv
import os
import random
# Load environment variables from a .env file in the current directory
load_dotenv()
mistral_key = os.getenv("MISTRAL_API_KEY")


def chat(query, persona_str):
    try:
        # Load prompt from prompts folder
        file_path = os.path.join("prompts", "prompt.txt")
        with open(file_path, "r") as file:
            prompt_template = file.read()

        # Format the prompt with the personas and query
        prompt = prompt_template.format(persona_str=persona_str, query=query)

        print(prompt)
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
