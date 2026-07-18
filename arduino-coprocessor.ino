#include <SoftwareSerial.h>
#include <Servo.h>
#include <DHT.h>

// SoftwareSerial Pins for communication with ESP32-CAM
// Uno Pin 10 (RX) <--- ESP32-CAM GPIO 14 (TX)
// Uno Pin 11 (TX) ---> ESP32-CAM GPIO 12 (RX) (voltage divider recommended!)
SoftwareSerial espSerial(10, 11);

// Servo for Camera rotation
Servo camServo;

// DHT11 Sensor
#define DHTPIN A4
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// Motor Pin Definitions (L298N)
const int IN1 = 2;
const int IN2 = 3;
const int IN3 = 4;
const int IN4 = 5;
const int ENA = 6;
const int ENB = 9;

// HC-SR04 Ultrasonic Sensor
const int trigPin = 7;
const int echoPin = 8;

// BS312 PIR Motion Sensor
const int pirPin = 12;

// Flame Sensor
const int flamePin = 13;

// Analog Soil Moisture Sensor
const int soilPin = A0;

// Actuators
const int buzzerPin = A1;
const int rgbRed = A2;
const int rgbGreen = A3;
// Pin A4 is used for DHT11 data line
const int servoPin = A5;

// Global State Variables
int currentSpeed = 150; // Speed 0-255
unsigned long lastTelemetryTime = 0;
String inputString = "";
bool stringComplete = false;

void setup() {
  // Serial Monitor Debug console
  Serial.begin(115200);
  Serial.println("RoboCore Arduino Coprocessor Initialized.");

  // ESP32 Serial Link
  espSerial.begin(9600);

  // Initialize DHT11 sensor
  dht.begin();

  // Servo setup
  camServo.attach(servoPin);
  camServo.write(90); // Center position

  // Motor outputs
  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
  pinMode(IN3, OUTPUT);
  pinMode(IN4, OUTPUT);
  pinMode(ENA, OUTPUT);
  pinMode(ENB, OUTPUT);
  stopMotors();

  // Sensor inputs
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  pinMode(pirPin, INPUT);
  pinMode(flamePin, INPUT);

  // Actuator outputs
  pinMode(buzzerPin, OUTPUT);
  pinMode(rgbRed, OUTPUT);
  pinMode(rgbGreen, OUTPUT);

  // Set RGB LED to green to indicate ready status
  setRGB(0, 255, 0);
  beep(100);
}

void loop() {
  // 1. Process incoming Serial commands from ESP32-CAM
  readSerialCommands();
  if (stringComplete) {
    parseCommand(inputString);
    inputString = "";
    stringComplete = false;
  }

  // 2. Stream Telemetry to ESP32-CAM periodically (every 500ms)
  if (millis() - lastTelemetryTime >= 500) {
    lastTelemetryTime = millis();
    sendTelemetry();
  }
}

// Read SoftwareSerial buffer
void readSerialCommands() {
  while (espSerial.available() > 0) {
    char inChar = (char)espSerial.read();
    if (inChar == '\n') {
      stringComplete = true;
    } else {
      inputString += inChar;
    }
  }
}

// Parse commands from ESP32-CAM
// Expected command formats:
// - MOVE:<dir>:<speed>
// - SERVO:<angle>
// - HORN:<active>
// - RGB:<r>:<g>:<b>
void parseCommand(String cmd) {
  cmd.trim();
  Serial.print("Rx Cmd: ");
  Serial.println(cmd);

  int colon1 = cmd.indexOf(':');
  if (colon1 == -1) return;

  String header = cmd.substring(0, colon1);
  String payload = cmd.substring(colon1 + 1);

  if (header == "MOVE") {
    int colon2 = payload.indexOf(':');
    if (colon2 != -1) {
      String dir = payload.substring(0, colon2);
      int speedPct = payload.substring(colon2 + 1).toInt();
      // Map 0-100% to 0-255 PWM
      currentSpeed = map(speedPct, 0, 100, 0, 255);
      driveMotors(dir, currentSpeed);
    }
  } else if (header == "SERVO") {
    int angle = payload.toInt();
    angle = constrain(angle, 0, 180);
    camServo.write(angle);
    Serial.print("Servo set to: ");
    Serial.println(angle);
  } else if (header == "HORN") {
    int active = payload.toInt();
    if (active == 1) {
      digitalWrite(buzzerPin, HIGH);
      setRGB(255, 0, 0); // Flash RED while horn is active
    } else {
      digitalWrite(buzzerPin, LOW);
      setRGB(0, 255, 0); // Reset to GREEN
    }
  } else if (header == "RGB") {
    int rColon = payload.indexOf(':');
    if (rColon != -1) {
      int r = payload.substring(0, rColon).toInt();
      String sub = payload.substring(rColon + 1);
      int gColon = sub.indexOf(':');
      if (gColon != -1) {
        int g = sub.substring(0, gColon).toInt();
        int b = sub.substring(gColon + 1).toInt();
        setRGB(r, g, b);
      }
    }
  }
}

