
    /* ---------------------- THEME TOGGLE ---------------------- */
    
    function toggleTheme() {
        document.body.classList.toggle('dark-theme');
        const icon = document.getElementById('themeIcon');
        const toggle = document.getElementById('darkModeToggle');
        icon.className = document.body.classList.contains('dark-theme')
        ? 'fas fa-sun'
            : 'fas fa-moon';
            if (toggle) toggle.checked = document.body.classList.contains('dark-theme');
        }

    /* ---------------------- LOGOUT ---------------------- */
    function logout() {
        const confirmLogout = confirm("Are you sure you want to logout?");

        if (confirmLogout) {

            // 🧹 Clear localStorage keys
            localStorage.removeItem("doctor_license");
            localStorage.removeItem("patient_id");
            localStorage.removeItem("user_role");

            // Optional: clear all storage
            // localStorage.clear();

            // Message
            alert("Logged out successfully!");

            // Redirect to login page
            window.location.href = "/";
        }
    }

    /*----------------------- Add to My Patients ----------------------*/
    function addToMyPatients(patientName) {
        // Create toast element
        const toast = document.createElement("div");

        toast.classList.add("success-toast"); // Add CSS class instead of inline CSS

        toast.innerHTML = `
            <i class="fas fa-check-circle"></i>
            ${patientName} added successfully!
        `;

        document.body.appendChild(toast);

        // Auto remove
        setTimeout(() => {
            toast.classList.add("fade-out");
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }

    /* ---------------------- SEARCH PATIENTS ---------------------- */
    
    function searchPatients() {
        const searchValue = document.getElementById('patientSearchInput').value.trim().toLowerCase();
        const items = document.querySelectorAll('.patient-search-item');
        
        items.forEach(item => {
            const nameEl = item.querySelector('.patient-name');
            const idEl = item.querySelector('.patient-id');
            
            if (!nameEl || !idEl) return;
            
            const patientName = nameEl.textContent.toLowerCase();
            const patientId = idEl.textContent.toLowerCase();
            
            // Show item if matches name OR id
            const match = patientName.includes(searchValue) || patientId.includes(searchValue);
            
            item.style.display = match ? "flex" : "none";
        });
    }

   /* ---------------------- LOAD MY PATIENTS (FINAL VERSION) ---------------------- */
async function loadMyPatients() {
    const tbody = document.getElementById("myPatientsTableBody");
    const license = localStorage.getItem("doctor_license");

    // If doctor license not found
    if (!license) {
        tbody.innerHTML = `<tr><td colspan="7">Doctor license missing. Please login again.</td></tr>`;
        return;
    }

    // Loading state
    tbody.innerHTML = `<tr><td colspan="7">Loading patients...</td></tr>`;

    try {
        const res = await fetch(`/api/doctor/${license}/patients`);

        if (!res.ok) {
            tbody.innerHTML = `<tr><td colspan="7">Failed to load patient data.</td></tr>`;
            return;
        }

        const patients = await res.json();

        // If empty list
        if (!patients.length) {
            tbody.innerHTML = `<tr><td colspan="7">No patients assigned yet.</td></tr>`;
            return;
        }

        // Clear table
        tbody.innerHTML = "";

        // Render each patient
        patients.forEach(p => {
            tbody.innerHTML += `
                <tr onclick="showPatientDetails(${p.id})" style="cursor:pointer;">
                    <td>${p.name || "Unknown"}</td>
                    <td>${p.age || "-"}</td>
                    <td>${p.gender || "-"}</td>
                    <td>${p.last_visit || "No visit yet"}</td>
                    <td>${p.condition || "N/A"}</td>
                    <td><span class="status-badge success">Stable</span></td>

                    <td>
                        <button class="btn btn-secondary"
                            onclick="event.stopPropagation(); showPatientDetails(${p.id})">
                            View
                        </button>
                    </td>
                </tr>
            `;
        });

    } catch (err) {
        console.error("Error loading patients:", err);
        tbody.innerHTML = `<tr><td colspan="7">Error loading patient data.</td></tr>`;
    }
}
    /* ---------------------- PATIENT INFO MODAL ---------------------- */
    let currentPatientId = null;
    function viewPatientInfo(id, name, condition, duration, symptoms) {
        currentPatientId = id;
        currentPatientName = name;

        document.getElementById('modalPatientName').textContent = name + ' - Detailed Information';
        document.getElementById('modalCondition').textContent = condition;
        document.getElementById('modalDuration').textContent = duration;
        document.getElementById('modalSymptoms').textContent = symptoms;

        document.getElementById('patientInfoModal').classList.add('show');
    }

    function closeModal() {
        document.getElementById('patientInfoModal').classList.remove('show');
    }

    function addToMyPatientsUI(patientName) {
        const toast = document.createElement("div");

        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--success);
            color: white;
            padding: 14px 20px;
            border-radius: 10px;
            font-size: 15px;
            box-shadow: var(--shadow-lg);
            z-index: 2000;
            animation: fadeIn 0.3s ease;
        `;

        toast.innerHTML = `<i class="fas fa-check-circle"></i> ${patientName} added successfully!`;

        document.body.appendChild(toast);

        setTimeout(() => toast.remove(), 3000);
    }

    // document.getElementById("totalPatients").textContent = d.total_patients;
    // document.getElementById("todaysAppointments").textContent = d.today_appointments;
    // document.getElementById("aiReportsGenerated").textContent = d.ai_reports;
    // document.getElementById("pendingNotifications").textContent = d.notifications;
    
    function addToMyPatientsFromModal() {
        addToMyPatientsUI(currentPatientName);
        closeModal();
    }
    
    /* ---------------------- SAVE SETTINGS ---------------------- */
   async function saveProfileSettings() {
        const license = localStorage.getItem("doctor_license");

        if (!license) {
            alert("Error: Doctor license not found. Please login again.");
            return;
        }

        // Collect values from settings page
        const fullName = document.getElementById("settingDoctorName").value.trim();
        const specialization = document.getElementById("settingDoctorSpecialization").value.trim();
        const email = document.getElementById("settingDoctorEmail").value.trim();
        const phone = document.getElementById("settingDoctorPhone").value.trim();
        const experience = document.getElementById("settingDoctorExperience").value.trim();

        // Basic validation
        if (!fullName || !email || !phone) {
            alert("Please fill in all required fields.");
            return;
        }

        // Prepare data
        const body = {
            license_no: license,
            name: fullName,
            specialization: specialization,
            email: email,
            phone: phone,
            experience: experience
        };

        try {
            const res = await fetch("/api/doctor/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            const result = await res.json();

            if (!res.ok) {
                alert("Error updating profile: " + result.error);
                return;
            }

            // Success popup
            alert("Profile settings saved successfully!");

            // Update top bar immediately
            document.getElementById("doctorNameTop").textContent = fullName;
            document.getElementById("doctorNameMain").textContent = "Welcome back, Dr. " + fullName;
            document.getElementById("doctorSpecialization").textContent = specialization;

        } catch (err) {
            console.error("Update error:", err);
            alert("Something went wrong. Please try again.");
        }
    }
    
    /* ---------------------- PAGE SWITCHING ---------------------- */
    function showPage(pageName, event) {
        const pages = [
            'dashboard', 'opd', 'appointments', 'myPatients',
            'patientDetails', 'addPatient', 'notifications', 'settings'
        ];

        // Hide all pages
        pages.forEach(page => {
            const element = document.getElementById(page + 'Page');
            if (element) element.classList.add('hidden');
        });

        // Show selected page
        const targetPage = document.getElementById(pageName + 'Page');
        if (targetPage) targetPage.classList.remove('hidden');

        // Reset scroll
        window.scrollTo(0, 0);

        // Remove previous active highlights
        document.querySelectorAll('.menu-item, .submenu-item')
            .forEach(i => i.classList.remove('active'));

        // Highlight correct menu item (sidebar)
        if (event) {
            let clickedItem = event.target.closest(".menu-item") || event.target.closest(".submenu-item");
            if (clickedItem) clickedItem.classList.add("active");

            // If submenu-item is clicked → also highlight parent menu
            if (clickedItem.classList.contains("submenu-item")) {
                clickedItem.parentElement.previousElementSibling.classList.add("active");
            }
        }

        // Auto load doctors' patients
        if (pageName === "myPatients") loadMyPatients();
        if (pageName === "addPatient") {
            loadAllPatientsForAddPage();
        }

        // Close submenu automatically when navigating to other pages
        if (pageName !== "myPatients" && pageName !== "addPatient") {
            document.getElementById("patientsSubmenu").classList.remove("open");
        }
    }

    function openNotificationsPage() {
            showPage("notifications");   // Open notification tab
            loadNotifications();         // Load notifications dynamically
        }
    
    /* ---------------------- SUBMENU ---------------------- */
    function toggleSubmenu() {
        const submenu = document.getElementById("patientsSubmenu");
        const arrow = submenu.previousElementSibling.querySelector(".fa-chevron-down");

        // Toggle submenu open/close
        submenu.classList.toggle("open");

        // Rotate the arrow icon smoothly
        if (submenu.classList.contains("open")) {
            arrow.style.transform = "rotate(180deg)";
        } else {
            arrow.style.transform = "rotate(0deg)";
        }
    }
    
    /* ---------------------- TABS ---------------------- */
    function switchTab(tabName, event = null) {

        // Remove active class from all tabs
        document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));

        // Remove active from all tab contents
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        // Highlight clicked tab safely
        if (event && event.currentTarget) {
            event.currentTarget.classList.add('active');
        }

        // Activate selected content
        document.getElementById(tabName).classList.add('active');

        // Load chart only when switching to analysis tab
        if (tabName === 'analysis') {
            setTimeout(() => {
                initChart();
            }, 100);
        }
    }

    
    /* ---------------------- SHOW PATIENT DETAILS ---------------------- */
    async function showPatientDetails(patientId) {

        // Load UI page AFTER data is fetched
        showPage("patientDetails");

        try {
            const res = await fetch(`/api/patient/${patientId}`);

            if (!res.ok) {
                console.error("Failed to load patient details");
                alert("Unable to load patient details.");
                return;
            }

            const p = await res.json();

            // Update patient header info
            document.getElementById("patientName").textContent = p.name;

            document.getElementById("patientBasicInfo").textContent =
                `Patient ID: #${p.id} • Age: ${p.age} • ${p.gender}`;

            // Load additional records
            await loadReports(patientId);
            await loadHistory(patientId);
            await loadAI(patientId);

        } catch (error) {
            console.error("Error loading patient details:", error);
            alert("Something went wrong while loading patient information.");
        }
    }
    
    /* ---------------------- CHART ---------------------- */
    function initChart() {
        const canvas = document.getElementById("progressionChart");
        if (!canvas) {
            console.warn("progressionChart canvas not found.");
            return;
        }

        const ctx = canvas.getContext("2d");

        // Destroy old chart safely
        if (window.progressionChart && typeof window.progressionChart.destroy === "function") {
            window.progressionChart.destroy();
        }

        // Create new updated chart
        window.progressionChart = new Chart(ctx, {
            type: "line",
            data: {
                labels: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov"],
                datasets: [
                    {
                        label: "Cognitive Score",
                        data: [85, 83, 80, 78, 75, 72, 70, 68, 65, 63, 60],
                        borderColor: "#ef4444",
                        backgroundColor: "rgba(239,68,68,0.15)",
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: "Memory Score",
                        data: [80, 78, 75, 73, 70, 68, 65, 63, 60, 58, 55],
                        borderColor: "#f59e0b",
                        backgroundColor: "rgba(245,158,11,0.15)",
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: getComputedStyle(document.body).getPropertyValue('--text-primary') } }
                },
                scales: {
                    x: { ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-secondary') }},
                    y: { ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-secondary') }}
                }
            }
        });
    }

    
    /* ---------------------- ADD PATIENT FORM ---------------------- */
    document.getElementById('addPatientForm')?.addEventListener('submit', e => {
        e.preventDefault();
        alert('Patient added successfully!');
        showPage('myPatients');
    });
    
        
        /* ---------------------- LOAD REPORTS ---------------------- */
        async function loadReports(patientId) {
            const tbody = document.getElementById("reportsTableBody");

            // Show loading state
            tbody.innerHTML = `
                <tr><td colspan="4">Loading reports...</td></tr>
            `;

            try {
                const res = await fetch(`/api/patient/${patientId}/reports`);

                if (!res.ok) {
                    tbody.innerHTML = `
                        <tr><td colspan="4">Failed to load reports.</td></tr>
                    `;
                    return;
                }

                const reports = await res.json();

                // Empty Reports
                if (!reports.length) {
                    tbody.innerHTML = `
                        <tr><td colspan="4">No reports available.</td></tr>
                    `;
                    return;
                }

                // Clear table
                tbody.innerHTML = "";

                // Render reports
                reports.forEach(r => {
                    const fileLink = r.file ? 
                        `<a href="${r.file}" class="btn btn-secondary" download>Download</a>` :
                        `<span style="color: var(--text-secondary);">No file</span>`;

                    tbody.innerHTML += `
                        <tr>
                            <td>${r.report_type || "Unknown"}</td>
                            <td>${r.date || "N/A"}</td>
                            <td>
                                <span class="status-badge success">
                                    ${r.status || "Completed"}
                                </span>
                            </td>
                            <td>${fileLink}</td>
                        </tr>
                    `;
                });

            } catch (error) {
                console.error("Report load error:", error);
                tbody.innerHTML = `
                    <tr><td colspan="4">Error loading reports. Try again.</td></tr>
                `;
            }
        }
            
                /* ---------------------- LOAD HISTORY ---------------------- */
                async function loadHistory(patientId) {
                    const timeline = document.getElementById("patientHistoryTimeline");

                    // Show loading state
                    timeline.innerHTML = "<p>Loading medical history...</p>";

                    try {
                        const res = await fetch(`/api/patient/${patientId}/history`);

                        if (!res.ok) {
                            timeline.innerHTML = "<p>No medical history available.</p>";
                            return;
                        }

                        const history = await res.json();

                        // Check if empty
                        if (!history.length) {
                            timeline.innerHTML = "<p>No medical history recorded.</p>";
                            return;
                        }

                        // Clear timeline
                        timeline.innerHTML = "";

                        // Render items
                        history.forEach(h => {
                            timeline.innerHTML += `
                                <div class="timeline-item">
                                    <div class="timeline-content">
                                        <h4>${h.title || "Untitled Record"}</h4>
                                        <p><strong>Date:</strong> ${h.date || "Not provided"}</p>
                                        <p>${h.notes?.replace(/\n/g, "<br>") || "No additional notes"}</p>
                                    </div>
                                </div>
                            `;
                        });

                    } catch (error) {
                        console.error("History load error:", error);
                        timeline.innerHTML = "<p>Error loading history. Please try again.</p>";
                    }
                }
                    
                    /* ---------------------- LOAD AI ANALYSIS ---------------------- */
                 async function loadAI(patientId) {
                    const aiBox = document.getElementById("aiAnalysisContent");

                    // Show loading state
                    aiBox.innerHTML = "<p>Loading AI analysis...</p>";

                    try {
                        const res = await fetch(`/api/patient/${patientId}/analysis`);

                        if (!res.ok) {
                            aiBox.innerHTML = "<p>No AI report available.</p>";
                            return;
                        }

                        const ai = await res.json();

                        // Handle incomplete AI data safely
                        const diagnosis = ai.result || "Not Available";
                        const probability = ai.probability !== null ? ai.probability : "N/A";
                        const risk = ai.risk_level || "Unknown";
                        const details = ai.details ? ai.details.replace(/\n/g, "<br>") : "No detailed analysis available.";

                        aiBox.innerHTML = `
                            <h3><i class="fas fa-brain"></i> Diagnosis: ${diagnosis}</h3>
                            <p><strong>Probability:</strong> ${probability}%</p>
                            <p><strong>Risk Level:</strong> ${risk}</p>
                            <p style="margin-top:10px;">${details}</p>
                        `;

                    } catch (error) {
                        console.error("AI load error:", error);
                        aiBox.innerHTML = "<p>Error loading AI analysis. Please try again.</p>";
                    }
                }


    /* ---------------------- PAGE LOAD ---------------------- */
    window.addEventListener('load', () => {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.body.classList.add('dark-theme');
            document.getElementById('themeIcon').className = 'fas fa-sun';
            const toggle = document.getElementById('darkModeToggle');
            if (toggle) toggle.checked = true;
        }
        
        document.getElementById('patientInfoModal')?.addEventListener('click', e => {
            if (e.target === e.currentTarget) closeModal();
        });
        
        const style = document.createElement('style');
        style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(400px); opacity:0; }
                to { transform: translateX(0); opacity:1; }
                }`;
                document.head.appendChild(style);
                loadDoctorDetails();
            });
            
            async function loadDoctorDetails() {
            const license = localStorage.getItem("doctor_license");
            if (!license) {
                console.error("❌ Doctor license missing in localStorage");
                return;
            }

            // Fetch doctor details
            const res = await fetch(`/api/doctor/${license}`);
            const d = await res.json();
            if (!d || d.error) {
                console.error("❌ Doctor not found");
                return;
            }

            // ---------------------- TOP BAR ----------------------
            document.getElementById("doctorNameTop").textContent = d.name;
            document.getElementById("doctorSpecialization").textContent = d.specialization;

            // ---------------------- DASHBOARD HEADING ----------------------
            document.getElementById("doctorNameMain").textContent = "Welcome back, Dr. " + d.name;

            // ⭐⭐⭐ ADD THESE 4 LINES HERE ⭐⭐⭐
            document.getElementById("totalPatients").textContent = d.total_patients;
            document.getElementById("todaysAppointments").textContent = d.today_appointments;
            document.getElementById("aiReportsGenerated").textContent = d.ai_reports;
            document.getElementById("pendingNotifications").textContent = d.notifications;
            // ⭐⭐⭐ END ⭐⭐⭐

            // ---------------------- SETTINGS PAGE ----------------------
            document.getElementById("settingDoctorName").value = d.name;
            document.getElementById("settingDoctorSpecialization").value = d.specialization;
            document.getElementById("settingDoctorEmail").value = d.email;
            document.getElementById("settingDoctorPhone").value = d.phone;
            document.getElementById("settingDoctorLicense").value = d.license_no;
            document.getElementById("settingDoctorExperience").value = d.experience;

            // ---------------------- PROFILE AVATAR ----------------------
            if (d.profile_photo) {
                document.getElementById("doctorAvatar").src = d.profile_photo;
            } else {
                document.getElementById("doctorAvatar").src =
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(d.name)}&background=random`;
            }

            console.log("✔ Doctor details loaded:", d);
        }

        //---------------------- ASSIGN PATIENT TO DOCTOR ----------------------//
        async function assignPatient(patientId, patientName) {
            const license = localStorage.getItem("doctor_license");

            if (!license) {
                alert("Login expired. Please login again.");
                return;
            }

            const body = {
                license_no: license,
                patient_id: patientId
            };

            try {
                const res = await fetch("/api/doctor/add_patient", {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify(body)
                });

                const result = await res.json();

                if (!res.ok) {
                    alert("Error: " + result.error);
                    return;
                }

                addToMyPatients(patientName);   // UI Toast
                loadMyPatients();               // Refresh My Patients table

            } catch (err) {
                console.error(err);
                alert("Failed to add patient.");
            }
        }

        // ================ AI OPD PAGE PLACEHOLDER ================
        /* ---------------------- OPD WITH AI — MAIN FUNCTION ---------------------- */
            async function startOPD_AI() {
                const opdContainer = document.getElementById("opdAIContainer");

                opdContainer.innerHTML = `
                    <div style="padding:20px;text-align:center;">
                        <h2 style="margin-bottom:10px;">Starting AI-Powered OPD...</h2>
                        <p style="color:gray;">Please wait, preparing AI engine.</p>
                        <div class="spinner" style="margin-top:15px;"></div>
                    </div>
                `;

                try {
                    const res = await fetch("/api/opd/ai/start", { method: "POST" });

                    if (!res.ok) {
                        opdContainer.innerHTML = `
                            <div style="padding:20px;">
                                <h2>AI OPD Failed to Start</h2>
                                <p style="color:red;">Unable to initiate the AI system.</p>
                            </div>
                        `;
                        return;
                    }

                    const data = await res.json();

                    opdContainer.innerHTML = `
                        <div style="padding:20px;">
                            <h2><i class="fas fa-robot" style="color:var(--primary);"></i> AI OPD Ready</h2>
                            <p style="margin-top:10px; color:var(--text-secondary);">
                                The AI assistant is now active. Please upload patient data or start voice-based OPD.
                            </p>

                            <div style="margin-top:20px; display:flex; gap:20px; flex-wrap:wrap;">
                                
                                <button class="btn btn-primary" onclick="uploadOPDReport()">
                                    <i class="fas fa-upload"></i> Upload Report for Analysis
                                </button>

                                <button class="btn btn-secondary" onclick="startVoiceOPD()">
                                    <i class="fas fa-microphone"></i> Start Voice OPD
                                </button>

                            </div>

                            <div id="opdAIResult" style="margin-top:30px;"></div>
                        </div>
                    `;
                } catch (err) {
                    console.error("OPD error:", err);
                    opdContainer.innerHTML = `
                        <div style="padding:20px;">
                            <h2>Error</h2>
                            <p style="color:red;">Something went wrong. Please try later.</p>
                        </div>
                    `;
                }
            }

            /* =========================== UPLOAD OPD REPORT ========================= */

            async function uploadOPDReport() {
                const resultBox = document.getElementById("opdAIResult");

                // Open file selection
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".pdf,.jpg,.jpeg,.png";
                input.click();

                input.onchange = async () => {
                    const file = input.files[0];
                    if (!file) return;

                    const formData = new FormData();
                    formData.append("file", file);

                    resultBox.innerHTML = `<p>Analyzing report using AI...</p>`;

                    try {
                        const res = await fetch("/api/opd/ai/analyze", {
                            method: "POST",
                            body: formData
                        });

                        const data = await res.json();

                        resultBox.innerHTML = `
                            <div class="card" style="padding:20px;">
                                <h3><i class="fas fa-brain"></i> AI Diagnosis Result</h3>
                                <p><strong>Condition:</strong> ${data.condition}</p>
                                <p><strong>Probability:</strong> ${data.probability}%</p>
                                <p><strong>Risk Level:</strong> ${data.risk}</p>
                                <p style="margin-top:10px;">${data.details}</p>
                            </div>
                        `;

                    } catch (err) {
                        resultBox.innerHTML = `<p style="color:red;">Failed to analyze report.</p>`;
                    }
                };
            }

            // =========================== VOICE OPD ========================= //
            async function startVoiceOPD() {
                const resultBox = document.getElementById("opdAIResult");

                resultBox.innerHTML = `
                    <p><i class="fas fa-microphone" style="color:var(--primary);"></i> Listening...</p>
                `;

                const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
                recognition.lang = "en-US";
                recognition.start();

                recognition.onresult = async (e) => {
                    const voiceText = e.results[0][0].transcript;

                    resultBox.innerHTML = `<p>Processing: "${voiceText}"</p>`;

                    const res = await fetch("/api/opd/ai/voice", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ text: voiceText })
                    });

                    const data = await res.json();

                    resultBox.innerHTML = `
                        <div class="card" style="padding:20px;">
                            <h3><i class="fas fa-stethoscope"></i> AI OPD Summary</h3>
                            <p><strong>Symptoms:</strong> ${data.symptoms}</p>
                            <p><strong>Possible Condition:</strong> ${data.diagnosis}</p>
                            <p><strong>Confidence:</strong> ${data.confidence}%</p>
                            <p style="margin-top:10px;">${data.recommendation}</p>
                        </div>
                    `;
                };
            }

            /* ---------- 1) Fetch and load notifications ---------- */
            async function loadNotifications() {
                try {
                    const res = await fetch("/api/notifications");
                    const notifs = await res.json();

                    // Update Bell Counter
                    document.querySelector(".fa-bell + .badge").textContent = notifs.length;

                    // Render notification page UI
                    const page = document.getElementById("notificationsPage");
                    page.innerHTML = `
                        <div class="page-header">
                            <h1>Notifications</h1>
                            <p>Your latest alerts & system messages</p>
                        </div>

                        <div class="card">
                            <h3>Notification Center</h3>
                            <div id="notifyList" style="margin-top:20px;"></div>
                        </div>
                    `;

                    const list = document.getElementById("notifyList");

                    if (notifs.length === 0) {
                        list.innerHTML = `<p style="color:gray;">No notifications available.</p>`;
                        return;
                    }

                    // Render each notification
                    notifs.forEach(n => {
                        list.innerHTML += `
                            <div class="patient-item">
                                <i class="fas fa-bell" style="font-size:22px; color:var(--primary);"></i>

                                <div style="flex:1;">
                                    <h4>${n.title}</h4>
                                    <p style="color:gray;">${n.message}</p>
                                </div>

                                <span class="status-badge info">${n.time}</span>
                            </div>
                        `;
                    });

                } catch (err) {
                    console.error("Notification Error:", err);
                }
            }

            /* ---------- 2) Toast notification UI ---------- */
            function showToast(msg) {
                const toast = document.createElement("div");
                toast.classList.add("success-toast");

                toast.innerHTML = `
                    <i class="fas fa-check-circle"></i> ${msg}
                `;

                document.body.appendChild(toast);

                setTimeout(() => {
                    toast.classList.add("fade-out");
                    setTimeout(() => toast.remove(), 300);
                }, 2500);
            }

            /* ---------- 3) Auto-load notifications on page load ---------- */
            window.addEventListener("load", () => {
                loadNotifications();
            });

            function openAppointmentsPage() {
                showPage("appointments");
                loadAppointments(); // load all appointments automatically
            }

            async function loadAppointments(filter = "all") {
            const container = document.getElementById("appointmentsList");
            container.innerHTML = "<p>Loading appointments...</p>";

            try {
                const res = await fetch("/api/appointments");
                const appointments = await res.json();

                let today = new Date().toISOString().split("T")[0];
                let filtered = appointments;

                if (filter === "today") filtered = appointments.filter(a => a.date === today);
                if (filter === "upcoming") filtered = appointments.filter(a => a.date > today);
                if (filter === "past") filtered = appointments.filter(a => a.date < today);

                if (!filtered.length) {
                    container.innerHTML = "<p>No appointments found.</p>";
                    return;
                }

                // Render all appointments
                container.innerHTML = "";
                filtered.forEach(a => {
                    container.innerHTML += `
                        <div class="patient-item" onclick="openAppointmentModal(${a.id})">
                            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(a.patient)}&background=random" 
                                class="patient-avatar">

                            <div style="flex:1;">
                                <h4>${a.patient}</h4>
                                <p>${a.reason}</p>
                            </div>

                            <span class="status-badge info">${a.time}</span>
                        </div>
                    `;
                });

            } catch (err) {
                console.error(err);
                container.innerHTML = "<p style='color:red;'>Failed to load appointments.</p>";
            }
        }

            async function openAppointmentModal(id) {
                const res = await fetch(`/api/appointment/${id}`);
                const a = await res.json();

                alert(`
            Patient: ${a.patient}
            Date: ${a.date}
            Time: ${a.time}
            Reason: ${a.reason}
            Notes: ${a.notes || "No notes"}
                `);
            }

            async function openAppointmentModal(id) {
            const modal = document.getElementById("appointmentModal");
            const body = document.getElementById("appointmentModalBody");

            modal.classList.add("show");
            body.innerHTML = "<p>Loading...</p>";

            const res = await fetch(`/api/appointment/${id}`);
            const a = await res.json();

            body.innerHTML = `
                <div class="info-grid">
                    <div class="info-item">
                        <i class="fas fa-user"></i>
                        <div>
                            <p class="info-label">Patient</p>
                            <p class="info-value">${a.patient}</p>
                        </div>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-calendar"></i>
                        <div>
                            <p class="info-label">Date</p>
                            <p class="info-value">${a.date}</p>
                        </div>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-clock"></i>
                        <div>
                            <p class="info-label">Time</p>
                            <p class="info-value">${a.time}</p>
                        </div>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-stethoscope"></i>
                        <div>
                            <p class="info-label">Reason</p>
                            <p class="info-value">${a.reason}</p>
                        </div>
                    </div>
                </div>

                <h3 style="margin-top:20px;">Notes</h3>
                <p>${a.notes || "No notes provided."}</p>

                <h3 style="margin-top:20px;">Status</h3>
                <p><span class="status-badge info">${a.status}</span></p>
            `;

            document.getElementById("approveBtn").onclick = () => updateAppointmentStatus(id, "confirmed");
            document.getElementById("cancelBtn").onclick = () => updateAppointmentStatus(id, "cancelled");
        }


        function closeAppointmentModal() {
            document.getElementById("appointmentModal").classList.remove("show");
        }
        async function updateAppointmentStatus(id, status) {
            try {
                const res = await fetch(`/api/appointment/${id}/status`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status })
                });

                const result = await res.json();

                if (!res.ok) {
                    alert("Error: " + result.error);
                    return;
                }

                alert("Appointment status updated to " + status);
                closeAppointmentModal();
                loadAppointments(); // Refresh list

            } catch (err) {
                console.error(err);
                alert("Failed to update appointment status.");
            }
        }

        const searchInput = document.getElementById("globalSearchInput");
        const resultBox = document.getElementById("globalSearchResults");
        let searchTimer = null;

        searchInput.addEventListener("input", () => {
            const q = searchInput.value.trim();

            clearTimeout(searchTimer);

            if (!q) {
                resultBox.style.display = "none";
                return;
            }

            searchTimer = setTimeout(() => {
                runGlobalSearch(q);
            }, 300);
        });


        async function runGlobalSearch(q) {
            const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
            const data = await res.json();

            resultBox.style.display = "block";
            resultBox.innerHTML = "";

            if (
                data.patients.length === 0 &&
                data.appointments.length === 0 &&
                data.reports.length === 0
            ) {
                resultBox.innerHTML = `
                    <p style="text-align:center; padding:10px;">No results found</p>
                `;
                return;
            }

            // PATIENTS
            if (data.patients.length > 0) {
                resultBox.innerHTML += `<h4 style="margin-bottom:6px;">Patients</h4>`;
                data.patients.forEach(p => {
                    resultBox.innerHTML += `
                        <div onclick="openPatientFromSearch(${p.id})"
                            style="padding:8px; cursor:pointer; border-bottom:1px solid var(--border);">
                            <b>${p.name}</b>
                            <br>
                            <span style="font-size:12px; color:var(--text-secondary);">
                                ${p.condition || "No condition recorded"}
                            </span>
                        </div>
                    `;
                });
            }

            // APPOINTMENTS
            if (data.appointments.length > 0) {
                resultBox.innerHTML += `<h4 style="margin:10px 0 6px;">Appointments</h4>`;
                data.appointments.forEach(a => {
                    resultBox.innerHTML += `
                        <div onclick="openAppointmentFromSearch(${a.id})"
                            style="padding:8px; cursor:pointer; border-bottom:1px solid var(--border);">
                            <b>${a.patient}</b> • ${a.time}
                            <br>
                            <span style="font-size:12px; color:var(--text-secondary);">${a.reason}</span>
                        </div>
                    `;
                });
            }

            // REPORTS
            if (data.reports.length > 0) {
                resultBox.innerHTML += `<h4 style="margin:10px 0 6px;">AI Reports</h4>`;
                data.reports.forEach(r => {
                    resultBox.innerHTML += `
                        <div onclick="openReportFromSearch(${r.id})"
                            style="padding:8px; cursor:pointer; border-bottom:1px solid var(--border);">
                            <b>${r.title}</b>
                            <br>
                            <span style="font-size:12px; color:var(--text-secondary);">
                                ${r.patient} • ${r.probability}% Probability
                            </span>
                        </div>
                    `;
                });
            }
        }

        function openPatientFromSearch(id) {
            showPage('patientDetails');
            showPatientDetails(id);  // ✔ Correct function
            resultBox.style.display = "none";
        }

        function openAppointmentFromSearch(id) {
            openAppointmentModal(id);
            resultBox.style.display = "none";
        }

        function openReportFromSearch(id) {
            alert("Open AI Report ID: " + id);
            resultBox.style.display = "none";
        }

        /* ---------------------- LOAD ALL PATIENTS FOR ADD PAGE ---------------------- */
