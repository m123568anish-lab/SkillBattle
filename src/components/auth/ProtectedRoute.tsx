"use client";

import { useEffect } from "react";

import { useRouter } from "next/navigation";

import { useAuth } from "@/hooks/useAuth";

export default function ProtectedRoute({

    children,

}:{

    children: React.ReactNode;

}){

    const router = useRouter();

    const {

        loading,

        isAuthenticated,

    } = useAuth();

    useEffect(()=>{

        if(

            !loading &&

            !isAuthenticated

        ){

            router.replace("/login");

        }

    },[

        loading,

        isAuthenticated,

        router,

    ]);

    if(

        loading ||

        !isAuthenticated

    ){

        return <div>Loading...</div>;

    }

    return children;

}