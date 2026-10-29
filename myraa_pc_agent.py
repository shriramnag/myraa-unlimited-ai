#!/usr/bin/env python3
"""
SHIV AI — MYRAA v4.0: PC / Desktop Remote Control Bridge
Supreme Owner & Nirman Karta: Shri Ram Nag (श्री राम नाग)

Usage on Windows / Linux / macOS:
  pip install pyautogui
  python myraa_pc_agent.py
"""
from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import os
import platform
import webbrowser

try:
    import pyautogui
    pyautogui.FAILSAFE = False
except ImportError:
    pyautogui = None


class MyraaPcBridgeHandler(BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_OPTIONS(self):
        self._send_cors_headers()

    def do_GET(self):
        self._send_cors_headers()
        status = {
            "ok": True,
            "agent": "SHIV AI — MYRAA v4.0 PC Bridge",
            "owner": "Shri Ram Nag",
            "os": platform.system(),
            "release": platform.release(),
            "pyautoguiReady": pyautogui is not None,
        }
        self.wfile.write(json.dumps(status).encode("utf-8"))

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length).decode("utf-8") if length > 0 else "{}"
        data = json.loads(raw or "{}")
        cmd = data.get("cmd", "")
        text = data.get("text", "")

        if cmd == "MOUSE_MOVE" and pyautogui:
            pyautogui.moveRel(int(data.get("dx", 0)), int(data.get("dy", 0)))
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

        self._send_cors_headers()
        self.wfile.write(json.dumps({"ok": True, "executed": cmd}).encode("utf-8"))


if __name__ == "__main__":
    print("==========================================================")
    print("🔱 SHIV AI — MYRAA v4.0 PC Desktop Remote Bridge")
    print("👑 Supreme Owner: Shri Ram Nag (श्री राम नाग)")
    print("📡 Listening on http://0.0.0.0:8765")
    print("==========================================================")
    HTTPServer(("0.0.0.0", 8765), MyraaPcBridgeHandler).serve_forever()
