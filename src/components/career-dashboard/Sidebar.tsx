"use client";

import Link from "next/link";

import {
    Home,
    FileText,
    Brain,
    GraduationCap,
    Briefcase,
    User,
    Settings,
} from "lucide-react";

const menu = [

    {
        icon: Home,
        label: "Dashboard",
        href: "/career/dashboard",
    },

    {
        icon: FileText,
        label: "Resume",
        href: "/career/resume",
    },

    {
        icon: Briefcase,
        label: "Job Match",
        href: "/career/jobs",
    },

    {
        icon: GraduationCap,
        label: "Roadmap",
        href: "/career/roadmap",
    },

    {
        icon: Brain,
        label: "AI Mentor",
        href: "/career/mentor",
    },

    {
        icon: User,
        label: "Profile",
        href: "/profile",
    },

    {
        icon: Settings,
        label: "Settings",
        href: "/settings",
    },

];

export default function Sidebar() {

    return (

        <aside className="fixed left-0 top-0 h-screen w-72 border-r bg-white">

            <div className="border-b p-8">

                <h1 className="text-3xl font-bold text-blue-600">

                    SkillBattle

                </h1>

            </div>

            <nav className="p-4">

                {menu.map((item) => {

                    const Icon = item.icon;

                    return (

                        <Link

                            key={item.href}

                            href={item.href}

                            className="mb-2 flex items-center rounded-xl p-4 transition hover:bg-slate-100"

                        >

                            <Icon className="mr-4 h-5 w-5" />

                            {item.label}

                        </Link>

                    );

                })}

            </nav>

        </aside>

    );

}