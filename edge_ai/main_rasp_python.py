import os
import time
import cv2
import face_recognition
import pandas as pd
import requests
from datetime import datetime, timedelta
import glob
import threading
import numpy as np
import pytz
import queue

# Import OLED (optional)
try:
    from oled_display import OLEDDisplay
    oled = OLEDDisplay(simulate=False)
except ImportError:
    oled = None

# Import Buzzer (optional)
try:
    from buzzer import Buzzer
    buzzer = Buzzer(simulate=False)
except ImportError:
    buzzer = None

# Import Servo (optional)
try:
    from servo import Servo
    servo = Servo(pin=18, simulate=False)
except ImportError:
    servo = None

# ===== CONFIGURATION =====
WEB_APP_URL = "https://inzgane.netlify.app"
DEVICE_IP = "192.168.100.168"
CAMERA_INDEX = 0

# Morocco timezone
MOROCCO_TZ = pytz.timezone('Africa/Casablanca')

# Folders
STUDENTS_FOLDER = "students"
FACES_FOLDER = "faces"
RESULTS_FOLDER = "results"

os.makedirs(STUDENTS_FOLDER, exist_ok=True)
os.makedirs(FACES_FOLDER, exist_ok=True)
os.makedirs(RESULTS_FOLDER, exist_ok=True)

