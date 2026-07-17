from sqlalchemy.orm import Session
from models.db_models import SpaceObject, CollisionPrediction
from orbital.orbit_engine import orbit_engine
import datetime
import math
import logging
from typing import List

logger = logging.getLogger("app")


class CollisionEngine:
    def calculate_probability(self, miss_distance_m: float, rel_vel_kms: float, r_combined_m: float = 15.0) -> float:
        try:
            sigma = max(20.0, miss_distance_m * 0.4)
            prob  = math.exp(-0.5 * (miss_distance_m ** 2) / (sigma ** 2)) * (r_combined_m ** 2) / (2 * sigma ** 2)
            return min(0.95, max(0.0001, prob))
        except Exception as e:
            logger.error(f"Error calculating probability: {e}")
            return 0.001

    def predict_collisions(self, db: Session, lookahead_hours: float = 24.0) -> List[CollisionPrediction]:
        objects = (
            db.query(SpaceObject)
            .filter(SpaceObject.tle_line1.isnot(None), SpaceObject.tle_line2.isnot(None))
            .all()
        )

        predictions: List[CollisionPrediction] = []
        now = datetime.datetime.utcnow()

        propagated = []
        for obj in objects:
            try:
                r, v = orbit_engine.propagate_state(obj.tle_line1, obj.tle_line2, now)
                propagated.append((obj, r, v))
            except Exception as e:
                logger.warning(f"Failed to propagate state for {obj.catalog_number}: {e}")
                propagated.append((obj, None, None))

        for i in range(len(propagated)):
            obj_a, r_a, v_a = propagated[i]
            if r_a is None:
                continue
            for j in range(i + 1, len(propagated)):
                obj_b, r_b, v_b = propagated[j]
                if r_b is None:
                    continue
                try:
                    distance_km = orbit_engine.calculate_distance(r_a, r_b)
                    if distance_km < 15.0:
                        miss_m   = distance_km * 1000.0
                        rel_vel  = orbit_engine.calculate_relative_velocity(v_a, v_b)
                        prob     = self.calculate_probability(miss_m, rel_vel)

                        if prob > 0.05:
                            risk_level = "CRITICAL"
                        elif prob > 0.01:
                            risk_level = "HIGH"
                        elif prob > 0.001:
                            risk_level = "MEDIUM"
                        else:
                            risk_level = "LOW"

                        pred = CollisionPrediction(
                            object_a_id=obj_a.id,
                            object_b_id=obj_b.id,
                            primaryObject=obj_a.noradId,
                            secondaryObject=obj_b.noradId,
                            riskScore=prob,
                            missDistance=miss_m,
                            conjunctionTime=now + datetime.timedelta(minutes=12.0),
                            relative_velocity_kms=rel_vel,
                            risk_level=risk_level,
                            status="PENDING",
                        )
                        db.add(pred)
                        predictions.append(pred)
                except Exception as e:
                    logger.warning(
                        f"Failed to calculate intersection between "
                        f"{obj_a.catalog_number} and {obj_b.catalog_number}: {e}"
                    )

        db.commit()
        return predictions


collision_engine = CollisionEngine()
