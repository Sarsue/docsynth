from flask import Flask, request, jsonify
import firebase_admin
from firebase_admin import credentials, auth
from flask_cors import CORS
from db.illumn_ai_store import IllumnAiStore
import os
from api.users import users_bp
from api.histories import histories_bp
from api.messages import messages_bp
from api.files import files_bp
from api.subscriptions import subscriptions_bp
from api.personas import personas_bp
from dotenv import load_dotenv
import os
load_dotenv()

app = Flask(__name__)
# Replace with your frontend's origin

# Configure CORS with the correct syntax
CORS(app, resources={
     r"/api/*": {"origins": "http://localhost:3000"}}, supports_credentials=True)
bucket_path = 'docsynth-fbb02.appspot.com'
cred = credentials.Certificate('./config/credentials.json')

firebase_admin.initialize_app(cred, {
    'storageBucket': bucket_path,
})

database_path = './db/illumnai.db'
store = IllumnAiStore(database_path)
app.store = store
stripe_api_key = ''
endpoint_secret = ''

# Register Blueprints
app.register_blueprint(users_bp, url_prefix="/api/v1/users")
app.register_blueprint(histories_bp, url_prefix="/api/v1/histories")
app.register_blueprint(messages_bp, url_prefix="/api/v1/messages")
app.register_blueprint(files_bp, url_prefix="/api/v1/files")
app.register_blueprint(subscriptions_bp, url_prefix="/api/v1/subscriptions")
app.register_blueprint(personas_bp, url_prefix="/api/v1/personas")

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
