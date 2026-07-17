import { useSafetyStore } from "../store/useSafetyStore";
import { useHOSStore } from "../store/useHOSStore";
import SafetyDashboard from "../components/SafetyDashboard";

export default function SafetyPage() {
  const safetyIncidents = useSafetyStore((state) => state.safetyIncidents);
  const safetyScores = useSafetyStore((state) => state.safetyScores);
  const updateSafetyIncident = useSafetyStore(
    (state) => state.updateSafetyIncident
  );
  const updateSafetyScore = useSafetyStore((state) => state.updateSafetyScore);

  const hosLogs = useHOSStore((state) => state.hosLogs);

  const handleResolveIncident = async (incidentId) => {
    const inc = safetyIncidents.find((i) => i.id === incidentId);
    if (inc) {
      const updatedInc = { ...inc, status: "resolved" };
      await updateSafetyIncident(updatedInc);

      const score = safetyScores.find((s) => s.driverId === inc.driverId);
      if (score) {
        const updatedScore = {
          ...score,
          score: Math.min(100, score.score + 5),
          totalViolations: Math.max(0, score.totalViolations - 1),
        };
        await updateSafetyScore(inc.driverId, updatedScore);
      }
    }
  };

  return (
    <SafetyDashboard
      incidents={safetyIncidents}
      scores={safetyScores}
      hosLogs={hosLogs}
      onResolveIncident={handleResolveIncident}
    />
  );
}
