
#!/usr/bin/env python3
"""
NON-BLOCKING Servo Motor Control Module for Raspberry Pi 5
Compatible with lgpio (Pi 5) and RPi.GPIO (fallback)
"""

import time
import threading
from threading import Thread

class Servo:
    def __init__(self, pin=18, simulate=False):
        """
        Initialize servo motor
        Args:
            pin (int): GPIO pin number for servo (default: 18)
            simulate (bool): If True, only print actions without hardware
        """
        self.pin = pin
        self.simulate = simulate
        self.chip = None
        self.pwm = None
        self.gpio_lib = None
        self._servo_thread = None
        self._stop_servo = False
       
        if not simulate:
            self._initialize_gpio()
       
        print(f"🔧 Servo initialized on GPIO {pin} ({'simulated' if simulate else 'hardware'})")
   
    def _initialize_gpio(self):
        """Initialize GPIO library (lgpio preferred for Pi 5, RPi.GPIO fallback)"""
        try:
            # Try lgpio first (Raspberry Pi 5 compatible)
            import lgpio
            self.chip = lgpio.gpiochip_open(0)
            lgpio.gpio_claim_output(self.chip, self.pin)
            self.gpio_lib = 'lgpio'
            print(f"✅ Servo using lgpio (Pi 5 compatible) on GPIO {self.pin}")
           
        except ImportError:
            try:
                # Fallback to RPi.GPIO
                import RPi.GPIO as GPIO
                GPIO.setmode(GPIO.BCM)
                GPIO.setwarnings(False)
                GPIO.setup(self.pin, GPIO.OUT)
                self.pwm = GPIO.PWM(self.pin, 50)  # 50Hz for servo
                self.pwm.start(0)
                self.gpio_lib = 'RPi.GPIO'
                print(f"✅ Servo using RPi.GPIO (fallback) on GPIO {self.pin}")
               
            except ImportError:
                print("⚠️  No GPIO library available - running in simulation mode")
                self.simulate = True
   
    def _lgpio_servo_control_blocking(self, angle):
        """INTERNAL USE - blocking servo control for thread"""
        if not self.chip:
            return
           
        try:
            import lgpio
           
            # Convert angle (0-180) to pulse width (500-2500 microseconds)
            pulse_width_us = 500 + (angle / 180.0) * 2000
            period_us = 20000  # 20ms period for servo
           
            # Send PWM signal for 0.5 seconds to position servo
            end_time = time.time() + 0.5
            while time.time() < end_time and not self._stop_servo:
                lgpio.gpio_write(self.chip, self.pin, 1)
                time.sleep(pulse_width_us / 1000000.0)
                lgpio.gpio_write(self.chip, self.pin, 0)
                time.sleep((period_us - pulse_width_us) / 1000000.0)
               
        except Exception as e:
            print(f"⚠️  lgpio servo control error: {e}")
   
    def _rpi_gpio_servo_control_blocking(self, angle):
        """INTERNAL USE - blocking servo control for thread"""
        if not self.pwm:
            return
           
        try:
            # Convert angle (0-180) to duty cycle (2.5-12.5)
            duty_cycle = 2.5 + (angle / 180.0) * 10
            self.pwm.ChangeDutyCycle(duty_cycle)
            time.sleep(0.5)  # Position servo
            self.pwm.ChangeDutyCycle(0)  # Stop sending signal
           
        except Exception as e:
            print(f"⚠️  RPi.GPIO servo control error: {e}")
   
    def _servo_thread_func(self, angle):
        """Thread function for non-blocking servo control"""
        if self.gpio_lib == 'lgpio':
            self._lgpio_servo_control_blocking(angle)
        elif self.gpio_lib == 'RPi.GPIO':
            self._rpi_gpio_servo_control_blocking(angle)
   
    def move_to_angle(self, angle):
        """
        NON-BLOCKING: Move servo to specific angle
        Args:
            angle (int): Angle between 0-180 degrees
        """
        if self.simulate:
            print(f"🔧 SERVO: Moving to {angle} degrees")
            return
           
        angle = max(0, min(180, angle))  # Clamp angle to 0-180
       
        # Stop any existing servo thread
        self._stop_servo = True
        if self._servo_thread and self._servo_thread.is_alive():
            self._servo_thread.join(timeout=0.1)
       
        # Start new servo thread
        self._stop_servo = False
        self._servo_thread = Thread(target=self._servo_thread_func, args=(angle,))
        self._servo_thread.daemon = True
        self._servo_thread.start()
           
        print(f"🔧 Servo moving to {angle} degrees (non-blocking)")
   
    def open_door(self):
        """NON-BLOCKING: Open door (rotate to 90 degrees)"""
        print("🚪 Opening door...")
        self.move_to_angle(90)
   
    def close_door(self):
        """NON-BLOCKING: Close door (rotate to 0 degrees)"""
        print("🚪 Closing door...")
        self.move_to_angle(0)
   
    def door_cycle(self):
        """NON-BLOCKING: Complete door cycle with delayed close"""
        print("🚪 Door cycle starting...")
        self.open_door()
       
        # Schedule door close after 2 seconds (non-blocking)
        def delayed_close():
            time.sleep(2)
            self.close_door()
            print("🚪 Door cycle complete")
       
        close_thread = Thread(target=delayed_close)
        close_thread.daemon = True
        close_thread.start()
   
    def cleanup(self):
        """Clean up GPIO resources"""
        self._stop_servo = True
       
        if self._servo_thread and self._servo_thread.is_alive():
            self._servo_thread.join(timeout=1.0)
       
        if self.simulate:
            print("🔧 SERVO: Cleanup (simulated)")
            return
           
        try:
            if self.gpio_lib == 'lgpio' and self.chip:
                import lgpio
                lgpio.gpio_write(self.chip, self.pin, 0)
                lgpio.gpiochip_close(self.chip)
                print("🔧 Servo cleanup: lgpio resources released")
               
            elif self.gpio_lib == 'RPi.GPIO' and self.pwm:
                self.pwm.stop()
                import RPi.GPIO as GPIO
                GPIO.cleanup(self.pin)
                print("🔧 Servo cleanup: RPi.GPIO resources released")
               
        except Exception as e:
            print(f"⚠️  Servo cleanup error: {e}")

# Test function
if __name__ == "__main__":
    print("🔧 NON-BLOCKING Servo Motor Test")
   
    servo = Servo(pin=18, simulate=False)
   
    try:
        print("Testing non-blocking door cycle...")
        servo.door_cycle()
       
        # Main thread continues immediately
        for i in range(10):
            print(f"Main thread running: {i}")
            time.sleep(0.5)
       
    except KeyboardInterrupt:
        print("\n🛑 Test stopped by user")
    finally:
        servo.cleanup()

