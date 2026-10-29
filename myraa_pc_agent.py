#!/usr/bin/env python3
"""
SHIV AI — MYRAA v6.0 OMNI-AGENT: PC / DESKTOP REMOTE & LIVE SCREEN STREAMING SERVER
Supreme Owner & Nirman Karta: Shri Ram Nag (श्री राम नाग)

Usage on Windows / Linux / macOS:
  1. pip install pyautogui pillow
  2. python myraa_pc_agent.py
  3. Enter your PC's Wi-Fi IP:8765 inside the MYRAA Android App -> PC CTRL tab!
"""

from http.server import BaseHTTPRequestHandler, HTTPServer
import base64
import io
import json
import os
import platform
import webbrowser

try:
    import pyautogui
    pyautogui.FAILSAFE = False
except ImportError:
    pyautogui = None

try:
    from PIL import ImageGrab
except ImportError:
    ImageGrab = None

PORT = 8765


def capture_screen_base64():
    """Captures the live PC desktop screen and encodes as compressed JPEG base64."""
    img = None
    if pyautogui is not None:
        try:
            img = pyautogui.screenshot()
        except Exception:
            img = None
    if img is None and ImageGrab is not None:
        try:
            img = ImageGrab.grab()
        except Exception:
            img = None
    if img is None:
        return None, 0, 0

    w, h = img.size
    # Resize for ultra-fast low-latency Wi-Fi streaming to MYRAA mobile app
    preview = img.convert("RGB").resize((min(960, w), int(h * min(960, w) / max(1, w))))
    buf = io.BytesIO()
    preview.save(buf, format="JPEG", quality=68)
    b64 = base64.b64encode(buf.getvalue()).decode("ascii")
    return f"data:image/jpeg;base64,{b64}", w, h


class MyraaPcBridgeHandler(BaseHTTPRequestHandler):
    def _send_cors(self, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_OPTIONS(self):
        self._send_cors(200)

    def do_GET(self):
        if self.path.startswith("/screen"):
            data_url, w, h = capture_screen_base64()
            self._send_cors(200)
            self.wfile.write(json.dumps({
                "ok": data_url is not None,
                "image": data_url,
                "width": w,
                "height": h,
                "system": platform.system()
            }).encode("utf-8"))
            return

        self._send_cors(200)
        self.wfile.write(json.dumps({
            "ok": True,
            "agent": "SHIV AI — MYRAA v6.0 PC Desktop Remote & Live Screen Streamer",
            "owner": "Shri Ram Nag",
            "system": platform.system(),
            "release": platform.release(),
            "pyautogui_ready": pyautogui is not None
        }).encode("utf-8"))

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length).decode("utf-8") if length > 0 else "{}"
        data = json.loads(raw or "{}")
        cmd = data.get("cmd", "")
        text = data.get("text", "")

        try:
            if cmd == "MOUSE_MOVE" and pyautogui:
                pyautogui.moveRel(int(data.get("dx", 0)), int(data.get("dy", 0)))
            elif cmd == "MOUSE_CLICK_RATIO" and pyautogui:
                sw, sh = pyautogui.size()
                rx = float(data.get("rx", 0.5))
                ry = float(data.get("ry", 0.5))
                pyautogui.click(int(rx * sw), int(ry * sh))
            elif cmd == "MOUSE_LEFT_CLICK" and pyautogui:
                pyautogui.click()
            elif cmd == "MOUSE_RIGHT_CLICK" and pyautogui:
                pyautogui.rightClick()
            elif cmd == "KEY_ENTER" and pyautogui:
                pyautogui.press("enter")
            elif cmd == "TYPE_TEXT" and pyautogui:
                pyautogui.write(text, interval=0.02)
            elif cmd == "PC_VOL_UP" and pyautogui:
                pyautogui.press("volumeup")
            elif cmd == "PC_VOL_DOWN" and pyautogui:
                pyautogui.press("volumedown")
            elif cmd == "PC_ALT_TAB" and pyautogui:
                pyautogui.hotkey("alt", "tab")
            elif cmd == "PC_SHOW_DESKTOP" and pyautogui:
                pyautogui.hotkey("win", "d")
            elif cmd == "PC_SCREENSHOT" and pyautogui:
                pyautogui.screenshot("myraa_pc_screenshot.png")
            elif cmd == "PC_OPEN_BROWSER":
                webbrowser.open("https://github.com/shriramnag/myraa-unlimited-ai")
            elif cmd == "PC_OPEN_VSCODE":
                os.system("code .")
            elif cmd == "PC_LOCK":
                if platform.system() == "Windows":
                    os.system("rundll32.exe user32.dll,LockWorkStation")
                else:
                    os.system("loginctl lock-session || pmset displaysleepnow")
            self._send_cors(200)
            self.wfile.write(json.dumps({"ok": True, "executed": cmd}).encode("utf-8"))
        except Exception as e:
            self._send_cors(500)
            self.wfile.write(json.dumps({"ok": False, "error": str(e)}).encode("utf-8"))


if __name__ == "__main__":
    print(f"============================================================")
    print(f" SHIV AI — MYRAA v6.0 PC Desktop & Live Screen Server")
    print(f" Supreme Owner: Shri Ram Nag (श्री राम नाग)")
    print(f" Listening on: http://0.0.0.0:{PORT} (Live Screen: /screen)")
    print(f"============================================================")
    HTTPServer(("0.0.0.0", PORT), MyraaPcBridgeHandler).serve_forever()
