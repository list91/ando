from flask import Flask, request, jsonify
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import logging
import time

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

app = Flask(__name__)

SMTP_HOST = os.getenv("SMTP_HOST", "sm31.hosting.reg.ru")
SMTP_PORT = int(os.getenv("SMTP_PORT", "465"))
SMTP_USER = os.getenv("SMTP_USER", "noreply@andojv.com")
SMTP_PASS = os.getenv("SMTP_PASS")
SENDER_NAME = os.getenv("SENDER_NAME", "ANDO JV")

EMAIL_TEMPLATES = {
    "signup": {
        "subject": "Подтверждение регистрации - ANDO JV",
        "body": '''
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Добро пожаловать в ANDO JV!</h2>
            <p>Ваш код подтверждения:</p>
            <h1 style="color: #4CAF50; font-size: 32px; letter-spacing: 5px;">{token}</h1>
            <p>Код действителен 1 час.</p>
            <hr>
            <p style="color: #666; font-size: 12px;">ANDO JV</p>
        </body>
        </html>
        '''
    },
    "recovery": {
        "subject": "Восстановление пароля - ANDO JV",
        "body": '''
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Восстановление пароля</h2>
            <p>Ваш код для сброса пароля:</p>
            <h1 style="color: #FF9800; font-size: 32px; letter-spacing: 5px;">{token}</h1>
            <p>Код действителен 1 час.</p>
            <hr>
            <p style="color: #666; font-size: 12px;">ANDO JV</p>
        </body>
        </html>
        '''
    },
    "email_change": {
        "subject": "Подтверждение смены email - ANDO JV",
        "body": '''
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Смена email</h2>
            <p>Ваш код подтверждения:</p>
            <h1 style="color: #2196F3; font-size: 32px; letter-spacing: 5px;">{token}</h1>
            <p>Код действителен 1 час.</p>
            <hr>
            <p style="color: #666; font-size: 12px;">ANDO JV</p>
        </body>
        </html>
        '''
    }
}

def send_email_sync(to_email, subject, html_body):
    start = time.time()
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{SENDER_NAME} <{SMTP_USER}>"
        msg["To"] = to_email
        msg.attach(MIMEText(html_body, "html"))
        
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context, timeout=20) as server:
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, to_email, msg.as_string())
        elapsed = time.time() - start
        logger.info(f"Email sent to {to_email} in {elapsed:.2f}s")
        return True
    except Exception as e:
        elapsed = time.time() - start
        logger.error(f"Failed to send to {to_email} after {elapsed:.2f}s: {str(e)}")
        return False

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

@app.route("/send-otp", methods=["POST"])
def send_otp():
    try:
        data = request.json
        to_email = data.get("email")
        otp_code = data.get("otp")
        
        if not to_email or not otp_code:
            return jsonify({"error": "email and otp required"}), 400
        
        template = EMAIL_TEMPLATES["signup"]
        html = template["body"].format(token=otp_code)
        
        logger.info(f"Sending OTP to {to_email}")
        if send_email_sync(to_email, template["subject"], html):
            return jsonify({"success": True})
        else:
            return jsonify({"error": "send failed"}), 500
    except Exception as e:
        logger.error(f"send-otp error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/hook/send-email", methods=["POST"])
def hook_send_email():
    """Gotrue Send Email Hook - SYNC version"""
    try:
        data = request.json
        user = data.get("user", {})
        email_data = data.get("email_data", {})
        
        to_email = user.get("email")
        token = email_data.get("token", "")
        action_type = email_data.get("email_action_type", "signup")
        
        logger.info(f"Hook received: {to_email}, action: {action_type}")
        
        if not to_email:
            logger.error("No email in hook data")
            return jsonify({}), 200
        
        template = EMAIL_TEMPLATES.get(action_type, EMAIL_TEMPLATES["signup"])
        html = template["body"].format(token=token)
        
        # SYNC send - wait for completion
        success = send_email_sync(to_email, template["subject"], html)
        logger.info(f"Hook completed for {to_email}, success={success}")
        
        return jsonify({}), 200
    except Exception as e:
        logger.error(f"Hook error: {str(e)}")
        return jsonify({}), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
