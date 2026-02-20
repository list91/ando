from flask import Flask, request, jsonify
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import logging
import time
import threading
import atexit

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
        "body": '''<html><body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Добро пожаловать в ANDO JV!</h2>
            <p>Ваш код подтверждения:</p>
            <h1 style="color: #4CAF50; font-size: 32px; letter-spacing: 5px;">{token}</h1>
            <p>Код действителен 1 час.</p>
            <hr><p style="color: #666; font-size: 12px;">ANDO JV</p>
        </body></html>'''
    },
    "recovery": {
        "subject": "Восстановление пароля - ANDO JV",
        "body": '''<html><body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Восстановление пароля</h2>
            <p>Ваш код для сброса пароля:</p>
            <h1 style="color: #FF9800; font-size: 32px; letter-spacing: 5px;">{token}</h1>
            <p>Код действителен 1 час.</p>
            <hr><p style="color: #666; font-size: 12px;">ANDO JV</p>
        </body></html>'''
    },
    "email_change": {
        "subject": "Подтверждение смены email - ANDO JV",
        "body": '''<html><body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Смена email</h2>
            <p>Ваш код подтверждения:</p>
            <h1 style="color: #2196F3; font-size: 32px; letter-spacing: 5px;">{token}</h1>
            <p>Код действителен 1 час.</p>
            <hr><p style="color: #666; font-size: 12px;">ANDO JV</p>
        </body></html>'''
    }
}

class SMTPKeepAlive:
    """SMTP connection with aggressive keep-alive"""
    def __init__(self):
        self._conn = None
        self._lock = threading.Lock()
        self._stop_event = threading.Event()
        self._keepalive_thread = None
    
    def _connect(self):
        context = ssl.create_default_context()
        conn = smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context, timeout=25)
        conn.login(SMTP_USER, SMTP_PASS)
        logger.info("SMTP connected")
        return conn
    
    def _keepalive_loop(self):
        """Send NOOP every 20 seconds to keep connection alive"""
        while not self._stop_event.wait(20):
            with self._lock:
                if self._conn:
                    try:
                        self._conn.noop()
                        logger.debug("SMTP keepalive OK")
                    except Exception as e:
                        logger.warning(f"Keepalive failed, reconnecting: {e}")
                        self._conn = None
                        try:
                            self._conn = self._connect()
                        except Exception as e2:
                            logger.error(f"Reconnect failed: {e2}")
    
    def start(self):
        with self._lock:
            if not self._conn:
                self._conn = self._connect()
        self._keepalive_thread = threading.Thread(target=self._keepalive_loop, daemon=True)
        self._keepalive_thread.start()
        logger.info("SMTP keepalive started")
    
    def stop(self):
        self._stop_event.set()
        with self._lock:
            if self._conn:
                try:
                    self._conn.quit()
                except:
                    pass
                self._conn = None
    
    def send(self, to_email, subject, html_body):
        start = time.time()
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{SENDER_NAME} <{SMTP_USER}>"
        msg["To"] = to_email
        msg.attach(MIMEText(html_body, "html"))
        
        for attempt in range(2):
            with self._lock:
                try:
                    if not self._conn:
                        self._conn = self._connect()
                    self._conn.sendmail(SMTP_USER, to_email, msg.as_string())
                    elapsed = time.time() - start
                    logger.info(f"Email sent to {to_email} in {elapsed:.2f}s")
                    return True
                except Exception as e:
                    logger.warning(f"Send attempt {attempt+1} failed: {e}")
                    self._conn = None
                    if attempt == 0:
                        continue
        
        elapsed = time.time() - start
        logger.error(f"All send attempts failed for {to_email} after {elapsed:.2f}s")
        return False

smtp = SMTPKeepAlive()

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

@app.route("/hook/send-email", methods=["POST"])
def hook_send_email():
    try:
        data = request.json
        user = data.get("user", {})
        email_data = data.get("email_data", {})
        
        to_email = user.get("email")
        token = email_data.get("token", "")
        action_type = email_data.get("email_action_type", "signup")
        
        logger.info(f"Hook: {to_email}, action: {action_type}")
        
        if not to_email:
            return jsonify({}), 200
        
        template = EMAIL_TEMPLATES.get(action_type, EMAIL_TEMPLATES["signup"])
        html = template["body"].format(token=token)
        
        success = smtp.send(to_email, template["subject"], html)
        logger.info(f"Hook done: {to_email}, success={success}")
        
        return jsonify({}), 200
    except Exception as e:
        logger.error(f"Hook error: {e}")
        return jsonify({}), 200

def startup():
    smtp.start()

def shutdown():
    smtp.stop()

atexit.register(shutdown)

if __name__ == "__main__":
    startup()
    app.run(host="0.0.0.0", port=5000)

# Auto-start on module load (for gunicorn --preload)
startup()
