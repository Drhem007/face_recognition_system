import time

class Buzzer:
    def __init__(self, simulate=False, pin=12):  # Changed to GPIO 12 (PWM pin)
        """Initialize buzzer on PWM-capable GPIO pin"""
        self.simulate = simulate
        self.pin = pin  # GPIO 12 = Hardware PWM
        self.gpio_setup = False
        self.use_lgpio = False
        self.h = None
       
        if not self.simulate:
            if self._init_lgpio():
                print(f"✅ Buzzer initialized with lgpio on GPIO {self.pin} (PWM)")
                return
           
            if self._init_rpi_gpio():
                print(f"✅ Buzzer initialized with RPi.GPIO on GPIO {self.pin} (PWM)")
                return
           
            print("⚠️ Buzzer init failed - falling back to terminal mode")
            self.simulate = True
   
    def _init_lgpio(self):
        """Try to initialize with lgpio"""
        try:
            import lgpio
            self.h = lgpio.gpiochip_open(0)
            lgpio.gpio_claim_output(self.h, self.pin)
            self.use_lgpio = True
            self.gpio_setup = True
            return True
        except ImportError:
            return False
        except Exception as e:
            return False
   
    def _init_rpi_gpio(self):
        """Try to initialize with RPi.GPIO"""
        try:
            import RPi.GPIO as GPIO
            GPIO.setmode(GPIO.BCM)
            GPIO.setup(self.pin, GPIO.OUT)
            GPIO.output(self.pin, GPIO.LOW)
            self.gpio_setup = True
            return True
        except Exception as e:
            return False
   
    def _simple_beep(self, duration=0.2):
        """Simple ON/OFF beep"""
        if self.simulate:
            return
       
        try:
            if self.use_lgpio:
                import lgpio
                lgpio.gpio_write(self.h, self.pin, 1)
                time.sleep(duration)
                lgpio.gpio_write(self.h, self.pin, 0)
            else:
                import RPi.GPIO as GPIO
                GPIO.output(self.pin, GPIO.HIGH)
                time.sleep(duration)
                GPIO.output(self.pin, GPIO.LOW)
        except Exception as e:
            pass
   
    def _hardware_pwm_tone(self, frequency=1000, duration=0.5, duty_cycle=50):
        """Generate REAL hardware PWM tone (proper buzzing sound)"""
        if self.simulate:
            return
       
        try:
            if self.use_lgpio:
                # lgpio PWM - more complex but works
                import lgpio
                # Set PWM frequency and duty cycle
                lgpio.tx_pwm(self.h, self.pin, frequency, duty_cycle)
                time.sleep(duration)
                lgpio.tx_pwm(self.h, self.pin, frequency, 0)  # Stop PWM
            else:
                # RPi.GPIO PWM on hardware PWM pin
                import RPi.GPIO as GPIO
                pwm = GPIO.PWM(self.pin, frequency)  # GPIO 12 = Hardware PWM
                pwm.start(duty_cycle)
                time.sleep(duration)
                pwm.stop()
        except Exception as e:
            print(f"PWM error: {e}")
            # Fallback to simple beep
            self._simple_beep(duration)
   
    # ===== REAL BUZZING SOUNDS =====
   
    def buzz_tone(self, frequency=1000, duration=0.5):
        """Generate proper buzzing tone"""
        if self.simulate:
            print(f"🎵 BUZZ ({frequency}Hz) for {duration}s")
            return
       
        self._hardware_pwm_tone(frequency, duration)
   
    def beep(self, duration=0.3):
        """Nice buzzing beep (1000Hz)"""
        if self.simulate:
            print("🔊 BUZZ!")
            return
       
        self._hardware_pwm_tone(1000, duration, 50)
   
    def double_beep(self):
        """Double buzzing beep for recognition"""
        if self.simulate:
            print("🔊 BUZZ-BUZZ!")
            return
       
        self._hardware_pwm_tone(1200, 0.2, 50)
        time.sleep(0.1)
        self._hardware_pwm_tone(1200, 0.2, 50)
   
    def long_beep(self, duration=1.0):
        """Long buzzing beep"""
        if self.simulate:
            print("🔊 BUZZZZZZ!")
            return
       
        self._hardware_pwm_tone(800, duration, 50)
   
    def success_beep(self):
        """Success melody - ascending tones"""
        if self.simulate:
            print("🎵 SUCCESS MELODY!")
            return
       
        frequencies = [600, 800, 1000]
        for freq in frequencies:
            self._hardware_pwm_tone(freq, 0.25, 50)
            time.sleep(0.05)
   
    def error_beep(self):
        """Error sound - low frequency alarm"""
        if self.simulate:
            print("🔊 ERROR BUZZ!")
            return
       
        for i in range(3):
            self._hardware_pwm_tone(300, 0.3, 70)  # Low, loud buzz
            time.sleep(0.1)
   
    def recognition_chime(self):
        """Pleasant chime for student recognition"""
        if self.simulate:
            print("🎵 RECOGNITION CHIME!")
            return
       
        # Two-tone chime with real buzzing
        self._hardware_pwm_tone(1200, 0.2, 40)  # High, softer
        time.sleep(0.05)
        self._hardware_pwm_tone(900, 0.3, 50)   # Lower, normal
   
    def startup_melody(self):
        """Startup melody"""
        if self.simulate:
            print("🎵 STARTUP MELODY!")
            return
       
        notes = [
            (523, 0.2),   # C5
            (659, 0.2),   # E5  
            (784, 0.4),   # G5
        ]
       
        for freq, duration in notes:
            self._hardware_pwm_tone(freq, duration, 45)
            time.sleep(0.05)
   
    def cleanup(self):
        """Clean up GPIO"""
        if not self.simulate and self.gpio_setup:
            try:
                if self.use_lgpio and self.h is not None:
                    import lgpio
                    lgpio.tx_pwm(self.h, self.pin, 1000, 0)  # Stop PWM
                    lgpio.gpiochip_close(self.h)
                else:
                    import RPi.GPIO as GPIO
                    GPIO.cleanup()
            except:
                pass

# Test hardware PWM sounds
if __name__ == "__main__":
    print("🧪 Testing REAL Hardware PWM Buzzer Sounds...")
    print("🔌 Make sure buzzer is connected to GPIO 12 (Pin 32)!")
   
    buzzer = Buzzer(simulate=False)
   
    if not buzzer.simulate:
        print("🎵 Testing 500Hz tone...")
        buzzer.buzz_tone(500, 1)
        time.sleep(0.5)
       
        print("🎵 Testing 1000Hz tone...")
        buzzer.buzz_tone(1000, 1)
        time.sleep(0.5)
       
        print("🎵 Testing 2000Hz tone...")
        buzzer.buzz_tone(2000, 1)
        time.sleep(0.5)
       
        print("🎵 Testing recognition chime...")
        buzzer.recognition_chime()
        time.sleep(1)
       
        print("🎵 Testing startup melody...")
        buzzer.startup_melody()
        time.sleep(1)
   
    buzzer.cleanup()
    print("✅ Hardware PWM test complete!")