"use client";

export default function QuickActions() {

    return (

        <div className="rounded-2xl bg-white p-6 shadow">

            <h2 className="mb-6 text-xl font-bold">

                Quick Actions

            </h2>

            <div className="space-y-3">

                <button className="w-full rounded-xl bg-blue-600 p-3 text-white">

                    Upload Resume

                </button>

                <button className="w-full rounded-xl bg-purple-600 p-3 text-white">

                    AI Mentor

                </button>

                <button className="w-full rounded-xl bg-green-600 p-3 text-white">

                    Learning Roadmap

                </button>

            </div>

        </div>

    );

}