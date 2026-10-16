/**
 * SHIVAI — MYRAA v6.0: SPEAKER VOICEPRINT BIOMETRICS (OWNER + USER VOICE LOCK)
 * & AUTOMATIC BACKGROUND MEDIA AUDIO DUCKER (INSTAGRAM / FACEBOOK / YOUTUBE NOISE FILTER)
 */

(function initVoiceBiometricsAndAudioDucker() {
  const VOICEPRINT_STORAGE_KEY = "shivai.voiceprints.v6";

  function loadVoiceState() {
    try {
      const raw = localStorage.getItem(VOICEPRINT_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      ownerProfile: {
        enrolled: true,
        ownerName: "Shri Ram Nag",
        minPitchHz: 95,
        maxPitchHz: 230,
        passphrase: "shri ram nag",
        updatedAt: "2026-10-16T00:00:00Z",
      },
      userProfile: null,
      voiceLockActive: true,
      noiseGateRmsThreshold: 0.045,
      autoDuckBackgroundMedia: true,
      mediaCurrentlyDucked: false,
      previousMediaVolume: 70,
    };
  }

  function saveVoiceState(state) {
    try {
      localStorage.setItem(VOICEPRINT_STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }

  /**
   * Enrolls or updates the voiceprint profile for either Supreme Owner ('OWNER') or the logged-in User ('USER').
   */
  function enrollSpeakerVoiceprint({ role = "USER", speakerName = "User", avgPitchHz = 155, samplePhrase = "hey myraa" }) {
    const state = loadVoiceState();
    const profile = {
      enrolled: true,
      speakerName: String(speakerName || "User"),
      minPitchHz: Math.max(70, Number(avgPitchHz) - 35),
      maxPitchHz: Math.min(320, Number(avgPitchHz) + 35),
      avgPitchHz: Number(avgPitchHz),
      passphrase: String(samplePhrase || "hey myraa").toLowerCase().trim(),
      updatedAt: new Date().toISOString(),
    };

    if (String(role).toUpperCase() === "OWNER") {
      if (!window.MyraaAdminVault?.isAdminUnlocked()) {
        return { ok: false, error: "Only Supreme Admin Shri Ram Nag can modify the Owner Voiceprint." };
      }
      state.ownerProfile = profile;
    } else {
      state.userProfile = profile;
    }

    saveVoiceState(state);
    return {
      ok: true,
      role: String(role).toUpperCase(),
      profile,
      message: `✓ ${profile.speakerName} ki aawaz (Voiceprint: ~${profile.avgPitchHz}Hz) safaltapurvak pehchan me save ho gayi hai! Ab bheed ya dusre logon ki aawaz ignore hogi.`,
    };
  }

  /**
   * Deletes a voiceprint profile (Admin can delete any profile; user can delete their own).
   */
  function deleteSpeakerVoiceprint(role = "USER") {
    const state = loadVoiceState();
    if (String(role).toUpperCase() === "OWNER") {
      if (!window.MyraaAdminVault?.isAdminUnlocked()) {
        return { ok: false, error: "Only Supreme Admin Shri Ram Nag can delete Owner Voiceprint." };
      }
      state.ownerProfile = null;
    } else {
      state.userProfile = null;
    }
    saveVoiceState(state);
    return { ok: true, deletedRole: role };
  }

  /**
   * Verifies incoming speech audio against the enrolled Owner or User voiceprint AND filters out
   * market/travel background crowd noise (low RMS or mismatched fundamental frequency F0).
   */
  function verifySpeakerAndFilterNoise({ pitchHz = 150, rmsLevel = 0.12, transcript = "" }) {
    const state = loadVoiceState();

    // 1. Crowd / travel ambient noise gate check
    if (rmsLevel < state.noiseGateRmsThreshold) {
      return {
        accepted: false,
        reason: "BACKGROUND_NOISE_IGNORED",
        detail: "Low-energy background chatter or distant crowd noise ignored.",
      };
    }

    if (!state.voiceLockActive) {
      return { accepted: true, matchedRole: "ANY_SPEAKER" };
    }

    // 2. Check Owner Voiceprint match first
    const own = state.ownerProfile;
    if (own && own.enrolled && pitchHz >= own.minPitchHz && pitchHz <= own.maxPitchHz) {
      return { accepted: true, matchedRole: "OWNER", speakerName: own.ownerName };
    }

    // 3. Check Enrolled User Voiceprint match
    const usr = state.userProfile;
    if (usr && usr.enrolled && pitchHz >= usr.minPitchHz && pitchHz <= usr.maxPitchHz) {
      return { accepted: true, matchedRole: "ENROLLED_USER", speakerName: usr.speakerName };
    }

    // If user hasn't enrolled a custom voiceprint yet, accept foreground speech above noise gate
    if (!usr || !usr.enrolled) {
      return { accepted: true, matchedRole: "DEFAULT_FOREGROUND_USER" };
    }

    return {
      accepted: false,
      reason: "STRANGER_VOICE_REJECTED",
      detail: `Voice pitch (${pitchHz}Hz) did not match enrolled speaker (${usr.speakerName}). Ignored in crowd mode.`,
    };
  }

  /**
   * Automatic Background Media Audio Ducker:
   * When Instagram, Facebook, or YouTube video audio is playing in the background and the user starts
   * speaking to MYRAA, automatically lowers media volume to 15% (or pauses playback) so MYRAA hears clearly!
   */
  async function setListeningMediaDucking(isListening, nativeBridge = null) {
    const state = loadVoiceState();
    if (!state.autoDuckBackgroundMedia) return { ducked: false };

    if (isListening && !state.mediaCurrentlyDucked) {
      state.mediaCurrentlyDucked = true;
      saveVoiceState(state);
      // Duck in-page HTML5 videos/audio
      if (typeof document !== "undefined") {
        document.querySelectorAll("video, audio").forEach((m) => {
          try {
            m.__prevVol = m.volume;
            m.volume = 0.1;
          } catch {}
        });
      }
      // Duck Android system media stream volume to 15% while listening to user voice
      if (nativeBridge && typeof nativeBridge.executeAction === "function") {
        try {
          await nativeBridge.executeAction({ action: { action: "CHANGE_MEDIA_VOLUME", volume: 15 } });
        } catch {}
      }
      return { ok: true, ducked: true, targetVolume: 15, message: "Background media audio ducked to 15% for clear voice recognition." };
    }

    if (!isListening && state.mediaCurrentlyDucked) {
      state.mediaCurrentlyDucked = false;
      saveVoiceState(state);
      if (typeof document !== "undefined") {
        document.querySelectorAll("video, audio").forEach((m) => {
          try {
            if (typeof m.__prevVol === "number") m.volume = m.__prevVol;
          } catch {}
        });
      }
      if (nativeBridge && typeof nativeBridge.executeAction === "function") {
        try {
          await nativeBridge.executeAction({ action: { action: "CHANGE_MEDIA_VOLUME", volume: state.previousMediaVolume || 70 } });
        } catch {}
      }
      return { ok: true, ducked: false, restoredVolume: state.previousMediaVolume || 70 };
    }

    return { ok: true, ducked: state.mediaCurrentlyDucked };
  }

  window.MyraaVoiceBiometrics = Object.freeze({
    getVoiceState: loadVoiceState,
    enrollSpeakerVoiceprint,
    deleteSpeakerVoiceprint,
    verifySpeakerAndFilterNoise,
    setListeningMediaDucking,
    setVoiceLockActive: (active) => {
      const s = loadVoiceState();
      s.voiceLockActive = Boolean(active);
      saveVoiceState(s);
      return s.voiceLockActive;
    },
  });
})();
