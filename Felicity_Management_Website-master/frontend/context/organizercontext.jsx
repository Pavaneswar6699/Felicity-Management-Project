import { createContext, useReducer } from "react";

export const OrganizersContext=createContext(); // context for the events for providing state and dispatch to components
// reducer updates the state based on action by replacing old state with new state
export const eventsReducer=(state,action)=>{
    switch(action.type){ // action is what we dispatch from components, it has a type and a payload
        case "SET_ORGANIZERS":
            return{
                organizers: action.payload // we are setting the organizers to the payload data from action
            }
        case "CREATE_ORGANIZER":
            return{
                organizers: [action.payload,...(state.organizers || [])].sort((a,b)=>a.organizerName.localeCompare(b.organizerName)) 
                // we are adding the new organizer to the existing organizers and sorting by organizer name
            }
        case "DELETE_ORGANIZER":
            return{
                organizers: state.organizers.filter((o)=> o._id !== action.payload._id)
                // filtering out the deleted organizers
            }
        case "DISABLE_ORGANIZER":
            return{
                organizers: state.organizers.map((o)=> o._id === action.payload._id ? {...o, isDisabled: true} : o)
                // updating the disabled status of the organizer
            }
        case "ENABLE_ORGANIZER":
            return{
                organizers: state.organizers.map((o)=> o._id === action.payload._id ? {...o, isDisabled: false} : o)
                // updating the disabled status of the organizer
            }
        default:
            return state; // if action type is not matched, we return the current state without any changes
    }
}

export const OrganizersContextProvider=({children})=>{ // children is what is wrapped by this provider
    // state is current organizers state, dispatch fn is to send actions to reducer for state updates
    const [state,dispatch]=useReducer(eventsReducer,{ 
        organizers:null
    });

    return(
        <OrganizersContext.Provider value={{...state,dispatch}}>
            {children}
        </OrganizersContext.Provider>
    )
}