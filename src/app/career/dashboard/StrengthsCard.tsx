const strengths = [

    "Strong Python skills",

    "AI/ML projects",

    "FastAPI experience",

    "GitHub portfolio",

];

export default function StrengthsCard() {

    return (

        <div className="rounded-xl border bg-white p-6 shadow">

            <h2 className="mb-4 text-xl font-semibold">

                Strengths

            </h2>

            <ul className="space-y-3">

                {strengths.map((item) => (

                    <li key={item}>

                        ✅ {item}

                    </li>

                ))}

            </ul>

        </div>

    );

}