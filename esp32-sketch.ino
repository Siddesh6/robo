#include <WiFi.h>
#include <WebServer.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include "esp_camera.h"

// Tiny pure C++ SHA-1 implementation to guarantee compilation across all ESP32 Core versions
namespace SHA1 {
  #define SHA1_ROL(value, bits) (((value) << (bits)) | ((value) >> (32 - (bits))))

  void transform(uint32_t state[5], const uint8_t buffer[64]) {
    uint32_t a = state[0], b = state[1], c = state[2], d = state[3], e = state[4];
    uint32_t w[80];
    for (int i = 0; i < 16; i++) {
      w[i] = ((uint32_t)buffer[i * 4] << 24) |
             ((uint32_t)buffer[i * 4 + 1] << 16) |
             ((uint32_t)buffer[i * 4 + 2] << 8) |
             ((uint32_t)buffer[i * 4 + 3]);
    }
    for (int i = 16; i < 80; i++) {
      w[i] = SHA1_ROL(w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16], 1);
    }
    for (int i = 0; i < 80; i++) {
      uint32_t f, k;
      if (i < 20) {
        f = (b & c) | (~b & d);
        k = 0x5A827999;
      } else if (i < 40) {
        f = b ^ c ^ d;
        k = 0x6ED9EBA1;
      } else if (i < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = 0x8F1BBCDC;
      } else {
        f = b ^ c ^ d;
        k = 0xCA62C1D6;
      }
      uint32_t temp = SHA1_ROL(a, 5) + f + e + k + w[i];
      e = d;
      d = c;
      c = SHA1_ROL(b, 30);
      b = a;
      a = temp;
    }
    state[0] += a;
    state[1] += b;
    state[2] += c;
    state[3] += d;
    state[4] += e;
  }

  void calculate(const uint8_t* src, size_t bytelength, uint8_t* dest) {
    uint32_t state[5] = {0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0};
    uint8_t buffer[64];
    size_t i = 0;
    uint64_t bitLength = (uint64_t)bytelength * 8;
    
    while (i + 64 <= bytelength) {
      memcpy(buffer, src + i, 64);
      transform(state, buffer);
      i += 64;
    }
    
    size_t remaining = bytelength - i;
    memcpy(buffer, src + i, remaining);
    buffer[remaining] = 0x80;
    remaining++;
    
    if (remaining > 56) {
      memset(buffer + remaining, 0, 64 - remaining);
      transform(state, buffer);
      memset(buffer, 0, 56);
    } else {
      memset(buffer + remaining, 0, 56 - remaining);
    }
    
    // Append bit length in big-endian
    for (int j = 0; j < 8; j++) {
      buffer[56 + j] = (uint8_t)(bitLength >> (56 - j * 8));
    }
    transform(state, buffer);
    
    for (int j = 0; j < 5; j++) {
      dest[j * 4] = (uint8_t)(state[j] >> 24);
      dest[j * 4 + 1] = (uint8_t)(state[j] >> 16);
      dest[j * 4 + 2] = (uint8_t)(state[j] >> 8);
      dest[j * 4 + 3] = (uint8_t)state[j];
    }
  }
}

// Tiny pure C++ Base64 implementation
namespace Base64 {
  const char chars[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  
  String encode(const uint8_t* data, size_t length) {
    String result = "";
    int i = 0;
    while (i < length) {
      uint32_t val = (data[i] << 16) | 
                     ((i + 1 < length ? data[i + 1] : 0) << 8) | 
                     (i + 2 < length ? data[i + 2] : 0);
      
      result += chars[(val >> 18) & 0x3F];
      result += chars[(val >> 12) & 0x3F];
      result += (i + 1 < length ? chars[(val >> 6) & 0x3F] : '=');
      result += (i + 2 < length ? chars[val & 0x3F] : '=');
      
      i += 3;
    }
    return result;
  }
}

// Camera Model: AI-THINKER
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27

#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

#define FLASH_GPIO_NUM     4
#define HEADLIGHT_LED_PIN 33 // Onboard red LED (active low)

// SSD1306 OLED Config
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET     -1
#define SCREEN_ADDRESS 0x3C
#define OLED_SDA       13 // Custom I2C Data pin for ESP32-CAM
#define OLED_SCL       15 // Custom I2C Clock pin for ESP32-CAM

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// WiFi Settings
const char* ssid = "siddu";
const char* password = "sidduubdt";

// Web Servers
WebServer server(80);         // Main HTTP & WebSocket Server
WebServer streamServer(81);   // Dedicated Live Video Stream Server

// WebSocket Client state
WiFiClient wsClient;
bool wsConnected = false;
unsigned long lastTelemetryTime = 0;

// Cached telemetry variables from Arduino Uno
int cachedDistance = 80;
int cachedPir = 0;
int cachedSoilMoisture = 45;
int cachedMq5Gas = 120;
int cachedHeatFlux = 150;
float cachedTemperature = 28.0;
float cachedHumidity = 42.0;

// Camera and Synchronization state
bool cameraInitSuccess = false;
SemaphoreHandle_t camSemaphore = NULL;

// Helper to inject CORS headers for browser security
void setCORSHeaders() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "*");
}

