from flask import Flask, jsonify, request, render_template
from models import db, users, Doctor, Patient, Report, VisitHistory, AIAnalysis, Appointment, Prescription, Notification
from werkzeug.utils import secure_filename
from flask_cors import CORS
from datetime import date
from models import db, Doctor, Patient
from config import Config
import bcrypt
import os

app = Flask(__name__)
app.config.from_object(Config)
db.init_app(app)
CORS(app)

# Create uploads folder
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# ------------------ INIT DB ------------------
with app.app_context():
    db.create_all()



# ------------------ WEBPAGES ------------------
@app.route("/")
def home():
    return render_template("Registeration.html")


@app.route("/doctor/dashboard")
def doctor_dashboard():
    return render_template("Doctors_Dashboard.html")


@app.route("/patient/dashboard")
def patient_dashboard():
    return render_template("Patient.html")



# ============================================================
#                     DOCTOR REGISTRATION
# ============================================================
@app.route("/register/doctor", methods=["POST"])
def register_doctor():
    form = request.form

    # --- USER TABLE FIELDS ---
    first = form.get("firstName")
    last = form.get("lastName")
    email = form.get("email")
    password = form.get("password")
    phone = form.get("phone")

    # --- DOCTOR TABLE FIELDS ---
    specialization = form.get("specialization")
    license_number = form.get("licenseNumber")
    experience = form.get("experience")

    # Password hashing
    hashed_pass = bcrypt.hashpw(password.encode(), bcrypt.gensalt())

    # Profile photo upload
    file = request.files.get("profilePic")
    filename = None
    if file:
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)

    # 1️⃣ CREATE USER FIRST
    new_user = users(
        first_name=first,
        last_name=last,
        email=email,
        password_hash=hashed_pass,
        role="doctor",
        phone=phone,
        profile_photo=filename
    )

    db.session.add(new_user)
    db.session.commit()     # commit to generate user_id

    # 2️⃣ CREATE DOCTOR PROFILE LINKED TO USER
    new_doc = Doctor(
        user_id=new_user.id,
        specialization=specialization,
        license_number=license_number,
        experience=experience
    )

    db.session.add(new_doc)
    db.session.commit()

    return jsonify({
        "message": "Doctor Registered Successfully!",
        "license_number": new_doc.license_number,
        "redirect": "/doctor/dashboard?license=" + new_doc.license_number
    })

# ============================================================
#                     ADD PATIENT TO DOCTOR 
# ============================================================
@app.route("/api/doctor/add_patient", methods=["POST"])
def add_patient_to_doctor():
    data = request.json
    doctor_license = data.get("license_no")
    patient_id = data.get("patient_id")

    doctor = Doctor.query.filter_by(license_number=doctor_license).first()
    if not doctor:
        return jsonify({"error": "Doctor not found"}), 404

    patient = Patient.query.get(patient_id)
    if not patient:
        return jsonify({"error": "Patient not found"}), 404

    # Assign patient to doctor
    patient.doctor_id = doctor.id
    db.session.commit()

    return jsonify({"message": "Patient added to doctor's list successfully!"})


# ============================================================
#                     PATIENT REGISTRATION
# ============================================================
@app.route("/register/patient", methods=["POST"])
def register_patient():
    form = request.form

    # --- USER TABLE FIELDS ---
    first = form.get("firstName")
    last = form.get("lastName")
    email = form.get("email")
    password = form.get("password")
    phone = form.get("phone")

    # --- PATIENT TABLE FIELDS ---
    age = form.get("age")
    gender = form.get("gender")
    blood_type = form.get("bloodType")
    emergency_name = form.get("emergencyName")
    emergency_phone = form.get("emergencyPhone")

    # Hash Password
    hashed_pass = bcrypt.hashpw(password.encode(), bcrypt.gensalt())

    # Profile Photo Upload
    file = request.files.get("profilePic")
    filename = None
    if file:
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)

    # 1️⃣ CREATE USER FIRST
    new_user = users(
        first_name=first,
        last_name=last,
        email=email,
        password_hash=hashed_pass,
        role="patient",
        phone=phone,
        profile_photo=filename
    )

    db.session.add(new_user)
    db.session.commit()  # generate user_id

    # 2️⃣ CREATE PATIENT PROFILE LINKED TO USER
    new_patient = Patient(
        user_id=new_user.id,
        age=age,
        gender=gender,
        blood_type=blood_type,
        emergency_name=emergency_name,
        emergency_phone=emergency_phone,
        last_visit=None
    )

    db.session.add(new_patient)
    db.session.commit()

    return jsonify({
        "message": "Patient Registered Successfully!",
        "redirect": "/patient/dashboard"
    })

