interface Props {

    progress: number;

}

export default function UploadProgress({

    progress,

}: Props) {

    return (

        <div className="w-full">

            <div className="h-3 rounded bg-gray-200">

                <div

                    className="h-3 rounded bg-blue-600 transition-all"

                    style={{

                        width: `${progress}%`,

                    }}

                />

            </div>

            <p className="mt-2 text-sm">

                {progress}%

            </p>

        </div>

    );

}