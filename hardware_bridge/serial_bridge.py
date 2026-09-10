import serial
import requests
import time
import re
from datetime import datetime, timezone


# =========================================================
# CONFIGURATION
# =========================================================

SERIAL_PORT = "COM4"
BAUD_RATE = 115200

BACKEND_URL = "http://127.0.0.1:8000"

LOGIN_URL = f"{BACKEND_URL}/api/v1/auth/login"
INGEST_URL = f"{BACKEND_URL}/api/v1/sensors/ingest"

EMAIL = "admin@coal.gov.in"
PASSWORD = "Admin@Coal2026"


# =========================================================
# GLOBAL TOKEN
# =========================================================

TOKEN = None


# =========================================================
# LOGIN
# =========================================================

def login():

    global TOKEN

    print()
    print("Connecting to Mine Monitoring Backend...")
    print(LOGIN_URL)

    try:

        response = requests.post(
            LOGIN_URL,
            json={
                "email": EMAIL,
                "password": PASSWORD
            },
            timeout=5
        )

        if response.status_code != 200:

            print("LOGIN FAILED")
            print("Status:", response.status_code)
            print(response.text)

            return False

        data = response.json()

        TOKEN = data["access_token"]

        print("Backend login successful.")

        return True

    except Exception as e:

        print("Could not connect to backend.")
        print(e)

        return False


# =========================================================
# SEND TELEMETRY
# =========================================================

def send_telemetry(
    node_id,
    tilt_x,
    tilt_y,
    accel_x,
    accel_y,
    accel_z,
    vibration,
    rssi,
    snr
):

    global TOKEN

    # -----------------------------------------------------
    # Convert acceleration into resultant acceleration
    # -----------------------------------------------------

    acceleration_magnitude = (
        accel_x ** 2 +
        accel_y ** 2 +
        accel_z ** 2
    ) ** 0.5


    # -----------------------------------------------------
    # DEMO displacement calculation
    #
    # The MPU6050 measures acceleration/tilt, not actual
    # displacement. For now we keep displacement at zero.
    #
    # Later this can be replaced with a proper displacement
    # sensor / GNSS / LVDT / geodetic measurement.
    # -----------------------------------------------------

    displacement = 0.0


    # -----------------------------------------------------
    # Vibration
    #
    # SW-420 is a digital vibration trigger, not an RMS
    # vibration sensor.
    #
    # Therefore:
    # 0 = no vibration
    # 1 = vibration detected
    # -----------------------------------------------------

    vibration_value = float(vibration)


    # -----------------------------------------------------
    # Demo battery value
    #
    # Add battery sensing later using an ADC voltage divider.
    # -----------------------------------------------------

    battery_level = 100.0


    # -----------------------------------------------------
    # Convert SW-420 state into crack flag
    #
    # For now we DO NOT treat vibration as a physical crack.
    # -----------------------------------------------------

    crack_detected = False


    # -----------------------------------------------------
    # Backend payload
    # -----------------------------------------------------

    payload = {
        "node_id": node_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),

        "tilt_x": float(tilt_x),
        "tilt_y": float(tilt_y),

        "displacement": displacement,

        "vibration": vibration_value,

        "crack_detected": crack_detected,

        "battery_level": battery_level,

        "signal_strength": int(rssi)
    }


    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json"
    }


    try:

        response = requests.post(
            INGEST_URL,
            json=payload,
            headers=headers,
            timeout=5
        )


        # -------------------------------------------------
        # Token expired
        # -------------------------------------------------

        if response.status_code == 401:

            print("Token expired. Logging in again...")

            if login():

                return send_telemetry(
                    node_id,
                    tilt_x,
                    tilt_y,
                    accel_x,
                    accel_y,
                    accel_z,
                    vibration,
                    rssi,
                    snr
                )

            return False


        # -------------------------------------------------
        # Successful ingestion
        # -------------------------------------------------

        if response.status_code in [200, 201]:

            result = response.json()

            print()
            print("========================================")
            print(" TELEMETRY SENT TO WEBSITE")
            print("========================================")

            print("Node:", node_id)
            print("Tilt X:", tilt_x)
            print("Tilt Y:", tilt_y)
            print("Vibration:", vibration)
            print("RSSI:", rssi)
            print("SNR:", snr)

            print()
            print("Backend Status:", result.get("status"))
            print("Risk Score:", result.get("risk_score"))
            print("Classification:", result.get("classification"))
            print("Alert ID:", result.get("alert_id"))

            print("========================================")

            return True


        # -------------------------------------------------
        # Backend rejected data
        # -------------------------------------------------

        print()
        print("BACKEND REJECTED TELEMETRY")
        print("Status:", response.status_code)
        print(response.text)

        return False


    except requests.exceptions.ConnectionError:

        print("Backend is not running.")

        return False


    except Exception as e:

        print("Telemetry upload error:")
        print(e)

        return False


