"use client";

import { Bell, Search } from "lucide-react";

export default function Topbar() {

    return (

        <header className="flex h-20 items-center justify-between border-b bg-white px-8">

            <div className="flex items-center rounded-lg border px-4 py-2">

                <Search className="mr-2 h-5 w-5" />

                <input

                    placeholder="Search..."

                    className="outline-none"

                />

            </div>

            <div className="flex items-center gap-6">

                <Bell />

                <img

                    src="https://ui-avatars.com/api/?name=User"

                    className="h-10 w-10 rounded-full"

                    alt="Avatar"

                />

            </div>

        </header>

    );

}