export interface VoiceActions {
  trackISS: () => void;
  showDebris: () => void;
  openCollisionCenter: () => void;
  zoomToIndia: () => void;
  toggleSpaceWeather: () => void;
}

export interface VoiceCommandResult {
  success: boolean;
  message: string;
}

export function executeVoiceCommand(
  transcript: string,
  actions: VoiceActions
): VoiceCommandResult {
  const command = transcript.toLowerCase().trim();

  if (
    command.includes("track iss") ||
    command.includes("track the iss")
  ) {
    actions.trackISS();

    return {
      success: true,
      message: "Tracking ISS",
    };
  }

  if (
    command.includes("show debris") ||
    command.includes("show the debris") ||
    command.includes("display debris")
  ) {
    actions.showDebris();

    return {
      success: true,
      message: "Showing debris",
    };
  }

  if (
    command.includes("collision center") ||
    command.includes("open collision center")
  ) {
    actions.openCollisionCenter();

    return {
      success: true,
      message: "Opening Collision Center",
    };
  }

  if (
    command.includes("zoom to india") ||
    command.includes("zoom into india") ||
    command.includes("show india")
  ) {
    actions.zoomToIndia();

    return {
      success: true,
      message: "Zooming to India",
    };
  }

  if (
    command.includes("space weather") ||
    command.includes("toggle space weather")
  ) {
    actions.toggleSpaceWeather();

    return {
      success: true,
      message: "Toggling space weather",
    };
  }

  return {
    success: false,
    message: `Command not recognized: "${transcript}"`,
  };
}