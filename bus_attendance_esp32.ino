/*
  College Bus Attendance System - ESP32
  --------------------------------------
  Reads:
    - RFID card UID (MFRC522, SPI)
    - GPS location (NEO-6M, UART2)
  Sends to Firebase Realtime Database:
    https://college-bus-119b6-default-rtdb.asia-southeast1.firebasedatabase.app/bus/BUS001.json
  Buzzer (pin 4) beeps once on a successful scan/upload.

  Libraries needed (Arduino IDE > Library Manager):
    - MFRC522        by GithubCommunity
    - TinyGPSPlus    by Mikal Hart

  ------------------------------------------------------------
  WIRING
  ------------------------------------------------------------
  RFID RC522  -> ESP32
    VCC  -> 3.3V   (RC522 is 3.3V only, do NOT use 5V)
    GND  -> GND
    SDA/SS -> GPIO 5
    SCK  -> GPIO 18
    MOSI -> GPIO 23
    MISO -> GPIO 19
    RST  -> GPIO 22
    IRQ  -> not connected

  GPS NEO-6M  -> ESP32
    VCC  -> 5V (VIN) or 3.3V, check your module's silkscreen
    GND  -> GND
    TX   -> GPIO 16 (ESP32 RX2)
    RX   -> GPIO 17 (ESP32 TX2)

  Buzzer -> ESP32
    +    -> GPIO 4
    -    -> GND
    (Use a transistor/driver if it's a large 5V buzzer that draws
     more current than a GPIO pin can supply; a small 3.3V active
     buzzer can connect directly.)
  ------------------------------------------------------------
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>
#include <TinyGPSPlus.h>
#include <HardwareSerial.h>

// ---------- WiFi ----------
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// ---------- Firebase ----------
const String FIREBASE_HOST = "https://college-bus-119b6-default-rtdb.asia-southeast1.firebasedatabase.app";
const String BUS_ID         = "BUS001";

// ---------- RFID (RC522) ----------
#define SS_PIN  5
#define RST_PIN 22
MFRC522 rfid(SS_PIN, RST_PIN);

// ---------- GPS (NEO-6M) ----------
#define GPS_RX_PIN 16   // ESP32 RX2 <- GPS TX
#define GPS_TX_PIN 17   // ESP32 TX2 -> GPS RX
HardwareSerial gpsSerial(2);
TinyGPSPlus gps;

// ---------- Buzzer ----------
#define BUZZER_PIN 4

void connectWiFi() {
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(400);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("WiFi connected, IP: ");
  Serial.println(WiFi.localIP());
}

void beep(int times, int onMs, int offMs) {
  for (int i = 0; i < times; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(onMs);
    digitalWrite(BUZZER_PIN, LOW);
    if (i < times - 1) delay(offMs);
  }
}

String readRFIDUID() {
  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(rfid.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();
  return uid;
}

bool sendToFirebase(const String& rfidUID, double lat, double lng, bool gpsValid) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected, skipping upload");
    return false;
  }

  HTTPClient http;
  String url = FIREBASE_HOST + "/bus/" + BUS_ID + ".json";

  String payload = "{";
  payload += "\"bus_id\":\"" + BUS_ID + "\",";
  payload += "\"rfid\":\"" + rfidUID + "\",";
  payload += "\"lat\":" + String(gpsValid ? lat : 0.0, 6) + ",";
  payload += "\"lng\":" + String(gpsValid ? lng : 0.0, 6) + ",";
  payload += "\"gps_fix\":" + String(gpsValid ? "true" : "false") + ",";
  payload += "\"millis\":" + String(millis());
  payload += "}";

  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  int httpCode = http.PUT(payload);   // PUT overwrites bus/BUS001 with this object

  Serial.printf("Firebase PUT -> HTTP %d\n", httpCode);
  if (httpCode > 0) {
    Serial.println(http.getString());
  }
  http.end();

  return httpCode == 200;
}

void setup() {
  Serial.begin(115200);

  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  SPI.begin();
  rfid.PCD_Init();

  gpsSerial.begin(9600, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);

  connectWiFi();
  beep(2, 100, 100); // ready signal
}

void loop() {
  // Continuously feed GPS parser
  while (gpsSerial.available() > 0) {
    gps.encode(gpsSerial.read());
  }

  // Wait for a card
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) {
    return;
  }

  String uid = readRFIDUID();
  Serial.println("Card scanned: " + uid);

  bool gpsValid = gps.location.isValid();
  double lat = gpsValid ? gps.location.lat() : 0.0;
  double lng = gpsValid ? gps.location.lng() : 0.0;

  bool ok = sendToFirebase(uid, lat, lng, gpsValid);

  if (ok) {
    beep(1, 250, 0);   // single beep = upload success
  } else {
    beep(3, 100, 100); // triple beep = failed to upload
  }

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
  delay(1500); // debounce so the same card doesn't spam multiple reads
}
