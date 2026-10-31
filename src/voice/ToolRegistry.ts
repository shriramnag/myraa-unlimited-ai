import { FunctionDeclaration, FunctionResponse, Type } from "@google/genai";
import { deviceActions, ToolExecutionResult } from "./DeviceActions";
import { voiceStore } from "./voiceStore";

export const LIVE_TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: "openApp",
    description:
      "Opens an allowlisted application (whatsapp, youtube, instagram, maps, playstore, camera, settings, chrome). Returns whether it succeeded in the current runtime.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        appName: {
          type: Type.STRING,
          description:
            "One of: whatsapp, youtube, instagram, maps, playstore, camera, settings, chrome",
        },
      },
      required: ["appName"],
    },
  },
  {
    name: "openWhatsApp",
    description: "Opens a WhatsApp chat with an optional phone number and pre-filled message.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        phone: {
          type: Type.STRING,
          description: "Optional phone number with country code (e.g. 919876543210)",
        },
        message: {
          type: Type.STRING,
          description: "Optional text message to prefill in WhatsApp",
        },
      },
    },
  },
  {
    name: "openUrl",
    description: "Opens a validated https:// URL in a new browser tab.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        url: {
          type: Type.STRING,
          description: "Full https:// URL to open",
        },
      },
      required: ["url"],
    },
  },
  {
    name: "makeCall",
    description:
      "Initiates a phone call to a validated phone number after showing an on-screen confirmation dialog to the user.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        number: {
          type: Type.STRING,
          description: "Phone number to dial",
        },
      },
      required: ["number"],
    },
  },
  {
    name: "callContact",
    description:
      "Looks up a contact by name and calls them after confirmation. Never guesses a phone number; if multiple contacts match or none match, reports honestly.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: {
          type: Type.STRING,
          description: "Contact name to search and call",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "toggleFlashlight",
    description:
      "Toggles the hardware camera flashlight/torch on Android. Returns success: false in a plain browser where hardware torch is unavailable.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        on: {
          type: Type.BOOLEAN,
          description: "Optional explicit true (on) or false (off)",
        },
      },
    },
  },
  {
    name: "saveMemory",
    description: "Saves an important fact, preference, or note into the on-device Brain Database.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        text: {
          type: Type.STRING,
          description: "The memory content to store",
        },
        key: {
          type: Type.STRING,
          description: "Short title/key for the memory",
        },
        category: {
          type: Type.STRING,
          description: "One of: FACT, PREFERENCE, IDENTITY, PROJECT, HABIT, RELATIONSHIP",
        },
      },
      required: ["text"],
    },
  },
  {
    name: "searchMemory",
    description: "Searches the on-device Brain Database for saved memories matching a query.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: "Search keyword or phrase",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "deepResearch",
    description:
      "Runs a live web-grounded Deep Research query using Gemini with Google Search grounding and returns findings with source URLs.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        topic: {
          type: Type.STRING,
          description: "The topic or question to research deeply",
        },
      },
      required: ["topic"],
    },
  },
  {
    name: "rewriteText",
    description:
      "Rewrites or humanizes text in a specified style with zero AI slop using Gemini.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        text: {
          type: Type.STRING,
          description: "The text to rewrite",
        },
        style: {
          type: Type.STRING,
          description: "Desired tone/style (e.g., natural Hindi, concise professional, witty)",
        },
      },
      required: ["text"],
    },
  },
  {
    name: "openPanel",
    description:
      "Opens an in-app UI panel on screen: brain (Brain DB), apps (Android Apps/Dialer), vault (Security Vault), or settings (Settings).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        panel: {
          type: Type.STRING,
          description: "One of: brain, apps, vault, settings",
        },
      },
      required: ["panel"],
    },
  },
];

export async function executeLiveFunctionCall(call: {
  id?: string;
  name?: string;
  args?: Record<string, any>;
}): Promise<FunctionResponse> {
  const name = call.name || "unknown";
  const args = call.args || {};
  voiceStore.log("INFO", `[ToolCall] Executing ${name}(${JSON.stringify(args)})`);

  let result: ToolExecutionResult;

  switch (name) {
    case "openApp":
      result = await deviceActions.openApp(String(args.appName || ""));
      break;
    case "openWhatsApp":
      result = await deviceActions.openWhatsApp(
        args.phone ? String(args.phone) : undefined,
        args.message ? String(args.message) : undefined
      );
      break;
    case "openUrl":
      result = await deviceActions.openUrl(String(args.url || ""));
      break;
    case "makeCall":
      result = await deviceActions.makeCall(String(args.number || ""));
      break;
    case "callContact":
      result = await deviceActions.callContact(String(args.name || ""));
      break;
    case "toggleFlashlight":
      result = await deviceActions.toggleFlashlight(
        typeof args.on === "boolean" ? args.on : undefined
      );
      break;
    case "saveMemory":
      result = await deviceActions.saveMemory(
        String(args.text || ""),
        (args.category as any) || "FACT",
        args.key ? String(args.key) : undefined
      );
      break;
    case "searchMemory":
      result = await deviceActions.searchMemory(String(args.query || ""));
      break;
    case "deepResearch":
      result = await deviceActions.deepResearch(String(args.topic || ""));
      break;
    case "rewriteText":
      result = await deviceActions.rewriteText(
        String(args.text || ""),
        args.style ? String(args.style) : undefined
      );
      break;
    case "openPanel":
      result = await deviceActions.openPanel(String(args.panel || ""));
      break;
    default:
      result = {
        success: false,
        message: `अज्ञात टूल '${name}'। यह टूल समर्थित नहीं है।`,
      };
      break;
  }

  voiceStore.log(
    result.success ? "INFO" : "WARN",
    `[ToolResult] ${name} -> success=${result.success}: ${result.message.slice(0, 120)}`
  );

  return {
    id: call.id,
    name,
    response: {
      success: result.success,
      message: result.message,
      ...(result.data || {}),
    },
  };
}
