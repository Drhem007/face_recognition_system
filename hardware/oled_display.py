import time
try:
    import board
    import busio
    import adafruit_ssd1306
    from PIL import Image, ImageDraw, ImageFont
    HARDWARE_AVAILABLE = True
except ImportError:
    HARDWARE_AVAILABLE = False

class OLEDDisplay:
    def __init__(self, simulate=False):
        self.simulate = simulate or not HARDWARE_AVAILABLE
        self.display = None
       
        if not self.simulate:
            try:
                i2c = busio.I2C(board.SCL, board.SDA)
                self.display = adafruit_ssd1306.SSD1306_I2C(128, 64, i2c)
                self.display.fill(0)
                self.display.show()
                print("✅ OLED display initialized")
            except Exception as e:
                print(f"⚠️ OLED init failed: {e}")
                self.simulate = True
   
    def show_message(self, line1="", line2="", line3="", line4=""):
        if self.simulate:
            print(f"📺 OLED: {line1}")
            if line2: print(f"📺      {line2}")
            if line3: print(f"📺      {line3}")
            if line4: print(f"📺      {line4}")
            return
       
        try:
            image = Image.new('1', (128, 64))
            draw = ImageDraw.Draw(image)
           
            try:
                font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 11)
            except:
                font = ImageFont.load_default()
           
            y_positions = [0, 16, 32, 48]
            lines = [line1, line2, line3, line4]
           
            for i, line in enumerate(lines):
                if line:
                    draw.text((0, y_positions[i]), line, font=font, fill=255)
           
            self.display.image(image)
            self.display.show()
           
        except Exception as e:
            print(f"📺 OLED: {line1}")
            if line2: print(f"📺      {line2}")