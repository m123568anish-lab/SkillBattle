"use client";

import { useAuth } from "@/hooks/useAuth";

export default function ProtectedRoute({

    children,

}:{

    children: React.ReactNode;

}){

    const {

        loading,

        isAuthenticated,

    } = useAuth();

    if(

        loading ||

        !isAuthenticated

    ){

        return <div>Loading...</div>;

    }

    return children;

}