class FaceRecognitionSystem:
    """Threaded face recognition system to prevent camera freezing"""
   
    def __init__(self, known_faces, known_names):
        self.known_faces = known_faces
        self.known_names = known_names
        self.frame_queue = queue.Queue(maxsize=2)  # Small queue to prevent lag
        self.result_queue = queue.Queue(maxsize=5)
        self.running = False
        self.worker_thread = None
       
    def recognize_face_optimized(self, frame):
        """Optimized face recognition function"""
        try:
            # Smaller resize for speed (0.2 instead of 0.25)
            small_frame = cv2.resize(frame, (0, 0), fx=0.2, fy=0.2)
            rgb_small_frame = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)
           
            # Use faster HOG model instead of CNN
            face_locations = face_recognition.face_locations(rgb_small_frame, model="hog")
           
            if not face_locations:  # Early return if no faces
                return None, frame
               
            face_encodings = face_recognition.face_encodings(rgb_small_frame, face_locations)
           
            # Scale back up face locations (factor of 5 since we used 0.2)
            face_locations = np.array(face_locations) * 5
           
            for i, face_encoding in enumerate(face_encodings):
                # Use slightly lower tolerance for faster comparison
                matches = face_recognition.compare_faces(self.known_faces, face_encoding, tolerance=0.5)
               
                if True in matches:
                    match_index = matches.index(True)
                    name = self.known_names[match_index]
                   
                    # Draw rectangle around face
                    top, right, bottom, left = face_locations[i]
                    cv2.rectangle(frame, (left, top), (right, bottom), (0, 255, 0), 2)
                    cv2.putText(frame, name, (left, top - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.75, (0, 255, 0), 2)
                   
                    return name, frame
           
            return None, frame
           
        except Exception as e:
            print(f"⚠️  Face recognition error: {e}")
            return None, frame
   
    def recognition_worker(self):
        """Background thread for face recognition"""
        while self.running:
            try:
                frame = self.frame_queue.get(timeout=1)
                if frame is None:  # Signal to stop
                    break
                   
                # Process the frame
                recognized_name, processed_frame = self.recognize_face_optimized(frame)
               
                # Put result in queue (non-blocking)
                try:
                    self.result_queue.put((recognized_name, processed_frame), block=False)
                except queue.Full:
                    # Remove oldest result and add new one
                    try:
                        self.result_queue.get(block=False)
                        self.result_queue.put((recognized_name, processed_frame), block=False)
                    except queue.Empty:
                        pass
                       
            except queue.Empty:
                continue
               
    def start_processing(self):
        """Start the background recognition thread"""
        self.running = True
        self.worker_thread = threading.Thread(target=self.recognition_worker, daemon=True)
        self.worker_thread.start()
        print("🧠 Face recognition thread started")
       
    def stop_processing(self):
        """Stop the background recognition thread"""
        self.running = False
        try:
            self.frame_queue.put(None, timeout=1)  # Signal to stop
        except queue.Full:
            pass
           
    def process_frame(self, frame):
        """Add frame to processing queue (non-blocking)"""
        try:
            self.frame_queue.put(frame.copy(), block=False)
        except queue.Full:
            # Queue is full, skip this frame to prevent backup
            pass
           
    def get_result(self):
        """Get recognition result if available"""
        try:
            return self.result_queue.get(block=False)
        except queue.Empty:
            return None, None

def beep():
    """Buzzer beep - now uses Nokia student present sound"""
    if buzzer:
        buzzer.student_present_sound()  # 🎉 Nokia recognition sound
    else:
        print("🔊 BEEP!")

def show_oled(message):
    """Show message on OLED if available, otherwise terminal"""
    if oled:
        if isinstance(message, str):
            oled.show_message(message, "", "", "")
        else:
            oled.show_message(*message)
    else:
        print(f"📺 OLED: {message}")

def open_door():
    """Open door using servo motor"""
    if servo:
        servo.door_cycle()  # Opens door, waits 2 seconds, closes door
    else:
        print("🚪 Door OPENED!")

def get_morocco_time():
    """Get current time in Morocco timezone"""
    return datetime.now(MOROCCO_TZ)

def send_heartbeat():
    try:
        response = requests.post(
            f"{WEB_APP_URL}/api/devices/heartbeat",
            json={'deviceIp': DEVICE_IP},
            timeout=10
        )
        if response.status_code == 200:
            morocco_time = get_morocco_time().strftime('%H:%M:%S')
            print(f"💓 Heartbeat sent at {morocco_time} (Morocco time)")
    except Exception as e:
        print(f"❌ Heartbeat error: {e}")

def check_for_tasks():
    try:
        response = requests.get(
            f"{WEB_APP_URL}/api/devices/poll",
            params={'deviceIp': DEVICE_IP},
            timeout=10
        )
       
        if response.status_code == 200:
            data = response.json()
            tasks = data.get('tasks', [])
            for task in tasks:
                download_and_process_task(task)
    except Exception as e:
        print(f"❌ Failed to check tasks: {e}")

def download_and_process_task(task):
    task_id = task.get('id')
    file_url = task.get('file_url')
    file_name = task.get('file_name')
   
    print(f"📥 New task: {file_name}")
    show_oled(("NEW TASK", file_name[:12], "Downloading...", ""))
   
    try:
        response = requests.get(file_url, timeout=30)
        file_path = os.path.join(STUDENTS_FOLDER, file_name)
       
        with open(file_path, 'wb') as f:
            f.write(response.content)
       
        print(f"✅ Downloaded: {file_path}")
       
        if buzzer:
            buzzer.file_received_sound()  # 📥 Nokia file received sound
       
        requests.post(
            f"{WEB_APP_URL}/api/devices/poll",
            json={'taskId': task_id, 'status': 'completed'},
            timeout=10
        )
       
        process_exam_file(file_path)
       
    except Exception as e:
        print(f"❌ Task processing failed: {e}")
        if buzzer:
            buzzer.error_beep()

def parse_exam_timing(filename):
    """Parse exam start and end time from filename"""
    try:
        base_name = os.path.basename(filename).replace('.xlsx', '')
        parts = base_name.split('_')
       
        if len(parts) >= 4:
            date_str = parts[-3]  # 2025-06-21
            start_time_str = parts[-2].replace('-', ':')  # 00:15
            end_time_str = parts[-1].replace('-', ':')    # 23:15
           
            print(f"📅 Parsed from filename:")
            print(f"   Date: {date_str}")
            print(f"   Start: {start_time_str}")
            print(f"   End: {end_time_str}")
           
            # Create Morocco timezone datetime objects
            exam_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            start_time = datetime.strptime(start_time_str, '%H:%M').time()
            end_time = datetime.strptime(end_time_str, '%H:%M').time()
           
            # Combine date and time in Morocco timezone
            start_datetime = MOROCCO_TZ.localize(datetime.combine(exam_date, start_time))
            end_datetime = MOROCCO_TZ.localize(datetime.combine(exam_date, end_time))
           
            return start_datetime, end_datetime
           
    except Exception as e:
        print(f"⚠️  Could not parse exam timing: {e}")
   
    # Default: start now, end in 30 minutes (for testing)
    now = get_morocco_time()
    return now, now + timedelta(minutes=30)

def load_known_faces():
    """Load student faces for recognition"""
    known_faces = []
    known_names = []
   
    print("📸 Loading student faces...")
    show_oled(("LOADING", "Student faces", "Please wait...", ""))
   
    if not os.path.exists(FACES_FOLDER):
        print(f"❌ Faces folder not found: {FACES_FOLDER}")
        if buzzer:
            buzzer.error_beep()
        return known_faces, known_names
   
    for student_folder in os.listdir(FACES_FOLDER):
        student_path = os.path.join(FACES_FOLDER, student_folder)
        if os.path.isdir(student_path):
            student_name = student_folder.upper()
           
            for image_file in os.listdir(student_path):
                if image_file.lower().endswith(('.jpg', '.jpeg', '.png')):
                    image_path = os.path.join(student_path, image_file)
                   
                    try:
                        image = face_recognition.load_image_file(image_path)
                        encodings = face_recognition.face_encodings(image)
                       
                        if encodings:
                            known_faces.append(encodings[0])
                            known_names.append(student_name)
                            print(f"  ✅ Loaded: {student_name}")
                        else:
                            print(f"  ⚠️  No face in: {image_file}")
                           
                    except Exception as e:
                        print(f"  ❌ Error loading {image_path}: {e}")
   
    print(f"📸 Total faces loaded: {len(known_faces)} students")
    return known_faces, known_names

def handle_student_recognition(recognized_name, present_students, student_names, current_morocco_time):
    """Handle student recognition with immediate door opening"""
    if recognized_name not in present_students:
        present_students.add(recognized_name)
       
        # 🚪 IMMEDIATE DOOR OPENING (highest priority - parallel)
        threading.Thread(target=open_door, daemon=True).start()
       
        # 🔊 BEEP in parallel (don't block door)
        threading.Thread(target=beep, daemon=True).start()
       
        # 📺 Update OLED in parallel
        threading.Thread(target=lambda: show_oled(("FACE DETECTED", recognized_name[:12], "PRESENT", "Access OK")), daemon=True).start()
       
        # Print status (lowest priority)
        print(f"🎉 STUDENT RECOGNIZED: {recognized_name}")
        print(f"   Time: {current_morocco_time.strftime('%H:%M:%S')}")
        print(f"   Present count: {len(present_students)}/{len(student_names)}")
    else:
        print(f"👋 Already present: {recognized_name}")

def process_exam_file(excel_file):
    """Automatic exam processing with OPTIMIZED face recognition and camera display"""
    print(f"\n{'='*60}")
    print(f"📊 Processing Exam: {os.path.basename(excel_file)}")
    print(f"{'='*60}")
   
    try:
        # Read Excel file
        df = pd.read_excel(excel_file)
        student_names = [str(name).upper().strip() for name in df['Student_Name'].tolist() if pd.notna(name)]
        print(f"📝 Students in exam: {student_names}")
        print(f"📊 Total students: {len(student_names)}")
       
        show_oled(("EXAM LOADED", f"{len(student_names)} students", "Starting soon...", ""))
       
        # Parse exam timing
        start_time, end_time = parse_exam_timing(excel_file)
        current_time = get_morocco_time()
       
        print(f"\n⏰ Exam Schedule (Morocco Time):")
        print(f"   Start: {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"   End:   {end_time.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"   Now:   {current_time.strftime('%Y-%m-%d %H:%M:%S')}")
       
        # Wait for exam to start
        if current_time < start_time:
            wait_seconds = (start_time - current_time).total_seconds()
            print(f"\n⏳ Waiting {wait_seconds:.0f} seconds for exam to start...")
            show_oled(f"Exam starts at {start_time.strftime('%H:%M')}")
           
            while get_morocco_time() < start_time:
                remaining = (start_time - get_morocco_time()).total_seconds()
                if remaining > 0:
                    mins, secs = divmod(int(remaining), 60)
                    show_oled(("WAITING", "Exam starts in:", f"{mins:02d}:{secs:02d}", ""))
                time.sleep(30)
       
        # Load known faces
        known_faces, known_names = load_known_faces()
       
        if not known_faces:
            print("❌ No student faces loaded!")
            show_oled(("ERROR", "No faces", "loaded", ""))
            if buzzer:
                buzzer.error_beep()
            create_absent_list(student_names, set(), excel_file)
            return
       
        # Start OPTIMIZED face recognition system
        print(f"\n🧠 Starting OPTIMIZED Face Recognition System...")
        print(f"🎥 Camera window will open - Press 'q' to stop early")
        print(f"📅 Exam Duration: {start_time.strftime('%H:%M')} - {end_time.strftime('%H:%M')}")
        show_oled(("EXAM STARTED", os.path.basename(excel_file)[:12], f"{len(student_names)} students", f"{start_time.strftime('%H:%M')}-{end_time.strftime('%H:%M')}"))
       
        present_students = set()
        last_recognition = {}
       
        # Initialize threaded face recognition system
        face_system = FaceRecognitionSystem(known_faces, known_names)
        face_system.start_processing()
       
        # Set up camera display environment
        os.environ['QT_QPA_PLATFORM'] = 'xcb'
       
        cap = cv2.VideoCapture(CAMERA_INDEX)
       
        if not cap.isOpened():
            print("❌ Camera failed to open!")
            show_oled(("ERROR", "Camera failed", "Check connection", ""))
            if buzzer:
                buzzer.error_beep()
            face_system.stop_processing()
            create_absent_list(student_names, set(), excel_file)
            return
       
        # Optimize camera settings
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        cap.set(cv2.CAP_PROP_FPS, 30)
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)  # Reduce buffer to prevent lag
       
        print("📹 Camera opened successfully!")
        print("🖥️  Camera window should appear...")
       
        try:
            frame_count = 0
            last_status_time = time.time()
           
            while get_morocco_time() < end_time:
                ret, frame = cap.read()
                if not ret:
                    print("❌ Failed to read camera frame")
                    break
               
                frame_count += 1
                current_morocco_time = get_morocco_time()
               
                # Submit frame for processing every 10th frame (faster recognition)
                if frame_count % 10 == 0:
                    face_system.process_frame(frame)
               
                # Check for recognition results (non-blocking)
                recognized_name, processed_frame = face_system.get_result()
                if processed_frame is not None:
                    frame = processed_frame  # Use processed frame with rectangles
               
                if recognized_name and recognized_name in student_names:
                    current_time = time.time()
                   
                    # Prevent duplicate recognition (5 second cooldown)
                    if (recognized_name not in last_recognition or
                        current_time - last_recognition[recognized_name] > 5):
                       
                        # Handle recognition with immediate door opening
                        handle_student_recognition(recognized_name, present_students, student_names, current_morocco_time)
                        last_recognition[recognized_name] = current_time
               
                # ===== CAMERA DISPLAY (OPTIMIZED) =====
                # Show attendance status on frame
                cv2.putText(frame, f"Present: {len(present_students)}/{len(student_names)}",
                           (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
               
                # Show time remaining
                remaining_seconds = (end_time - current_morocco_time).total_seconds()
                remaining_minutes = max(0, int(remaining_seconds / 60))
                cv2.putText(frame, f"Time left: {remaining_minutes} min",
                           (10, 70), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 2)
               
                # Show current time
                cv2.putText(frame, current_morocco_time.strftime('%H:%M:%S'),
                           (10, 110), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
               
                # Show student list
                y_offset = 150
                for i, student in enumerate(student_names[:10]):  # Show first 10 students
                    status = "✅" if student in present_students else "❌"
                    color = (0, 255, 0) if student in present_students else (0, 0, 255)
                    text = f"{status} {student}"
                    cv2.putText(frame, text, (10, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
                    y_offset += 25
               
                # Show instructions
                cv2.putText(frame, "Press 'q' to stop early",
                           (10, frame.shape[0] - 20), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
               
                # DISPLAY THE CAMERA WINDOW (SMOOTH)
                cv2.imshow('Face Recognition - Morocco Attendance System', frame)
               
                # Check for key press (fast response)
                key = cv2.waitKey(1) & 0xFF
                if key == ord('q'):
                    print("🛑 User pressed 'q' - stopping early")
                    break
               
                # Show status every 30 seconds
                if time.time() - last_status_time > 30:
                    if remaining_seconds > 0:
                        print(f"📊 Status: {len(present_students)}/{len(student_names)} present, {remaining_minutes} min remaining")
                        show_oled(("ATTENDANCE", f"Present: {len(present_students)}", f"Total: {len(student_names)}", f"{int(len(present_students)/len(student_names)*100)}% here" if len(student_names) > 0 else ""))
                    last_status_time = time.time()
       
        finally:
            # Cleanup
            face_system.stop_processing()
            cap.release()
            cv2.destroyAllWindows()
            print("📹 Camera window closed")
            print("🧠 Face recognition system stopped")
       
        # Exam finished
        current_time = get_morocco_time()
        print(f"\n⏰ Exam finished at {current_time.strftime('%H:%M:%S')}")
        print(f"📊 Final attendance:")
        print(f"   Present: {len(present_students)} students")
        print(f"   Absent:  {len(student_names) - len(present_students)} students")
       
        for student in student_names:
            status = "✅ PRESENT" if student in present_students else "❌ ABSENT"
            print(f"   {student}: {status}")
       
        # Create and send complete attendance list
        create_absent_list(student_names, present_students, excel_file)
       
    except Exception as e:
        print(f"❌ Error processing exam: {e}")
        show_oled(("ERROR", "Processing", "failed", ""))
        if buzzer:
            buzzer.error_beep()
        import traceback
        traceback.print_exc()

def create_absent_list(all_students, present_students, original_file):
    """Create and send ALL students list with Present/Absent status"""
    print(f"\n📋 Creating complete attendance list...")
   
    # Find absent students
    absent_students = [student for student in all_students if student not in present_students]
   
    print(f"📊 Final Results:")
    print(f"   Present: {len(present_students)} students")
    print(f"   Absent: {len(absent_students)} students")
   
    # Create COMPLETE attendance list with ALL students and their status
    all_attendance_data = []
   
    for student in all_students:
        if student in present_students:
            all_attendance_data.append({"Student_Name": student, "Status": "Present"})
            print(f"   ✅ {student}: Present")
        else:
            all_attendance_data.append({"Student_Name": student, "Status": "Absent"})
            print(f"   ❌ {student}: Absent")
   
    # Create DataFrame with ALL students
    results_df = pd.DataFrame(all_attendance_data)
   
    # Generate result filename based on original filename
    original_basename = os.path.basename(original_file).replace('.xlsx', '')
    result_file = os.path.join(RESULTS_FOLDER, f"{original_basename}.xlsx")
   
    print(f"💾 Saving complete attendance list: {result_file}")
    results_df.to_excel(result_file, index=False)
   
    # Verify file creation
    if os.path.exists(result_file):
        file_size = os.path.getsize(result_file)
        print(f"✅ Complete attendance list created ({file_size} bytes)")
        print(f"📊 File contains {len(all_attendance_data)} students total")
       
        # Send to web app
        show_oled(("UPLOADING", "Results to", "web app...", ""))
        success = send_results_to_web_app(result_file)
       
        if success:
            print("✅ Complete attendance list sent to web app successfully!")
            show_oled(("SUCCESS", "Results sent", "to web app", "✓ Complete"))
            if buzzer:
                buzzer.exam_finished_sound()  # 📱 Nokia exam finished sound
            os.remove(original_file)
            print(f"🧹 Cleaned up original file: {original_file}")
        else:
            print("❌ Failed to send attendance list")
            show_oled(("ERROR", "Upload failed", "", ""))
            if buzzer:
                buzzer.error_beep()
    else:
        print("❌ Failed to create attendance list file")
        if buzzer:
            buzzer.error_beep()

def send_results_to_web_app(excel_file):
    """Send complete attendance list to web app"""
    print(f"📤 Sending complete attendance list to web app...")
   
    try:
        url = f"{WEB_APP_URL}/api/attendance/upload-public"
       
        with open(excel_file, 'rb') as f:
            files = {'file': (os.path.basename(excel_file), f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
            data = {'deviceIp': DEVICE_IP}
           
            response = requests.post(url, files=files, data=data, timeout=30)
           
            if response.status_code == 200:
                print("✅ Complete attendance list uploaded successfully!")
                return True
            else:
                print(f"❌ Upload failed: {response.status_code}")
                return False
               
    except Exception as e:
        print(f"❌ Error uploading attendance list: {e}")
        return False

def heartbeat_loop():
    """Send heartbeat every 30 seconds"""
    while True:
        send_heartbeat()
        time.sleep(30)

def main():
    """Main function - automatic system with OPTIMIZED camera display"""
    print("🇲🇦 OPTIMIZED Raspberry Pi Attendance System (Morocco)")
    print("🧠 THREADED Face Recognition with Camera Display + OLED + Nokia Buzzer + Servo Door")
    print("⚡ NO MORE CAMERA FREEZING!")
    print(f"📱 Device IP: {DEVICE_IP}")
    print(f"🌐 Web App: {WEB_APP_URL}")
    print(f"⏰ Timezone: Africa/Casablanca")
    print()
   
    show_oled(("STARTING", "OPTIMIZED", "System init...", ""))
   
    if buzzer:
        buzzer.nokia_reboot_sound()  # 📱 Nokia startup sound
   
    time.sleep(2)
    show_oled(("READY", "Morocco time", "NO LAG!", ""))
   
    if buzzer:
        buzzer.system_ready_sound()  # ✅ System ready sound
   
    # Start heartbeat
    heartbeat_thread = threading.Thread(target=heartbeat_loop, daemon=True)
    heartbeat_thread.start()
   
    print("💓 Heartbeat started")
    print("📋 Waiting for exam files from web app...")
    print("🎥 SMOOTH Camera window will appear during exams")
    print("📱 Nokia sounds enabled!")
    print("🚪 INSTANT Servo door control enabled!")
    print("⚡ Threading optimizations active!")
    print()
   
    try:
        while True:
            show_oled(("WAITING", "For exam file", "from web app", "OPTIMIZED"))
           
            check_for_tasks()
           
            # Check local files
            excel_files = glob.glob(os.path.join(STUDENTS_FOLDER, "*.xlsx"))
            for excel_file in excel_files:
                if not excel_file.endswith(('_processed.xlsx', '_absent.xlsx')):
                    print(f"📁 Found exam file: {excel_file}")
                    process_exam_file(excel_file)
           
            time.sleep(10)
           
    except KeyboardInterrupt:
        print("\n🛑 System stopped by user")
        show_oled(("STOPPED", "By user", "", ""))
        if buzzer:
            buzzer.beep()
       
    finally:
        # Cleanup GPIO
        if buzzer:
            buzzer.cleanup()
        if servo:
            servo.cleanup()

if __name__ == "__main__":
    main()