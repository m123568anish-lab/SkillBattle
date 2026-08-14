"use client";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

interface Props {
    children: React.ReactNode;
}

export default function DashboardLayout({
    children,
}: Props) {

    return (

        <div className="min-h-screen bg-slate-100">

            <Sidebar />

            <div className="ml-72">

                <Topbar />

                <main className="p-8">

                    {children}

                </main>

            </div>

        </div>

    );

}