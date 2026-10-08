import { useEffect } from "react";

import { careerService } from "@/services/career.service";
import { useCareerStore } from "@/stores/career-store";

export function useResume() {
  const { resumes, setResumes } = useCareerStore();

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    const data = await careerService.getResumes();
    setResumes(data);
  }

  return { resumes, reload: load };
}