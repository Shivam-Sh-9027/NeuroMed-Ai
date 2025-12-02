from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

# =====================================================
# USERS TABLE
# =====================================================
class users(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(150), nullable=False)
    last_name = db.Column(db.String(150))
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.LargeBinary, nullable=False)
    role = db.Column(db.String(20), nullable=False)

    phone = db.Column(db.String(50))
    profile_photo = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    doctor_profile = db.relationship("Doctor", backref="user", uselist=False)
    patient_profile = db.relationship("Patient", backref="user", uselist=False)


# =====================================================
# DOCTOR TABLE
# =====================================================
class Doctor(db.Model):
    __tablename__ = "doctor"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), unique=True)

    specialization = db.Column(db.String(150))
    license_number = db.Column(db.String(150), unique=True)
    experience = db.Column(db.Integer)

    clinic_name = db.Column(db.String(255))
    clinic_address = db.Column(db.Text)
    working_hours = db.Column(db.String(255))

    patients = db.relationship("Patient", backref="assigned_doctor", lazy=True)


# =====================================================
# PATIENT TABLE
# =====================================================
class Patient(db.Model):
    __tablename__ = "patient"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), unique=True)

    doctor_id = db.Column(db.Integer, db.ForeignKey("doctor.id"))

    age = db.Column(db.Integer)
    gender = db.Column(db.String(30))
    blood_type = db.Column(db.String(10))

    emergency_name = db.Column(db.String(255))
    emergency_phone = db.Column(db.String(50))

    last_visit = db.Column(db.Date)

    reports = db.relationship("Report", backref="patient", lazy=True)
    visit_history = db.relationship("VisitHistory", backref="patient", lazy=True)
    ai_analysis = db.relationship("AIAnalysis", backref="patient", lazy=True)
    prescriptions = db.relationship("Prescription", backref="patient", lazy=True)


# =====================================================
# REPORTS TABLE
# =====================================================
class Report(db.Model):
    __tablename__ = "reports"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patient.id"), nullable=False)

    report_type = db.Column(db.String(150))
    file_path = db.Column(db.String(500))
    date = db.Column(db.Date)
    status = db.Column(db.String(50))


# =====================================================
# VISIT HISTORY
# =====================================================
class VisitHistory(db.Model):
    __tablename__ = "visit_history"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patient.id"), nullable=False)

    title = db.Column(db.String(255))
    date = db.Column(db.Date)
    notes = db.Column(db.Text)


# =====================================================
# AI ANALYSIS
# =====================================================
class AIAnalysis(db.Model):
    __tablename__ = "ai_analysis"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patient.id"), nullable=False)

    probability = db.Column(db.Integer)
    result = db.Column(db.String(255))
    risk_level = db.Column(db.String(100))
    details = db.Column(db.Text)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)


# =====================================================
# APPOINTMENT
# =====================================================
class Appointment(db.Model):
    __tablename__ = "appointments"

    id = db.Column(db.Integer, primary_key=True)
    doctor_id = db.Column(db.Integer, db.ForeignKey("doctor.id"), nullable=False)
    patient_id = db.Column(db.Integer, db.ForeignKey("patient.id"), nullable=False)

    date = db.Column(db.String(50))
    time = db.Column(db.String(50))
    reason = db.Column(db.String(255))
    status = db.Column(db.String(50), default="Scheduled")


# =====================================================
# PRESCRIPTION TABLE  ✅ FIXED
# =====================================================
class Prescription(db.Model):
    __tablename__ = "prescriptions"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patient.id"), nullable=False)
    patient_name = db.Column(db.String(255))

    doctor_id = db.Column(db.Integer, db.ForeignKey("doctor.id"))
    doctor_name = db.Column(db.String(255))

    symptoms = db.Column(db.Text)
    diagnosis = db.Column(db.String(512))
    meds = db.Column(db.Text)
    notes = db.Column(db.Text)

    pdf_path = db.Column(db.String(1024))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def as_dict(self):
        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "patient_name": self.patient_name,
            "doctor_id": self.doctor_id,
            "doctor_name": self.doctor_name,
            "symptoms": self.symptoms,
            "diagnosis": self.diagnosis,
            "meds": self.meds,
            "notes": self.notes,
            "pdf_path": self.pdf_path,
            "created_at": self.created_at.isoformat()
        }
    
# =====================================================
# NOTIFICATIONS TABLE
# =====================================================
class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.Integer, primary_key=True)

    doctor_id = db.Column(db.Integer, db.ForeignKey("doctor.id"), nullable=False)

    title = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    time = db.Column(db.String(100))  # Example: "10 mins ago" or timestamp string

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    doctor = db.relationship("Doctor", backref="notifications", lazy=True)
