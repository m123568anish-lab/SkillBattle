"use client";

interface Props {

    resume: any;

}

export default function ResumeOverview({

    resume,

}: Props) {

    return (

        <div className="rounded-2xl bg-white p-6 shadow">

            <h2 className="text-2xl font-bold">

                Resume

            </h2>

            <div className="mt-6">

                <p>

                    <strong>Name</strong>

                </p>

                <p>

                    {resume.filename}

                </p>

            </div>

            <div className="mt-4">

                <p>

                    <strong>Uploaded</strong>

                </p>

                <p>

                    {new Date(

                        resume.uploaded_at,

                    ).toLocaleDateString()}

                </p>

            </div>

        </div>

    );

}