# ============================================================
#                          SIGN IN
# ============================================================
@app.route("/signin", methods=["POST"])
def signin():
    data = request.json
    email = data.get("email")
    password = data.get("password")
    userType = data.get("userType")

    # 1️⃣ FIND USER IN users TABLE
    user = users.query.filter_by(email=email).first()
    
    if not user:
        return jsonify({"message": "User not found"}), 400

    # 2️⃣ CHECK PASSWORD
    if not bcrypt.checkpw(password.encode(), user.password_hash):
        return jsonify({"message": "Incorrect Password"}), 400

    # 3️⃣ LOGIN FLOW BASED ON ROLE
    if userType == "doctor":
        doctor = Doctor.query.filter_by(user_id=user.id).first()
        if not doctor:
            return jsonify({"message": "Doctor profile not found"}), 400

        return jsonify({
            "message": "Login Successful",
            "license_no": doctor.license_number,
            "redirect": "/doctor/dashboard?license=" + doctor.license_number
        })

    elif userType == "patient":
        patient = Patient.query.filter_by(user_id=user.id).first()
        if not patient:
            return jsonify({"message": "Patient profile not found"}), 400

        return jsonify({
            "message": "Login Successful",
            "redirect": "/patient/dashboard"
        })

    return jsonify({"message": "Invalid user type"}), 400


# ------------------ DOCTOR APIs ----------------------

# ✔️ UPDATED: Return full doctor details
@app.route("/api/doctor/<license_no>")
def get_doctor(license_no):

    # 1️⃣ FIND DOCTOR
    doctor = Doctor.query.filter_by(license_number=license_no).first()
    if not doctor:
        return jsonify({"error": "Doctor not found"}), 404

    # 2️⃣ FIND USER (because email, phone, photo stored here)
    user = users.query.get(doctor.user_id)
     # ⭐ 1) TOTAL PATIENTS
    total_patients = Patient.query.filter_by(doctor_id=doctor.id).count()

    # ⭐ 2) TODAY'S APPOINTMENTS
    today = date.today().isoformat()
    todays_appointments = Appointment.query.filter_by(doctor_id=doctor.id, date=today).count()

    # ⭐ 3) AI REPORTS (doctor_id यकीन से नहीं था — इसलिए safe calculation)
    try:
        ai_reports = AIAnalysis.query.filter_by(doctor_id=doctor.id).count()
    except:
        # अगर doctor_id column नहीं है तो fallback:
        ai_reports = AIAnalysis.query.count()

    # ⭐ 4) NOTIFICATIONS (अगर table नहीं है → safe)
    try:
        notifications = Notification.query.filter_by(doctor_id=doctor.id).count()
    except:
        notifications = 0

    return jsonify({
        "id": doctor.id,
        "name": f"{user.first_name} {user.last_name}",
        "email": user.email,
        "phone": user.phone,
        "profile_photo": user.profile_photo,
        "specialization": doctor.specialization,
        "experience": doctor.experience,
        "clinic_name": doctor.clinic_name,
        "clinic_address": doctor.clinic_address,
        "working_hours": doctor.working_hours,
        "license_no": doctor.license_number,
        # ⭐ ADDING THESE 4 KEYS ⭐
        "total_patients": total_patients,
        "today_appointments": todays_appointments,
        "ai_reports": ai_reports,
        "notifications": notifications
    })

