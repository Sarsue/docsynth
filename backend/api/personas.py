from flask import Blueprint, request, jsonify, current_app

# protect route this is for admin only
personas_bp = Blueprint("personas", __name__, url_prefix="api/v1/personas")

@personas_bp.route('', methods=['GET'])
def get_personas():
    store = current_app.store
    personas = store.get_personas()
    return jsonify(personas)


# @personas_bp.route('', methods=['POST'])
# def add_persona():
#     store = current_app.store
#     data = request.json
#     name = data.get('name')
#     works = data.get('works')
#     persona = store.add_persona(name, works)
#     return jsonify(persona)


# @personas_bp.route('/<int:persona_id>', methods=['DELETE'])
# def delete_persona(persona_id):
#     store = current_app.store
#     success = store.delete_persona(persona_id)
#     return jsonify({'success': success})