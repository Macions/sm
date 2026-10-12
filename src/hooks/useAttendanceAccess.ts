import { useEffect, useState } from "react";
import api from "@/api/axios";

export function useAttendanceAccess() {
  const [isAttendanceCoordinator, setIsAttendanceCoordinator] = useState(false);
  const [leaderPillars, setLeaderPillars] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    api
      .get("/user/is-coordinator")
      .then(({ data }) => {
        if (!mounted) return;
        setIsAttendanceCoordinator(!!data.isCoordinator);
        setLeaderPillars((data.leaderTeams || []).map((t: any) => t.name));
      })
      .catch(() => {
        if (!mounted) return;
        setIsAttendanceCoordinator(false);
        setLeaderPillars([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { isAttendanceCoordinator, leaderPillars, loading };
}