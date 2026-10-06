/**
 * SMARTBUS GLOBALRIDE - SHARED DATA STORE & REAL-TIME SYNC ENGINE
 * Connects Firebase Realtime Database, BroadcastChannel (multi-tab instant sync), and LocalStorage.
 */

const FIREBASE_BASE_URL = "https://college-bus-119b6-default-rtdb.asia-southeast1.firebasedatabase.app";
const DEFAULT_BUS_ID = "BUS001";
const SYNC_CHANNEL_NAME = "smartbus_globalride_channel";

// BroadcastChannel for 0ms cross-window/cross-tab updates
const broadcast = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(SYNC_CHANNEL_NAME) : null;

// Initial Students Database
const INITIAL_STUDENTS = [
  {
    rfid: "RFID-102938",
    name: "Ajay Pravin",
    student_id: "23CS001",
    phone: "+91 98765 43210",
    parent_phone: "+91 94433 11223",
    department: "Computer Science",
    year: "3",
    pickup_point: "Erode Stand",
    pickup_lat: 11.341000,
    pickup_lng: 77.717000,
    pickup_notes: "Near Erode Central Bus Stand Gate 2",
    bus_id: "BUS001",
    avatar: "AP",
    avatar_color: "#2563eb",
    status: "Waiting",
    enrollment_status: "Active",
    status_reason: "",
    streak_days: 18,
    attendance_rate: "98%"
  },
  {
    rfid: "RFID-882194",
    name: "Deepa Lakshmi",
    student_id: "23EC015",
    phone: "+91 91234 56789",
    parent_phone: "+91 98421 98765",
    department: "Electronics & Comm",
    year: "2",
    pickup_point: "Perundurai Byp",
    pickup_lat: 11.278000,
    pickup_lng: 77.585000,
    pickup_notes: "Perundurai Bypass Flyover Junction",
    bus_id: "BUS001",
    avatar: "DL",
    avatar_color: "#10b981",
    status: "Waiting",
    enrollment_status: "Active",
    status_reason: "",
    streak_days: 14,
    attendance_rate: "95%"
  },
  {
    rfid: "RFID-554412",
    name: "Rahul Kumar",
    student_id: "23ME032",
    phone: "+91 94455 66778",
    parent_phone: "+91 97890 12345",
    department: "Mechanical Engg",
    year: "3",
    pickup_point: "Chithode Junction",
    pickup_lat: 11.378000,
    pickup_lng: 77.675000,
    pickup_notes: "Chithode Signal Opp. Post Office",
    bus_id: "BUS001",
    avatar: "RK",
    avatar_color: "#f59e0b",
    status: "Waiting",
    enrollment_status: "Active",
    status_reason: "",
    streak_days: 12,
    attendance_rate: "92%"
  },
  {
    rfid: "RFID-771122",
    name: "Sneha Patel",
    student_id: "23IT009",
    phone: "+91 90011 22334",
    parent_phone: "+91 93344 55667",
    department: "Information Tech",
    year: "1",
    pickup_point: "College Campus Gate",
    pickup_lat: 11.274000,
    pickup_lng: 77.607000,
    pickup_notes: "Main Archway North Entrance",
    bus_id: "BUS001",
    avatar: "SP",
    avatar_color: "#8b5cf6",
    status: "Waiting",
    enrollment_status: "Active",
    status_reason: "",
    streak_days: 21,
    attendance_rate: "100%"
  }
];

// Initial Drivers Database
const INITIAL_DRIVERS = [
  {
    driver_id: "DRV001",
    name: "John Peter",
    phone: "+91 98432 10987",
    password_hash: "494d022492052a06f8f81949639a1d148c1051fa3d4e4688fbd96efe649cd382", // SHA-256 of "driver123"
    bus_id: "BUS001",
    license_number: "DL-TN33-2018-00912",
    role: "driver",
    status: "active",
    avatar: "JP",
    avatar_color: "#2563eb",
    created_at: "2026-01-15T08:00:00.000Z"
  },
  {
    driver_id: "DRV002",
    name: "Arun Kumar",
    phone: "+91 98765 12340",
    password_hash: "494d022492052a06f8f81949639a1d148c1051fa3d4e4688fbd96efe649cd382", // SHA-256 of "driver123"
    bus_id: "BUS002",
    license_number: "DL-TN33-2020-00445",
    role: "driver",
    status: "active",
    avatar: "AK",
    avatar_color: "#10b981",
    created_at: "2026-02-10T08:00:00.000Z"
  },
  {
    driver_id: "DRV003",
    name: "Ravi Kumar",
    phone: "+91 97890 54321",
    password_hash: "494d022492052a06f8f81949639a1d148c1051fa3d4e4688fbd96efe649cd382", // SHA-256 of "driver123"
    bus_id: "BUS003",
    license_number: "DL-TN33-2019-00788",
    role: "driver",
    status: "active",
    avatar: "RK",
    avatar_color: "#f59e0b",
    created_at: "2026-03-01T08:00:00.000Z"
  }
];

// Cryptographic Password Hashing Utility (SHA-256 via Web Crypto API with fallback)
async function hashPassword(password) {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    } catch (e) {
      // Fallback below
    }
  }
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    hash = ((hash << 5) - hash) + password.charCodeAt(i);
    hash |= 0;
  }
  return "hash_" + Math.abs(hash).toString(16);
}

// Initial Bus Details & Telemetry
const INITIAL_BUS_DATA = {
  bus_id: "BUS001",
  route_name: "Erode Express &bull; Route 4",
  driver_name: "John Peter",
  driver_phone: "+91 98432 10987",
  license_plate: "TN-33-AX-4821",
  vehicle_model: "Volvo B11R &bull; 50 Seater",
  fuel_type: "Clean Diesel (8 km/l)",
  lat: 11.341000,
  lng: 77.717000,
  gps_fix: true,
  speed: 42,
  distance_km: 16.4,
  driving_hours: "1 hr 24 m",
  occupancy: 32,
  max_seats: 50,
  current_stop: "Perundurai Byp",
  next_stop: "Chithode Junction",
  eta: "12 mins",
  status: "En route"
};

