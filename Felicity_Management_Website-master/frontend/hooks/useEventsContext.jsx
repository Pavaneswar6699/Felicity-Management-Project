import { EventsContext } from "../context/eventcontext";
import { useContext } from "react";

export const useEventsContext=()=>{
    const context=useContext(EventsContext); // useContext is a hook that allows us to use the context in our components

    if(!context){
        throw Error("useEventsContext must be used inside an EventsContextProvider");
    }

    return context;
}