from flask import Blueprint, request, jsonify, current_app
from utils import get_user_id
from documents_handlers import handle_file
import stripe
from dotenv import load_dotenv
import os
from utils import decode_firebase_token, get_user_id
load_dotenv()


endpoint_secret ='whsec_ed91c65f7bd8c9a0b71121358aaea581bc89093511f3c685fa53aa4171a75db9'
stripe.api_key  = os.getenv('STRIPE_SECRET') #endpoint_secret

subscriptions_bp = Blueprint("subscriptions", __name__,
                             url_prefix="api/v1/subscriptions")


def get_id_helper(store, success, user_info):
    if not success:
        return jsonify(user_info), 401

    # Now you can use the user_info dictionary to allow or restrict actions
    name = user_info['name']
    email = user_info['email']
    id = store.get_user_id_from_email(email)
    return id

@subscriptions_bp.route('/status', methods=['GET'])
def get_user_subscription_status():
    store = current_app.store
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'error': 'Authorization token is missing'}), 401

    # Extract the actual token from the "Authorization" header
    token = token.split("Bearer ")[1]
    success, user_info = decode_firebase_token(token)

    if not success:
        return jsonify(user_info), 401
    user_id = get_id_helper(store,success,user_info)    
    subscription_status = store.get_subscription(user_id)

    if subscription_status != None:
        subscription_status = subscription_status['status']


    print(f"{user_info} has status {subscription_status} " )
    return jsonify({'subscription_status': subscription_status}),200

@subscriptions_bp.route('/cancel', methods=['POST'])
def cancel_sub():
    try:
        store = current_app.store
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Authorization token is missing'}), 401

        # Extract the actual token from the "Authorization" header
        token = token.split("Bearer ")[1]
        success, user_info = decode_firebase_token(token)

        if not success:
            return jsonify(user_info), 401
        user_id = get_id_helper(store,success,user_info)    

        subscription_status = store.get_subscription(user_id)
       
        cust_id = subscription_status['stripe_customer_id']
        subscription_id = subscription_status['stripe_subscription_id']
        print(f"subscription {subscription_id}  was --- {subscription_status}")

        canellation_result = stripe.Subscription.cancel(subscription_id)
        subscription_status = canellation_result["status"]
        print(f"subscription {canellation_result['id']} changed to --- {subscription_status}")
        print(canellation_result)


        store.add_or_update_subscription(user_id, cust_id, subscription_id, subscription_status)
   
        return {"subscription_status":subscription_status},200
    except Exception as e:
        return jsonify(error=str(e)), 403


@subscriptions_bp.route('/sub', methods=['POST'])
def sub():
    store = current_app.store
    token = request.headers.get('Authorization')
    payment_method = request.json.get('payment_method', None)
    #email = request.json.get('email', None)
    if not token:
        return jsonify({'error': 'Authorization token is missing'}), 401

    # Extract the actual token from the "Authorization" header
    token = token.split("Bearer ")[1]
    success, user_info = decode_firebase_token(token)

    if not success:
        return jsonify(user_info), 401
    user_id = get_id_helper(store,success,user_info)    
    subscription_status = store.get_subscription(user_id)
   
   

    # if not email:
    #     return 'You need to send an Email!', 400
    if not payment_method:
        return 'You need to send a payment_method!', 400
    
    cust_id = None
    if (subscription_status == None):

        customer = stripe.Customer.create(
            payment_method=payment_method,
            email=user_info['email'],
            invoice_settings={
                'default_payment_method': payment_method,
            },
        )
        cust_id= customer['id']
    else:
        cust_id = subscription_status['stripe_customer_id']
 
    #email = email

    # Creates a subscription and attaches the customer to it
    subscription = stripe.Subscription.create(
        customer=cust_id,
        items=[
            {
            'plan': 'price_1OYEt8HuDDTkwuzjd4i66xD0',
            },
        ],
        expand=['latest_invoice.payment_intent'],
    )
   
    subscription_status = subscription["status"]
    subscription_id = subscription["id"]
    status = subscription['latest_invoice']['payment_intent']['status'] 
    print(cust_id,subscription_id,subscription_status)
    store.add_or_update_subscription(user_id, cust_id, subscription_id, subscription_status)
    client_secret = subscription['latest_invoice']['payment_intent']['client_secret']
    print(subscription_id, status)
  


    
    return {'status': subscription_status, 'client_secret': client_secret}, 200


@subscriptions_bp.route('/webhook', methods=['POST'])
def webhook():
    payload = request.get_data()
    sig_header = request.headers.get('Stripe_Signature', None)

    if not sig_header:
        return 'No Signature Header!', 400

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, endpoint_secret
        )
        
        print(event['type'])
        if event['type'] == 'payment_intent.succeeded':
            email = event['data']['object']['receipt_email'] # contains the email that will recive the recipt for the payment (users email usually)
            
            # user_info['paid_50'] = True
            # user_info['email'] = email
            print("USER PAYMENT SUCCEDDED")
        if event['type'] == 'invoice.payment_succeeded':
            email = event['data']['object']['customer_email'] # contains the email that will recive the recipt for the payment (users email usually)
            customer_id = event['data']['object']['customer'] # contains the customer id
            print("USER HAS PAID")
            #user_info['paid'] = True
        else:
            return 'Unexpected event type', 400

        return '', 200
    except ValueError as e:
        # Invalid payload
        return 'Invalid payload', 400
    except stripe.error.SignatureVerificationError as e:
        # Invalid signature
        return 'Invalid signature', 400

    