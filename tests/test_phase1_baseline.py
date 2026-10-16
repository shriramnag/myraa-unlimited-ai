import unittest
import os
import re
import json
import struct
import zipfile
import hashlib
from cryptography import x509
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding

REPO_DIR = "/working_dir/c_0f9e1b55fa423ed5/MYRAA-GitHub-Repo"
APK_PATH = "/working_dir/c_0f9e1b55fa423ed5/artifacts/file_generation/ttl=63d/output/MYRAA-v3.0-ShriRamNag-Edition.apk"


class TestPhase1Baseline(unittest.TestCase):

    def test_01_manifest_security_hardening(self):
        """Verify debuggable=false, allowBackup=false, and no SMS permissions in both text XML and binary AXML."""
        xml_path = os.path.join(REPO_DIR, "android/AndroidManifest.xml")
        with open(xml_path, "r", encoding="utf-8") as f:
            xml = f.read()

        self.assertIn('android:debuggable="false"', xml)
        self.assertIn('android:allowBackup="false"', xml)
        self.assertNotIn('android:debuggable="true"', xml)
        self.assertNotIn('android:allowBackup="true"', xml)
        self.assertNotIn("READ_SMS", xml)
        self.assertNotIn("RECEIVE_SMS", xml)

        # Also verify inside binary AndroidManifest.xml of the packaged APK
        with zipfile.ZipFile(APK_PATH, "r") as z:
            bin_man = z.read("AndroidManifest.xml")

        scnt, stcnt, flags, sstart, ststart = struct.unpack("<IIIII", bin_man[16:36])
        offsets = struct.unpack(f"<{scnt}I", bin_man[36:36 + scnt * 4])
        pool = bin_man[8 + sstart:]
        strings = [
            pool[o + 2 : o + 2 + struct.unpack("<H", pool[o : o + 2])[0] * 2].decode("utf-16le", errors="replace")
            for o in offsets
        ]

        off = 8
        app_attrs = {}
        while off < len(bin_man):
            ctype, hsize, csize = struct.unpack("<HHI", bin_man[off : off + 8])
            if ctype == 0x0102:
                _, tag_name_idx = struct.unpack("<ii", bin_man[off + 16 : off + 24])
                attr_cnt = struct.unpack("<H", bin_man[off + 28 : off + 30])[0]
                if strings[tag_name_idx] == "application":
                    attr_off = off + 36
                    for _ in range(attr_cnt):
                        a_ns, a_name, a_raw, a_sz, a_res, a_type, a_data = struct.unpack(
                            "<iiiHBBI", bin_man[attr_off : attr_off + 20]
                        )
                        app_attrs[strings[a_name]] = a_data
                        attr_off += 20
            off += csize

        self.assertEqual(app_attrs.get("debuggable"), 0, "Binary AXML debuggable must be 0 (false)")
        self.assertEqual(app_attrs.get("allowBackup"), 0, "Binary AXML allowBackup must be 0 (false)")

    def test_02_no_uninvited_background_telemetry(self):
        """Verify background polling to localhost:3001/api/status and /api/settings POST are disabled."""
        js_path = os.path.join(REPO_DIR, "web/dist/assets/index-D1Yb3TTp.js")
        with open(js_path, "r", encoding="utf-8") as f:
            js = f.read()

        self.assertNotIn('fetch("http://localhost:3001/api/status"', js)
        self.assertNotIn('fetch("/api/settings"', js)
        self.assertIn("async function QL(i){return;}", js)

    def test_03_system_prompt_and_creator_identity(self):
        """Verify yx(dx) extraction logic succeeds, Creator is Shri Ram Nag, and dead server code is stripped."""
        js_path = os.path.join(REPO_DIR, "web/dist/assets/index-D1Yb3TTp.js")
        with open(js_path, "r", encoding="utf-8") as f:
            js = f.read()

        self.assertEqual(len(re.findall(r"\bTECH\b", js)), 0, "No legacy TECH references should remain")
        self.assertIn("Shri Ram Nag", js)
        self.assertTrue(os.path.exists(os.path.join(REPO_DIR, "web/src/config/systemPrompt.ts")))

        # Simulate yx(dx) parser from bundle
        e = js.find("const baseInstructions =")
        t = js.find("const finalInstructions", e)
        self.assertGreater(e, 0)
        self.assertGreater(t, e)
        slice_str = js[e:t]
        literals = re.findall(r'"(?:\\.|[^"\\])*"', slice_str)
        parsed_prompt = "".join(json.loads(lit) for lit in literals)
        self.assertIn("You are Myraa", parsed_prompt)
        self.assertIn("Shri Ram Nag", parsed_prompt)

    def test_04_launcher_icons_integrity(self):
        """Verify all 15 launcher PNGs across 5 mipmap densities and adaptive icon XMLs."""
        densities = ["mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi"]
        variants = ["ic_launcher.png", "ic_launcher_foreground.png", "ic_launcher_round.png"]
        for d in densities:
            for v in variants:
                p = os.path.join(REPO_DIR, f"android/res/mipmap-{d}-v4/{v}")
                self.assertTrue(os.path.exists(p), f"Missing icon {p}")
                with open(p, "rb") as f:
                    hdr = f.read(24)
                self.assertEqual(hdr[:8], b"\x89PNG\r\n\x1a\n", f"Invalid PNG header in {p}")
                w, h = struct.unpack(">II", hdr[16:24])
                self.assertGreater(w, 0)
                self.assertEqual(w, h, f"Launcher icon {p} should be square ({w}x{h})")

        for xml_name in ["ic_launcher.xml", "ic_launcher_round.xml"]:
            xml_p = os.path.join(REPO_DIR, f"android/res/mipmap-anydpi-v26/{xml_name}")
            self.assertTrue(os.path.exists(xml_p), f"Missing adaptive icon XML {xml_p}")

    def test_05_apk_stored_4byte_alignment(self):
        """Verify every uncompressed (STORED) entry in the built APK is 4-byte aligned (zipalign -p 4)."""
        with open(APK_PATH, "rb") as f:
            raw = f.read()

        with zipfile.ZipFile(APK_PATH, "r") as z:
            stored_count = 0
            for info in z.infolist():
                if info.compress_type == 0:
                    stored_count += 1
                    off = info.header_offset
                    fn_len, ext_len = struct.unpack("<HH", raw[off + 26 : off + 30])
                    data_off = off + 30 + fn_len + ext_len
                    self.assertEqual(
                        data_off % 4,
                        0,
                        f"STORED entry {info.filename} is unaligned at offset {data_off}",
                    )
            self.assertGreater(stored_count, 100)

    def test_06_apk_v2_signature_cryptographic_verification(self):
        """Verify APK Signature Scheme v2 Merkle tree digest and RSA-2048 signature on the built APK."""
        with open(APK_PATH, "rb") as f:
            data = f.read()

        eocd_off = data.rfind(b"PK\x05\x06")
        cd_size, cd_off = struct.unpack("<II", data[eocd_off + 12 : eocd_off + 20])
        block_size_2 = struct.unpack("<Q", data[cd_off - 24 : cd_off - 16])[0]
        sig_start = cd_off - 8 - block_size_2

        self.assertEqual(data[cd_off - 16 : cd_off], b"APK Sig Block 42")
        self.assertEqual((cd_off - sig_start) % 4096, 0)

        sec1 = data[:sig_start]
        sec3 = data[cd_off:eocd_off]
        sec4 = bytearray(data[eocd_off:])
        struct.pack_into("<I", sec4, 16, sig_start)

        chunk_digests = []
        for sec in (sec1, sec3, bytes(sec4)):
            for i in range(0, len(sec), 1048576):
                chunk = sec[i : i + 1048576]
                chunk_digests.append(hashlib.sha256(b"\xa5" + struct.pack("<I", len(chunk)) + chunk).digest())

        expected_top_digest = hashlib.sha256(
            b"\x5a" + struct.pack("<I", len(chunk_digests)) + b"".join(chunk_digests)
        ).digest()

        pos = sig_start + 8
        pair_len = struct.unpack("<Q", data[pos : pos + 8])[0]
        pair_id = struct.unpack("<I", data[pos + 8 : pos + 12])[0]
        self.assertEqual(pair_id, 0x7109871A)

        val = data[pos + 12 : pos + 8 + pair_len]
        signed_data_len = struct.unpack("<I", val[8:12])[0]
        signed_data = val[12 : 12 + signed_data_len]
        self.assertIn(expected_top_digest, signed_data)

        digests_len = struct.unpack("<I", signed_data[:4])[0]
        off = 4 + digests_len
        cert0_len = struct.unpack("<I", signed_data[off + 4 : off + 8])[0]
        cert_der = signed_data[off + 8 : off + 8 + cert0_len]
        cert = x509.load_der_x509_certificate(cert_der)

        s_off = 12 + signed_data_len
        sig0_bytes_len = struct.unpack("<I", val[s_off + 12 : s_off + 16])[0]
        sig_bytes = val[s_off + 16 : s_off + 16 + sig0_bytes_len]

        cert.public_key().verify(sig_bytes, signed_data, padding.PKCS1v15(), hashes.SHA256())
        self.assertIn("Shri Ram Nag", cert.subject.rfc4514_string())


if __name__ == "__main__":
    unittest.main(verbosity=2)
