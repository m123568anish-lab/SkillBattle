const weaknesses = [

    "Learn Docker",

    "Improve DSA",

    "Earn AWS Certification",

    "Deploy Projects",

];

export default function WeaknessesCard() {

    return (

        <div className="rounded-xl border bg-white p-6 shadow">

            <h2 className="mb-4 text-xl font-semibold">

                Improvement Areas

            </h2>

            <ul className="space-y-3">

                {weaknesses.map((item) => (

                    <li key={item}>

                        ⚠️ {item}

                    </li>

                ))}

            </ul>

        </div>

    );

}