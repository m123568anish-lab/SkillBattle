"use client";

interface Props {

    weaknesses: string[];

}

export default function WeaknessCard({

    weaknesses,

}: Props) {

    return (

        <div className="rounded-2xl bg-white p-6 shadow">

            <h2 className="mb-5 text-xl font-bold">

                Improvement Areas

            </h2>

            <div className="space-y-3">

                {weaknesses.map(

                    (item) => (

                        <div

                            key={item}

                            className="rounded bg-red-50 p-3"

                        >

                            ⚠ {item}

                        </div>

                    )

                )}

            </div>

        </div>

    );

}