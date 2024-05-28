from flask import Blueprint, request, jsonify, current_app
from utils import get_user_id
from documents_handlers import handle_file
from google.cloud import storage
import PyPDF2
import os

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "./config/credentials.json"

# Replace 'your-firebase-storage-bucket' with your actual Firebase Storage bucket name
bucket_name = 'docsynth-fbb02.appspot.com'


files_bp = Blueprint("files", __name__, url_prefix="api/v1/files")


def get_id_helper(success, user_info):
    if not success:
        return jsonify(user_info), 401

    # Now you can use the user_info dictionary to allow or restrict actions
    id = user_info['user_id']
    return id


def delete_from_gcs(user_id, file_name):
    # Initialize a client
    client = storage.Client()
    # Get the bucket
    bucket = client.get_bucket(bucket_name)

    # Define the destination folder within the bucket based on user ID
    user_folder = f"{user_id}/"

    # Specify the file to delete
    blob = bucket.blob(user_folder + file_name)

    # Delete the file
    blob.delete()


def upload_to_gcs(file, user_id):
    client = storage.Client()
    bucket = client.get_bucket(bucket_name)

    # Define the destination folder within the bucket based on user ID
    user_folder = f"{user_id}/"

    # Create a blob within the user's folder using the original file name
    blob = bucket.blob(user_folder + file.filename)

    # Set the content type in the metadata

    # Upload the file from the file stream
    blob.upload_from_file(file.stream,content_type = file.mimetype)

    # Make the blob publicly accessible
    blob.make_public()

    # Get the public URL of the uploaded file
    file_url = blob.public_url

    print("Your file URL:", file_url)
    return file_url


@files_bp.route('', methods=['GET'])
def retrieve_files():
    try:
        store = current_app.store
        token = request.headers.get('Authorization')
        success, user_info = get_user_id(token)
        id = store.get_user_id_from_email(user_info['email'])
        files = store.get_files_for_user(id)
        return files
    except Exception as e:
        print(str(e))
        return jsonify({'error': str(e)}), 500


@files_bp.route('', methods=['POST'])
def save_file():
    try:
        store = current_app.store
        token = request.headers.get('Authorization')
        success, user_info = get_user_id(token)
        user_id = get_id_helper(success, user_info)
        id = store.get_user_id_from_email(user_info['email'])
        subscription_status = store.get_subscription(user_id)
        if subscription_status != 'active':
            files = store.get_files_for_user(id)
            for file_info in files:
                file_id = file_info['id']
                file_dict = store.delete_file_entry(id, file_id)
                delete_from_gcs(user_id, file_dict['file_name'])

        # Check if any files are provided
        if not request.files:
            print('No files provided')
            return jsonify({'error': 'No files provided'}), 400

        for file_key, file in request.files.items():
            print(file_key, file)
            # Use the file name directly or process it as needed
            file_url = upload_to_gcs(file, user_id)
            # if pdf do this 
            with file.stream as pdf_file:
                pdf_reader = PyPDF2.PdfReader(pdf_file)
                pdf_text = ''
                
                for page_num in range(len(pdf_reader.pages)):
                    page = pdf_reader.pages[page_num]
                    pdf_text += page.extract_text()
            vec_doc_id = 0
            store.add_file(id, file.filename, file_url, vec_doc_id)

        return jsonify({'message': 'Files uploaded successfully'})

    except Exception as e:
        print(str(e))
        return jsonify({'error': str(e)}), 500


@files_bp.route('/<int:fileId>', methods=['DELETE'])
def delete_file(fileId):
    try:
        store = current_app.store
      

        token = request.headers.get('Authorization')
        success, user_info = get_user_id(token)
        user_id = get_id_helper(success, user_info)
        id = store.get_user_id_from_email(user_info['email'])
        file_dict = store.delete_file_entry(id, fileId)
        delete_from_gcs(user_id, file_dict['file_name'])

        # Return an empty response with a 204 No Content status code
        return '', 204

    except Exception as e:
        print(str(e))
        return jsonify({'error': str(e)}), 500