# =========================================================
# PARSE CSV PACKET
# =========================================================

def parse_packet(line):

    line = line.strip()

    if not line.startswith("CSV,DATA,"):
        return None


    parts = line.split(",")


    # Expected:
    #
    # CSV
    # DATA
    # N14
    # tiltX
    # tiltY
    # accelX
    # accelY
    # accelZ
    # vibration
    # RSSI
    # SNR

    if len(parts) < 11:

        print("Invalid packet:")
        print(line)

        return None


    try:

        node_id = parts[2]

        tilt_x = float(parts[3])
        tilt_y = float(parts[4])

        accel_x = float(parts[5])
        accel_y = float(parts[6])
        accel_z = float(parts[7])

        vibration = int(parts[8])

        rssi = int(float(parts[9]))

        snr = float(parts[10])


        return (
            node_id,
            tilt_x,
            tilt_y,
            accel_x,
            accel_y,
            accel_z,
            vibration,
            rssi,
            snr
        )


    except ValueError as e:

        print("Packet parsing error:", e)

        return None


# =========================================================
# SERIAL READER
# =========================================================

def main():

    print()
    print("============================================")
    print("     SMART MINE HARDWARE BRIDGE")
    print("============================================")

    print()
    print("Serial Port:", SERIAL_PORT)
    print("Baud Rate:", BAUD_RATE)

    # -----------------------------------------------------
    # Login
    # -----------------------------------------------------

    while not login():

        print()
        print("Retrying backend connection in 3 seconds...")
        time.sleep(3)


    # -----------------------------------------------------
    # Open COM4
    # -----------------------------------------------------

    try:

        ser = serial.Serial(
            SERIAL_PORT,
            BAUD_RATE,
            timeout=1
        )

    except Exception as e:

        print()
        print("ERROR: Could not open", SERIAL_PORT)
        print(e)

        print()
        print("Make sure:")
        print("1. Arduino Serial Monitor is CLOSED")
        print("2. COM4 belongs to Base Station")
        print("3. ESP32 Base Station is connected")
        print()

        return


    print()
    print("Serial connection established.")
    print("Waiting for LoRa telemetry...")
    print("--------------------------------------------")


    # -----------------------------------------------------
    # Main loop
    # -----------------------------------------------------

    while True:

        try:

            raw = ser.readline()


            if not raw:
                continue


            line = raw.decode(
                "utf-8",
                errors="ignore"
            ).strip()


            if not line:
                continue


            # Display received serial line
            print("SERIAL:", line)


            # Parse telemetry
            packet = parse_packet(line)


            if packet is None:
                continue


            # Send to backend
            send_telemetry(*packet)


        except KeyboardInterrupt:

            print()
            print("Stopping hardware bridge...")

            break


        except serial.SerialException as e:

            print()
            print("Serial connection lost:")
            print(e)

            break


        except Exception as e:

            print()
            print("Unexpected error:")
            print(e)

            time.sleep(1)


    ser.close()


# =========================================================
# START
# =========================================================

if __name__ == "__main__":
    main()