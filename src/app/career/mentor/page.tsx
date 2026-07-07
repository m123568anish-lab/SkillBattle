"use client";

import MentorLayout from "@/components/mentor/MentorLayout";

export default function MentorPage() {

    /*
        Replace this with
        the uploaded resume id
        after login.
    */

    const resumeId = "YOUR_RESUME_ID";

    return (

        <MentorLayout
            resumeId={resumeId}
        />

    );

}