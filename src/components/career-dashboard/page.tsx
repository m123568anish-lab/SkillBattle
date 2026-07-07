"use client";

import DashboardContent from "@/components/career-dashboard/DashboardContent";
import DashboardLayout from "@/components/career-dashboard/DashboardLayout";

export default function DashboardPage() {

    /*
      TODO:
      Replace this with the resume id
      returned after uploading.
    */

    const resumeId = "YOUR_RESUME_ID";

    return (
        <DashboardLayout>
            <DashboardContent
                resumeId={resumeId}
            />
        </DashboardLayout>
    );
}