async function loadAllPatientsForAddPage() {
    const searchText = document.getElementById("patientSearchInput").value.trim().toLowerCase();
    const container = document.getElementById("searchResults");

    container.innerHTML = `
        <p style="padding:12px; color:gray;">Loading patients...</p>
    `;

    try {
        const res = await fetch("/api/patients/all");
        const allPatients = await res.json();

        // Filter by name, ID, or phone
        const patients = allPatients.filter(p =>
            p.name.toLowerCase().includes(searchText) ||
            String(p.id).includes(searchText)
        );

        if (patients.length === 0) {
            container.innerHTML = `
                <p style="padding:12px; color:red;">No patients found.</p>
            `;
            return;
        }

        container.innerHTML = "";

        patients.forEach(p => {
            container.innerHTML += `
                <div class="patient-search-item">
                    <div style="display:flex;align-items:center;gap:16px;flex:1;">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=random"
                             class="patient-avatar" 
                             style="width:60px;height:60px;border-radius:50%;">
                        
                        <div style="flex:1;">
                            <h4 style="margin-bottom:4px;">${p.name}</h4>
                            <p style="color:gray;font-size:14px;">
                                ID: #${p.id} • Age: ${p.age} • ${p.gender}
                            </p>
                        </div>
                    </div>

                    <div style="display:flex;gap:8px;">
                        <button class="btn btn-secondary"
                            onclick="viewPatientInfo('${p.id}', '${p.name}', 'N/A', 'N/A', 'N/A')">
                            <i class="fas fa-eye"></i> View
                        </button>

                        <button class="btn btn-primary"
                            onclick="assignPatient(${p.id}, '${p.name}')">
                            <i class="fas fa-plus"></i> Add
                        </button>
                    </div>
                </div>`
        });

    } catch (err) {
        console.error(err);
        container.innerHTML = `
            <p style="padding:12px; color:red;">Error loading patients.</p>
        `;
    }
}