// Route Waypoints
const ROUTE_STOPS = [
  { name: "Erode Stand", lat: 11.341000, lng: 77.717000, time: "07:45 AM", status: "passed", code: "ERD" },
  { name: "Perundurai Byp", lat: 11.278000, lng: 77.585000, time: "08:10 AM", status: "current", code: "PRD" },
  { name: "Chithode Junction", lat: 11.378000, lng: 77.675000, time: "08:25 AM", status: "upcoming", code: "CHT" },
  { name: "College Campus Gate", lat: 11.274000, lng: 77.607000, time: "08:45 AM", status: "upcoming", code: "CMP" }
];

class SmartBusStore {
  constructor() {
    this.busId = DEFAULT_BUS_ID;
    this.listeners = [];
    this.drivers = [];
    this.currentDriverSession = null;
    this.loadState();

    // Fetch latest drivers from Firebase in background
    this.fetchDriversFromFirebase();

    // Listen for cross-tab broadcast events
    if (broadcast) {
      broadcast.onmessage = (event) => {
        if (event.data && event.data.type) {
          this.handleBroadcastEvent(event.data);
        }
      };
    }

    // Auto-poll Firebase every 1.5 seconds for instant hardware responsiveness
    this.pollFirebase();
    setInterval(() => this.pollFirebase(), 1500);
  }

  loadState() {
    try {
      const storedStudents = localStorage.getItem("smartbus_students");
      if (storedStudents) {
        const parsed = JSON.parse(storedStudents);
        this.students = parsed.map(s => {
          if (!s.enrollment_status) s.enrollment_status = "Active";
          if (!s.status_reason) s.status_reason = "";
          if (typeof s.pickup_lat !== "number" || isNaN(s.pickup_lat)) {
            const matched = ROUTE_STOPS.find(st => st.name.toLowerCase() === (s.pickup_point || "").toLowerCase());
            s.pickup_lat = matched ? matched.lat : 11.278000;
            s.pickup_lng = matched ? matched.lng : 77.585000;
          }
          if (!s.pickup_notes) s.pickup_notes = "";
          return s;
        });
      } else {
        this.students = [...INITIAL_STUDENTS];
      }

      // Load Drivers Database
      const storedDrivers = localStorage.getItem("smartbus_drivers");
      this.drivers = storedDrivers ? JSON.parse(storedDrivers) : [...INITIAL_DRIVERS];

      // Load Active Driver Session
      const storedSession = localStorage.getItem("smartbus_driver_session");
      this.currentDriverSession = storedSession ? JSON.parse(storedSession) : null;

      const storedBus = localStorage.getItem("smartbus_busdata");
      this.busData = storedBus ? JSON.parse(storedBus) : { ...INITIAL_BUS_DATA };

      if (this.currentDriverSession) {
        this.busId = this.currentDriverSession.bus_id || DEFAULT_BUS_ID;
        this.busData.bus_id = this.busId;
        this.busData.driver_name = this.currentDriverSession.name;
        if (this.currentDriverSession.phone) {
          this.busData.driver_phone = this.currentDriverSession.phone;
        }
      } else {
        this.busId = this.busData.bus_id || DEFAULT_BUS_ID;
      }

      const storedLogs = localStorage.getItem("smartbus_attendance_logs");
      this.attendanceLogs = storedLogs ? JSON.parse(storedLogs) : [
        {
          id: "ATT-1001",
          rfid: "RFID-102938",
          name: "Ajay Pravin",
          student_id: "23CS001",
          bus_id: "BUS001",
          driver_id: "DRV001",
          driver_name: "John Peter",
          pickup: "Erode Stand",
          timestamp: "07:46 AM",
          date: new Date().toLocaleDateString(),
          status: "Confirmed",
          confirmedBy: "Driver John Peter (BUS001)",
          lat: 11.341000,
          lng: 77.717000
        }
      ];

      const storedPending = localStorage.getItem("smartbus_pending_scans");
      this.pendingScans = storedPending ? JSON.parse(storedPending) : [];

      const storedUnknown = localStorage.getItem("smartbus_unknown_cards");
      this.unknownCards = storedUnknown ? JSON.parse(storedUnknown) : [];

      const storedHistory = localStorage.getItem("smartbus_scan_history");
      this.scanHistory = storedHistory ? JSON.parse(storedHistory) : [
        {
          id: "SCH-101",
          rfid: "RFID-102938",
          isRegistered: true,
          studentName: "Ajay Pravin",
          studentId: "23CS001",
          pickup: "Erode Stand",
          timestamp: "07:46 AM",
          status: "Boarded & Confirmed"
        }
      ];

      const storedLastScan = localStorage.getItem("smartbus_last_scan");
      this.lastScan = storedLastScan ? JSON.parse(storedLastScan) : null;

      this.sosActive = localStorage.getItem("smartbus_sos") === "true";
      this.lastProcessedRfid = localStorage.getItem("smartbus_last_rfid") || "";
    } catch (e) {
      console.error("Failed to load local state", e);
      this.students = [...INITIAL_STUDENTS];
      this.drivers = [...INITIAL_DRIVERS];
      this.currentDriverSession = null;
      this.busData = { ...INITIAL_BUS_DATA };
      this.attendanceLogs = [];
      this.pendingScans = [];
      this.unknownCards = [];
      this.scanHistory = [];
      this.lastScan = null;
      this.sosActive = false;
      this.lastProcessedRfid = "";
    }
  }

