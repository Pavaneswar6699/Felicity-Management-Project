import { AuthContext } from "../context/authcontext";
import { useContext } from "react";

export const useAuthContext=()=>{
    const context=useContext(AuthContext); // useContext is a hook that allows us to use the context in our components

    if(!context){
        throw Error("useAuthContext must be used inside an AuthContextProvider");
    }

    return context;
}