async function loadDashboardTodaysAppointments() {
    const doctorId = localStorage.getItem("doctor_id");
    if (!doctorId) return;

    try {
        const res = await fetch(`http://127.0.0.1:5000/api/doctor/${doctorId}/appointments/today`);
        const data = await res.json();

        const container = document.getElementById("todaysAppointmentsContainer");
        container.innerHTML = "";

        if (data.appointments.length === 0) {
            container.innerHTML = `<p style="color:var(--text-secondary);">No appointments today</p>`;
            return;
        }

        data.appointments.forEach(a => {
            container.innerHTML += `
                <div class="patient-item">
                    <img src="https://ui-avatars.com/api/?name=${a.patient_name}&background=random"
                        class="patient-avatar">

                    <div class="patient-info" style="flex:1;">
                        <h4>${a.patient_name}</h4>
                        <p>${a.reason}</p>
                    </div>

                    <span class="status-badge success">${a.time}</span>
                </div>
            `;
        });

    } catch (err) {
        console.log("Error loading today's appointments:", err);
    }
}
window.onload = () => {
    loadDoctorDetails();
    loadDashboardTodaysAppointments();
};

    /* ---------------------- THEME TOGGLE ---------------------- */
    
    function toggleTheme() {
        document.body.classList.toggle('dark-theme');
        const icon = document.getElementById('themeIcon');
        const toggle = document.getElementById('darkModeToggle');
        icon.className = document.body.classList.contains('dark-theme')
        ? 'fas fa-sun'
            : 'fas fa-moon';
            if (toggle) toggle.checked = document.body.classList.contains('dark-theme');
        }

    /* ---------------------- LOGOUT ---------------------- */
    function logout() {
        const confirmLogout = confirm("Are you sure you want to logout?");

        if (confirmLogout) {

            // 🧹 Clear localStorage keys
            localStorage.removeItem("doctor_license");
            localStorage.removeItem("patient_id");
            localStorage.removeItem("user_role");

            // Optional: clear all storage
            // localStorage.clear();

            // Message
            alert("Logged out successfully!");

            // Redirect to login page
            window.location.href = "/";
        }
    }

    /*----------------------- Add to My Patients ----------------------*/
    function addToMyPatients(patientName) {
        // Create toast element
        const toast = document.createElement("div");

        toast.classList.add("success-toast"); // Add CSS class instead of inline CSS

        toast.innerHTML = `
            <i class="fas fa-check-circle"></i>
            ${patientName} added successfully!
        `;

        document.body.appendChild(toast);

        // Auto remove
        setTimeout(() => {
            toast.classList.add("fade-out");
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }

    /* ---------------------- SEARCH PATIENTS ---------------------- */
    
    function searchPatients() {
        const searchValue = document.getElementById('patientSearchInput').value.trim().toLowerCase();
        const items = document.querySelectorAll('.patient-search-item');
        
        items.forEach(item => {
            const nameEl = item.querySelector('.patient-name');
            const idEl = item.querySelector('.patient-id');
            
            if (!nameEl || !idEl) return;
            
            const patientName = nameEl.textContent.toLowerCase();
            const patientId = idEl.textContent.toLowerCase();
            
            // Show item if matches name OR id
            const match = patientName.includes(searchValue) || patientId.includes(searchValue);
            
            item.style.display = match ? "flex" : "none";
        });
    }

   /* ---------------------- LOAD MY PATIENTS (FINAL VERSION) ---------------------- */
async function loadMyPatients() {
    const tbody = document.getElementById("myPatientsTableBody");
    const license = localStorage.getItem("doctor_license");

    // If doctor license not found
    if (!license) {
        tbody.innerHTML = `<tr><td colspan="7">Doctor license missing. Please login again.</td></tr>`;
        return;
    }

    // Loading state
    tbody.innerHTML = `<tr><td colspan="7">Loading patients...</td></tr>`;

    try {
        const res = await fetch(`/api/doctor/${license}/patients`);

        if (!res.ok) {
            tbody.innerHTML = `<tr><td colspan="7">Failed to load patient data.</td></tr>`;
            return;
        }

        const patients = await res.json();

        // If empty list
        if (!patients.length) {
            tbody.innerHTML = `<tr><td colspan="7">No patients assigned yet.</td></tr>`;
            return;
        }

        // Clear table
        tbody.innerHTML = "";

        // Render each patient
        patients.forEach(p => {
            tbody.innerHTML += `
                <tr onclick="showPatientDetails(${p.id})" style="cursor:pointer;">
                    <td>${p.name || "Unknown"}</td>
                    <td>${p.age || "-"}</td>
                    <td>${p.gender || "-"}</td>
                    <td>${p.last_visit || "No visit yet"}</td>
                    <td>${p.condition || "N/A"}</td>
                    <td><span class="status-badge success">Stable</span></td>

                    <td>
                        <button class="btn btn-secondary"
                            onclick="event.stopPropagation(); showPatientDetails(${p.id})">
                            View
                        </button>
                    </td>
                </tr>
            `;
        });

    } catch (err) {
        console.error("Error loading patients:", err);
        tbody.innerHTML = `<tr><td colspan="7">Error loading patient data.</td></tr>`;
    }
}
    /* ---------------------- PATIENT INFO MODAL ---------------------- */
    let currentPatientId = null;
    function viewPatientInfo(id, name, condition, duration, symptoms) {
        currentPatientId = id;
        currentPatientName = name;

        document.getElementById('modalPatientName').textContent = name + ' - Detailed Information';
        document.getElementById('modalCondition').textContent = condition;
        document.getElementById('modalDuration').textContent = duration;
        document.getElementById('modalSymptoms').textContent = symptoms;

        document.getElementById('patientInfoModal').classList.add('show');
    }

    function closeModal() {
        document.getElementById('patientInfoModal').classList.remove('show');
    }

    function addToMyPatientsUI(patientName) {
        const toast = document.createElement("div");

        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--success);
            color: white;
            padding: 14px 20px;
            border-radius: 10px;
            font-size: 15px;
            box-shadow: var(--shadow-lg);
            z-index: 2000;
            animation: fadeIn 0.3s ease;
        `;

        toast.innerHTML = `<i class="fas fa-check-circle"></i> ${patientName} added successfully!`;

        document.body.appendChild(toast);

        setTimeout(() => toast.remove(), 3000);
    }

    // document.getElementById("totalPatients").textContent = d.total_patients;
    // document.getElementById("todaysAppointments").textContent = d.today_appointments;
    // document.getElementById("aiReportsGenerated").textContent = d.ai_reports;
    // document.getElementById("pendingNotifications").textContent = d.notifications;
    
    function addToMyPatientsFromModal() {
        addToMyPatientsUI(currentPatientName);
        closeModal();
    }
    
    /* ---------------------- SAVE SETTINGS ---------------------- */
   async function saveProfileSettings() {
        const license = localStorage.getItem("doctor_license");

        if (!license) {
            alert("Error: Doctor license not found. Please login again.");
            return;
        }

        // Collect values from settings page
        const fullName = document.getElementById("settingDoctorName").value.trim();
        const specialization = document.getElementById("settingDoctorSpecialization").value.trim();
        const email = document.getElementById("settingDoctorEmail").value.trim();
        const phone = document.getElementById("settingDoctorPhone").value.trim();
        const experience = document.getElementById("settingDoctorExperience").value.trim();

        // Basic validation
        if (!fullName || !email || !phone) {
            alert("Please fill in all required fields.");
            return;
        }

        // Prepare data
        const body = {
            license_no: license,
            name: fullName,
            specialization: specialization,
            email: email,
            phone: phone,
            experience: experience
        };

        try {
            const res = await fetch("/api/doctor/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            const result = await res.json();

            if (!res.ok) {
                alert("Error updating profile: " + result.error);
                return;
            }

            // Success popup
            alert("Profile settings saved successfully!");

            // Update top bar immediately
            document.getElementById("doctorNameTop").textContent = fullName;
            document.getElementById("doctorNameMain").textContent = "Welcome back, Dr. " + fullName;
            document.getElementById("doctorSpecialization").textContent = specialization;

        } catch (err) {
            console.error("Update error:", err);
            alert("Something went wrong. Please try again.");
        }
    }
    
    /* ---------------------- PAGE SWITCHING ---------------------- */
    function showPage(pageName, event) {
        const pages = [
            'dashboard', 'opd', 'appointments', 'myPatients',
            'patientDetails', 'addPatient', 'notifications', 'settings'
        ];

        // Hide all pages
        pages.forEach(page => {
            const element = document.getElementById(page + 'Page');
            if (element) element.classList.add('hidden');
        });

        // Show selected page
        const targetPage = document.getElementById(pageName + 'Page');
        if (targetPage) targetPage.classList.remove('hidden');

        // Reset scroll
        window.scrollTo(0, 0);

        // Remove previous active highlights
        document.querySelectorAll('.menu-item, .submenu-item')
            .forEach(i => i.classList.remove('active'));

        // Highlight correct menu item (sidebar)
        if (event) {
            let clickedItem = event.target.closest(".menu-item") || event.target.closest(".submenu-item");
            if (clickedItem) clickedItem.classList.add("active");

            // If submenu-item is clicked → also highlight parent menu
            if (clickedItem.classList.contains("submenu-item")) {
                clickedItem.parentElement.previousElementSibling.classList.add("active");
            }
        }

        // Auto load doctors' patients
        if (pageName === "myPatients") loadMyPatients();
        if (pageName === "addPatient") {
            loadAllPatientsForAddPage();
        }

        // Close submenu automatically when navigating to other pages
        if (pageName !== "myPatients" && pageName !== "addPatient") {
            document.getElementById("patientsSubmenu").classList.remove("open");
        }
    }

    function openNotificationsPage() {
            showPage("notifications");   // Open notification tab
            loadNotifications();         // Load notifications dynamically
        }
    
    /* ---------------------- SUBMENU ---------------------- */
    function toggleSubmenu() {
        const submenu = document.getElementById("patientsSubmenu");
        const arrow = submenu.previousElementSibling.querySelector(".fa-chevron-down");

        // Toggle submenu open/close
        submenu.classList.toggle("open");

        // Rotate the arrow icon smoothly
        if (submenu.classList.contains("open")) {
            arrow.style.transform = "rotate(180deg)";
        } else {
            arrow.style.transform = "rotate(0deg)";
        }
    }
    
    /* ---------------------- TABS ---------------------- */
    function switchTab(tabName, event = null) {

        // Remove active class from all tabs
        document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));

        // Remove active from all tab contents
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        // Highlight clicked tab safely
        if (event && event.currentTarget) {
            event.currentTarget.classList.add('active');
        }

        // Activate selected content
        document.getElementById(tabName).classList.add('active');

        // Load chart only when switching to analysis tab
        if (tabName === 'analysis') {
            setTimeout(() => {
                initChart();
            }, 100);
        }
    }

    
    /* ---------------------- SHOW PATIENT DETAILS ---------------------- */
    async function showPatientDetails(patientId) {

        // Load UI page AFTER data is fetched
        showPage("patientDetails");

        try {
            const res = await fetch(`/api/patient/${patientId}`);

            if (!res.ok) {
                console.error("Failed to load patient details");
                alert("Unable to load patient details.");
                return;
            }

            const p = await res.json();

            // Update patient header info
            document.getElementById("patientName").textContent = p.name;

            document.getElementById("patientBasicInfo").textContent =
                `Patient ID: #${p.id} • Age: ${p.age} • ${p.gender}`;

            // Load additional records
            await loadReports(patientId);
            await loadHistory(patientId);
            await loadAI(patientId);

        } catch (error) {
            console.error("Error loading patient details:", error);
            alert("Something went wrong while loading patient information.");
        }
    }
    
    /* ---------------------- CHART ---------------------- */
    function initChart() {
        const canvas = document.getElementById("progressionChart");
        if (!canvas) {
            console.warn("progressionChart canvas not found.");
            return;
        }

        const ctx = canvas.getContext("2d");

        // Destroy old chart safely
        if (window.progressionChart && typeof window.progressionChart.destroy === "function") {
            window.progressionChart.destroy();
        }

        // Create new updated chart
        window.progressionChart = new Chart(ctx, {
            type: "line",
            data: {
                labels: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov"],
                datasets: [
                    {
                        label: "Cognitive Score",
                        data: [85, 83, 80, 78, 75, 72, 70, 68, 65, 63, 60],
                        borderColor: "#ef4444",
                        backgroundColor: "rgba(239,68,68,0.15)",
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: "Memory Score",
                        data: [80, 78, 75, 73, 70, 68, 65, 63, 60, 58, 55],
                        borderColor: "#f59e0b",
                        backgroundColor: "rgba(245,158,11,0.15)",
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: getComputedStyle(document.body).getPropertyValue('--text-primary') } }
                },
                scales: {
                    x: { ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-secondary') }},
                    y: { ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-secondary') }}
                }
            }
        });
    }

    
    /* ---------------------- ADD PATIENT FORM ---------------------- */
    document.getElementById('addPatientForm')?.addEventListener('submit', e => {
        e.preventDefault();
        alert('Patient added successfully!');
        showPage('myPatients');
    });
    
        
        /* ---------------------- LOAD REPORTS ---------------------- */
        async function loadReports(patientId) {
            const tbody = document.getElementById("reportsTableBody");

            // Show loading state
            tbody.innerHTML = `
                <tr><td colspan="4">Loading reports...</td></tr>
            `;

            try {
                const res = await fetch(`/api/patient/${patientId}/reports`);

                if (!res.ok) {
                    tbody.innerHTML = `
                        <tr><td colspan="4">Failed to load reports.</td></tr>
                    `;
                    return;
                }

                const reports = await res.json();

                // Empty Reports
                if (!reports.length) {
                    tbody.innerHTML = `
                        <tr><td colspan="4">No reports available.</td></tr>
                    `;
                    return;
                }

                // Clear table
                tbody.innerHTML = "";

                // Render reports
                reports.forEach(r => {
                    const fileLink = r.file ? 
                        `<a href="${r.file}" class="btn btn-secondary" download>Download</a>` :
                        `<span style="color: var(--text-secondary);">No file</span>`;

                    tbody.innerHTML += `
                        <tr>
                            <td>${r.report_type || "Unknown"}</td>
                            <td>${r.date || "N/A"}</td>
                            <td>
                                <span class="status-badge success">
                                    ${r.status || "Completed"}
                                </span>
                            </td>
                            <td>${fileLink}</td>
                        </tr>
                    `;
                });

            } catch (error) {
                console.error("Report load error:", error);
                tbody.innerHTML = `
                    <tr><td colspan="4">Error loading reports. Try again.</td></tr>
                `;
            }
        }
            
                /* ---------------------- LOAD HISTORY ---------------------- */
                async function loadHistory(patientId) {
                    const timeline = document.getElementById("patientHistoryTimeline");

                    // Show loading state
                    timeline.innerHTML = "<p>Loading medical history...</p>";

                    try {
                        const res = await fetch(`/api/patient/${patientId}/history`);

                        if (!res.ok) {
                            timeline.innerHTML = "<p>No medical history available.</p>";
                            return;
                        }

                        const history = await res.json();

                        // Check if empty
                        if (!history.length) {
                            timeline.innerHTML = "<p>No medical history recorded.</p>";
                            return;
                        }

                        // Clear timeline
                        timeline.innerHTML = "";

                        // Render items
                        history.forEach(h => {
                            timeline.innerHTML += `
                                <div class="timeline-item">
                                    <div class="timeline-content">
                                        <h4>${h.title || "Untitled Record"}</h4>
                                        <p><strong>Date:</strong> ${h.date || "Not provided"}</p>
                                        <p>${h.notes?.replace(/\n/g, "<br>") || "No additional notes"}</p>
                                    </div>
                                </div>
                            `;
                        });

                    } catch (error) {
                        console.error("History load error:", error);
                        timeline.innerHTML = "<p>Error loading history. Please try again.</p>";
                    }
                }
                    
                    /* ---------------------- LOAD AI ANALYSIS ---------------------- */
                 async function loadAI(patientId) {
                    const aiBox = document.getElementById("aiAnalysisContent");

                    // Show loading state
                    aiBox.innerHTML = "<p>Loading AI analysis...</p>";

                    try {
                        const res = await fetch(`/api/patient/${patientId}/analysis`);

                        if (!res.ok) {
                            aiBox.innerHTML = "<p>No AI report available.</p>";
                            return;
                        }

                        const ai = await res.json();

                        // Handle incomplete AI data safely
                        const diagnosis = ai.result || "Not Available";
                        const probability = ai.probability !== null ? ai.probability : "N/A";
                        const risk = ai.risk_level || "Unknown";
                        const details = ai.details ? ai.details.replace(/\n/g, "<br>") : "No detailed analysis available.";

                        aiBox.innerHTML = `
                            <h3><i class="fas fa-brain"></i> Diagnosis: ${diagnosis}</h3>
                            <p><strong>Probability:</strong> ${probability}%</p>
                            <p><strong>Risk Level:</strong> ${risk}</p>
                            <p style="margin-top:10px;">${details}</p>
                        `;

                    } catch (error) {
                        console.error("AI load error:", error);
                        aiBox.innerHTML = "<p>Error loading AI analysis. Please try again.</p>";
                    }
                }


    /* ---------------------- PAGE LOAD ---------------------- */
    window.addEventListener('load', () => {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.body.classList.add('dark-theme');
            document.getElementById('themeIcon').className = 'fas fa-sun';
            const toggle = document.getElementById('darkModeToggle');
            if (toggle) toggle.checked = true;
        }
        
        document.getElementById('patientInfoModal')?.addEventListener('click', e => {
            if (e.target === e.currentTarget) closeModal();
        });
        
        const style = document.createElement('style');
        style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(400px); opacity:0; }
                to { transform: translateX(0); opacity:1; }
                }`;
                document.head.appendChild(style);
                loadDoctorDetails();
            });
            
            async function loadDoctorDetails() {
            const license = localStorage.getItem("doctor_license");
            if (!license) {
                console.error("❌ Doctor license missing in localStorage");
                return;
            }

            // Fetch doctor details
            const res = await fetch(`/api/doctor/${license}`);
            const d = await res.json();
            if (!d || d.error) {
                console.error("❌ Doctor not found");
                return;
            }

            // ---------------------- TOP BAR ----------------------
            document.getElementById("doctorNameTop").textContent = d.name;
            document.getElementById("doctorSpecialization").textContent = d.specialization;

            // ---------------------- DASHBOARD HEADING ----------------------
            document.getElementById("doctorNameMain").textContent = "Welcome back, Dr. " + d.name;

            // ⭐⭐⭐ ADD THESE 4 LINES HERE ⭐⭐⭐
            document.getElementById("totalPatients").textContent = d.total_patients;
            document.getElementById("todaysAppointments").textContent = d.today_appointments;
            document.getElementById("aiReportsGenerated").textContent = d.ai_reports;
            document.getElementById("pendingNotifications").textContent = d.notifications;
            // ⭐⭐⭐ END ⭐⭐⭐

            // ---------------------- SETTINGS PAGE ----------------------
            document.getElementById("settingDoctorName").value = d.name;
            document.getElementById("settingDoctorSpecialization").value = d.specialization;
            document.getElementById("settingDoctorEmail").value = d.email;
            document.getElementById("settingDoctorPhone").value = d.phone;
            document.getElementById("settingDoctorLicense").value = d.license_no;
            document.getElementById("settingDoctorExperience").value = d.experience;

            // ---------------------- PROFILE AVATAR ----------------------
            if (d.profile_photo) {
                document.getElementById("doctorAvatar").src = d.profile_photo;
            } else {
                document.getElementById("doctorAvatar").src =
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(d.name)}&background=random`;
            }

            console.log("✔ Doctor details loaded:", d);
        }

        //---------------------- ASSIGN PATIENT TO DOCTOR ----------------------//
        async function assignPatient(patientId, patientName) {
            const license = localStorage.getItem("doctor_license");

            if (!license) {
                alert("Login expired. Please login again.");
                return;
            }

            const body = {
                license_no: license,
                patient_id: patientId
            };

            try {
                const res = await fetch("/api/doctor/add_patient", {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify(body)
                });

                const result = await res.json();

                if (!res.ok) {
                    alert("Error: " + result.error);
                    return;
                }

                addToMyPatients(patientName);   // UI Toast
                loadMyPatients();               // Refresh My Patients table

            } catch (err) {
                console.error(err);
                alert("Failed to add patient.");
            }
        }

        // ================ AI OPD PAGE PLACEHOLDER ================
        /* ---------------------- OPD WITH AI — MAIN FUNCTION ---------------------- */
            async function startOPD_AI() {
                const opdContainer = document.getElementById("opdAIContainer");

                opdContainer.innerHTML = `
                    <div style="padding:20px;text-align:center;">
                        <h2 style="margin-bottom:10px;">Starting AI-Powered OPD...</h2>
                        <p style="color:gray;">Please wait, preparing AI engine.</p>
                        <div class="spinner" style="margin-top:15px;"></div>
                    </div>
                `;

                try {
                    const res = await fetch("/api/opd/ai/start", { method: "POST" });

                    if (!res.ok) {
                        opdContainer.innerHTML = `
                            <div style="padding:20px;">
                                <h2>AI OPD Failed to Start</h2>
                                <p style="color:red;">Unable to initiate the AI system.</p>
                            </div>
                        `;
                        return;
                    }

                    const data = await res.json();

                    opdContainer.innerHTML = `
                        <div style="padding:20px;">
                            <h2><i class="fas fa-robot" style="color:var(--primary);"></i> AI OPD Ready</h2>
                            <p style="margin-top:10px; color:var(--text-secondary);">
                                The AI assistant is now active. Please upload patient data or start voice-based OPD.
                            </p>

                            <div style="margin-top:20px; display:flex; gap:20px; flex-wrap:wrap;">
                                
                                <button class="btn btn-primary" onclick="uploadOPDReport()">
                                    <i class="fas fa-upload"></i> Upload Report for Analysis
                                </button>

                                <button class="btn btn-secondary" onclick="startVoiceOPD()">
                                    <i class="fas fa-microphone"></i> Start Voice OPD
                                </button>

                            </div>

                            <div id="opdAIResult" style="margin-top:30px;"></div>
                        </div>
                    `;
                } catch (err) {
                    console.error("OPD error:", err);
                    opdContainer.innerHTML = `
                        <div style="padding:20px;">
                            <h2>Error</h2>
                            <p style="color:red;">Something went wrong. Please try later.</p>
                        </div>
                    `;
                }
            }

            /* =========================== UPLOAD OPD REPORT ========================= */

            async function uploadOPDReport() {
                const resultBox = document.getElementById("opdAIResult");

                // Open file selection
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".pdf,.jpg,.jpeg,.png";
                input.click();

                input.onchange = async () => {
                    const file = input.files[0];
                    if (!file) return;

                    const formData = new FormData();
                    formData.append("file", file);

                    resultBox.innerHTML = `<p>Analyzing report using AI...</p>`;

                    try {
                        const res = await fetch("/api/opd/ai/analyze", {
                            method: "POST",
                            body: formData
                        });

                        const data = await res.json();

                        resultBox.innerHTML = `
                            <div class="card" style="padding:20px;">
                                <h3><i class="fas fa-brain"></i> AI Diagnosis Result</h3>
                                <p><strong>Condition:</strong> ${data.condition}</p>
                                <p><strong>Probability:</strong> ${data.probability}%</p>
                                <p><strong>Risk Level:</strong> ${data.risk}</p>
                                <p style="margin-top:10px;">${data.details}</p>
                            </div>
                        `;

                    } catch (err) {
                        resultBox.innerHTML = `<p style="color:red;">Failed to analyze report.</p>`;
                    }
                };
            }

            // =========================== VOICE OPD ========================= //
            async function startVoiceOPD() {
                const resultBox = document.getElementById("opdAIResult");

                resultBox.innerHTML = `
                    <p><i class="fas fa-microphone" style="color:var(--primary);"></i> Listening...</p>
                `;

                const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
                recognition.lang = "en-US";
                recognition.start();

                recognition.onresult = async (e) => {
                    const voiceText = e.results[0][0].transcript;

                    resultBox.innerHTML = `<p>Processing: "${voiceText}"</p>`;

                    const res = await fetch("/api/opd/ai/voice", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ text: voiceText })
                    });

                    const data = await res.json();

                    resultBox.innerHTML = `
                        <div class="card" style="padding:20px;">
                            <h3><i class="fas fa-stethoscope"></i> AI OPD Summary</h3>
                            <p><strong>Symptoms:</strong> ${data.symptoms}</p>
                            <p><strong>Possible Condition:</strong> ${data.diagnosis}</p>
                            <p><strong>Confidence:</strong> ${data.confidence}%</p>
                            <p style="margin-top:10px;">${data.recommendation}</p>
                        </div>
                    `;
                };
            }

            /* ---------- 1) Fetch and load notifications ---------- */
            async function loadNotifications() {
                try {
                    const res = await fetch("/api/notifications");
                    const notifs = await res.json();

                    // Update Bell Counter
                    document.querySelector(".fa-bell + .badge").textContent = notifs.length;

                    // Render notification page UI
                    const page = document.getElementById("notificationsPage");
                    page.innerHTML = `
                        <div class="page-header">
                            <h1>Notifications</h1>
                            <p>Your latest alerts & system messages</p>
                        </div>

                        <div class="card">
                            <h3>Notification Center</h3>
                            <div id="notifyList" style="margin-top:20px;"></div>
                        </div>
                    `;

                    const list = document.getElementById("notifyList");

                    if (notifs.length === 0) {
                        list.innerHTML = `<p style="color:gray;">No notifications available.</p>`;
                        return;
                    }

                    // Render each notification
                    notifs.forEach(n => {
                        list.innerHTML += `
                            <div class="patient-item">
                                <i class="fas fa-bell" style="font-size:22px; color:var(--primary);"></i>

                                <div style="flex:1;">
                                    <h4>${n.title}</h4>
                                    <p style="color:gray;">${n.message}</p>
                                </div>

                                <span class="status-badge info">${n.time}</span>
                            </div>
                        `;
                    });

                } catch (err) {
                    console.error("Notification Error:", err);
                }
            }

            /* ---------- 2) Toast notification UI ---------- */
            function showToast(msg) {
                const toast = document.createElement("div");
                toast.classList.add("success-toast");

                toast.innerHTML = `
                    <i class="fas fa-check-circle"></i> ${msg}
                `;

                document.body.appendChild(toast);

                setTimeout(() => {
                    toast.classList.add("fade-out");
                    setTimeout(() => toast.remove(), 300);
                }, 2500);
            }

            /* ---------- 3) Auto-load notifications on page load ---------- */
            window.addEventListener("load", () => {
                loadNotifications();
            });

            function openAppointmentsPage() {
                showPage("appointments");
                loadAppointments(); // load all appointments automatically
            }

            async function loadAppointments(filter = "all") {
            const container = document.getElementById("appointmentsList");
            container.innerHTML = "<p>Loading appointments...</p>";

            try {
                const res = await fetch("/api/appointments");
                const appointments = await res.json();

                let today = new Date().toISOString().split("T")[0];
                let filtered = appointments;

                if (filter === "today") filtered = appointments.filter(a => a.date === today);
                if (filter === "upcoming") filtered = appointments.filter(a => a.date > today);
                if (filter === "past") filtered = appointments.filter(a => a.date < today);

                if (!filtered.length) {
                    container.innerHTML = "<p>No appointments found.</p>";
                    return;
                }

                // Render all appointments
                container.innerHTML = "";
                filtered.forEach(a => {
                    container.innerHTML += `
                        <div class="patient-item" onclick="openAppointmentModal(${a.id})">
                            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(a.patient)}&background=random" 
                                class="patient-avatar">

                            <div style="flex:1;">
                                <h4>${a.patient}</h4>
                                <p>${a.reason}</p>
                            </div>

                            <span class="status-badge info">${a.time}</span>
                        </div>
                    `;
                });

            } catch (err) {
                console.error(err);
                container.innerHTML = "<p style='color:red;'>Failed to load appointments.</p>";
            }
        }

            async function openAppointmentModal(id) {
                const res = await fetch(`/api/appointment/${id}`);
                const a = await res.json();

                alert(`
            Patient: ${a.patient}
            Date: ${a.date}
            Time: ${a.time}
            Reason: ${a.reason}
            Notes: ${a.notes || "No notes"}
                `);
            }

            async function openAppointmentModal(id) {
            const modal = document.getElementById("appointmentModal");
            const body = document.getElementById("appointmentModalBody");

            modal.classList.add("show");
            body.innerHTML = "<p>Loading...</p>";

            const res = await fetch(`/api/appointment/${id}`);
            const a = await res.json();

            body.innerHTML = `
                <div class="info-grid">
                    <div class="info-item">
                        <i class="fas fa-user"></i>
                        <div>
                            <p class="info-label">Patient</p>
                            <p class="info-value">${a.patient}</p>
                        </div>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-calendar"></i>
                        <div>
                            <p class="info-label">Date</p>
                            <p class="info-value">${a.date}</p>
                        </div>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-clock"></i>
                        <div>
                            <p class="info-label">Time</p>
                            <p class="info-value">${a.time}</p>
                        </div>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-stethoscope"></i>
                        <div>
                            <p class="info-label">Reason</p>
                            <p class="info-value">${a.reason}</p>
                        </div>
                    </div>
                </div>

                <h3 style="margin-top:20px;">Notes</h3>
                <p>${a.notes || "No notes provided."}</p>

                <h3 style="margin-top:20px;">Status</h3>
                <p><span class="status-badge info">${a.status}</span></p>
            `;

            document.getElementById("approveBtn").onclick = () => updateAppointmentStatus(id, "confirmed");
            document.getElementById("cancelBtn").onclick = () => updateAppointmentStatus(id, "cancelled");
        }


        function closeAppointmentModal() {
            document.getElementById("appointmentModal").classList.remove("show");
        }
        async function updateAppointmentStatus(id, status) {
            try {
                const res = await fetch(`/api/appointment/${id}/status`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status })
                });

                const result = await res.json();

                if (!res.ok) {
                    alert("Error: " + result.error);
                    return;
                }

                alert("Appointment status updated to " + status);
                closeAppointmentModal();
                loadAppointments(); // Refresh list

            } catch (err) {
                console.error(err);
                alert("Failed to update appointment status.");
            }
        }

        const searchInput = document.getElementById("globalSearchInput");
        const resultBox = document.getElementById("globalSearchResults");
        let searchTimer = null;

        searchInput.addEventListener("input", () => {
            const q = searchInput.value.trim();

            clearTimeout(searchTimer);

            if (!q) {
                resultBox.style.display = "none";
                return;
            }

            searchTimer = setTimeout(() => {
                runGlobalSearch(q);
            }, 300);
        });


        async function runGlobalSearch(q) {
            const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
            const data = await res.json();

            resultBox.style.display = "block";
            resultBox.innerHTML = "";

            if (
                data.patients.length === 0 &&
                data.appointments.length === 0 &&
                data.reports.length === 0
            ) {
                resultBox.innerHTML = `
                    <p style="text-align:center; padding:10px;">No results found</p>
                `;
                return;
            }

            // PATIENTS
            if (data.patients.length > 0) {
                resultBox.innerHTML += `<h4 style="margin-bottom:6px;">Patients</h4>`;
                data.patients.forEach(p => {
                    resultBox.innerHTML += `
                        <div onclick="openPatientFromSearch(${p.id})"
                            style="padding:8px; cursor:pointer; border-bottom:1px solid var(--border);">
                            <b>${p.name}</b>
                            <br>
                            <span style="font-size:12px; color:var(--text-secondary);">
                                ${p.condition || "No condition recorded"}
                            </span>
                        </div>
                    `;
                });
            }

            // APPOINTMENTS
            if (data.appointments.length > 0) {
                resultBox.innerHTML += `<h4 style="margin:10px 0 6px;">Appointments</h4>`;
                data.appointments.forEach(a => {
                    resultBox.innerHTML += `
                        <div onclick="openAppointmentFromSearch(${a.id})"
                            style="padding:8px; cursor:pointer; border-bottom:1px solid var(--border);">
                            <b>${a.patient}</b> • ${a.time}
                            <br>
                            <span style="font-size:12px; color:var(--text-secondary);">${a.reason}</span>
                        </div>
                    `;
                });
            }

            // REPORTS
            if (data.reports.length > 0) {
                resultBox.innerHTML += `<h4 style="margin:10px 0 6px;">AI Reports</h4>`;
                data.reports.forEach(r => {
                    resultBox.innerHTML += `
                        <div onclick="openReportFromSearch(${r.id})"
                            style="padding:8px; cursor:pointer; border-bottom:1px solid var(--border);">
                            <b>${r.title}</b>
                            <br>
                            <span style="font-size:12px; color:var(--text-secondary);">
                                ${r.patient} • ${r.probability}% Probability
                            </span>
                        </div>
                    `;
                });
            }
        }

        function openPatientFromSearch(id) {
            showPage('patientDetails');
            showPatientDetails(id);  // ✔ Correct function
            resultBox.style.display = "none";
        }

        function openAppointmentFromSearch(id) {
            openAppointmentModal(id);
            resultBox.style.display = "none";
        }

        function openReportFromSearch(id) {
            alert("Open AI Report ID: " + id);
            resultBox.style.display = "none";
        }

        /* ---------------------- LOAD ALL PATIENTS FOR ADD PAGE ---------------------- */
