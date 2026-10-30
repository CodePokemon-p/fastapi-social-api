from database import SessionLocal
import models
import auth

db = SessionLocal()

# Find the user
user = db.query(models.User).filter(models.User.username == 'sabaminn').first()

if user:
    # Generate a brand new hash and save it
    user.password_hash = auth.get_password_hash('password123')
    db.commit()
    print("✅ Password successfully reset to 'password123' for user: sabaminn")
else:
    print("❌ User not found!")