// Motor driving functions (L298N)
void driveMotors(String dir, int speed) {
  analogWrite(ENA, speed);
  analogWrite(ENB, speed);

  if (dir == "forward") {
    digitalWrite(IN1, HIGH);
    digitalWrite(IN2, LOW);
    digitalWrite(IN3, HIGH);
    digitalWrite(IN4, LOW);
    Serial.println("Drive: FORWARD");
  } else if (dir == "backward") {
    digitalWrite(IN1, LOW);
    digitalWrite(IN2, HIGH);
    digitalWrite(IN3, LOW);
    digitalWrite(IN4, HIGH);
    Serial.println("Drive: BACKWARD");
  } else if (dir == "left") {
    digitalWrite(IN1, LOW);
    digitalWrite(IN2, HIGH);
    digitalWrite(IN3, HIGH);
    digitalWrite(IN4, LOW);
    Serial.println("Drive: LEFT");
  } else if (dir == "right") {
    digitalWrite(IN1, HIGH);
    digitalWrite(IN2, LOW);
    digitalWrite(IN3, LOW);
    digitalWrite(IN4, HIGH);
    Serial.println("Drive: RIGHT");
  } else {
    stopMotors();
    Serial.println("Drive: STOP");
  }
}

void stopMotors() {
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, LOW);
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, LOW);
  analogWrite(ENA, 0);
  analogWrite(ENB, 0);
}

// Sensors reading and Telemetry sending
void sendTelemetry() {
  // 1. HC-SR04 Ultrasonic Distance
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  long duration = pulseIn(echoPin, HIGH, 30000); // 30ms timeout
  int distance = duration * 0.034 / 2;
  if (distance <= 0 || distance > 400) {
    distance = 250; // out of range default
  }

  // 2. PIR Sensor
  bool pirState = digitalRead(pirPin);

  // 3. Soil Moisture
  int soilRaw = analogRead(soilPin);
  // Map typical dry (1023) to wet (~300) values to percentage
  int soilPct = map(soilRaw, 1023, 300, 0, 100);
  soilPct = constrain(soilPct, 0, 100);

  // 4. Flame Sensor (active-low check: flame detected is LOW output)
  bool flameState = (digitalRead(flamePin) == LOW); 

  // 5. DHT11 Temperature & Humidity
  float dhtTemp = dht.readTemperature();
  float dhtHum = dht.readHumidity();
  if (isnan(dhtTemp)) dhtTemp = 0.0;
  if (isnan(dhtHum)) dhtHum = 0.0;

  // Format: TELE:<dist>:<pir>:<soil>:<flame>:<dhtTemp>:<dhtHum>
  String teleString = "TELE:" + String(distance) + ":" + String(pirState) + ":" + String(soilPct) + ":" + String(flameState) + ":" + String(dhtTemp, 1) + ":" + String(dhtHum, 1);
  espSerial.println(teleString);

  // Debug output to Serial Monitor
  Serial.println("Sent Telemetry: " + teleString);
}

// Helpers
void beep(int ms) {
  digitalWrite(buzzerPin, HIGH);
  delay(ms);
  digitalWrite(buzzerPin, LOW);
}

void setRGB(int r, int g, int b) {
  analogWrite(rgbRed, r);
  analogWrite(rgbGreen, g);
  // Note: Blue pin (A4) is now used for the DHT11 data line.
}