async function loadAllPatientsForAddPage() {
    const searchText = document.getElementById("patientSearchInput").value.trim().toLowerCase();
    const container = document.getElementById("searchResults");

    container.innerHTML = `
        <p style="padding:12px; color:gray;">Loading patients...</p>
    `;

    try {
        const res = await fetch("/api/patients/all");
        const allPatients = await res.json();

        // Filter by name, ID, or phone
        const patients = allPatients.filter(p =>
            p.name.toLowerCase().includes(searchText) ||
            String(p.id).includes(searchText)
        );

        if (patients.length === 0) {
            container.innerHTML = `
                <p style="padding:12px; color:red;">No patients found.</p>
            `;
            return;
        }

        container.innerHTML = "";

        patients.forEach(p => {
            container.innerHTML += `
                <div class="patient-search-item">
                    <div style="display:flex;align-items:center;gap:16px;flex:1;">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=random"
                             class="patient-avatar" 
                             style="width:60px;height:60px;border-radius:50%;">
                        
                        <div style="flex:1;">
                            <h4 style="margin-bottom:4px;">${p.name}</h4>
                            <p style="color:gray;font-size:14px;">
                                ID: #${p.id} • Age: ${p.age} • ${p.gender}
                            </p>
                        </div>
                    </div>

                    <div style="display:flex;gap:8px;">
                        <button class="btn btn-secondary"
                            onclick="viewPatientInfo('${p.id}', '${p.name}', 'N/A', 'N/A', 'N/A')">
                            <i class="fas fa-eye"></i> View
                        </button>

                        <button class="btn btn-primary"
                            onclick="assignPatient(${p.id}, '${p.name}')">
                            <i class="fas fa-plus"></i> Add
                        </button>
                    </div>
                </div>`
        });

    } catch (err) {
        console.error(err);
        container.innerHTML = `
            <p style="padding:12px; color:red;">Error loading patients.</p>
        `;
    }
}
