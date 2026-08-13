"use client";

interface Props {

    summary: string;

}

export default function AnalysisSummary({

    summary,

}: Props) {

    return (

        <div className="rounded-2xl bg-white p-6 shadow">

            <h2 className="text-2xl font-bold">

                AI Summary

            </h2>

            <p className="mt-5 leading-8">

                {summary}

            </p>

        </div>

    );

}