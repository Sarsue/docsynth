from flask import Blueprint, request, jsonify, current_app
from utils import get_user_id
from youtube_video_handler import process_youtube_link
from web_link_handler import process_newsletter_link
from llm_service import chat

messages_bp = Blueprint("messages", __name__, url_prefix="api/v1/messages")


def get_id_helper(store, success, user_info):
    if not success:
        return jsonify(user_info), 401

    # Now you can use the user_info dictionary to allow or restrict actions
    name = user_info['name']
    email = user_info['email']
    id = store.get_user_id_from_email(email)
    return id


@messages_bp.route('', methods=['POST'])
def create_message():
    store = current_app.store
    message_list = []
    message = request.args.get('message')
    token = request.headers.get('Authorization')
    success, user_info = get_user_id(token)
    id = get_id_helper(store, success, user_info)
    user_persona_pref = store.get_formatted_user_personas(id)

    print(f" user pref is {user_persona_pref}")
    history_id = int(request.args.get('history-id'))

    formatted_history = store.format_user_chat_history(history_id,id)
    print(message, id, history_id)
    user_request = store.add_message(
        content=message, sender='user', user_id=id, chat_history_id=history_id)
    message_list.append(user_request)

    # add history for more conversational context
    response = chat(query=message, persona_str=user_persona_pref, convo_history= formatted_history)
    if len(user_persona_pref) == 0:
        response = f"{response} \n WARNING \n MANAGE YOUR PERSONA IN THE SETTINGS PAGE YOU CURRENTLY HAVE NOTHING SELECTED"
    bot_response = store.add_message(
        content=response, sender='bot', user_id=id, chat_history_id=history_id)
    message_list.append(bot_response)
    return message_list


@messages_bp.route('/like/<int:message_id>', methods=['POST'])
def like_message(message_id):
    try:
        store = current_app.store
        token = request.headers.get('Authorization')
        success, user_info = get_user_id(token)
        id = get_id_helper(store, success, user_info)
        store.like_message(message_id, id)
        return jsonify({'message': 'Message liked successfully'})
    except Exception as e:
        # Handle exceptions and return an error response
        print(str(e))
        return jsonify({'error': str(e)}), 500


# Example route to handle disliking a message
@messages_bp.route('/dislike/<int:message_id>', methods=['POST'])
def dislike_message(message_id):
    try:
        store = current_app.store
        token = request.headers.get('Authorization')
        success, user_info = get_user_id(token)
        id = get_id_helper(store, success, user_info)
        store.dislike_message(message_id, id)
        return jsonify({'message': 'Message disliked successfully'})
    except Exception as e:
        # Handle exceptions and return an error response
        print(str(e))
        return jsonify({'error': str(e)}), 500