void handleRoot() {
  setCORSHeaders();
  String html = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
<title>RoboCore ESP32-CAM Controller</title>
<style>
body{font-family:Arial;background:#0f172a;color:#f8fafc;text-align:center;margin-top:50px;}
h1{color:#38bdf8;}
button{padding:12px 24px;font-size:16px;margin:8px;cursor:pointer;background:#0284c7;color:white;border:none;border-radius:8px;}
button:hover{background:#0369a1;}
</style>
</head>
<body>
<h1>RoboCore ESP32-CAM Controller</h1>
<p>Firmware Running Successfully</p>
<p>Live Video Stream Port 81: <a href="http://__IP__:81/stream" style="color:#38bdf8;">/stream</a></p>
<button onclick="fetch('/headlight?val=1')">LED ON</button>
<button onclick="fetch('/headlight?val=0')">LED OFF</button>
</body>
</html>
)rawliteral";
  html.replace("__IP__", WiFi.localIP().toString());
  server.send(200, "text/html", html);
}

// React app checks this to verify the connection
void handleStatus() {
  setCORSHeaders();
  long rssi = WiFi.RSSI();
  float battery = 11.5 + ((float)random(0, 150) / 100.0); // Simulated battery
  
  String json = "{\"battery\":" + String(battery, 2) + 
                ",\"distance\":" + String(cachedDistance) + 
                ",\"pir\":" + String(cachedPir) + 
                ",\"soilMoisture\":" + String(cachedSoilMoisture) + 
                ",\"mq5Gas\":" + String(cachedMq5Gas) + 
                ",\"heatFlux\":" + String(cachedHeatFlux) + 
                ",\"temperature\":" + String(cachedTemperature, 1) + 
                ",\"humidity\":" + String(cachedHumidity, 1) + 
                ",\"wifi\":" + String(rssi) + 
                ",\"camera_init\":" + (cameraInitSuccess ? "true" : "false") + 
                ",\"arduinoConnected\":" + ((millis() - lastTelemetryTime < 3000) ? "true" : "false") + "}";
  server.send(200, "application/json", json);
}

// Maps to the Headlights button in the React UI (Onboard Red LED active-low)
void handleHeadlight() {
  setCORSHeaders();
  if (server.hasArg("val")) {
    int val = server.arg("val").toInt();
    digitalWrite(HEADLIGHT_LED_PIN, val ? LOW : HIGH); // Active-low control
    Serial.printf("Headlight set to: %d\n", val);
    
    // Command Uno to update RGB: White for Headlight ON, Green for Headlight OFF
    Serial1.printf("RGB:%d:%d:%d\n", val ? 255 : 0, val ? 255 : 255, val ? 255 : 0);
    
    // Show headlight status on OLED
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(0, 0);
    display.println("Headlight Status:");
    display.setTextSize(2);
    display.setCursor(0, 20);
    display.println(val ? "ACTIVE" : "INACTIVE");
    display.setTextSize(1);
    display.setCursor(0, 56);
    display.print("IP: ");
    display.print(WiFi.localIP().toString());
    display.display();

    server.send(200, "text/plain", val ? "ON" : "OFF");
  } else {
    server.send(400, "text/plain", "Missing 'val' parameter");
  }
}

// Maps to the Horn button in the React UI (flashes the white flash LED rapidly)
void handleHorn() {
  setCORSHeaders();
  Serial.println("Horn triggered!");
  
  // Forward Horn active to Arduino Uno over Serial1
  Serial1.println("HORN:1");
  
  // Show horn status on OLED
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("Sound Horn:");
  display.setTextSize(2);
  display.setCursor(0, 20);
  display.println("BEEP! BEEP!");
  display.setTextSize(1);
  display.setCursor(0, 56);
  display.print("IP: ");
  display.print(WiFi.localIP().toString());
  display.display();

  // Flash white flash LED as visual horn response
  digitalWrite(FLASH_GPIO_NUM, HIGH); delay(80);
  digitalWrite(FLASH_GPIO_NUM, LOW); delay(80);
  digitalWrite(FLASH_GPIO_NUM, HIGH); delay(80);
  digitalWrite(FLASH_GPIO_NUM, LOW);
  
  // Turn off horn on Arduino Uno
  Serial1.println("HORN:0");
  
  server.send(200, "text/plain", "BEEP");
}

// Maps to the OLED Text submit on the React UI
void handleDisplay() {
  setCORSHeaders();
  if (server.hasArg("text")) {
    String text = server.arg("text");
    Serial.print("OLED Print Request: ");
    Serial.println(text);

    display.clearDisplay();
    display.setTextColor(SSD1306_WHITE);
    if (text.length() > 10) {
      display.setTextSize(1); // Smaller font for longer text
    } else {
      display.setTextSize(2); // Bigger font for short text
    }
    
    display.setCursor(0, 15);
    display.println(text);
    
    display.setTextSize(1);
    display.setCursor(0, 56);
    display.print("IP: ");
    display.print(WiFi.localIP().toString());
    display.display();

    server.send(200, "text/plain", "OLED updated");
  } else {
    server.send(400, "text/plain", "Missing 'text' parameter");
  }
}

// Control camera flash LED (GPIO 4)
void handleFlash() {
  setCORSHeaders();
  if (server.hasArg("val")) {
    int val = server.arg("val").toInt();
    digitalWrite(FLASH_GPIO_NUM, val ? HIGH : LOW);
    Serial.printf("Flash set to: %d\n", val);
    server.send(200, "text/plain", val ? "ON" : "OFF");
  } else {
    server.send(400, "text/plain", "Missing 'val' parameter");
  }
}

// Thread-safe camera frame acquisition helper
camera_fb_t* safe_get_fb() {
  if (!cameraInitSuccess) return NULL;
  if (!camSemaphore) return esp_camera_fb_get();
  
  camera_fb_t* fb = NULL;
  // Try to acquire camera lock, wait up to 150ms
  if (xSemaphoreTake(camSemaphore, pdMS_TO_TICKS(150)) == pdTRUE) {
    fb = esp_camera_fb_get();
    if (!fb) {
      xSemaphoreGive(camSemaphore); // Give back immediately on failure
    }
  }
  return fb;
}

// Thread-safe camera frame release helper
void safe_return_fb(camera_fb_t* fb) {
  if (fb) {
    esp_camera_fb_return(fb);
    if (camSemaphore) {
      xSemaphoreGive(camSemaphore);
    }
  }
}

// Captures a single JPEG snapshot frame safely
void handleCapture() {
  setCORSHeaders();
  camera_fb_t* fb = safe_get_fb();
  if (!fb) {
    Serial.println("Camera capture failed (busy or uninitialized)");
    server.send(500, "text/plain", "Camera capture failed");
    return;
  }
  
  WiFiClient client = server.client();
  client.println("HTTP/1.1 200 OK");
  client.println("Content-Type: image/jpeg");
  client.println("Access-Control-Allow-Origin: *");
  client.printf("Content-Length: %u\r\n", fb->len);
  client.println();
  client.write(fb->buf, fb->len);
  client.flush();
  
  safe_return_fb(fb);
}

// Handle preflight CORS requests from browsers
void handleOptions() {
  setCORSHeaders();
  server.send(204);
}

// WebSocket support helper functions
String calculateAcceptKey(String clientKey) {
  String concat = clientKey + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
  uint8_t sha1Result[20];
  SHA1::calculate((const uint8_t*)concat.c_str(), concat.length(), sha1Result);
  return Base64::encode(sha1Result, 20);
}

// Simple JSON field parser
String getValue(String data, String key) {
  int keyIndex = data.indexOf("\"" + key + "\"");
  if (keyIndex == -1) return "";
  int valStart = data.indexOf(":", keyIndex);
  if (valStart == -1) return "";
  valStart++;
  while (valStart < data.length() && (data[valStart] == ' ' || data[valStart] == '"')) {
    valStart++;
  }
  int valEnd = valStart;
  if (data[valStart - 1] == '"') {
    while (valEnd < data.length() && data[valEnd] != '"') {
      valEnd++;
    }
  } else {
    while (valEnd < data.length() && data[valEnd] != ',' && data[valEnd] != '}') {
      valEnd++;
    }
  }
  return data.substring(valStart, valEnd);
}

// Sends text frame over WebSocket
void sendWebSocketText(String text) {
  if (!wsConnected || !wsClient.connected()) return;
  
  size_t length = text.length();
  wsClient.write(0x81); // FIN = 1, Opcode = 1 (Text)
  
  if (length < 126) {
    wsClient.write((uint8_t)length);
  } else if (length <= 65535) {
    wsClient.write(126);
    uint16_t len = __builtin_bswap16((uint16_t)length);
    wsClient.write((uint8_t*)&len, 2);
  }
  
  wsClient.print(text);
  wsClient.flush();
}

// Handle steering and state commands received via WebSocket
void handleWebSocketMessage(String msg) {
  Serial.print("WS Message: ");
  Serial.println(msg);
  
  String type = getValue(msg, "type");
  
  if (type == "move") {
    String direction = getValue(msg, "direction");
    String speedStr = getValue(msg, "speed");
    int speed = speedStr.toInt();
    
    Serial.printf("MOVE: %s at speed %d%%\n", direction.c_str(), speed);
    
    // Forward movement command to Arduino Uno over Serial1
    Serial1.printf("MOVE:%s:%d\n", direction.c_str(), speed);
    
    // Render movement feedback on OLED
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(0, 0);
    display.println("Motor Drive Status:");
    display.setTextSize(2);
    display.setCursor(0, 16);
    display.println(direction);
    display.setTextSize(1);
    display.setCursor(0, 40);
    display.printf("Speed: %d%%\n", speed);
    display.setCursor(0, 56);
    display.print("IP: ");
    display.print(WiFi.localIP().toString());
    display.display();
    
  } else if (type == "speed") {
    String speedStr = getValue(msg, "speed");
    int speed = speedStr.toInt();
    Serial.printf("Throttling Speed: %d%%\n", speed);
    
  } else if (type == "mode") {
    String mode = getValue(msg, "mode");
    Serial.printf("Robot Mode Select: %s\n", mode.c_str());
    
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(0, 0);
    display.println("Operation Mode:");
    display.setTextSize(2);
    display.setCursor(0, 20);
    display.println(mode);
    display.setTextSize(1);
    display.setCursor(0, 56);
    display.print("IP: ");
    display.print(WiFi.localIP().toString());
    display.display();
    
  } else if (type == "estop") {
    Serial.println("EMERGENCY STOP ENFORCED!");
    
    // Forward E-Stop to Arduino Uno
    Serial1.println("MOVE:stop:0");
    Serial1.println("RGB:255:0:0"); // Set to RED
    
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(0, 0);
    display.println("SYSTEM STATUS:");
    display.setTextSize(2);
    display.setCursor(0, 20);
    display.println("!! ESTOP !!");
    display.setTextSize(1);
    display.setCursor(0, 56);
    display.print("IP: ");
    display.print(WiFi.localIP().toString());
    display.display();
  } else if (type == "servo") {
    // Allows rotating camera pan/tilt if needed
    String angle = getValue(msg, "angle");
    Serial1.printf("SERVO:%s\n", angle.c_str());
  }
}

// Handshake to switch connection to WebSocket protocol
void handleWebSocketHandshake() {
  if (server.header("Upgrade") == "websocket") {
    String clientKey = server.header("Sec-WebSocket-Key");
    String acceptKey = calculateAcceptKey(clientKey);
    
    WiFiClient client = server.client();
    client.println("HTTP/1.1 101 Switching Protocols");
    client.println("Upgrade: websocket");
    client.println("Connection: Upgrade");
    client.print("Sec-WebSocket-Accept: ");
    client.println(acceptKey);
    client.println();
    client.flush();
    
    wsClient = client;
    wsConnected = true;
    Serial.println("WebSocket Client Handshake Successful!");
  } else {
    server.send(400, "text/plain", "Not a WebSocket request");
  }
}

// REST HTTP Movement command handler
void handleMove() {
  setCORSHeaders();
  if (server.hasArg("dir")) {
    String direction = server.arg("dir");
    int speed = server.hasArg("speed") ? server.arg("speed").toInt() : 80;
    
    Serial.printf("HTTP MOVE: %s at speed %d%%\n", direction.c_str(), speed);
    
    // Forward movement command to Arduino Uno over Serial1
    Serial1.printf("MOVE:%s:%d\n", direction.c_str(), speed);
    
    // Render movement feedback on OLED
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(0, 0);
    display.println("Motor Drive Status:");
    display.setTextSize(2);
    display.setCursor(0, 16);
    display.println(direction);
    display.setTextSize(1);
    display.setCursor(0, 40);
    display.printf("Speed: %d%%\n", speed);
    display.setCursor(0, 56);
    display.print("IP: ");
    display.print(WiFi.localIP().toString());
    display.display();
    
    server.send(200, "text/plain", "OK");
  } else {
    server.send(400, "text/plain", "Missing 'dir' parameter");
  }
}

// REST HTTP Speed command handler
void handleSpeed() {
  setCORSHeaders();
  if (server.hasArg("val")) {
    int speed = server.arg("val").toInt();
    Serial.printf("Throttling Speed: %d%%\n", speed);
    server.send(200, "text/plain", "OK");
  } else {
    server.send(400, "text/plain", "Missing 'val' parameter");
  }
}

// REST HTTP Mode command handler
void handleMode() {
  setCORSHeaders();
  if (server.hasArg("val")) {
    String mode = server.arg("val");
    Serial.printf("Robot Mode Select: %s\n", mode.c_str());
    
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(0, 0);
    display.println("Operation Mode:");
    display.setTextSize(2);
    display.setCursor(0, 20);
    display.println(mode);
    display.setTextSize(1);
    display.setCursor(0, 56);
    display.print("IP: ");
    display.print(WiFi.localIP().toString());
    display.display();
    
    server.send(200, "text/plain", "OK");
  } else {
    server.send(400, "text/plain", "Missing 'val' parameter");
  }
}

// REST HTTP E-Stop command handler
void handleEStop() {
  setCORSHeaders();
  Serial.println("EMERGENCY STOP ENFORCED!");
  
  // Forward E-Stop to Arduino Uno
  Serial1.println("MOVE:stop:0");
  Serial1.println("RGB:255:0:0"); // Set to RED
  
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("SYSTEM STATUS:");
  display.setTextSize(2);
  display.setCursor(0, 20);
  display.println("!! ESTOP !!");
  display.setTextSize(1);
  display.setCursor(0, 56);
  display.print("IP: ");
  display.print(WiFi.localIP().toString());
  display.display();
  
  server.send(200, "text/plain", "OK");
}

// REST HTTP RGB control handler
void handleRGB() {
  setCORSHeaders();
  if (server.hasArg("r") && server.hasArg("g") && server.hasArg("b")) {
    int r = server.arg("r").toInt();
    int g = server.arg("g").toInt();
    int b = server.arg("b").toInt();
    
    Serial.printf("RGB Control: R=%d, G=%d, B=%d\n", r, g, b);
    Serial1.printf("RGB:%d:%d:%d\n", r, g, b);
    
    server.send(200, "text/plain", "RGB Updated");
  } else {
    server.send(400, "text/plain", "Missing RGB parameters");
  }
}


// Package and stream telemetry packages over active WebSocket connection
void sendTelemetry() {
  if (!wsConnected) return;
  
  long rssi = WiFi.RSSI();
  float battery = 11.5 + ((float)random(0, 150) / 100.0); // Simulated 11.5V to 13.0V
  int distance = random(15, 180);                        // Simulated distance in cm
  float temp = 28.0 + ((float)random(0, 30) / 10.0);    // Simulated temperature
  float humidity = 42.0 + ((float)random(0, 80) / 10.0); // Simulated humidity
  
  String json = "{\"type\":\"telemetry\",\"battery\":" + String(battery, 2) + 
                ",\"distance\":" + String(distance) + 
                ",\"temperature\":" + String(temp, 1) + 
                ",\"humidity\":" + String(humidity, 1) + 
                ",\"arduinoConnected\":false" +
                ",\"wifi\":" + String(rssi) + "}";
  
  sendWebSocketText(json);
}

// MJPEG multipart stream handler
#define PART_BOUNDARY "123456789000000000000987654321"
static const char* _STREAM_CONTENT_TYPE = "multipart/x-mixed-replace;boundary=" PART_BOUNDARY;
static const char* _STREAM_BOUNDARY = "\r\n--" PART_BOUNDARY "\r\n";
static const char* _STREAM_PART = "Content-Type: image/jpeg\r\nContent-Length: %u\r\n\r\n";

void handleStream() {
  char part_buf[64];
  WiFiClient client = streamServer.client();
  
  client.println("HTTP/1.1 200 OK");
  client.printf("Content-Type: %s\r\n", _STREAM_CONTENT_TYPE);
  client.println("Access-Control-Allow-Origin: *");
  client.println();
  client.flush();
  
  Serial.println("Live stream client connected");
  
  while (client.connected()) {
    camera_fb_t* fb = safe_get_fb();
    if (!fb) {
      Serial.println("Camera capture failed (busy or uninitialized)");
      server.handleClient(); // Let port 80 requests execute
      delay(100);
      continue;
    }
    
    if (client.write(_STREAM_BOUNDARY, strlen(_STREAM_BOUNDARY)) == 0) {
      safe_return_fb(fb);
      break;
    }
    
    size_t hlen = snprintf(part_buf, 64, _STREAM_PART, fb->len);
    if (client.write(part_buf, hlen) == 0) {
      safe_return_fb(fb);
      break;
    }
    
    if (client.write(fb->buf, fb->len) == 0) {
      safe_return_fb(fb);
      break;
    }
    
    safe_return_fb(fb);
    
    // Let the main web server process client requests (e.g. movement, speed, status)
    server.handleClient();
    
    // Give the CPU and network stack some breathing room to avoid port 80 timeout
    delay(40);
    yield();
  }
  
  Serial.println("Live stream client disconnected");
}

// Parses telemetry packets from Arduino Uno and broadcasts to React Client
// Parses telemetry packets from Arduino Uno and updates cached values
void parseUnoPacket(String packet) {
  packet.trim();
  if (packet.startsWith("TELE:")) {
    lastTelemetryTime = millis();
    String data = packet.substring(5);
    
    // Count how many colons exist to determine format
    int colonCount = 0;
    int idx = 0;
    while ((idx = data.indexOf(':', idx)) != -1) {
      colonCount++;
      idx++;
    }
    
    int distance = 80;
    int pir = 0;
    int soil = 45;
    int mq5 = 120;
    int heatFlux = 150;
    float dhtTemp = 28.0;
    float dhtHum = 42.0;
    
    if (colonCount == 5) {
      // Old format: TELE:distance:pir:soilMoisture:flame:temperature:humidity
      int colon1 = data.indexOf(':');
      String distStr = data.substring(0, colon1);
      
      String sub1 = data.substring(colon1 + 1);
      int colon2 = sub1.indexOf(':');
      String pirStr = sub1.substring(0, colon2);
      
      String sub2 = sub1.substring(colon2 + 1);
      int colon3 = sub2.indexOf(':');
      String soilStr = sub2.substring(0, colon3);
      
      String sub3 = sub2.substring(colon3 + 1);
      int colon4 = sub3.indexOf(':');
      String flameStr = sub3.substring(0, colon4);
      
      String sub4 = sub3.substring(colon4 + 1);
      int colon5 = sub4.indexOf(':');
      String tempStr = sub4.substring(0, colon5);
      String humStr = sub4.substring(colon5 + 1);
      
      distance = distStr.toInt();
      pir = pirStr.toInt();
      soil = soilStr.toInt();
      int flame = flameStr.toInt();
      dhtTemp = tempStr.toFloat();
      dhtHum = humStr.toFloat();
      
      // Map flame sensor to heatFlux and mq5Gas proxy values
      heatFlux = flame ? 450 : 150;
      mq5 = flame ? 350 : 120;
      
    } else if (colonCount >= 6) {
      // New format: TELE:distance:pir:soilMoisture:mq5Gas:heatFlux:temperature:humidity
      int colons[10];
      int count = 0;
      int searchIdx = 0;
      while ((searchIdx = data.indexOf(':', searchIdx)) != -1 && count < 10) {
        colons[count++] = searchIdx;
        searchIdx++;
      }
      
      if (count >= 6) {
        String distStr = data.substring(0, colons[0]);
        String pirStr = data.substring(colons[0] + 1, colons[1]);
        String soilStr = data.substring(colons[1] + 1, colons[2]);
        String mq5Str = data.substring(colons[2] + 1, colons[3]);
        String heatStr = data.substring(colons[3] + 1, colons[4]);
        String tempStr = data.substring(colons[4] + 1, colons[5]);
        String humStr = data.substring(colons[5] + 1);
        
        distance = distStr.toInt();
        pir = pirStr.toInt();
        soil = soilStr.toInt();
        mq5 = mq5Str.toInt();
        heatFlux = heatStr.toInt();
        dhtTemp = tempStr.toFloat();
        dhtHum = humStr.toFloat();
      }
    }
    
    // Update global variables
    cachedDistance = distance;
    cachedPir = pir;
    cachedSoilMoisture = soil;
    cachedMq5Gas = mq5;
    cachedHeatFlux = heatFlux;
    cachedTemperature = dhtTemp;
    cachedHumidity = dhtHum;
    
    // Send Telemetry JSON to client
    long rssi = WiFi.RSSI();
    float battery = 11.5 + ((float)random(0, 150) / 100.0);
    String json = "{\"type\":\"telemetry\",\"battery\":" + String(battery, 2) + 
                  ",\"distance\":" + String(distance) + 
                  ",\"pir\":" + String(pir) + 
                  ",\"soilMoisture\":" + String(soil) + 
                  ",\"mq5Gas\":" + String(mq5) + 
                  ",\"heatFlux\":" + String(heatFlux) + 
                  ",\"temperature\":" + String(dhtTemp, 1) + 
                  ",\"humidity\":" + String(dhtHum, 1) + 
                  ",\"arduinoConnected\":true" +
                  ",\"wifi\":" + String(rssi) + "}";
    sendWebSocketText(json);
  }
}

void setup() {
  Serial.begin(115200);
  delay(100); // Give serial monitor time to connect

  // 1. Camera settings configure & initialization (MUST happen first for SRAM allocation success)
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  config.grab_mode = CAMERA_GRAB_WHEN_EMPTY;
  config.fb_location = CAMERA_FB_IN_PSRAM;
  config.jpeg_quality = 12;
  config.fb_count = 1;

  if (psramFound()) {
    config.frame_size = FRAMESIZE_VGA;
    config.jpeg_quality = 10;
    config.fb_count = 2;
    config.grab_mode = CAMERA_GRAB_LATEST;
    Serial.println("PSRAM found. Camera configured for VGA in PSRAM.");
  } else {
    config.frame_size = FRAMESIZE_QVGA; // 320x240 (ultra safe fallback for internal SRAM)
    config.fb_location = CAMERA_FB_IN_DRAM;
    config.jpeg_quality = 16;
    config.fb_count = 1;
    Serial.println("PSRAM NOT found. Camera configured for QVGA in DRAM.");
  }

  // Create FreeRTOS Mutex semaphore for camera frame synchronization
  camSemaphore = xSemaphoreCreateMutex();

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera initialization failed: 0x%x\n", err);
    cameraInitSuccess = false;
  } else {
    Serial.println("Camera driver initialized successfully.");
    cameraInitSuccess = true;
    
    // Sensor orientation adjustments for AI-THINKER module
    sensor_t * s = esp_camera_sensor_get();
    if (s) {
      s->set_vflip(s, 1);
      s->set_hmirror(s, 1);
    }
  }

  // 2. Initialize LEDs
  pinMode(HEADLIGHT_LED_PIN, OUTPUT);
  digitalWrite(HEADLIGHT_LED_PIN, HIGH); // Off
  pinMode(FLASH_GPIO_NUM, OUTPUT);
  digitalWrite(FLASH_GPIO_NUM, LOW); // Off

  // 3. Connect to Wifi Network
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected!");
  Serial.print("Local IP Address: ");
  Serial.println(WiFi.localIP());

  // 4. Setup I2C SSD1306 Display on custom pins
  Wire.begin(OLED_SDA, OLED_SCL);
  if(!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
    Serial.println(F("SSD1306 OLED allocation failed"));
  } else {
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(0, 0);
    display.println("RoboCore Active!");
    display.println("");
    display.println("WiFi: Connected");
    display.println("IP Address:");
    display.println(WiFi.localIP().toString());
    display.display();
  }

  // Instruct WebServer to collect WebSocket-specific handshake headers
  const char* headerkeys[] = {"Upgrade", "Sec-WebSocket-Key"};
  size_t headerkeyssize = sizeof(headerkeys)/sizeof(char*);
  server.collectHeaders(headerkeys, headerkeyssize);

  // Setup server endpoints on Port 80
  server.on("/", HTTP_GET, handleRoot);
  server.on("/status", HTTP_GET, handleStatus);
  server.on("/headlight", HTTP_GET, handleHeadlight);
  server.on("/horn", HTTP_GET, handleHorn);
  server.on("/display", HTTP_GET, handleDisplay);
  server.on("/flash", HTTP_GET, handleFlash);
  server.on("/capture", HTTP_GET, handleCapture);
  server.on("/ws", HTTP_GET, handleWebSocketHandshake);
  server.on("/move", HTTP_GET, handleMove);
  server.on("/speed", HTTP_GET, handleSpeed);
  server.on("/mode", HTTP_GET, handleMode);
  server.on("/estop", HTTP_GET, handleEStop);
  server.on("/rgb", HTTP_GET, handleRGB);

  server.on("/status", HTTP_OPTIONS, handleOptions);
  server.on("/headlight", HTTP_OPTIONS, handleOptions);
  server.on("/horn", HTTP_OPTIONS, handleOptions);
  server.on("/display", HTTP_OPTIONS, handleOptions);
  server.on("/flash", HTTP_OPTIONS, handleOptions);
  server.on("/capture", HTTP_OPTIONS, handleOptions);
  server.on("/move", HTTP_OPTIONS, handleOptions);
  server.on("/speed", HTTP_OPTIONS, handleOptions);
  server.on("/mode", HTTP_OPTIONS, handleOptions);
  server.on("/estop", HTTP_OPTIONS, handleOptions);
  server.on("/rgb", HTTP_OPTIONS, handleOptions);

  server.begin();
  Serial.println("HTTP Server active on port 80");

  // Stream Server active on Port 81
  streamServer.on("/stream", HTTP_GET, handleStream);
  streamServer.begin();
  Serial.println("MJPEG Camera Stream Server active on port 81");

  // Initialize UART1 Serial connection to Arduino Uno (RX=12, TX=14)
  Serial1.begin(9600, SERIAL_8N1, 12, 14);
  Serial.println("Serial Link to Arduino Uno initialized.");
}

void loop() {
  server.handleClient();
  streamServer.handleClient();

  if (wsConnected) {
    if (!wsClient.connected()) {
      wsConnected = false;
      Serial.println("WebSocket Client connection closed");
    } else {
      while (wsClient.available() > 0) {
        // Read WebSocket frames
        uint8_t byte0 = wsClient.read();
        uint8_t byte1 = wsClient.read();
        
        bool fin = byte0 & 0x80;
        uint8_t opcode = byte0 & 0x0F;
        bool masked = byte1 & 0x80;
        uint64_t payloadLen = byte1 & 0x7F;
        
        if (payloadLen == 126) {
          uint16_t len = 0;
          wsClient.readBytes((uint8_t*)&len, 2);
          payloadLen = __builtin_bswap16(len);
        } else if (payloadLen == 127) {
          uint64_t len = 0;
          wsClient.readBytes((uint8_t*)&len, 8);
          payloadLen = ((uint64_t)__builtin_bswap32(len & 0xFFFFFFFF) << 32) | __builtin_bswap32(len >> 32);
        }
        
        uint8_t mask[4];
        if (masked) {
          wsClient.readBytes(mask, 4);
        }
        
        uint8_t* payload = (uint8_t*)malloc(payloadLen + 1);
        wsClient.readBytes(payload, payloadLen);
        payload[payloadLen] = '\0';
        
        if (masked) {
          for (uint64_t i = 0; i < payloadLen; i++) {
            payload[i] ^= mask[i % 4];
          }
        }
        
        if (opcode == 0x8) { // Connection Close
          wsConnected = false;
          wsClient.stop();
          Serial.println("WebSocket Client closed frame received");
        } else if (opcode == 0x1) { // Text frame
          String msg = String((char*)payload);
          handleWebSocketMessage(msg);
        }
        
        free(payload);
      }
    }
  }

  // Process incoming telemetry from Arduino Uno over Serial1
  static String unoString = "";
  while (Serial1.available() > 0) {
    char inChar = (char)Serial1.read();
    if (inChar == '\n') {
      parseUnoPacket(unoString);
      unoString = "";
    } else {
      unoString += inChar;
    }
  }

  // Fallback to simulated telemetry only if WebSocket is active but Uno is not transmitting
  if (wsConnected && (millis() - lastTelemetryTime >= 1000)) {
    lastTelemetryTime = millis();
    sendTelemetry();
  }
}