# ✔️ NEW: Update doctor profile settings
@app.route("/api/doctor/update", methods=["POST"])
def update_doctor():
    data = request.json

    # 1️⃣ Find doctor by license number
    doctor = Doctor.query.filter_by(license_number=data.get("license_no")).first()
    if not doctor:
        return jsonify({"error": "Doctor not found"}), 404

    # 2️⃣ Find linked user
    user = users.query.get(doctor.user_id)

    # ---------- UPDATE USER TABLE ----------
    full_name = data.get("name")
    if full_name:
        parts = full_name.split(" ", 1)
        user.first_name = parts[0]
        user.last_name = parts[1] if len(parts) > 1 else ""

    user.email = data.get("email", user.email)
    user.phone = data.get("phone", user.phone)
    user.profile_photo = data.get("profile_photo", user.profile_photo)

    # ---------- UPDATE DOCTOR TABLE ----------
    doctor.specialization = data.get("specialization", doctor.specialization)
    doctor.experience = data.get("experience", doctor.experience)
    doctor.clinic_name = data.get("clinic_name", doctor.clinic_name)
    doctor.clinic_address = data.get("clinic_address", doctor.clinic_address)
    doctor.working_hours = data.get("working_hours", doctor.working_hours)

    db.session.commit()

    return jsonify({"message": "Doctor profile updated successfully!"})

# ------------------ PATIENT APIs ----------------------
@app.route("/api/patients/all")
def get_all_patients():

    patients = Patient.query.all()
    result = []

    for p in patients:
        user = users.query.get(p.user_id)  # patient name, email, phone stored here

        result.append({
            "id": p.id,
            "name": f"{user.first_name} {user.last_name}" if user else "Unknown",
            "age": p.age,
            "gender": p.gender,
            "blood_type": p.blood_type,
            "last_visit": p.last_visit,
        })

    return jsonify(result)

@app.route("/api/doctor/<license_no>/patients")
def get_doctor_patients(license_no):

    # FIXED: correct field name in DB
    doctor = Doctor.query.filter_by(license_number=license_no).first()
    if not doctor:
        return jsonify({"error": "Doctor not found"}), 404

    # fetch assigned patients
    patients = Patient.query.filter_by(doctor_id=doctor.id).all()

    result = []
    for p in patients:
        user = users.query.get(p.user_id)
        result.append({
            "id": p.id,
            "name": f"{user.first_name} {user.last_name}",
            "age": p.age,
            "gender": p.gender,
            "blood_type": p.blood_type,
            "last_visit": p.last_visit
        })

    return jsonify(result)

@app.route("/api/patient/<int:patient_id>")
def get_patient_details(patient_id):

    p = Patient.query.get(patient_id)
    if not p:
        return jsonify({"error": "Patient not found"}), 404

    # get patient user info
    user = users.query.get(p.user_id)

    return jsonify({
        "id": p.id,
        "name": f"{user.first_name} {user.last_name}" if user else "Unknown",
        "age": p.age,
        "gender": p.gender,
        "blood_type": p.blood_type,
        "emergency_name": p.emergency_name,
        "emergency_phone": p.emergency_phone,
        "last_visit": p.last_visit,
        "condition": "N/A"     # no such field in DB, so send default
    })

@app.route("/api/patient/add", methods=["POST"])
def add_patient():
    data = request.json

    # STEP 1 — Create user
    new_user = users(
        first_name=data["first_name"],
        last_name=data["last_name"],
        email=data["email"],
        phone=data["phone"],
        role="patient"
    )
    db.session.add(new_user)
    db.session.commit()   # generates new_user.id

    # STEP 2 — Create patient
    new_patient = Patient(
        user_id=new_user.id,
        age=data["age"],
        gender=data["gender"],
        blood_type=data.get("blood_type"),
        emergency_name=data.get("emergency_name"),
        emergency_phone=data.get("emergency_phone"),
        last_visit=data.get("last_visit")
    )

    db.session.add(new_patient)
    db.session.commit()

    return jsonify({
        "message": "Patient added successfully!",
        "patient_id": new_patient.id
    })

