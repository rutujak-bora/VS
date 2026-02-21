import os
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

def test_email():
    sender_email = os.getenv("GMAIL_USER")
    sender_password = os.getenv("GMAIL_APP_PASSWORD")
    target_email = "vsfashiiiion@gmail.com"
    
    print(f"Attempting to send test email from: {sender_email}")
    
    msg = MIMEMultipart()
    msg['Subject'] = 'SMTP Test Connection (Insecure)'
    msg['From'] = sender_email
    msg['To'] = target_email
    msg.attach(MIMEText("This is a test email with SSL verification disabled.", 'plain'))
    
    try:
        context = ssl._create_unverified_context()
        print("Connecting to smtp.gmail.com:465 with unverified context...")
        with smtplib.SMTP_SSL('smtp.gmail.com', 465, context=context) as server:
            print("Logging in...")
            server.login(sender_email, sender_password)
            print("Sending message...")
            server.send_message(msg)
            print("Email sent successfully!")
    except Exception as e:
        print(f"Failed to send email: {e}")

if __name__ == "__main__":
    test_email()
