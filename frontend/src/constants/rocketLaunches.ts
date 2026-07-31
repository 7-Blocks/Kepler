export interface RocketLaunch {
  id: number;
  mission: string;
  vehicle: string;
  provider: string;
  launchSite: string;
  targetOrbit: string;
  launchTime: string;
  status: "Upcoming" | "Delayed" | "Scrubbed" | "Completed";
  missionPatch: string;
}

export const rocketLaunches: RocketLaunch[] = [
  {
    id: 1,
    mission: "Artemis II",
    vehicle: "SLS Block 1",
    provider: "NASA",
    launchSite: "Kennedy Space Center LC-39B",
    targetOrbit: "Lunar Flyby",
    launchTime: "2026-12-15T14:30:00Z",
    status: "Upcoming",
    missionPatch: "🚀",
  },
  {
    id: 2,
    mission: "Starlink Group 18-5",
    vehicle: "Falcon 9",
    provider: "SpaceX",
    launchSite: "Cape Canaveral SLC-40",
    targetOrbit: "Low Earth Orbit",
    launchTime: "2026-09-12T09:45:00Z",
    status: "Upcoming",
    missionPatch: "🛰️",
  },
  {
    id: 3,
    mission: "New Glenn Demo",
    vehicle: "New Glenn",
    provider: "Blue Origin",
    launchSite: "Cape Canaveral LC-36",
    targetOrbit: "Geostationary Transfer Orbit",
    launchTime: "2026-10-01T18:00:00Z",
    status: "Delayed",
    missionPatch: "🌍",
  },
];