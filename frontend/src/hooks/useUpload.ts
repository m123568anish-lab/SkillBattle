import { useState } from "react";

import { careerService } from "@/services/career";

export function useUpload() {

    const [

        uploading,

        setUploading,

    ] = useState(false);

    async function upload(

        file: File,

    ) {

        const form = new FormData();

        form.append(

            "file",

            file,

        );

        setUploading(true);

        try {

            return await careerService.uploadResume(

                form,

            );

        }

        finally {

            setUploading(false);

        }

    }

    return {

        upload,

        uploading,

    };

}