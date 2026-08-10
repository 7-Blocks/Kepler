export interface CatalogObject {
  id: number;
  name: string;
  catalog_number: string;
  classification: 'PAYLOAD' | 'DEBRIS' | 'ROCKET_BODY' | 'UNKNOWN';
  epoch: string | null;
  inclination: number | null;
  eccentricity: number | null;
  semimajor_axis: number | null;
  raan: number | null;
  arg_of_perigee: number | null;
  mean_anomaly: number | null;
  mean_motion: number | null;
  period: number | null;
  has_tle: boolean;
  updated_at: string | null;
}

export interface CollisionRisk {
  id: number;
  object_a: { name: string; catalog_number: string } | null;
  object_b: { name: string; catalog_number: string } | null;
  probability: number;
  miss_distance_m: number;
  relative_velocity_kms: number;
  risk_level: string;
  tca: string;
}
