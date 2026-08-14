"use client";

interface Props {

    strengths: string[];

}

export default function StrengthCard({

    strengths,

}: Props) {

    return (

        <div className="rounded-2xl bg-white p-6 shadow">

            <h2 className="mb-5 text-xl font-bold">

                Strengths

            </h2>

            <div className="space-y-3">

                {strengths.map(

                    (item) => (

                        <div

                            key={item}

                            className="rounded bg-green-50 p-3"

                        >

                            ✅ {item}

                        </div>

                    )

                )}

            </div>

        </div>

    );

}