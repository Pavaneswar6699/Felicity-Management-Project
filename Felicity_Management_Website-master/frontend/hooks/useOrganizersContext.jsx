import { OrganizersContext } from "../context/organizercontext";
import { useContext } from "react";

export const useOrganizersContext=()=>{
    const context=useContext(OrganizersContext); // useContext is a hook that allows us to use the context in our components

    if(!context){
        throw Error("useOrganizersContext must be used inside an OrganizersContextProvider");
    }

    return context;
}