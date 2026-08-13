"use client";

import { motion } from "framer-motion";

interface Props {

    title: string;

    value: number;

    color: string;

}

export default function StatCard({

    title,

    value,

    color,

}: Props) {

    return (

        <motion.div

            whileHover={{

                y: -5,

            }}

            className="rounded-2xl bg-white p-6 shadow"

        >

            <h3 className="text-gray-500">

                {title}

            </h3>

            <h2

                className={`mt-4 text-5xl font-bold ${color}`}

            >

                {value}

            </h2>

            <p className="mt-2">

                /100

            </p>

        </motion.div>

    );

}