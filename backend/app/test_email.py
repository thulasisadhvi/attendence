import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

SENDER_EMAIL = "poornimapraneetha42@gmail.com" # Your Gmail address
# Make sure this APP_PASSWORD is the one you just generated/verified from Step 1
APP_PASSWORD = "peshfmzrjocfgmuk" 

RECEIVER_EMAIL = "yelamanchiliswaritha@gmail.com" # Change this to an email you can check easily

msg = MIMEMultipart()
msg['Subject'] = 'Test Email from Flask App Debug'
msg['From'] = SENDER_EMAIL
msg['To'] = RECEIVER_EMAIL
msg.attach(MIMEText("This is a test email to check SMTP connectivity.", 'plain'))

try:
    print("Attempting to connect to SMTP server...")
    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        print("Connected to SMTP server. Attempting login...")
        server.login(SENDER_EMAIL, APP_PASSWORD)
        print("Login successful. Sending email...")
        server.send_message(msg)
        print("Email sent successfully!")
except Exception as e:
    print(f"Error sending test email: {e}")