# ------------------ REPORTS ----------------------
@app.route("/api/patient/<int:patient_id>/reports")
def get_reports(patient_id):
    reports = Report.query.filter_by(patient_id=patient_id).all()

    return jsonify([
        {
            "id": r.id,
            "report_type": r.report_type,
            "date": r.date.strftime("%Y-%m-%d") if r.date else None,
            "status": r.status,
            "file": r.file_path
        }
        for r in reports
    ])

# ------------------ HISTORY ----------------------

@app.route("/api/patient/<int:patient_id>/history")
def get_history(patient_id):
    history = VisitHistory.query.filter_by(patient_id=patient_id).all()

    return jsonify([
        {
            "title": h.title,
            "date": h.date.strftime("%Y-%m-%d") if h.date else None,
            "notes": h.notes
        }
        for h in history
    ])

# =============== search ======================
    @app.route("/api/search")
    def search():
        query = request.args.get("q", "").strip()

        if not query:
            return jsonify({"patients": [], "appointments": [], "reports": []})

        # Patients
        patients = Patient.query.filter(Patient.name.ilike(f"%{query}%")).limit(5).all()

        # Appointments
        appointments = Appointment.query.join(Patient).filter(
            Patient.name.ilike(f"%{query}%") |
            Appointment.reason.ilike(f"%{query}%")
        ).limit(5).all()

        # AI Reports
        reports = AIReport.query.filter(
            AIReport.title.ilike(f"%{query}%")
        ).limit(5).all()

        return jsonify({
            "patients": [{
                "id": p.id,
                "name": p.name,
                "condition": p.condition
            } for p in patients],

            "appointments": [{
                "id": a.id,
                "patient": a.patient.name,
                "time": a.scheduled_at.strftime("%I:%M %p")
            } for a in appointments],

            "reports": [{
                "id": r.id,
                "title": r.title,
                "patient": r.patient.name
            } for r in reports]
        })

# ------------------ AI ANALYSIS ----------------------

@app.route("/api/patient/<int:patient_id>/analysis")
def get_ai_analysis(patient_id):
    ai = AIAnalysis.query.filter_by(patient_id=patient_id).first()

    if not ai:
        return jsonify({
            "available": False,
            "message": "No AI analysis available"
        })

    return jsonify({
        "available": True,
        "probability": ai.probability,  # already integer (0–100)
        "result": ai.result,
        "risk_level": ai.risk_level,
        "details": ai.details,
        "created_at": ai.created_at.strftime("%Y-%m-%d %H:%M:%S")
    })

@app.route("/api/doctor/assign", methods=["POST"])
def assign_patient():
    data = request.json
    patient_id = data.get("patient_id")
    license_no = data.get("license_no")

    doctor = Doctor.query.filter_by(license_no=license_no).first()
    patient = Patient.query.get(patient_id)

    if not doctor or not patient:
        return jsonify({"error": "Invalid doctor or patient"}), 400

    patient.doctor_id = doctor.id
    db.session.commit()

    return jsonify({"message": "Patient assigned successfully"})

@app.route("/api/doctor/<license_no>/notification", methods=["POST"])
def add_notification(license_no):
    doctor = Doctor.query.filter_by(license_number=license_no).first()
    if not doctor:
        return jsonify({"error": "Doctor not found"}), 404

    data = request.json

    new_notif = Notification(
        doctor_id=doctor.id,
        title=data.get("title"),
        message=data.get("message"),
        time=data.get("time", "Just now")
    )

    db.session.add(new_notif)
    db.session.commit()

    return jsonify({"message": "Notification created successfully!"})

@app.route("/api/notifications/<license_no>")
def get_notifications(license_no):
    doctor = Doctor.query.filter_by(license_number=license_no).first()
    if not doctor:
        return jsonify({"error": "Doctor not found"}), 404

    notifs = [{
        "id": n.id,
        "title": n.title,
        "message": n.message,
        "time": n.time
    } for n in doctor.notifications]

    return jsonify(notifs)

# ------------------ MAIN ----------------------

if __name__ == "__main__":
    app.run(debug=True)
