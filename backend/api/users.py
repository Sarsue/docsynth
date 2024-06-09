from flask import Blueprint, request, jsonify, current_app
from utils import decode_firebase_token, get_user_id

users_bp = Blueprint("users", __name__, url_prefix="api/v1/users")


@users_bp.route("", methods=["POST"])
def create_user():
    store = current_app.store
    token = request.headers.get('Authorization')

    if not token:
        return jsonify({'error': 'Authorization token is missing'}), 401

    # Extract the actual token from the "Authorization" header
    token = token.split("Bearer ")[1]
    success, user_info = decode_firebase_token(token)

    if not success:
        return jsonify(user_info), 401

    # Now you can use the user_info dictionary to allow or restrict actions
    name = user_info['name']
    email = user_info['email']

    print(f"{email} and {name}")

    User = store.add_user(email, name)
    print(User)
    return jsonify(User)
    
@users_bp.route("/<int:user_id>/personas", methods=["GET"])
def get_user_personas(user_id):
    store = current_app.store
    user_personas = store.get_user_personas(user_id)
    return jsonify(user_personas)

@users_bp.route("/<int:user_id>/personas", methods=["PUT"])
def update_user_personas(user_id):
    store = current_app.store
    data = request.json
    selected_personas = data.get("selected_personas")
    store.update_user_personas(user_id, selected_personas)
    return jsonify({"success": True})