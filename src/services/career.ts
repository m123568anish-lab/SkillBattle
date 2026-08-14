import { api } from "@/lib/api";
import { Resume, UploadResponse } from "@/types/resume";
import { ResumeAnalysis } from "@/types/analysis";

class CareerService {
  async getResumes(): Promise<Resume[]> {
    const response = await api.get<Resume[]>("/career/resumes");
    return response.data;
  }

  async getResume(resumeId: string): Promise<Resume> {
    const response = await api.get<Resume>(`/career/resume/${resumeId}`);
    return response.data;
  }

  async getAnalysis(resumeId: string): Promise<ResumeAnalysis> {
    const response = await api.get<ResumeAnalysis>(`/career/analysis/${resumeId}`);
    return response.data;
  }

  async uploadResume(formData: FormData): Promise<UploadResponse> {
    const response = await api.post<UploadResponse>("/career/upload-resume", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  }
}

export const careerService = new CareerService();
