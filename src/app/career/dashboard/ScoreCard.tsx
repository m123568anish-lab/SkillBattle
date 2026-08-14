interface Props {

    title: string;

    score: number;

}

export default function ScoreCard({

    title,

    score,

}: Props) {

    return (

        <div className="rounded-xl border bg-white p-6 shadow">

            <h3 className="text-gray-500">

                {title}

            </h3>

            <h2 className="mt-4 text-5xl font-bold text-blue-600">

                {score}

            </h2>

            <p className="mt-2 text-sm">

                /100

            </p>

        </div>

    );

}