  saveState() {
    try {
      localStorage.setItem("smartbus_students", JSON.stringify(this.students));
      localStorage.setItem("smartbus_drivers", JSON.stringify(this.drivers));
      if (this.currentDriverSession) {
        localStorage.setItem("smartbus_driver_session", JSON.stringify(this.currentDriverSession));
      } else {
        localStorage.removeItem("smartbus_driver_session");
      }
      localStorage.setItem("smartbus_busdata", JSON.stringify(this.busData));
      localStorage.setItem("smartbus_attendance_logs", JSON.stringify(this.attendanceLogs));
      localStorage.setItem("smartbus_pending_scans", JSON.stringify(this.pendingScans));
      localStorage.setItem("smartbus_unknown_cards", JSON.stringify(this.unknownCards));
      localStorage.setItem("smartbus_scan_history", JSON.stringify(this.scanHistory));
      if (this.lastScan) {
        localStorage.setItem("smartbus_last_scan", JSON.stringify(this.lastScan));
      } else {
        localStorage.removeItem("smartbus_last_scan");
      }
      localStorage.setItem("smartbus_sos", this.sosActive ? "true" : "false");
      localStorage.setItem("smartbus_last_rfid", this.lastProcessedRfid);
    } catch (e) {
      console.warn("Storage error", e);
    }
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify(eventType, payload) {
    this.saveState();
    this.listeners.forEach(cb => {
      try { cb(eventType, payload, this.getState()); } catch (e) { console.error(e); }
    });

    if (broadcast) {
      broadcast.postMessage({ type: eventType, payload, timestamp: Date.now() });
    }
  }

  handleBroadcastEvent(data) {
    this.loadState();
    this.listeners.forEach(cb => {
      try { cb(data.type, data.payload, this.getState()); } catch (e) { console.error(e); }
    });
  }

  getState() {
    return {
      students: this.students,
      drivers: this.getSanitizedDrivers(),
      currentDriver: this.currentDriverSession,
      busId: this.busId,
      busData: this.busData,
      attendanceLogs: this.attendanceLogs,
      pendingScans: this.pendingScans,
      unknownCards: this.unknownCards,
      scanHistory: this.scanHistory,
      lastScan: this.lastScan,
      sosActive: this.sosActive,
      routeStops: ROUTE_STOPS,
      lastProcessedRfid: this.lastProcessedRfid
    };
  }

  getSanitizedDrivers() {
    return this.drivers.map(({ password_hash, ...rest }) => rest);
  }

  isCardRegistered(rfidUID) {
    if (!rfidUID) return false;
    const clean = rfidUID.trim().toUpperCase();
    return this.students.some(s => s.rfid.toUpperCase() === clean);
  }

  getStudentByRfid(rfidUID) {
    if (!rfidUID) return null;
    const clean = rfidUID.trim().toUpperCase();
    return this.students.find(s => s.rfid.toUpperCase() === clean) || null;
  }

  // ==========================================
  // HARDWARE / SIMULATOR RFID SCAN TRIGGER
  // ==========================================
  handleIncomingScan(rfidUID, sourceLat = null, sourceLng = null) {
    if (!rfidUID || rfidUID === "—" || rfidUID === "") return;
    rfidUID = rfidUID.trim().toUpperCase();
    this.lastProcessedRfid = rfidUID;

    const student = this.students.find(s => s.rfid.toUpperCase() === rfidUID);
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const nowDate = new Date().toLocaleDateString();

    const activeDriverId = this.currentDriverSession ? this.currentDriverSession.driver_id : "DRV001";
    const activeDriverName = this.currentDriverSession ? this.currentDriverSession.name : (this.busData.driver_name || "John Peter");
    const activeBusId = this.busData.bus_id || DEFAULT_BUS_ID;

    if (student) {
      if (student.status === "Boarded") {
        // ====================================================
        // SECOND TAP: AUTOMATICALLY MARK AS "LANDED" (SAFE DROP-OFF)
        // ====================================================
        student.status = "Landed";
        
        // Decrement Bus Occupancy
        this.busData.occupancy = Math.max(0, this.busData.occupancy - 1);

        // Create Landed / De-boarding Attendance Record
        const currentStopName = this.busData.current_stop || "College Campus Gate";
        const record = {
          id: "ATT-" + Math.floor(1000 + Math.random() * 9000),
          rfid: student.rfid,
          name: student.name,
          student_id: student.student_id,
          bus_id: activeBusId,
          driver_id: activeDriverId,
          driver_name: activeDriverName,
          pickup: currentStopName,
          timestamp: nowTime,
          date: nowDate,
          status: "Landed (Safe Drop-off)",
          action: "LANDED",
          confirmedBy: `Driver ${activeDriverName} (${activeBusId})`,
          lat: (typeof sourceLat === 'number' && sourceLat !== 0) ? sourceLat : this.busData.lat,
          lng: (typeof sourceLng === 'number' && sourceLng !== 0) ? sourceLng : this.busData.lng
        };

        this.attendanceLogs.unshift(record);

        // Update Last Scan State
        this.lastScan = {
          rfid: student.rfid,
          isRegistered: true,
          action: "LANDED",
          student: { ...student },
          timestamp: nowTime,
          date: nowDate,
          stop: currentStopName,
          status: "🏁 Landed / Safely Dropped Off"
        };

        // Add to Live Scan Activity Feed
        const historyEntry = {
          id: "SCH-" + Math.floor(1000 + Math.random() * 9000),
          rfid: student.rfid,
          isRegistered: true,
          action: "LANDED",
          studentName: student.name,
          studentId: student.student_id,
          pickup: currentStopName,
          timestamp: nowTime,
          status: "🏁 Landed / Dropped Off"
        };
        this.scanHistory = [historyEntry, ...this.scanHistory.filter(h => h.rfid !== rfidUID || h.timestamp !== nowTime)].slice(0, 25);

        // Remove from pendingScans if present
        this.pendingScans = this.pendingScans.filter(p => p.rfid !== rfidUID);

        // Sync to Firebase
        this.pushAttendanceToFirebase(record);
        this.playChime('landed');
        this.notify("STUDENT_LANDED", { student, record, lastScan: this.lastScan });

      } else {
        // ====================================================
        // FIRST TAP: AUTOMATICALLY MARK AS "BOARDED" & VERIFIED
        // ====================================================
        student.status = "Boarded";

        // Increment Bus Occupancy
        if (this.busData.occupancy < this.busData.max_seats) {
          this.busData.occupancy++;
        }

        const pickupStop = student.pickup_point || this.busData.current_stop || "Erode Stand";
        const record = {
          id: "ATT-" + Math.floor(1000 + Math.random() * 9000),
          rfid: student.rfid,
          name: student.name,
          student_id: student.student_id,
          bus_id: activeBusId,
          driver_id: activeDriverId,
          driver_name: activeDriverName,
          pickup: pickupStop,
          timestamp: nowTime,
          date: nowDate,
          status: "Boarded",
          action: "BOARDED",
          confirmedBy: `Driver ${activeDriverName} (${activeBusId})`,
          lat: (typeof sourceLat === 'number' && sourceLat !== 0) ? sourceLat : this.busData.lat,
          lng: (typeof sourceLng === 'number' && sourceLng !== 0) ? sourceLng : this.busData.lng
        };

        this.attendanceLogs.unshift(record);

        // Update Last Scan State
        this.lastScan = {
          rfid: student.rfid,
          isRegistered: true,
          action: "BOARDED",
          student: { ...student },
          timestamp: nowTime,
          date: nowDate,
          stop: pickupStop,
          status: "🟢 Boarded & Auto-Verified"
        };

        // Add to Live Scan Activity Feed
        const historyEntry = {
          id: "SCH-" + Math.floor(1000 + Math.random() * 9000),
          rfid: student.rfid,
          isRegistered: true,
          action: "BOARDED",
          studentName: student.name,
          studentId: student.student_id,
          pickup: pickupStop,
          timestamp: nowTime,
          status: "🟢 Boarded & Auto-Verified"
        };
        this.scanHistory = [historyEntry, ...this.scanHistory.filter(h => h.rfid !== rfidUID || h.timestamp !== nowTime)].slice(0, 25);

        // Sync to Firebase
        this.pushAttendanceToFirebase(record);
        this.playChime('boarded');
        this.notify("STUDENT_BOARDED", { student, record, lastScan: this.lastScan });
      }

    } else {
      // ====================================================
      // UNKNOWN / NEW RFID CARD TAP
      // ====================================================
      this.lastScan = {
        rfid: rfidUID,
        isRegistered: false,
        action: "NEW_CARD",
        student: null,
        timestamp: nowTime,
        date: nowDate,
        status: "New / Unregistered Card"
      };

      const unknownItem = {
        rfid: rfidUID,
        timestamp: nowTime,
        date: nowDate
      };

      if (!this.unknownCards.some(u => u.rfid === rfidUID)) {
        this.unknownCards.unshift(unknownItem);
      }

      const historyEntry = {
        id: "SCH-" + Math.floor(1000 + Math.random() * 9000),
        rfid: rfidUID,
        isRegistered: false,
        action: "NEW_CARD",
        studentName: "Unregistered Card",
        studentId: "NEW CARD",
        pickup: this.busData.current_stop || "Perundurai Byp",
        timestamp: nowTime,
        status: "⚠️ New Unregistered Card"
      };
      this.scanHistory = [historyEntry, ...this.scanHistory.filter(h => h.rfid !== rfidUID || h.timestamp !== nowTime)].slice(0, 25);

      this.playChime('unknown');
      this.notify("UNKNOWN_CARD_DETECTED", { rfid: rfidUID, unknownItem, lastScan: this.lastScan });
    }
  }

  // ==========================================
  // DRIVER ACTIONS & MANUAL OVERRIDES
  // ==========================================
  dismissScan() {
    this.lastScan = null;
    localStorage.removeItem("smartbus_last_scan");
    this.saveState();
    this.notify("SCAN_DISMISSED", {});
  }

  toggleStudentStatus(rfidUID) {
    this.handleIncomingScan(rfidUID);
  }

  confirmBoarding(scanId, rfidUID) {
    this.handleIncomingScan(rfidUID);
  }

  flagBoarding(scanId, rfidUID, reason = "Unscheduled Stop") {
    const student = this.students.find(s => s.rfid.toUpperCase() === rfidUID.toUpperCase());
    this.pendingScans = this.pendingScans.filter(p => p.scanId !== scanId);

    const activeDriverId = this.currentDriverSession ? this.currentDriverSession.driver_id : "DRV001";
    const activeDriverName = this.currentDriverSession ? this.currentDriverSession.name : (this.busData.driver_name || "John Peter");
    const activeBusId = this.busData.bus_id || DEFAULT_BUS_ID;

    const flagRecord = {
      id: "FLG-" + Math.floor(1000 + Math.random() * 9000),
      rfid: rfidUID,
      name: student ? student.name : "Unregistered",
      student_id: student ? student.student_id : "N/A",
      bus_id: activeBusId,
      driver_id: activeDriverId,
      driver_name: activeDriverName,
      pickup: student ? student.pickup_point : this.busData.current_stop,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString(),
      status: "Flagged (" + reason + ")",
      confirmedBy: `Driver ${activeDriverName} (${activeBusId})`,
      lat: this.busData.lat,
      lng: this.busData.lng
    };

    this.attendanceLogs.unshift(flagRecord);
    this.notify("BOARDING_FLAGGED", { flagRecord, reason });
  }

  registerNewStudent(data) {
    if (!data.rfid || !data.name) return;
    const cleanRfid = data.rfid.trim().toUpperCase();

    // Check if already registered
    const existing = this.students.find(s => s.rfid.toUpperCase() === cleanRfid);
    if (existing) {
      existing.name = data.name.trim();
      existing.student_id = data.student_id.trim().toUpperCase();
      existing.phone = data.phone.trim();
      existing.parent_phone = data.parent_phone || "+91 94433 00000";
      existing.department = data.department;
      existing.year = data.year || "1";
      existing.pickup_point = data.pickup_point.trim();
      this.notify("STUDENT_UPDATED", { student: existing });
      return existing;
    }

    const initials = data.name.trim().split(" ").filter(Boolean).map(n => n[0]).join("").substring(0, 2).toUpperCase() || "ST";
    const colors = ["#2563eb", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899", "#06b6d4"];
    const avatarColor = colors[Math.floor(Math.random() * colors.length)];

    let pLat = typeof data.pickup_lat === "number" ? data.pickup_lat : null;
    let pLng = typeof data.pickup_lng === "number" ? data.pickup_lng : null;
    if (pLat === null || pLng === null) {
      const matched = ROUTE_STOPS.find(st => st.name.toLowerCase() === (data.pickup_point || "").toLowerCase());
      pLat = matched ? matched.lat : (this.busData.lat || 11.278000);
      pLng = matched ? matched.lng : (this.busData.lng || 77.585000);
    }

    const activeDriverId = this.currentDriverSession ? this.currentDriverSession.driver_id : "DRV001";
    const activeDriverName = this.currentDriverSession ? this.currentDriverSession.name : (this.busData.driver_name || "John Peter");
    const activeBusId = this.busData.bus_id || DEFAULT_BUS_ID;

    const newStudent = {
      rfid: cleanRfid,
      name: data.name.trim(),
      student_id: data.student_id.trim().toUpperCase(),
      phone: data.phone.trim(),
      parent_phone: data.parent_phone ? data.parent_phone.trim() : "+91 94433 00000",
      department: data.department || "Computer Science",
      year: data.year || "1",
      pickup_point: data.pickup_point ? data.pickup_point.trim() : (this.busData.current_stop || "Perundurai Byp"),
      pickup_lat: pLat,
      pickup_lng: pLng,
      pickup_notes: data.pickup_notes || "",
      bus_id: data.bus_id || activeBusId,
      avatar: initials,
      avatar_color: avatarColor,
      status: "Boarded",
      enrollment_status: data.enrollment_status || "Active",
      status_reason: data.status_reason || "",
      streak_days: 1,
      attendance_rate: "100%"
    };

    this.students.push(newStudent);
    this.unknownCards = this.unknownCards.filter(u => u.rfid !== cleanRfid);

    // Update last scan state
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.lastScan = {
      rfid: cleanRfid,
      isRegistered: true,
      action: "BOARDED",
      student: newStudent,
      timestamp: nowTime,
      date: new Date().toLocaleDateString(),
      status: "Registered & Boarded Just Now"
    };

    // Update scan history
    const historyEntry = {
      id: "SCH-" + Math.floor(1000 + Math.random() * 9000),
      rfid: cleanRfid,
      isRegistered: true,
      action: "BOARDED",
      studentName: newStudent.name,
      studentId: newStudent.student_id,
      pickup: newStudent.pickup_point,
      timestamp: nowTime,
      status: "🎉 Registered & Boarded"
    };
    this.scanHistory = [historyEntry, ...this.scanHistory.filter(h => h.rfid !== cleanRfid || h.status.includes("New"))].slice(0, 25);

    // Save to Firebase /users and /registered_cards
    this.pushUserToFirebase(newStudent);

    // Auto-confirm their boarding record
    const record = {
      id: "ATT-" + Math.floor(1000 + Math.random() * 9000),
      rfid: newStudent.rfid,
      name: newStudent.name,
      student_id: newStudent.student_id,
      bus_id: activeBusId,
      driver_id: activeDriverId,
      driver_name: activeDriverName,
      pickup: newStudent.pickup_point,
      timestamp: nowTime,
      date: new Date().toLocaleDateString(),
      status: "Confirmed (New Reg)",
      confirmedBy: `Driver ${activeDriverName} (${activeBusId})`,
      lat: this.busData.lat,
      lng: this.busData.lng
    };

    this.attendanceLogs.unshift(record);
    if (this.busData.occupancy < this.busData.max_seats) {
      this.busData.occupancy++;
    }

    this.pushAttendanceToFirebase(record);
    this.playChime('boarded');
    this.notify("STUDENT_REGISTERED", { student: newStudent, record, lastScan: this.lastScan });
    return newStudent;
  }

  // ==========================================
  // DRIVER AUTHENTICATION & MULTI-DRIVER MGMT
  // ==========================================
  async registerDriver(data) {
    if (!data.name || !data.driver_id || !data.password) {
      return { success: false, error: "Please fill all required fields." };
    }

    const cleanId = data.driver_id.trim().toUpperCase();
    const cleanName = data.name.trim();
    const cleanBusId = (data.bus_id || "BUS001").trim().toUpperCase();

    // Check duplicate locally
    const existing = this.drivers.find(d => d.driver_id.toUpperCase() === cleanId);
    if (existing) {
      return { success: false, error: `Driver ID "${cleanId}" is already registered. Please choose a different ID or login.` };
    }

    // Check Firebase for existing driver in cloud
    try {
      const res = await fetch(`${FIREBASE_BASE_URL}/drivers/${cleanId}.json`);
      if (res.ok) {
        const cloudData = await res.json();
        if (cloudData && cloudData.driver_id) {
          return { success: false, error: `Driver ID "${cleanId}" is already registered in the system. Please login.` };
        }
      }
    } catch (e) {
      // Offline / fallback allowed
    }

    // Hash password securely (SHA-256)
    const pwdHash = await hashPassword(data.password);
    const initials = cleanName.split(" ").filter(Boolean).map(n => n[0]).join("").substring(0, 2).toUpperCase() || "DR";
    const colors = ["#2563eb", "#10b981", "#8b5cf6", "#f59e0b", "#06b6d4", "#ec4899"];
    const avatarColor = colors[Math.floor(Math.random() * colors.length)];

    const newDriver = {
      driver_id: cleanId,
      name: cleanName,
      phone: data.phone ? data.phone.trim() : "",
      password_hash: pwdHash,
      bus_id: cleanBusId,
      license_number: data.license_number ? data.license_number.trim() : "",
      role: "driver",
      status: "active",
      avatar: initials,
      avatar_color: avatarColor,
      created_at: new Date().toISOString()
    };

    this.drivers.push(newDriver);
    this.saveState();

    // Push to Firebase RTDB under /drivers/{driver_id}
    this.pushDriverToFirebase(newDriver);

    this.notify("DRIVER_REGISTERED", { driver_id: cleanId, name: cleanName, bus_id: cleanBusId });
    return { success: true, message: "Driver account created successfully.", driver_id: cleanId };
  }

  async loginDriver(driverId, password) {
    if (!driverId || !password) {
      return { success: false, error: "Please provide both Driver ID and Password." };
    }

    const cleanId = driverId.trim().toUpperCase();

    // Look for driver in store
    let driver = this.drivers.find(d => d.driver_id.toUpperCase() === cleanId);

    // If not found locally, try fetching from Firebase
    if (!driver) {
      try {
        const res = await fetch(`${FIREBASE_BASE_URL}/drivers/${cleanId}.json`);
        if (res.ok) {
          const cloudData = await res.json();
          if (cloudData && cloudData.driver_id) {
            driver = cloudData;
            this.drivers.push(driver);
            this.saveState();
          }
        }
      } catch (e) {
        // Fallback below
      }
    }

    if (!driver) {
      return { success: false, error: `Driver ID "${cleanId}" not found. Please verify your ID or create an account.` };
    }

    if (driver.status && driver.status !== "active") {
      return { success: false, error: "This driver account has been deactivated. Please contact transport dispatch." };
    }

    // Verify Password Hash
    const inputHash = await hashPassword(password);
    if (driver.password_hash !== inputHash) {
      return { success: false, error: "Incorrect password. Please check your credentials and try again." };
    }

    // Create safe, non-sensitive session (never store password in session)
    const session = {
      driver_id: driver.driver_id,
      name: driver.name,
      bus_id: driver.bus_id || "BUS001",
      phone: driver.phone || "",
      license_number: driver.license_number || "",
      role: driver.role || "driver",
      avatar: driver.avatar || "DR",
      avatar_color: driver.avatar_color || "#2563eb",
      login_at: new Date().toISOString()
    };

    this.currentDriverSession = session;
    this.setBusId(session.bus_id);
    this.saveState();

    this.notify("DRIVER_LOGGED_IN", { session });
    return { success: true, session };
  }

  logoutDriver() {
    this.currentDriverSession = null;
    this.busId = DEFAULT_BUS_ID;
    this.busData.bus_id = DEFAULT_BUS_ID;
    this.busData.driver_name = INITIAL_BUS_DATA.driver_name;
    this.busData.driver_phone = INITIAL_BUS_DATA.driver_phone;
    this.saveState();
    this.notify("DRIVER_LOGGED_OUT", {});
    return { success: true };
  }

  getAuthenticatedDriver() {
    if (this.currentDriverSession) return this.currentDriverSession;
    try {
      const stored = localStorage.getItem("smartbus_driver_session");
      if (stored) {
        this.currentDriverSession = JSON.parse(stored);
        return this.currentDriverSession;
      }
    } catch (e) {
      // Ignored
    }
    return null;
  }

  setBusId(busId) {
    if (!busId) return;
    this.busId = busId.trim().toUpperCase();
    this.busData.bus_id = this.busId;
    if (this.currentDriverSession) {
      this.currentDriverSession.bus_id = this.busId;
    }
    this.saveState();
    this.pollFirebase();
    this.notify("BUS_CHANGED", { busId: this.busId });
  }

  async pushDriverToFirebase(driver) {
    try {
      await fetch(`${FIREBASE_BASE_URL}/drivers/${driver.driver_id}.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(driver)
      });
    } catch (e) {
      console.warn("Could not write driver to Firebase:", e);
    }
  }

  async fetchDriversFromFirebase() {
    try {
      const res = await fetch(`${FIREBASE_BASE_URL}/drivers.json`);
      if (!res.ok) return;
      const data = await res.json();
      if (data && typeof data === 'object') {
        Object.values(data).forEach(d => {
          if (d && d.driver_id && !this.drivers.some(existing => existing.driver_id === d.driver_id)) {
            this.drivers.push(d);
          }
        });
        this.saveState();
      }
    } catch (e) {
      // Offline fallback
    }
  }

  // ==========================================
  // SYSTEM DATA RESET & MAINTENANCE ENGINE
  // ==========================================
  async resetData(options = {}) {
    const {
      clearDrivers = false,
      clearSessions = true,
      clearAttendance = true,
      clearScans = true,
      clearBusData = true,
      clearStudents = true,
      resetFirebase = true
    } = options;

    const clearedItems = [];
    const firebaseLog = [];
    const firebaseErrors = [];

    // 1. Reset Students Data (Restores INITIAL_STUDENTS)
    if (clearStudents) {
      this.students = JSON.parse(JSON.stringify(INITIAL_STUDENTS));
      localStorage.setItem("smartbus_students", JSON.stringify(this.students));
      clearedItems.push("Student roster & custom boarding map locations restored to default baseline");
    }

    // 2. Reset Driver Accounts
    if (clearDrivers) {
      this.drivers = JSON.parse(JSON.stringify(INITIAL_DRIVERS));
      localStorage.setItem("smartbus_drivers", JSON.stringify(this.drivers));
      clearedItems.push("Driver accounts reset to initial demo accounts (DRV001, DRV002, DRV003)");
    }

    // 3. Clear Active Driver Session
    if (clearSessions) {
      this.currentDriverSession = null;
      localStorage.removeItem("smartbus_driver_session");
      clearedItems.push("Active driver session cleared & logged out");
    }

    // 4. Reset Attendance Logs
    if (clearAttendance) {
      this.attendanceLogs = [
        {
          id: "ATT-1001",
          rfid: "RFID-102938",
          name: "Ajay Pravin",
          student_id: "23CS001",
          bus_id: "BUS001",
          driver_id: "DRV001",
          driver_name: "John Peter",
          pickup: "Erode Stand",
          timestamp: "07:46 AM",
          date: new Date().toLocaleDateString(),
          status: "Confirmed",
          confirmedBy: "Driver John Peter (BUS001)",
          lat: 11.341000,
          lng: 77.717000
        }
      ];
      localStorage.setItem("smartbus_attendance_logs", JSON.stringify(this.attendanceLogs));
      clearedItems.push("Attendance logs & boarding records cleared");
    }

    // 5. Reset Scans, Unknown Cards, and Live Scan Feed
    if (clearScans) {
      this.pendingScans = [];
      this.unknownCards = [];
      this.scanHistory = [
        {
          id: "SCH-101",
          rfid: "RFID-102938",
          isRegistered: true,
          studentName: "Ajay Pravin",
          studentId: "23CS001",
          pickup: "Erode Stand",
          timestamp: "07:46 AM",
          status: "Boarded & Confirmed"
        }
      ];
      this.lastScan = null;
      this.lastProcessedRfid = "";
      localStorage.setItem("smartbus_pending_scans", JSON.stringify(this.pendingScans));
      localStorage.setItem("smartbus_unknown_cards", JSON.stringify(this.unknownCards));
      localStorage.setItem("smartbus_scan_history", JSON.stringify(this.scanHistory));
      localStorage.removeItem("smartbus_last_scan");
      localStorage.setItem("smartbus_last_rfid", "");
      clearedItems.push("Live RFID scan history, pending scans & unknown cards cleared");
    }

    // 6. Reset Bus Telemetry, Occupancy & SOS
    if (clearBusData) {
      this.busId = DEFAULT_BUS_ID;
      this.busData = { ...INITIAL_BUS_DATA };
      this.sosActive = false;
      localStorage.setItem("smartbus_busdata", JSON.stringify(this.busData));
      localStorage.setItem("smartbus_sos", "false");
      clearedItems.push("Bus telemetry, GPS coordinates, occupancy (0) & SOS alert state reset");
    }

    this.saveState();

    // 7. Firebase Cloud Realtime Database Reset
    if (resetFirebase) {
      // A. Reset Firebase /bus/{busId}.json
      try {
        const initBusCloud = {
          lat: 11.341000,
          lng: 77.717000,
          current_stop: "Erode Stand",
          gps_fix: true,
          rfid: "—",
          occupancy: 0,
          sos: false
        };
        const busRes = await fetch(`${FIREBASE_BASE_URL}/bus/BUS001.json`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(initBusCloud)
        });
        if (busRes.ok) {
          firebaseLog.push("Reset /bus/BUS001 telemetry & cleared last hardware RFID scan");
        } else {
          firebaseErrors.push(`Failed to reset /bus/BUS001 in Firebase (HTTP ${busRes.status})`);
        }
      } catch (e) {
        firebaseErrors.push("Network error resetting /bus/BUS001: " + e.message);
      }

      // B. Clear Firebase /attendance.json
      if (clearAttendance) {
        try {
          const attRes = await fetch(`${FIREBASE_BASE_URL}/attendance.json`, {
            method: "DELETE"
          });
          if (attRes.ok) {
            firebaseLog.push("Cleared /attendance records from cloud");
          } else {
            firebaseErrors.push(`Failed to clear /attendance in Firebase (HTTP ${attRes.status})`);
          }
        } catch (e) {
          firebaseErrors.push("Network error clearing /attendance: " + e.message);
        }
      }

      // C. Clear/Reset Firebase /drivers.json
      if (clearDrivers) {
        try {
          const driversMap = {};
          INITIAL_DRIVERS.forEach(d => {
            driversMap[d.driver_id] = d;
          });
          const drvRes = await fetch(`${FIREBASE_BASE_URL}/drivers.json`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(driversMap)
          });
          if (drvRes.ok) {
            firebaseLog.push("Restored default demo drivers (DRV001, DRV002, DRV003) in cloud /drivers");
          } else {
            firebaseErrors.push(`Failed to reset /drivers in Firebase (HTTP ${drvRes.status})`);
          }
        } catch (e) {
          firebaseErrors.push("Network error resetting /drivers: " + e.message);
        }
      }

      // D. Clear Firebase /users.json
      if (clearStudents) {
        try {
          const usrRes = await fetch(`${FIREBASE_BASE_URL}/users.json`, {
            method: "DELETE"
          });
          if (usrRes.ok) {
            firebaseLog.push("Cleared custom student updates from cloud /users");
          } else {
            firebaseErrors.push(`Failed to clear /users in Firebase (HTTP ${usrRes.status})`);
          }
        } catch (e) {
          firebaseErrors.push("Network error clearing /users: " + e.message);
        }
      }
    }

    // Broadcast reset event to all other open tabs
    this.notify("SYSTEM_RESET", {
      options,
      clearedItems,
      firebaseLog,
      firebaseErrors,
      timestamp: new Date().toLocaleTimeString()
    });

    return {
      success: true,
      clearedItems,
      firebaseLog,
      firebaseErrors,
      firebaseSuccess: firebaseErrors.length === 0
    };
  }

  // ==========================================
  // DRIVER STUDENT MANAGEMENT & MAP CUSTOMIZATION
  // ==========================================
  updateStudent(rfid, data) {
    if (!rfid) return null;
    const cleanRfid = rfid.trim().toUpperCase();
    const student = this.students.find(s => s.rfid.toUpperCase() === cleanRfid);
    if (!student) return null;

    const oldName = student.name;
    const oldStatus = student.enrollment_status;

    if (data.name && data.name.trim()) {
      student.name = data.name.trim();
      student.avatar = student.name.split(" ").filter(Boolean).map(n => n[0]).join("").substring(0, 2).toUpperCase() || "ST";
    }
    if (data.student_id) student.student_id = data.student_id.trim().toUpperCase();
    if (data.phone) student.phone = data.phone.trim();
    if (data.parent_phone) student.parent_phone = data.parent_phone.trim();
    if (data.department) student.department = data.department;
    if (data.year) student.year = data.year;
    if (data.pickup_point) student.pickup_point = data.pickup_point.trim();
    if (typeof data.pickup_lat === "number" && !isNaN(data.pickup_lat)) student.pickup_lat = data.pickup_lat;
    if (typeof data.pickup_lng === "number" && !isNaN(data.pickup_lng)) student.pickup_lng = data.pickup_lng;
    if (data.pickup_notes !== undefined) student.pickup_notes = data.pickup_notes.trim();
    if (data.enrollment_status) student.enrollment_status = data.enrollment_status;
    if (data.status_reason !== undefined) student.status_reason = data.status_reason.trim();

    // If student has completed school or discontinued, adjust trip status if currently marked boarded
    if ((student.enrollment_status === "Completed" || student.enrollment_status === "Discontinued") && student.status === "Boarded") {
      student.status = "Waiting";
      this.busData.occupancy = Math.max(0, this.busData.occupancy - 1);
    }

    this.saveState();
    this.pushUserToFirebase(student);
    this.notify("STUDENT_UPDATED", { student, rfid: cleanRfid, oldName, oldStatus });
    return student;
  }

  updateStudentBoardingLocation(rfid, pickupPoint, lat, lng, notes = "") {
    if (!rfid) return null;
    const cleanRfid = rfid.trim().toUpperCase();
    const student = this.students.find(s => s.rfid.toUpperCase() === cleanRfid);
    if (!student) return null;

    if (pickupPoint) student.pickup_point = pickupPoint.trim();
    if (typeof lat === "number" && !isNaN(lat)) student.pickup_lat = lat;
    if (typeof lng === "number" && !isNaN(lng)) student.pickup_lng = lng;
    if (notes !== undefined) student.pickup_notes = notes.trim();

    this.saveState();
    this.pushUserToFirebase(student);
    this.notify("STUDENT_BOARDING_LOCATION_UPDATED", {
      student,
      rfid: cleanRfid,
      pickupPoint: student.pickup_point,
      lat: student.pickup_lat,
      lng: student.pickup_lng,
      notes: student.pickup_notes
    });
    return student;
  }

  reassignStudentPass(rfid, newData) {
    if (!rfid || !newData.name) return null;
    const cleanRfid = rfid.trim().toUpperCase();
    const student = this.students.find(s => s.rfid.toUpperCase() === cleanRfid);
    if (!student) return null;

    const prevName = student.name;
    student.name = newData.name.trim();
    student.student_id = (newData.student_id || "NEW").trim().toUpperCase();
    student.phone = (newData.phone || "").trim();
    student.parent_phone = (newData.parent_phone || "").trim();
    student.department = newData.department || "Computer Science";
    student.year = newData.year || "1";
    student.pickup_point = (newData.pickup_point || "Perundurai Byp").trim();
    student.pickup_lat = typeof newData.pickup_lat === "number" ? newData.pickup_lat : 11.278000;
    student.pickup_lng = typeof newData.pickup_lng === "number" ? newData.pickup_lng : 77.585000;
    student.pickup_notes = (newData.pickup_notes || "").trim();
    student.avatar = student.name.split(" ").filter(Boolean).map(n => n[0]).join("").substring(0, 2).toUpperCase() || "ST";
    student.status = "Waiting";
    student.enrollment_status = "Active";
    student.status_reason = `Reassigned from ${prevName}`;
    student.streak_days = 1;
    student.attendance_rate = "100%";

    this.saveState();
    this.pushUserToFirebase(student);
    this.notify("STUDENT_REASSIGNED", { student, prevName, newName: student.name, rfid: cleanRfid });
    return student;
  }

  deleteStudent(rfid) {
    if (!rfid) return false;
    const cleanRfid = rfid.trim().toUpperCase();
    const idx = this.students.findIndex(s => s.rfid.toUpperCase() === cleanRfid);
    if (idx !== -1) {
      const removed = this.students.splice(idx, 1)[0];
      if (removed.status === "Boarded") {
        this.busData.occupancy = Math.max(0, this.busData.occupancy - 1);
      }
      this.saveState();
      this.notify("STUDENT_DELETED", { student: removed, rfid: cleanRfid });
      return true;
    }
    return false;
  }

  // ==========================================
  // GPS & ROUTE SIMULATION
  // ==========================================
  advanceRoute(stopIndex) {
    if (stopIndex >= 0 && stopIndex < ROUTE_STOPS.length) {
      const stop = ROUTE_STOPS[stopIndex];
      this.busData.lat = stop.lat;
      this.busData.lng = stop.lng;
      this.busData.current_stop = stop.name;
      this.busData.next_stop = ROUTE_STOPS[Math.min(stopIndex + 1, ROUTE_STOPS.length - 1)].name;

      // Update route stop status
      ROUTE_STOPS.forEach((s, idx) => {
        if (idx < stopIndex) s.status = "passed";
        else if (idx === stopIndex) s.status = "current";
        else s.status = "upcoming";
      });

      this.notify("LOCATION_UPDATED", { busData: this.busData });
    }
  }

  triggerSOS() {
    this.sosActive = true;
    this.notify("SOS_TRIGGERED", { busData: this.busData, timestamp: new Date().toLocaleTimeString() });
    this.playChime('sos');
  }

  clearSOS() {
    this.sosActive = false;
    this.notify("SOS_CLEARED", {});
  }

  // ==========================================
  // FIREBASE REALTIME DB SYNC
  // ==========================================
  async pollFirebase() {
    try {
      const url = `${FIREBASE_BASE_URL}/bus/${this.busId}.json`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();

      if (data) {
        if (typeof data.lat === "number" && data.lat !== 0) this.busData.lat = data.lat;
        if (typeof data.lng === "number" && data.lng !== 0) this.busData.lng = data.lng;
        if (data.gps_fix !== undefined) this.busData.gps_fix = !!data.gps_fix;

        // Check if a card was scanned by ESP32
        if (data.rfid && data.rfid !== this.lastProcessedRfid && data.rfid !== "—") {
          this.handleIncomingScan(data.rfid, data.lat, data.lng);
        }
      }
    } catch (e) {
      // Fallback silently
    }
  }

  async pushAttendanceToFirebase(record) {
    try {
      await fetch(`${FIREBASE_BASE_URL}/attendance.json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...record, created_at: new Date().toISOString() })
      });
    } catch (e) {
      console.warn("Could not write attendance to Firebase:", e);
    }
  }

  async pushUserToFirebase(user) {
    try {
      await fetch(`${FIREBASE_BASE_URL}/users.json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...user, created_at: new Date().toISOString() })
      });
    } catch (e) {
      console.warn("Could not write user to Firebase:", e);
    }
  }

  // ==========================================
  // SOUND EFFECTS (Web Audio API Synthesizer)
  // ==========================================
  playChime(type) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'scan') {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === 'boarded' || type === 'confirm') {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.09); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.18); // G5
        gain.gain.setValueAtTime(0.22, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.45);
      } else if (type === 'landed') {
        // Melodious arrival / landing chord (G5 -> E5 -> C6)
        osc.frequency.setValueAtTime(783.99, ctx.currentTime); // G5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.2); // C6
        gain.gain.setValueAtTime(0.24, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
      } else if (type === 'unknown') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(329.63, ctx.currentTime); // E4
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === 'sos') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(440, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
      }
    } catch (e) {
      // Audio not supported or blocked by browser gesture policy
    }
  }
}

// Global Store Singleton
window.smartBusStore = new SmartBusStore();

