"use client";

import { useState } from "react";

import { useUpload } from "@/hooks/useUpload";

export default function ResumeUploader() {

    const {

        upload,

        uploading,

    } = useUpload();

    const [

        file,

        setFile,

    ] = useState<File>();

    async function submit() {

        if (!file) return;

        const result = await upload(file);

        console.log(result);
    }

    return (

        <div className="rounded-xl border bg-white p-8">

            <input

                type="file"

                accept=".pdf,.doc,.docx"

                onChange={(e) =>

                    setFile(

                        e.target.files?.[0]

                    )

                }

            />

            <button

                onClick={submit}

                disabled={uploading}

                className="mt-4 rounded bg-blue-600 px-6 py-2 text-white"

            >

                {uploading

                    ? "Uploading..."

                    : "Upload Resume"}

            </button>

        </div>

    );

}