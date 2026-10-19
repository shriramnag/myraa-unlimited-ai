import json
import subprocess
import tempfile
import struct
import zlib
import unittest
from pathlib import Path
import sys

OUT_DIR = Path("/working_dir/c_0f9e1b55fa423ed5/artifacts/file_generation/ttl=63d/output")
REPO_ROOT = Path("/working_dir/c_0f9e1b55fa423ed5/MYRAA-GitHub-Repo")
sys.path.insert(0, str(OUT_DIR))

import myraa_adb_controller as adb_ctrl


def _make_minimal_png(width: int = 1080, height: int = 2400) -> bytes:
    sig = b"\x89PNG\r\n\x1a\n"
    ihdr_data = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    ihdr_crc = zlib.crc32(b"IHDR" + ihdr_data) & 0xFFFFFFFF
    ihdr = struct.pack(">I", 13) + b"IHDR" + ihdr_data + struct.pack(">I", ihdr_crc)
    iend_crc = zlib.crc32(b"IEND") & 0xFFFFFFFF
    iend = struct.pack(">I", 0) + b"IEND" + struct.pack(">I", iend_crc)
    return sig + ihdr + iend


class TestV20001AdbAndGradualVersioning(unittest.TestCase):
    def test_01_gradual_100_step_versioning_in_python(self):
        """Version must step from v.2.0.001 up to v.2.0.100 one-by-one before becoming v.3.0.000."""
        self.assertRegex(adb_ctrl.CURRENT_VERSION, r"^v\.2\.0\.\d{3}$")
        self.assertEqual(adb_ctrl.increment_gradual_version("v.2.0.001"), "v.2.0.002")
        self.assertEqual(adb_ctrl.increment_gradual_version("v.2.0.049"), "v.2.0.050")
        self.assertEqual(adb_ctrl.increment_gradual_version("v.2.0.099"), "v.2.0.100")
        self.assertEqual(adb_ctrl.increment_gradual_version("v.2.0.100"), "v.3.0.000")

        v = "v.2.0.001"
        for expected_step in range(2, 101):
            v = adb_ctrl.increment_gradual_version(v)
            self.assertEqual(v, f"v.2.0.{expected_step:03d}")
        v = adb_ctrl.increment_gradual_version(v)
        self.assertEqual(v, "v.3.0.000")

    def test_02_adb_tap_screen_subprocess(self):
        """1. adb_tap_screen must invoke `adb shell input tap <x> <y>` via subprocess."""
        recorded = []

        def fake_runner(cmd, **kwargs):
            recorded.append(cmd)
            return subprocess.CompletedProcess(cmd, 0, stdout="", stderr="")

        res = adb_ctrl.adb_tap_screen(540, 1200, runner=fake_runner)
        self.assertTrue(res["ok"])
        self.assertEqual(recorded[0], ["adb", "shell", "input", "tap", "540", "1200"])
        self.assertEqual(res["coordinates"], {"x": 540, "y": 1200})

    def test_03_adb_swipe_scroll_subprocess(self):
        """2. adb_swipe_scroll must invoke `adb shell input swipe <x1> <y1> <x2> <y2> <duration_ms>` via subprocess."""
        recorded = []

        def fake_runner(cmd, **kwargs):
            recorded.append(cmd)
            return subprocess.CompletedProcess(cmd, 0, stdout="", stderr="")

        res = adb_ctrl.adb_swipe_scroll(direction="UP", duration_ms=400, runner=fake_runner)
        self.assertTrue(res["ok"])
        self.assertEqual(recorded[0], ["adb", "shell", "input", "swipe", "540", "1650", "540", "400", "400"])

    def test_04_adb_force_stop_app_subprocess_and_security_shield(self):
        """3. adb_force_stop_app must invoke `adb shell am force-stop <pkg>` and block protected banking apps."""
        recorded = []

        def fake_runner(cmd, **kwargs):
            recorded.append(cmd)
            return subprocess.CompletedProcess(cmd, 0, stdout="", stderr="")

        res_yt = adb_ctrl.adb_force_stop_app("YouTube", runner=fake_runner)
        self.assertTrue(res_yt["ok"])
        self.assertEqual(recorded[0], ["adb", "shell", "am", "force-stop", "com.google.android.youtube"])

        res_bank = adb_ctrl.adb_force_stop_app("com.phonepe.app", runner=fake_runner)
        self.assertFalse(res_bank["ok"])
        self.assertEqual(res_bank["status"], "BLOCKED_BY_SECURITY_SHIELD")

    def test_05_adb_screencap_capture_and_check_subprocess(self):
        """4. adb_capture_and_check_screen must invoke `adb shell screencap -p` + `adb pull` and verify PNG dimensions."""
        recorded_cmds = []
        with tempfile.TemporaryDirectory() as tmpdir:
            out_png = Path(tmpdir) / "screen.png"

            def fake_runner(cmd, **kwargs):
                recorded_cmds.append(cmd)
                if "pull" in cmd:
                    out_png.write_bytes(_make_minimal_png(1080, 2400))
                return subprocess.CompletedProcess(cmd, 0, stdout="1 file pulled", stderr="")

            res = adb_ctrl.adb_capture_and_check_screen(str(out_png), runner=fake_runner)
            self.assertTrue(res["ok"])
            self.assertTrue(res["is_valid_png"])
            self.assertEqual(res["dimensions"], {"width": 1080, "height": 2400})
            self.assertEqual(recorded_cmds[0][:4], ["adb", "shell", "screencap", "-p"])
            self.assertEqual(recorded_cmds[1][:2], ["adb", "pull"])

    def test_06_js_adb_functions_and_gradual_versioning(self):
        """Verify JS MyraaFullDeviceController ADB functions and MyraaOtaUpdater gradual versioning."""
        sec_js = str(REPO_ROOT / "web/src/security/securityPolicyEngine.js")
        dc_js = str(REPO_ROOT / "web/src/automation/fullDeviceAndPlayStoreController.js")
        ota_js = str(REPO_ROOT / "web/src/ota/githubOtaUpdater.js")

        harness = f"""
        const storage = new Map();
        global.window = global;
        global.localStorage = {{
          getItem: (k) => storage.has(k) ? storage.get(k) : null,
          setItem: (k, v) => storage.set(k, String(v))
        }};
        (async () => {{
          await import({json.dumps(sec_js)});
          await import({json.dumps(dc_js)});
          await import({json.dumps(ota_js)});

          const dc = window.MyraaFullDeviceController;
          const ota = window.MyraaOtaUpdater;

          if (!/^v\\.2\\.0\\.\\d{{3}}$/.test(ota.CURRENT_VERSION)) throw new Error("Expected gradual v.2.0.xxx version");
          if (ota.incrementGradualVersion("v.2.0.001") !== "v.2.0.002") throw new Error("Step 002 mismatch");
          if (ota.incrementGradualVersion("v.2.0.099") !== "v.2.0.100") throw new Error("Step 100 mismatch");
          if (ota.incrementGradualVersion("v.2.0.100") !== "v.3.0.000") throw new Error("Rollover to v.3.0.000 mismatch");

          const tap = await dc.adbTapScreen(500, 800);
          const swipe = await dc.adbSwipeScroll({{ direction: "UP" }});
          const stop = await dc.adbForceStopApp("Instagram");
          const cap = await dc.adbCaptureAndCheckScreen();

          if (!tap.ok || !swipe.ok || !stop.ok || !cap.ok) throw new Error("JS ADB function failed");
          console.log("JS_ADB_AND_VERSION_OK");
        }})().catch(e => {{ console.error(e); process.exit(1); }});
        """
        res = subprocess.run(["node", "-e", harness], capture_output=True, text=True)
        self.assertEqual(res.returncode, 0, res.stderr)
        self.assertIn("JS_ADB_AND_VERSION_OK", res.stdout)


if __name__ == "__main__":
    unittest.main()
